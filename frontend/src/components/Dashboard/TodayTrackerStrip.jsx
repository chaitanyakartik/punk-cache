import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/client';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toYearMonth(dateStr) {
  return dateStr.slice(0, 7); // "YYYY-MM-DD" → "YYYY-MM"
}

function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

export default function TodayTrackerStrip() {
  const today = todayISO();
  const yearMonth = toYearMonth(today);

  const [columns, setColumns] = useState([]);
  const [row, setRow] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.tracker.getMonth(yearMonth).then(data => {
      setColumns(data.columns || []);
      const r = (data.rows || []).find(r => r.date === today) || {};
      setRow(r);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [today, yearMonth]);

  const persist = useCallback(async (colId, value) => {
    try {
      await api.tracker.updateRow(yearMonth, today, { [colId]: value });
    } catch {
      // silent
    }
  }, [yearMonth, today]);

  const debouncedPersist = useDebounce(persist, 500);

  function handleChange(col, value) {
    setRow(prev => ({ ...prev, [col.id]: value }));
    if (col.type === 'checkbox') {
      persist(col.id, value); // instant for checkboxes
    } else {
      debouncedPersist(col.id, value);
    }
  }

  if (!loaded || columns.length === 0) return null;

  return (
    <div className="shrink-0 border-t border-black/[0.05] dark:border-white/[0.05]
      px-4 py-2.5 flex items-center gap-1 overflow-x-auto">

      {/* Label */}
      <span className="text-[10px] font-semibold uppercase tracking-widest
        text-gray-400/60 dark:text-gray-600 shrink-0 mr-2">
        Today
      </span>

      {/* Columns */}
      {columns.map((col, i) => {
        const val = row[col.id];

        return (
          <div key={col.id} className={`flex items-center gap-1.5 shrink-0 ${i > 0 ? 'pl-3 border-l border-black/[0.06] dark:border-white/[0.06]' : ''}`}>
            <span className="text-[11px] text-gray-400 dark:text-gray-600 whitespace-nowrap">
              {col.label}
            </span>

            {col.type === 'checkbox' ? (
              <button
                onClick={() => handleChange(col, !val)}
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all duration-150 ${
                  val
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-gray-300 dark:border-gray-600 text-transparent hover:border-gray-400'
                }`}
              >
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </button>
            ) : col.type === 'time' ? (
              <input
                type="text"
                value={val || ''}
                onChange={e => handleChange(col, e.target.value)}
                placeholder="--:--"
                className="w-14 px-1.5 py-0.5 rounded text-center text-[11px]
                  bg-black/[0.04] dark:bg-white/[0.05]
                  border border-black/[0.07] dark:border-white/[0.07]
                  text-gray-700 dark:text-gray-300
                  placeholder-gray-300 dark:placeholder-gray-700
                  outline-none focus:border-indigo-400/50 dark:focus:border-indigo-500/50
                  transition-colors"
              />
            ) : col.type === 'number' ? (
              <input
                type="number"
                value={val ?? ''}
                onChange={e => handleChange(col, e.target.value === '' ? null : Number(e.target.value))}
                placeholder="—"
                className="w-12 px-1.5 py-0.5 rounded text-center text-[11px]
                  bg-black/[0.04] dark:bg-white/[0.05]
                  border border-black/[0.07] dark:border-white/[0.07]
                  text-gray-700 dark:text-gray-300
                  placeholder-gray-300 dark:placeholder-gray-700
                  outline-none focus:border-indigo-400/50 dark:focus:border-indigo-500/50
                  transition-colors"
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
