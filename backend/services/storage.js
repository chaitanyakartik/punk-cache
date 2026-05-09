const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const CONTEXTS_DIR = path.join(DATA_DIR, 'contexts');
const NOTES_DIR = path.join(DATA_DIR, 'notes');
const TRACKER_DIR = path.join(DATA_DIR, 'tracker');
const META_FILE = path.join(DATA_DIR, 'meta.json');
const CLIPBOARD_FILE = path.join(DATA_DIR, 'clipboard.json');
const GOALS_FILE = path.join(DATA_DIR, 'goals.json');

async function ensureDataDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(CONTEXTS_DIR, { recursive: true });
  await fs.mkdir(NOTES_DIR, { recursive: true });
  await fs.mkdir(TRACKER_DIR, { recursive: true });
}

async function readMeta() {
  try {
    const raw = await fs.readFile(META_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { contexts: [], lastOpened: null, calendarTokens: null };
  }
}

async function writeMeta(meta) {
  await fs.writeFile(META_FILE, JSON.stringify(meta, null, 2));
}

async function readContext(id) {
  const raw = await fs.readFile(path.join(CONTEXTS_DIR, `${id}.json`), 'utf8');
  return JSON.parse(raw);
}

async function writeContext(ctx) {
  await fs.writeFile(path.join(CONTEXTS_DIR, `${ctx.id}.json`), JSON.stringify(ctx, null, 2));
}

async function deleteContextFile(id) {
  await fs.unlink(path.join(CONTEXTS_DIR, `${id}.json`));
}

async function readClipboard() {
  try {
    const raw = await fs.readFile(CLIPBOARD_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { entries: [] };
  }
}

async function writeClipboard(data) {
  await fs.writeFile(CLIPBOARD_FILE, JSON.stringify(data, null, 2));
}

async function readNote(filename) {
  return fs.readFile(path.join(NOTES_DIR, filename), 'utf8');
}

async function writeNote(filename, content) {
  await fs.writeFile(path.join(NOTES_DIR, filename), content);
}

async function deleteNote(filename) {
  try {
    await fs.unlink(path.join(NOTES_DIR, filename));
  } catch {
    // ignore if file doesn't exist
  }
}

async function readTrackerMonth(yearMonth) {
  try {
    const raw = await fs.readFile(path.join(TRACKER_DIR, `${yearMonth}.json`), 'utf8');
    return JSON.parse(raw);
  } catch {
    return { month: yearMonth, columns: [], rows: [] };
  }
}

async function writeTrackerMonth(data) {
  await fs.writeFile(path.join(TRACKER_DIR, `${data.month}.json`), JSON.stringify(data, null, 2));
}

async function readGoals() {
  try {
    const raw = await fs.readFile(GOALS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { goals: [] };
  }
}

async function writeGoals(data) {
  await fs.writeFile(GOALS_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  ensureDataDirs,
  readMeta, writeMeta,
  readContext, writeContext, deleteContextFile,
  readClipboard, writeClipboard,
  readNote, writeNote, deleteNote,
  readTrackerMonth, writeTrackerMonth,
  readGoals, writeGoals,
};
