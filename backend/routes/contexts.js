const express = require('express');
const router = express.Router();
const storage = require('../services/storage');

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function summarizeCards(cards) {
  return {
    total: cards.length,
    pending: cards.filter(c => c.state === 'pending').length,
    ongoing: cards.filter(c => c.state === 'ongoing').length,
    done: cards.filter(c => c.state === 'done').length,
  };
}

// GET /api/contexts — list all with card count summaries
router.get('/', async (req, res) => {
  try {
    const meta = await storage.readMeta();
    const contexts = await Promise.all(
      meta.contexts.map(async (id) => {
        try {
          const ctx = await storage.readContext(id);
          return { id: ctx.id, name: ctx.name, color: ctx.color || null, category: ctx.category || null, created_at: ctx.created_at, summary: summarizeCards(ctx.cards) };
        } catch {
          return null;
        }
      })
    );
    res.json(contexts.filter(Boolean));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/contexts — create new context
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'name required' });

    const meta = await storage.readMeta();
    let id = slugify(name);
    // ensure unique id
    let counter = 1;
    while (meta.contexts.includes(id)) {
      id = `${slugify(name)}-${counter++}`;
    }

    const { category = null } = req.body;
    const ctx = { id, name, category, created_at: new Date().toISOString(), cards: [] };
    await storage.writeContext(ctx);
    meta.contexts.push(id);
    await storage.writeMeta(meta);

    res.status(201).json(ctx);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/contexts/:id — full context with cards
router.get('/:id', async (req, res) => {
  try {
    const ctx = await storage.readContext(req.params.id);
    res.json(ctx);
  } catch {
    res.status(404).json({ message: 'Context not found' });
  }
});

// PUT /api/contexts/:id — update name
router.put('/:id', async (req, res) => {
  try {
    const ctx = await storage.readContext(req.params.id);
    if (req.body.name) ctx.name = req.body.name;
    if (req.body.color !== undefined) ctx.color = req.body.color;
    if (req.body.category !== undefined) ctx.category = req.body.category;
    await storage.writeContext(ctx);
    res.json(ctx);
  } catch {
    res.status(404).json({ message: 'Context not found' });
  }
});

// DELETE /api/contexts/:id
router.delete('/:id', async (req, res) => {
  try {
    await storage.deleteContextFile(req.params.id);
    const meta = await storage.readMeta();
    meta.contexts = meta.contexts.filter(id => id !== req.params.id);
    if (meta.lastOpened === req.params.id) meta.lastOpened = null;
    await storage.writeMeta(meta);
    res.json({ ok: true });
  } catch {
    res.status(404).json({ message: 'Context not found' });
  }
});

// PUT /api/contexts/meta/last-opened
router.put('/meta/last-opened', async (req, res) => {
  try {
    const { id } = req.body;
    const meta = await storage.readMeta();
    meta.lastOpened = id;
    await storage.writeMeta(meta);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
