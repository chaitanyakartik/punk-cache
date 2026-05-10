import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/client';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toYearMonth(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthTitle(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function shiftMonth(yearMonth, delta) {
  const [year, month] = yearMonth.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return toYearMonth(d);
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Returns all calendar days for the given YYYY-MM as "YYYY-MM-DD" strings
function daysInMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  const count = new Date(year, month, 0).getDate();
  const days = [];
  for (let d = 1; d <= count; d++) {
    days.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  return days;
}

function formatDayLabel(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function slugify(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Goal helpers
function bestLogValue(goal) {
  if (!goal.log || goal.log.length === 0) return 0;
  return Math.max(...goal.log.map(l => Number(l.value) || 0));
}

function progressPct(goal) {
  const best = bestLogValue(goal);
  const target = Number(goal.target) || 1;
  return Math.min(100, Math.round((best / target) * 100));
}

function nextUnhitMilestone(goal) {
  if (!goal.milestones || goal.milestones.length === 0) return null;
  return goal.milestones
    .filter(m => !m.hit)
    .sort((a, b) => new Date(a.due || '9999') - new Date(b.due || '9999'))[0] || null;
}

// Returns 'grey' | 'amber' | 'red' based on next milestone due date
function progressBarColor(goal) {
  const next = nextUnhitMilestone(goal);
  if (!next || !next.due) return 'grey';
  const dueDate = new Date(next.due + 'T00:00:00');
  const now = new Date();
  const diffMs = dueDate - now;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'red';
  if (diffDays <= 14) return 'amber';
  return 'grey';
}

function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]); // eslint-disable-line react-hooks/exhaustive-deps
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronLeftIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRightIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ArrowLeftIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function CheckCircleIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CircleDotIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

function CircleIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls = `w-full px-3 py-2 rounded-lg text-[13px]
  bg-black/[0.04] dark:bg-white/[0.05]
  border border-black/[0.08] dark:border-white/[0.07]
  text-gray-800 dark:text-gray-200
  placeholder-gray-400 dark:placeholder-gray-600
  outline-none focus:border-indigo-400/60 dark:focus:border-indigo-500/50
  transition-colors`;

const labelCls = `block text-[11px] font-semibold uppercase tracking-wider
  text-gray-400/70 dark:text-gray-500 mb-1`;

// ─── Daily Tracker ────────────────────────────────────────────────────────────

