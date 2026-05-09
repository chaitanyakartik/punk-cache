const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const storage = require('../services/storage');
const videoAdapter = require('../integrations/video');

// Load AI adapter lazily so missing key gives a runtime error, not a startup crash
let aiAdapter;
try { aiAdapter = require('../integrations/ai'); } catch (e) { aiAdapter = null; }

async function getAIReply(messages) {
  if (!aiAdapter) throw new Error('AI provider not configured.');
  return aiAdapter.chat(messages);
}

const SYSTEM_PROMPT = `You are a productivity assistant embedded in Personal OS, a localhost second-brain app.
Be concise and direct. The user manages work through typed "cards" (task, note, video, snippet, link, file) inside workspaces.
Cards have states: pending, ongoing, done.
When confirming actions, be brief. If a request is ambiguous, ask one clarifying question.`;

function buildContextBlock(ctx) {
  if (!ctx) return 'User is on the home page — no workspace selected.';
  const lines = ctx.cards.map(c => `  [${c.state}] [${c.type}] ${c.content}`);
  return `Workspace: "${ctx.name}"\nCards:\n${lines.join('\n') || '  (empty)'}`;
}

// ─── POST /api/ai/chat — free-form multi-turn ─────────────────────────────────

router.post('/chat', async (req, res) => {
  try {
    const { messages, contextId } = req.body;
    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ message: 'messages array required' });
    }

    let systemContent = SYSTEM_PROMPT;
    if (contextId) {
      try {
        const ctx = await storage.readContext(contextId);
        systemContent += '\n\nCurrent workspace context:\n' + buildContextBlock(ctx);
      } catch { /* context not found, proceed without */ }
    }

    const reply = await getAIReply([{ role: 'system', content: systemContent }, ...messages]);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/ai/command — slash command dispatch ────────────────────────────

