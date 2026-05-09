const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const storage = require('../services/storage');

// GET /api/clipboard
router.get('/', async (req, res) => {
  try {
    const data = await storage.readClipboard();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/clipboard
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'text required' });

    const data = await storage.readClipboard();
    const entry = { id: uuidv4(), content: text, created_at: new Date().toISOString() };
    data.entries.push(entry);
    await storage.writeClipboard(data);
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/clipboard/:entryId
router.delete('/:entryId', async (req, res) => {
  try {
    const data = await storage.readClipboard();
    data.entries = data.entries.filter(e => e.id !== req.params.entryId);
    await storage.writeClipboard(data);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
