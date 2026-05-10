const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const storage = require('../services/storage');

function today() {
  return new Date().toISOString().slice(0, 10);
}

// GET /api/goals
router.get('/', async (req, res) => {
  try {
    const data = await storage.readGoals();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/goals
router.post('/', async (req, res) => {
  try {
    const { title, metric, target, deadline, milestones } = req.body;

    const data = await storage.readGoals();

    const goal = {
      id: crypto.randomUUID(),
      title,
      metric,
      target,
      deadline,
      created_at: new Date().toISOString(),
      milestones: (milestones || []).map(m => ({
        id: crypto.randomUUID(),
        label: m.label,
        target: m.target,
        due: m.due,
        hit: false,
      })),
      log: [],
    };

    data.goals.push(goal);
    await storage.writeGoals(data);
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/goals/:goalId/log
// Appends a log entry. Auto-marks milestones hit if value >= milestone.target.
router.post('/:goalId/log', async (req, res) => {
  try {
    const { goalId } = req.params;
    const { value, note } = req.body;

    const data = await storage.readGoals();
    const goal = data.goals.find(g => g.id === goalId);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    const numVal = Number(value);

    const entry = {
      id: crypto.randomUUID(),
      value: numVal,
      note: note || '',
      date: today(),
    };

    goal.log.push(entry);

    for (const milestone of goal.milestones) {
      if (!milestone.hit && numVal >= Number(milestone.target)) {
        milestone.hit = true;
      }
    }

    await storage.writeGoals(data);
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/goals/:goalId/milestone
// Appends a new milestone to an existing goal.
router.post('/:goalId/milestone', async (req, res) => {
  try {
    const { goalId } = req.params;
    const { label, target, due } = req.body;

    const data = await storage.readGoals();
    const goal = data.goals.find(g => g.id === goalId);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    // Determine if already hit based on current log
    const maxVal = goal.log.length > 0
      ? Math.max(...goal.log.map(l => Number(l.value) || 0))
      : 0;

    const milestone = {
      id: crypto.randomUUID(),
      label,
      target: Number(target),
      due: due || null,
      hit: maxVal >= Number(target),
    };

    goal.milestones.push(milestone);
    await storage.writeGoals(data);
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