router.post('/command', async (req, res) => {
  const { command, args = '', contextId } = req.body;
  const trimmedArgs = args.trim();

  try {
    // ── Card creation commands ───────────────────────────────────────────────
    if (['task', 'note', 'snippet', 'link'].includes(command)) {
      if (!contextId) return res.json({ reply: 'No workspace open. Navigate to a workspace first.' });
      if (!trimmedArgs) return res.json({ reply: `Usage: /${command} <description>` });

      const ctx = await storage.readContext(contextId);
      const now = new Date().toISOString();
      const card = {
        id: uuidv4(), type: command, content: trimmedArgs,
        state: 'pending', created_at: now, updated_at: now,
        meta: {},
      };

      if (command === 'task') {
        card.meta.creation_date = now;
        card.meta.completion_date = null;
      }
      if (command === 'note') {
        const filename = `${card.id}.md`;
        await storage.writeNote(filename, trimmedArgs);
        card.meta.filename = filename;
      }

      ctx.cards.push(card);
      await storage.writeContext(ctx);
      return res.json({
        reply: `Created ${command}: "${trimmedArgs}"`,
        action: { type: 'card_created', card },
      });
    }

    // ── /video ───────────────────────────────────────────────────────────────
    if (command === 'video') {
      if (!contextId) return res.json({ reply: 'No workspace open. Navigate to a workspace first.' });
      if (!trimmedArgs) return res.json({ reply: 'Usage: /video <url or title>' });

      const ctx = await storage.readContext(contextId);
      const now = new Date().toISOString();
      const isUrl = trimmedArgs.startsWith('http');
      const card = {
        id: uuidv4(), type: 'video', content: trimmedArgs,
        state: 'pending', created_at: now, updated_at: now,
        meta: isUrl ? { url: trimmedArgs } : {},
      };

      if (isUrl) {
        try {
          const meta = await videoAdapter.fetchMetadata(trimmedArgs);
          Object.assign(card.meta, meta);
          card.content = meta.title || trimmedArgs;
        } catch { /* keep user-provided content */ }
      }

      ctx.cards.push(card);
      await storage.writeContext(ctx);
      const byLine = card.meta.author ? ` by ${card.meta.author}` : '';
      return res.json({
        reply: `Added video: "${card.content}"${byLine}`,
        action: { type: 'card_created', card },
      });
    }

    // ── /clip ────────────────────────────────────────────────────────────────
    if (command === 'clip') {
      if (!trimmedArgs) return res.json({ reply: 'Usage: /clip <text to save>' });
      const data = await storage.readClipboard();
      data.entries.push({ id: uuidv4(), content: trimmedArgs, created_at: new Date().toISOString() });
      await storage.writeClipboard(data);
      const preview = trimmedArgs.length > 60 ? trimmedArgs.slice(0, 60) + '…' : trimmedArgs;
      return res.json({ reply: `Saved to clipboard: "${preview}"` });
    }

    // ── /done ────────────────────────────────────────────────────────────────
    if (command === 'done') {
      if (!contextId) return res.json({ reply: 'No workspace open. Navigate to a workspace first.' });
      if (!trimmedArgs) return res.json({ reply: 'Usage: /done <partial card name>' });

      const ctx = await storage.readContext(contextId);
      const query = trimmedArgs.toLowerCase();
      const matches = ctx.cards.filter(c => c.state !== 'done' && c.content.toLowerCase().includes(query));

      if (matches.length === 0) return res.json({ reply: `No active cards matching "${trimmedArgs}".` });
      if (matches.length > 1) {
        const list = matches.map(c => `• ${c.content}`).join('\n');
        return res.json({ reply: `Multiple matches — be more specific:\n${list}` });
      }

      const idx = ctx.cards.findIndex(c => c.id === matches[0].id);
      const now = new Date().toISOString();
      ctx.cards[idx].state = 'done';
      ctx.cards[idx].updated_at = now;
      if (ctx.cards[idx].type === 'task') ctx.cards[idx].meta.completion_date = now;
      await storage.writeContext(ctx);
      return res.json({
        reply: `✓ Marked done: "${matches[0].content}"`,
        action: { type: 'card_updated', card: ctx.cards[idx] },
      });
    }

    // ── /stale ───────────────────────────────────────────────────────────────
    if (command === 'stale') {
      const now = Date.now();
      let allCards = [];

      if (contextId) {
        const ctx = await storage.readContext(contextId);
        allCards = ctx.cards.map(c => ({ ...c, workspace: ctx.name }));
      } else {
        const meta = await storage.readMeta();
        for (const id of meta.contexts) {
          try {
            const ctx = await storage.readContext(id);
            allCards.push(...ctx.cards.map(c => ({ ...c, workspace: ctx.name })));
          } catch { /* skip missing */ }
        }
      }

      const stale = allCards.filter(c => {
        const days = (now - new Date(c.updated_at)) / 86400000;
        return (c.state === 'ongoing' && days >= 5) || (c.state === 'pending' && days >= 14);
      });

      if (!stale.length) return res.json({ reply: 'No stale cards — everything looks fresh!' });

      const list = stale.map(c => {
        const days = Math.floor((now - new Date(c.updated_at)) / 86400000);
        const flag = c.state === 'ongoing' ? '🟡' : '🔴';
        return `${flag} [${c.workspace}] ${c.content} (${c.state}, ${days}d stale)`;
      }).join('\n');

      return res.json({ reply: `${stale.length} stale card${stale.length > 1 ? 's' : ''}:\n${list}` });
    }

    // ── /summarize ───────────────────────────────────────────────────────────
    if (command === 'summarize') {
      if (!contextId) return res.json({ reply: 'Navigate to a workspace first, then run /summarize.' });
      const ctx = await storage.readContext(contextId);
      const reply = await getAIReply([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Summarize the state of this workspace in 3–5 concise bullet points. Focus on what needs attention.\n\n${buildContextBlock(ctx)}` },
      ]);
      return res.json({ reply });
    }

    // ── /find ────────────────────────────────────────────────────────────────
    if (command === 'find') {
      if (!trimmedArgs) return res.json({ reply: 'Usage: /find <search query>' });

      let allCards = [];
      if (contextId) {
        const ctx = await storage.readContext(contextId);
        allCards = ctx.cards.map(c => ({ ...c, workspace: ctx.name }));
      } else {
        const meta = await storage.readMeta();
        for (const id of meta.contexts) {
          try {
            const ctx = await storage.readContext(id);
            allCards.push(...ctx.cards.map(c => ({ ...c, workspace: ctx.name })));
          } catch { /* skip */ }
        }
      }

      const cardList = allCards
        .map(c => `[${c.workspace}] [${c.type}] [${c.state}] ${c.content}`)
        .join('\n');

      const reply = await getAIReply([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Find cards matching: "${trimmedArgs}"\n\nAll cards:\n${cardList}\n\nReturn the most relevant (max 5). Quote the card content exactly. If nothing matches, say so.` },
      ]);
      return res.json({ reply });
    }

    return res.json({ reply: `Unknown command: /${command}. Type / to see available commands.` });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
