const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const storage = require('../services/storage');
const videoAdapter = require('../integrations/video');

// POST /api/cards/:contextId — create card
router.post('/:contextId', async (req, res) => {
  try {
    const ctx = await storage.readContext(req.params.contextId);
    const { type, content, meta = {} } = req.body;
    if (!type || !content) return res.status(400).json({ message: 'type and content required' });

    const now = new Date().toISOString();
    const card = {
      id: uuidv4(),
      type,
      content,
      state: 'pending',
      created_at: now,
      updated_at: now,
      meta,
    };

    if (type === 'task') {
      card.meta.creation_date = now;
      card.meta.completion_date = null;
    }

    // Auto-fetch YouTube metadata for video cards
    if (type === 'video' && meta.url) {
      try {
        const videoMeta = await videoAdapter.fetchMetadata(meta.url);
        Object.assign(card.meta, videoMeta);
        if (!card.content || card.content === meta.url) {
          card.content = videoMeta.title || card.content;
        }
      } catch {
        // fall through — user-provided content/meta is kept
      }
    }

    // If it's a note card, create the .md file
    if (type === 'note') {
      const filename = `${card.id}.md`;
      await storage.writeNote(filename, content);
      card.meta.filename = filename;
    }

    ctx.cards.push(card);
    await storage.writeContext(ctx);
    res.status(201).json(card);
  } catch (err) {
    res.status(err.code === 'ENOENT' ? 404 : 500).json({ message: err.message });
  }
});

// GET /api/cards/:contextId/:cardId
router.get('/:contextId/:cardId', async (req, res) => {
  try {
    const ctx = await storage.readContext(req.params.contextId);
    const card = ctx.cards.find(c => c.id === req.params.cardId);
    if (!card) return res.status(404).json({ message: 'Card not found' });
    res.json(card);
  } catch {
    res.status(404).json({ message: 'Context not found' });
  }
});

// PUT /api/cards/:contextId/:cardId — partial update
router.put('/:contextId/:cardId', async (req, res) => {
  try {
    const ctx = await storage.readContext(req.params.contextId);
    const idx = ctx.cards.findIndex(c => c.id === req.params.cardId);
    if (idx === -1) return res.status(404).json({ message: 'Card not found' });

    const { state, ...rest } = req.body; // state changes go through /state route
    ctx.cards[idx] = {
      ...ctx.cards[idx],
      ...rest,
      meta: { ...ctx.cards[idx].meta, ...(rest.meta || {}) },
      updated_at: new Date().toISOString(),
    };
    await storage.writeContext(ctx);
    res.json(ctx.cards[idx]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/cards/:contextId/:cardId/state — change state
router.put('/:contextId/:cardId/state', async (req, res) => {
  try {
    const { state } = req.body;
    if (!['pending', 'ongoing', 'done'].includes(state)) {
      return res.status(400).json({ message: 'Invalid state' });
    }
    const ctx = await storage.readContext(req.params.contextId);
    const idx = ctx.cards.findIndex(c => c.id === req.params.cardId);
    if (idx === -1) return res.status(404).json({ message: 'Card not found' });

    const now = new Date().toISOString();
    ctx.cards[idx].state = state;
    ctx.cards[idx].updated_at = now;
    if (ctx.cards[idx].type === 'task') {
      ctx.cards[idx].meta.completion_date = state === 'done' ? now : null;
    }
    await storage.writeContext(ctx);
    res.json(ctx.cards[idx]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/cards/:contextId/:cardId
router.delete('/:contextId/:cardId', async (req, res) => {
  try {
    const ctx = await storage.readContext(req.params.contextId);
    const idx = ctx.cards.findIndex(c => c.id === req.params.cardId);
    if (idx === -1) return res.status(404).json({ message: 'Card not found' });

    const card = ctx.cards[idx];
    if (card.type === 'note' && card.meta.filename) {
      await storage.deleteNote(card.meta.filename);
    }

    ctx.cards.splice(idx, 1);
    await storage.writeContext(ctx);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/cards/:contextId/:cardId/note — read note content
router.get('/:contextId/:cardId/note', async (req, res) => {
  try {
    const ctx = await storage.readContext(req.params.contextId);
    const card = ctx.cards.find(c => c.id === req.params.cardId);
    if (!card || card.type !== 'note') return res.status(404).json({ message: 'Note not found' });
    const content = await storage.readNote(card.meta.filename);
    res.json({ content });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/cards/:contextId/:cardId/note — save note content
router.put('/:contextId/:cardId/note', async (req, res) => {
  try {
    const { content } = req.body;
    const ctx = await storage.readContext(req.params.contextId);
    const idx = ctx.cards.findIndex(c => c.id === req.params.cardId);
    if (idx === -1 || ctx.cards[idx].type !== 'note') return res.status(404).json({ message: 'Note not found' });

    await storage.writeNote(ctx.cards[idx].meta.filename, content);
    ctx.cards[idx].content = content.split('\n')[0].replace(/^#+\s*/, '') || 'Untitled Note';
    ctx.cards[idx].updated_at = new Date().toISOString();
    await storage.writeContext(ctx);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
