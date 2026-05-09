const express = require('express');
const router = express.Router();

let adapter;
try { adapter = require('../integrations/calendar'); } catch (e) { adapter = null; }

function notConfigured(res) {
  return res.status(503).json({ message: 'Calendar integration not configured.' });
}

// GET /api/calendar/auth-url
router.get('/auth-url', (req, res) => {
  try {
    if (!adapter) return notConfigured(res);
    const url = adapter.getAuthUrl();
    res.json({ url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/calendar/oauth/callback  ← Google redirects here after auth
router.get('/oauth/callback', async (req, res) => {
  try {
    const { code, error } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    if (error) return res.redirect(`${frontendUrl}?calendarError=${encodeURIComponent(error)}`);
    if (!code) return res.redirect(`${frontendUrl}?calendarError=no_code`);
    await adapter.handleCallback(code);
    res.redirect(`${frontendUrl}?calendarConnected=1`);
  } catch (err) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?calendarError=${encodeURIComponent(err.message)}`);
  }
});

// GET /api/calendar/events?date=YYYY-MM-DD  (defaults to today)
router.get('/events', async (req, res) => {
  try {
    if (!adapter) return notConfigured(res);
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end   = new Date(date); end.setHours(23, 59, 59, 999);
    const events = await adapter.getEvents(start.toISOString(), end.toISOString());
    res.json({ events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/calendar/status
router.get('/status', async (req, res) => {
  try {
    if (!adapter) return res.json({ connected: false });
    const status = await adapter.getStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/calendar/disconnect
router.post('/disconnect', async (req, res) => {
  try {
    if (!adapter) return notConfigured(res);
    await adapter.disconnect();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