function DailyTracker() {
  const today = todayISO();
  const [yearMonth, setYearMonth] = useState(() => toYearMonth(new Date()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newCol, setNewCol] = useState({ label: '', type: 'checkbox' });
  const [addColSaving, setAddColSaving] = useState(false);

  // Local cell edits — keyed by "date:colId", value is the current string/bool
  const [localEdits, setLocalEdits] = useState({});

  async function fetchMonth(ym) {
    setLoading(true);
    setLocalEdits({});
    try {
      const result = await api.tracker.getMonth(ym);
      setData(result);
    } catch {
      setData({ month: ym, columns: [], rows: [] });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchMonth(yearMonth); }, [yearMonth]);

  // Persist a row update to the backend
  const persistRow = useCallback(async (date, colId, value) => {
    try {
      await api.tracker.updateRow(yearMonth, date, { [colId]: value });
    } catch {
      // silent — local state already reflects the change
    }
  }, [yearMonth]);

  const debouncedPersist = useDebounce(persistRow, 600);

  function getCellValue(date, colId, serverRows, col) {
    const key = `${date}:${colId}`;
    if (key in localEdits) return localEdits[key];
    const row = serverRows.find(r => r.date === date);
    if (!row) return col.type === 'checkbox' ? false : '';
    const v = row[colId];
    return v === null || v === undefined ? (col.type === 'checkbox' ? false : '') : v;
  }

  function handleCellChange(date, col, value) {
    const key = `${date}:${col.id}`;
    setLocalEdits(prev => ({ ...prev, [key]: value }));
    debouncedPersist(date, col.id, value);
  }

  async function handleAddColumn(e) {
    e.preventDefault();
    if (!newCol.label.trim()) return;
    setAddColSaving(true);
    try {
      const newColDef = { id: slugify(newCol.label.trim()), label: newCol.label.trim(), type: newCol.type };
      const updatedColumns = [...(data?.columns || []), newColDef];
      const result = await api.tracker.updateColumns(yearMonth, updatedColumns);
      setData(result);
      setNewCol({ label: '', type: 'checkbox' });
      setShowAddColumn(false);
    } catch {
      // ignore
    } finally {
      setAddColSaving(false);
    }
  }

  const columns = data?.columns || [];
  const serverRows = data?.rows || [];
  const days = data ? daysInMonth(yearMonth) : [];

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Section header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-black/[0.05] dark:border-white/[0.05] shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setYearMonth(m => shiftMonth(m, -1))}
            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-600
              hover:bg-black/[0.05] dark:hover:bg-white/[0.06]
              hover:text-gray-700 dark:hover:text-gray-300
              transition-all duration-150"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <span className="text-[14px] font-semibold text-gray-800 dark:text-gray-100 min-w-[130px] text-center">
            {formatMonthTitle(yearMonth)}
          </span>
          <button
            onClick={() => setYearMonth(m => shiftMonth(m, 1))}
            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-600
              hover:bg-black/[0.05] dark:hover:bg-white/[0.06]
              hover:text-gray-700 dark:hover:text-gray-300
              transition-all duration-150"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setYearMonth(toYearMonth(new Date()))}
            className="ml-1 px-2.5 py-1 rounded-lg text-[11px] font-medium
              text-gray-400 dark:text-gray-600
              hover:bg-black/[0.05] dark:hover:bg-white/[0.06]
              hover:text-gray-600 dark:hover:text-gray-300
              transition-all duration-150"
          >
            Today
          </button>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setShowAddColumn(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium
            transition-all duration-150
            ${showAddColumn
              ? 'bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400'
              : 'bg-black/[0.04] dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 hover:bg-black/[0.07] dark:hover:bg-white/[0.08]'
            }`}
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Add column
        </button>
      </div>

      {/* Add column form */}
      {showAddColumn && (
        <form
          onSubmit={handleAddColumn}
          className="flex items-end gap-3 px-5 py-3 border-b border-black/[0.05] dark:border-white/[0.05]
            bg-black/[0.02] dark:bg-white/[0.015] shrink-0"
        >
          <div className="flex-1">
            <label className={labelCls}>Column label</label>
            <input
              autoFocus
              value={newCol.label}
              onChange={e => setNewCol(c => ({ ...c, label: e.target.value }))}
              placeholder="e.g. Water, Meditation, Calories…"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <div className="flex rounded-lg overflow-hidden border border-black/[0.08] dark:border-white/[0.07]">
              {['checkbox', 'time', 'number'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewCol(c => ({ ...c, type: t }))}
                  className={`px-3 py-2 text-[12px] font-medium capitalize transition-colors duration-120
                    ${newCol.type === t
                      ? 'bg-indigo-500 text-white'
                      : 'bg-black/[0.03] dark:bg-white/[0.04] text-gray-500 dark:text-gray-500'
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={addColSaving || !newCol.label.trim()}
            className="px-4 py-2 rounded-lg text-[13px] font-medium
              bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50
              text-white transition-colors duration-150"
          >
            {addColSaving ? 'Adding…' : 'Add'}
          </button>
          <button
            type="button"
            onClick={() => { setShowAddColumn(false); setNewCol({ label: '', type: 'checkbox' }); }}
            className="px-3 py-2 rounded-lg text-[12px]
              text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
              transition-colors duration-150"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Table */}
      <div className="overflow-auto flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          </div>
        ) : columns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center">
              <PlusIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-gray-600 dark:text-gray-400">No columns yet</p>
              <p className="text-[12px] text-gray-400 dark:text-gray-600 mt-0.5">
                Add a column above to start tracking your daily habits.
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full text-[13px] border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-black/[0.07] dark:border-white/[0.07]
                bg-white/80 dark:bg-[#0a0a14]/90 backdrop-blur-sm">
                <th className="text-left px-5 py-2.5 font-semibold text-[11px] uppercase tracking-wider
                  text-gray-400/70 dark:text-gray-500 min-w-[150px]">
                  Date
                </th>
                {columns.map(col => (
                  <th
                    key={col.id}
                    className="px-4 py-2.5 font-semibold text-[11px] uppercase tracking-wider
                      text-gray-400/70 dark:text-gray-500 min-w-[110px] text-center"
                  >
                    <div>{col.label}</div>
                    <div className="text-[9px] font-normal normal-case text-gray-300/60 dark:text-gray-700 mt-0.5">
                      {col.type}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.03]">
              {days.map(dateStr => {
                const isToday = dateStr === today;
                return (
                  <tr
                    key={dateStr}
                    className={`transition-colors duration-120 ${
                      isToday
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/30'
                        : 'hover:bg-black/[0.015] dark:hover:bg-white/[0.015]'
                    }`}
                  >
                    {/* Date cell */}
                    <td className={`px-5 py-2 font-medium text-[13px] ${
                      isToday
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-500 dark:text-gray-500'
                    }`}>
                      <div className="flex items-center gap-2">
                        {isToday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        )}
                        {formatDayLabel(dateStr)}
                      </div>
                    </td>

                    {/* Data cells */}
                    {columns.map(col => {
                      const val = getCellValue(dateStr, col.id, serverRows, col);
                      return (
                        <td key={col.id} className="px-4 py-1.5 text-center">
                          {col.type === 'checkbox' ? (
                            <button
                              onClick={() => handleCellChange(dateStr, col, !val)}
                              className={`w-5 h-5 rounded-md mx-auto flex items-center justify-center
                                border transition-all duration-150 ${
                                  val
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-gray-200 dark:border-gray-700 text-transparent hover:border-gray-400'
                                }`}
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            </button>
                          ) : col.type === 'time' ? (
                            <input
                              type="text"
                              value={val}
                              onChange={e => handleCellChange(dateStr, col, e.target.value)}
                              placeholder="—"
                              className="w-20 px-2 py-1 rounded-md text-center text-[12px]
                                bg-transparent border border-transparent
                                hover:border-black/[0.08] dark:hover:border-white/[0.08]
                                focus:border-indigo-400/50 dark:focus:border-indigo-500/50
                                focus:bg-black/[0.03] dark:focus:bg-white/[0.04]
                                text-gray-700 dark:text-gray-300
                                placeholder-gray-300 dark:placeholder-gray-700
                                outline-none transition-all duration-120"
                            />
                          ) : col.type === 'number' ? (
                            <input
                              type="number"
                              value={val}
                              onChange={e => handleCellChange(dateStr, col, e.target.value === '' ? null : Number(e.target.value))}
                              placeholder="—"
                              className="w-16 px-2 py-1 rounded-md text-center text-[12px]
                                bg-transparent border border-transparent
                                hover:border-black/[0.08] dark:hover:border-white/[0.08]
                                focus:border-indigo-400/50 dark:focus:border-indigo-500/50
                                focus:bg-black/[0.03] dark:focus:bg-white/[0.04]
                                text-gray-700 dark:text-gray-300
                                placeholder-gray-300 dark:placeholder-gray-700
                                outline-none transition-all duration-120"
                            />
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct, color, height = '1.5' }) {
  const fillClass = color === 'red'
    ? 'bg-rose-500'
    : color === 'amber'
      ? 'bg-amber-500'
      : 'bg-gray-400 dark:bg-gray-600';

  return (
    <div className={`h-[${height}px] rounded-full bg-black/[0.06] dark:bg-white/[0.07] overflow-hidden`}
      style={{ height: `${height * 6}px` }}>
      <div
        className={`h-full rounded-full transition-all duration-300 ${fillClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({ goal, onClick }) {
  const pct = progressPct(goal);
  const color = progressBarColor(goal);
  const next = nextUnhitMilestone(goal);
  const best = bestLogValue(goal);

  const barFillCls = color === 'red'
    ? 'bg-rose-500'
    : color === 'amber'
      ? 'bg-amber-500'
      : 'bg-gray-400 dark:bg-gray-500';

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-4
        bg-white/60 dark:bg-white/[0.04]
        border border-black/[0.07] dark:border-white/[0.06]
        hover:bg-white/80 dark:hover:bg-white/[0.06]
        hover:scale-[1.01] active:scale-[0.99]
        transition-all duration-150 cursor-pointer"
    >
      {/* Title & deadline */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-[14px] font-semibold text-gray-800 dark:text-gray-100 leading-snug">
          {goal.title}
        </p>
        {goal.deadline && (
          <span className="shrink-0 text-[10px] font-medium text-gray-400 dark:text-gray-600
            bg-black/[0.04] dark:bg-white/[0.04] px-2 py-0.5 rounded-full whitespace-nowrap">
            {new Date(goal.deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* Metric */}
      <p className="text-[12px] text-gray-400 dark:text-gray-600 mb-3">
        {best} / {goal.target || '?'} {goal.metric}
      </p>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-400 dark:text-gray-600">Progress</span>
          <span className={`text-[10px] font-semibold ${
            color === 'red' ? 'text-rose-500' : color === 'amber' ? 'text-amber-500' : 'text-gray-500'
          }`}>
            {pct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.07] overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${barFillCls}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Next milestone */}
      {next ? (
        <div className="flex items-center gap-1.5">
          <CircleIcon className="w-3 h-3 text-gray-400 dark:text-gray-600 shrink-0" />
          <span className="text-[11px] text-gray-500 dark:text-gray-500 truncate">
            {next.label}
            {next.due && ` · ${new Date(next.due + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          </span>
        </div>
      ) : goal.milestones && goal.milestones.length > 0 ? (
        <div className="flex items-center gap-1.5">
          <CheckCircleIcon className="w-3 h-3 text-emerald-500 shrink-0" />
          <span className="text-[11px] text-emerald-600 dark:text-emerald-500">All milestones hit</span>
        </div>
      ) : null}
    </button>
  );
}

// ─── Goal Detail ─────────────────────────────────────────────────────────────

function GoalDetail({ goal: initialGoal, onBack, onUpdated }) {
  const [goal, setGoal] = useState(initialGoal);
  const [logForm, setLogForm] = useState({ value: '', note: '' });
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [msForm, setMsForm] = useState({ label: '', target: '', due: '' });
  const [msSubmitting, setMsSubmitting] = useState(false);

  const pct = progressPct(goal);
  const color = progressBarColor(goal);
  const best = bestLogValue(goal);
  const sortedLog = [...(goal.log || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  const sortedMilestones = [...(goal.milestones || [])].sort((a, b) =>
    new Date(a.due || '9999') - new Date(b.due || '9999')
  );

  const barFillCls = color === 'red'
    ? 'bg-rose-500'
    : color === 'amber'
      ? 'bg-amber-500'
      : 'bg-gray-400 dark:bg-gray-500';

  async function handleLogSubmit(e) {
    e.preventDefault();
    if (!logForm.value) return;
    setLogSubmitting(true);
    try {
      const updated = await api.goals.logSession(goal.id, { value: logForm.value, note: logForm.note });
      setGoal(updated);
      setLogForm({ value: '', note: '' });
      onUpdated(updated);
    } catch {
      // ignore
    } finally {
      setLogSubmitting(false);
    }
  }

  async function handleAddMilestone(e) {
    e.preventDefault();
    if (!msForm.label.trim() || !msForm.target) return;
    setMsSubmitting(true);
    try {
      const updated = await api.goals.addMilestone(goal.id, {
        label: msForm.label.trim(),
        target: msForm.target,
        due: msForm.due || undefined,
      });
      setGoal(updated);
      setMsForm({ label: '', target: '', due: '' });
      setShowAddMilestone(false);
      onUpdated(updated);
    } catch {
      // ignore
    } finally {
      setMsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-black/[0.05] dark:border-white/[0.05] shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] font-medium
            text-gray-500 dark:text-gray-500
            hover:text-gray-700 dark:hover:text-gray-300
            transition-colors duration-150"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Goals
        </button>
        <div className="w-px h-4 bg-black/[0.09] dark:bg-white/[0.09]" />
        <p className="text-[15px] font-semibold text-gray-800 dark:text-gray-100 tracking-tight flex-1 truncate">
          {goal.title}
        </p>
        {goal.deadline && (
          <span className="text-[11px] text-gray-400 dark:text-gray-600 shrink-0">
            {new Date(goal.deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>

      <div className="overflow-y-auto flex-1 p-5 space-y-5">
        {/* Overview panel */}
        <div className="rounded-xl bg-white/60 dark:bg-white/[0.04]
          border border-black/[0.07] dark:border-white/[0.06] p-4 space-y-3">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[11px] text-gray-400 dark:text-gray-600 uppercase tracking-wider font-semibold">Best</p>
              <p className="text-[22px] font-bold text-gray-800 dark:text-gray-100 tabular-nums">{best}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-600">{goal.metric}</p>
            </div>
            <div className="w-px h-10 bg-black/[0.06] dark:bg-white/[0.06]" />
            <div>
              <p className="text-[11px] text-gray-400 dark:text-gray-600 uppercase tracking-wider font-semibold">Target</p>
              <p className="text-[22px] font-bold text-gray-800 dark:text-gray-100 tabular-nums">{goal.target || '—'}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-600">{goal.metric}</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] text-gray-400 dark:text-gray-600">Progress</span>
                <span className={`text-[13px] font-bold ${
                  color === 'red' ? 'text-rose-500' : color === 'amber' ? 'text-amber-500' : 'text-gray-500'
                }`}>{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.07] overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${barFillCls}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400/70 dark:text-gray-500">
              Milestones
            </p>
            <button
              onClick={() => setShowAddMilestone(v => !v)}
              className="flex items-center gap-1 text-[11px] font-medium text-indigo-500 dark:text-indigo-400
                hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
            >
              <PlusIcon className="w-3 h-3" />
              Add milestone
            </button>
          </div>

          {showAddMilestone && (
            <form onSubmit={handleAddMilestone}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-2
                bg-indigo-50/60 dark:bg-indigo-950/20
                border border-indigo-200/50 dark:border-indigo-800/30">
              <input
                autoFocus
                value={msForm.label}
                onChange={e => setMsForm(f => ({ ...f, label: e.target.value }))}
                placeholder="Label"
                className="flex-1 bg-transparent text-[13px] text-gray-700 dark:text-gray-300
                  placeholder-gray-400 dark:placeholder-gray-600 outline-none min-w-0"
              />
              <input
                type="number"
                value={msForm.target}
                onChange={e => setMsForm(f => ({ ...f, target: e.target.value }))}
                placeholder="Target"
                className="w-20 bg-transparent text-[12px] text-gray-500 dark:text-gray-500
                  placeholder-gray-400 dark:placeholder-gray-600 outline-none text-right"
              />
              <input
                type="date"
                value={msForm.due}
                onChange={e => setMsForm(f => ({ ...f, due: e.target.value }))}
                className="bg-transparent text-[12px] text-gray-500 dark:text-gray-500 outline-none"
              />
              <button
                type="submit"
                disabled={msSubmitting || !msForm.label.trim() || !msForm.target}
                className="px-3 py-1 rounded-lg text-[12px] font-medium
                  bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50
                  text-white transition-colors"
              >
                {msSubmitting ? '…' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddMilestone(false); setMsForm({ label: '', target: '', due: '' }); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-[12px] transition-colors"
              >
                Cancel
              </button>
            </form>
          )}

          {sortedMilestones.length === 0 ? (
            <p className="text-[12px] text-gray-400/70 dark:text-gray-600 italic">No milestones yet.</p>
          ) : (
            <div className="space-y-1.5">
              {sortedMilestones.map((m, i) => {
                const hit = m.hit;
                const isNext = !hit && sortedMilestones.findIndex(x => !x.hit) === i;
                return (
                  <div
                    key={m.id || i}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                      hit
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                        : isNext
                          ? 'bg-amber-50/60 dark:bg-amber-950/20'
                          : 'bg-black/[0.02] dark:bg-white/[0.02]'
                    }`}
                  >
                    {hit ? (
                      <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : isNext ? (
                      <CircleDotIcon className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : (
                      <CircleIcon className="w-4 h-4 text-gray-300 dark:text-gray-700 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-medium ${
                        hit ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {m.label}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-600">
                        {m.target} {goal.metric}
                      </p>
                    </div>
                    {m.due && (
                      <span className={`text-[11px] shrink-0 ${
                        hit ? 'text-emerald-500/60 dark:text-emerald-700' : 'text-gray-400 dark:text-gray-600'
                      }`}>
                        {new Date(m.due + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Log Session */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400/70 dark:text-gray-500 mb-2">
            Log Session
          </p>
          <form onSubmit={handleLogSubmit}
            className="rounded-xl bg-white/60 dark:bg-white/[0.04]
              border border-black/[0.07] dark:border-white/[0.06] p-4">
            <div className="flex gap-3 mb-3">
              <div className="w-32">
                <label className={labelCls}>Value ({goal.metric})</label>
                <input
                  type="number"
                  value={logForm.value}
                  onChange={e => setLogForm(f => ({ ...f, value: e.target.value }))}
                  placeholder="0"
                  className={inputCls}
                />
              </div>
              <div className="flex-1">
                <label className={labelCls}>Note (optional)</label>
                <input
                  type="text"
                  value={logForm.note}
                  onChange={e => setLogForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="How did it go?"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={logSubmitting || !logForm.value}
                className="px-4 py-2 rounded-lg text-[13px] font-medium
                  bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50
                  text-white transition-colors duration-150"
              >
                {logSubmitting ? 'Logging…' : 'Log Session'}
              </button>
            </div>
          </form>
        </div>

        {/* Log history */}
        {sortedLog.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400/70 dark:text-gray-500 mb-2">
              History
            </p>
            <div className="space-y-1.5">
              {sortedLog.map((entry, i) => (
                <div
                  key={entry.id || i}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl
                    bg-black/[0.02] dark:bg-white/[0.02]"
                >
                  <span className="text-[13px] font-semibold text-indigo-500 dark:text-indigo-400 shrink-0 w-14 text-right tabular-nums">
                    {entry.value} <span className="text-[10px] font-normal text-gray-400">{goal.metric}</span>
                  </span>
                  <div className="w-px h-4 bg-black/[0.08] dark:bg-white/[0.08]" />
                  <span className="flex-1 text-[12px] text-gray-500 dark:text-gray-500 truncate">
                    {entry.note || <span className="text-gray-300 dark:text-gray-700 italic">no note</span>}
                  </span>
                  <span className="text-[11px] text-gray-400/70 dark:text-gray-600 shrink-0">
                    {entry.date ? new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── New Goal Form ────────────────────────────────────────────────────────────

function NewGoalForm({ onCancel, onCreated }) {
  const [form, setForm] = useState({ title: '', metric: '', target: '', deadline: '' });
  const [milestones, setMilestones] = useState([]);
  const [saving, setSaving] = useState(false);

  function addMilestone() {
    setMilestones(ms => [...ms, { label: '', target: '', due: '' }]);
  }

  function updateMilestone(i, field, value) {
    setMilestones(ms => ms.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  }

  function removeMilestone(i) {
    setMilestones(ms => ms.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const ms = milestones
        .filter(m => m.label.trim())
        .map(m => ({
          label: m.label.trim(),
          target: m.target ? Number(m.target) : undefined,
          due: m.due || undefined,
        }));
      await api.goals.create({
        title: form.title.trim(),
        metric: form.metric.trim(),
        target: form.target ? Number(form.target) : undefined,
        deadline: form.deadline || undefined,
        milestones: ms,
      });
      onCreated();
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-black/[0.05] dark:border-white/[0.05] shrink-0">
        <p className="text-[15px] font-semibold text-gray-800 dark:text-gray-100 tracking-tight flex-1">
          New Goal
        </p>
        <button
          onClick={onCancel}
          className="text-[12px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
        <div>
          <label className={labelCls}>Title</label>
          <input
            autoFocus
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="What do you want to achieve?"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Metric</label>
            <input
              value={form.metric}
              onChange={e => setForm(f => ({ ...f, metric: e.target.value }))}
              placeholder="km, pages, hours…"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Target</label>
            <input
              type="number"
              value={form.target}
              onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
              placeholder="e.g. 100"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Deadline</label>
          <input
            type="date"
            value={form.deadline}
            onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
            className={inputCls}
          />
        </div>

        {/* Milestones */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400/70 dark:text-gray-500">
              Milestones
            </label>
            <button
              type="button"
              onClick={addMilestone}
              className="flex items-center gap-1 text-[11px] font-medium text-indigo-500 dark:text-indigo-400
                hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Add
            </button>
          </div>

          {milestones.length === 0 ? (
            <p className="text-[12px] text-gray-400/70 dark:text-gray-600 italic px-1">
              No milestones — optional checkpoints along the way.
            </p>
          ) : (
            <div className="space-y-2">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl
                  bg-black/[0.02] dark:bg-white/[0.03]
                  border border-black/[0.05] dark:border-white/[0.05]">
                  <input
                    value={m.label}
                    onChange={e => updateMilestone(i, 'label', e.target.value)}
                    placeholder="Milestone label"
                    className="flex-1 bg-transparent text-[13px] text-gray-700 dark:text-gray-300
                      placeholder-gray-400 dark:placeholder-gray-600 outline-none min-w-0"
                  />
                  <input
                    type="number"
                    value={m.target}
                    onChange={e => updateMilestone(i, 'target', e.target.value)}
                    placeholder="Target"
                    className="w-20 bg-transparent text-[12px] text-gray-500 dark:text-gray-500
                      placeholder-gray-400 dark:placeholder-gray-600 outline-none text-right"
                  />
                  <input
                    type="date"
                    value={m.due}
                    onChange={e => updateMilestone(i, 'due', e.target.value)}
                    className="bg-transparent text-[12px] text-gray-500 dark:text-gray-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeMilestone(i)}
                    className="text-gray-300 dark:text-gray-700 hover:text-rose-400 dark:hover:text-rose-500 transition-colors shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-[13px]
              text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !form.title.trim()}
            className="px-5 py-2 rounded-lg text-[13px] font-medium
              bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50
              text-white transition-colors duration-150"
          >
            {saving ? 'Creating…' : 'Create Goal'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Goals Section ────────────────────────────────────────────────────────────

function GoalsSection() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'new' | 'detail'
  const [selectedGoal, setSelectedGoal] = useState(null);

  async function fetchGoals() {
    setLoading(true);
    try {
      const result = await api.goals.getAll();
      setGoals(result.goals || []);
    } catch {
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchGoals(); }, []);

  function handleGoalUpdated(updatedGoal) {
    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    setSelectedGoal(updatedGoal);
  }

  async function handleCreated() {
    await fetchGoals();
    setView('list');
  }

  if (view === 'new') {
    return <NewGoalForm onCancel={() => setView('list')} onCreated={handleCreated} />;
  }

  if (view === 'detail' && selectedGoal) {
    return (
      <GoalDetail
        goal={selectedGoal}
        onBack={() => { setView('list'); setSelectedGoal(null); }}
        onUpdated={handleGoalUpdated}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-black/[0.05] dark:border-white/[0.05] shrink-0">
        <p className="text-[14px] font-semibold text-gray-800 dark:text-gray-100 flex-1">Goals</p>
        <button
          onClick={() => setView('new')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium
            bg-indigo-500 hover:bg-indigo-600 text-white transition-colors duration-150"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          New Goal
        </button>
      </div>

      <div className="overflow-y-auto flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          </div>
        ) : goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-medium text-gray-600 dark:text-gray-400">No goals yet</p>
              <p className="text-[12px] text-gray-400 dark:text-gray-600 mt-0.5">
                Track something big you're working towards.
              </p>
            </div>
            <button
              onClick={() => setView('new')}
              className="mt-1 px-4 py-2 rounded-lg text-[13px] font-medium
                bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
            >
              Create Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onClick={() => { setSelectedGoal(goal); setView('detail'); }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LifePage ─────────────────────────────────────────────────────────────────

export default function LifePage() {
  const [tab, setTab] = useState('daily');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub-tab bar */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-0 shrink-0">
        {[
          { id: 'daily', label: 'Daily' },
          { id: 'goals', label: 'Goals' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-t-lg text-[13px] font-medium transition-all duration-150 border-b-2 ${
              tab === t.id
                ? 'text-indigo-600 dark:text-indigo-400 border-indigo-500 bg-white/50 dark:bg-white/[0.04]'
                : 'text-gray-500 dark:text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="flex-1 border-b-2 border-black/[0.05] dark:border-white/[0.05]" />
      </div>

      {/* Tab content — glass card */}
      <div className="flex-1 overflow-hidden mx-4 mb-4 rounded-b-2xl rounded-tr-2xl
        bg-white/60 dark:bg-[#0d0d1a]/80
        border border-black/[0.07] dark:border-white/[0.06]
        backdrop-blur-xl
        flex flex-col">
        {tab === 'daily' ? <DailyTracker /> : <GoalsSection />}
      </div>
    </div>
  );
}
