const express = require('express');
const router = express.Router();
const storage = require('../services/storage');

function slugify(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// GET /api/tracker/:yearMonth
// Returns the month file (creates empty structure if missing).
// When creating a new month, carries column schema from the previous month.
router.get('/:yearMonth', async (req, res) => {
  try {
    const { yearMonth } = req.params;
    let data = await storage.readTrackerMonth(yearMonth);

    // If this month has no columns yet, walk backwards up to 24 months to find a schema
    if (data.columns.length === 0) {
      let [year, month] = yearMonth.split('-').map(Number);
      for (let i = 0; i < 24; i++) {
        month--;
        if (month === 0) { month = 12; year--; }
        const prevYM = `${year}-${String(month).padStart(2, '0')}`;
        const prevData = await storage.readTrackerMonth(prevYM);
        if (prevData.columns.length > 0) {
          data.columns = prevData.columns;
          await storage.writeTrackerMonth(data);
          break;
        }
      }
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tracker/:yearMonth/row
// Upserts a single row by date. Body: { date, ...columnValues }
router.put('/:yearMonth/row', async (req, res) => {
  try {
    const { yearMonth } = req.params;
    const { date, ...values } = req.body;

    if (!date) return res.status(400).json({ error: 'date is required' });

    const data = await storage.readTrackerMonth(yearMonth);

    let row = data.rows.find(r => r.date === date);
    if (!row) {
      row = { date };
      for (const col of data.columns) {
        row[col.id] = null;
      }
      data.rows.push(row);
    }

    Object.assign(row, values);
    await storage.writeTrackerMonth(data);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tracker/:yearMonth/columns
// Replaces the columns array (used for adding a new column).
// Backfills null for any new column ids in all existing rows.
router.put('/:yearMonth/columns', async (req, res) => {
  try {
    const { yearMonth } = req.params;
    const { columns } = req.body;

    if (!Array.isArray(columns)) return res.status(400).json({ error: 'columns must be an array' });

    const data = await storage.readTrackerMonth(yearMonth);

    // Slugify ids for any column missing one
    const normalized = columns.map(col => ({
      ...col,
      id: col.id || slugify(col.label),
    }));

    data.columns = normalized;

    // Backfill null for new columns in all rows
    for (const row of data.rows) {
      for (const col of normalized) {
        if (!(col.id in row)) {
          row[col.id] = null;
        }
      }
    }

    await storage.writeTrackerMonth(data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
