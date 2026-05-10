import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/client';
import { useCategories } from '../../context/CategoriesContext';

const DEFAULT_COLOR = '#8b5cf6';

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function isVisibleToday(card) {
  if (card.state === 'ongoing') return true;
  if (card.state === 'done') return isToday(card.meta?.completion_date);
  return false;
}

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionDivider({ label, count }) {
  return (
    <li className="flex items-center gap-2.5 px-3 py-1.5 mt-1">
      <div className="flex-1 h-px bg-black/[0.05] dark:bg-white/[0.05]" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400/60 dark:text-gray-700 whitespace-nowrap">
        {label} · {count}
      </span>
      <div className="flex-1 h-px bg-black/[0.05] dark:bg-white/[0.05]" />
    </li>
  );
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function Checkbox({ checked, color, onClick }) {
  return (
    <button
      type="button"
      onClick={e => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className="shrink-0 w-4 h-4 rounded-full border flex items-center justify-center
        transition-all duration-150 focus:outline-none"
      style={checked ? {
        backgroundColor: color,
        borderColor: color,
        boxShadow: `0 0 6px ${color}66`,
      } : {
        borderColor: color + '60',
        backgroundColor: 'transparent',
      }}
    >
      {checked && (
        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      )}
    </button>
  );
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({ card, color, done, animClass, onToggle }) {
  return (
    <li className={animClass}>
      <div
        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-default"
        style={{ backgroundColor: color + (done ? '0d' : '14') }}
        onMouseEnter={e => { if (!done) e.currentTarget.style.backgroundColor = color + '26'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = color + (done ? '0d' : '14'); }}
      >
        <Checkbox checked={done} color={color} onClick={onToggle} />

        <span className={`flex-1 min-w-0 text-[13px] leading-snug font-[450] truncate transition-colors duration-150
          ${done
            ? 'line-through text-gray-400/70 dark:text-gray-600'
            : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
          }`}>
          {card.content}
        </span>

        <span
          className="text-[10px] shrink-0 font-medium"
          style={{ color: color + (done ? '55' : '80') }}
        >
          {card.contextName}
        </span>
      </div>
    </li>
  );
}


// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TodoList() {
  const { categories } = useCategories();
  const [cards, setCards] = useState([]);
  const [colorMap, setColorMap] = useState({});
  const [categoryMap, setCategoryMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [animatingOut, setAnimatingOut] = useState(new Set());
  const [animatingIn, setAnimatingIn] = useState(new Set());
  const [activeCategory, setActiveCategory] = useState(null);

  const load = useCallback(async () => {
    try {
      const ctxList = await api.get('/contexts');
      const colors = {}, cats = {};
      const catColorMap = Object.fromEntries(categories.map(c => [c.id, c.color]));
      ctxList.forEach(c => {
        const catColor = c.category ? catColorMap[c.category] : null;
        colors[c.id] = catColor || c.color || DEFAULT_COLOR;
        cats[c.id] = c.category || null;
      });
      setColorMap(colors);
      setCategoryMap(cats);

      const full = await Promise.all(ctxList.map(c => api.get(`/contexts/${c.id}`)));
      const enriched = [];
      full.forEach(ctx => {
        ctx.cards.forEach(card => {
          if (isVisibleToday(card)) {
            enriched.push({ ...card, contextId: ctx.id, contextName: ctx.name });
          }
        });
      });
      setCards(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visibleCards = activeCategory
    ? cards.filter(card => categoryMap[card.contextId] === activeCategory)
    : cards;

  const active = visibleCards.filter(c => c.state === 'ongoing');
  const completedToday = visibleCards.filter(c => c.state === 'done');

  // ─── Toggle completion ────────────────────────────────────────────────────

  const toggle = useCallback(async (card) => {
    const completing = card.state !== 'done';
    const newState = completing ? 'done' : 'ongoing';

    setAnimatingOut(prev => new Set([...prev, card.id]));

    setTimeout(() => {
      setAnimatingOut(prev => { const s = new Set(prev); s.delete(card.id); return s; });
      const now = new Date().toISOString();
      setCards(prev => prev.map(c => c.id !== card.id ? c : {
        ...c,
        state: newState,
        meta: { ...c.meta, completion_date: completing ? now : null },
      }));
      setAnimatingIn(prev => new Set([...prev, card.id]));
      setTimeout(() => {
        setAnimatingIn(prev => { const s = new Set(prev); s.delete(card.id); return s; });
      }, 250);
    }, 190);

    try {
      await api.put(`/cards/${card.contextId}/${card.id}/state`, { state: newState });
    } catch (err) {
      console.error('Toggle failed, reverting', err);
      setCards(prev => prev.map(c => c.id === card.id ? { ...c, state: card.state, meta: card.meta } : c));
    }
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="p-4 space-y-1.5">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-10 rounded-xl shimmer" />)}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {active.length === 0 && completedToday.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[140px] gap-2 px-6">
            <div className="w-8 h-8 rounded-full bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[13px] text-gray-400/80 dark:text-gray-600 text-center">
              {activeCategory ? 'Nothing in progress here' : 'Nothing in progress'}
            </p>
          </div>
        ) : (
          <ul className="py-1.5 px-2 space-y-0.5">
            {active.map(card => (
              <TaskRow
                key={card.id}
                card={card}
                color={colorMap[card.contextId] || DEFAULT_COLOR}
                done={false}
                animClass={animatingOut.has(card.id) ? 'task-checking' : animatingIn.has(card.id) ? 'task-enter' : ''}
                onToggle={() => toggle(card)}
              />
            ))}
            {completedToday.length > 0 && (
              <>
                <SectionDivider label="Completed today" count={completedToday.length} />
                {completedToday.map(card => (
                  <TaskRow
                    key={card.id}
                    card={card}
                    color={colorMap[card.contextId] || DEFAULT_COLOR}
                    done={true}
                    animClass={animatingOut.has(card.id) ? 'task-unchecking' : animatingIn.has(card.id) ? 'task-enter' : ''}
                    onToggle={() => toggle(card)}
                  />
                ))}
              </>
            )}
          </ul>
        )}
      </div>

      {/* Category filter bar */}
      <div className="px-3 py-2 border-t border-black/[0.05] dark:border-white/[0.05] shrink-0 flex items-center gap-1.5">
        <button
          onClick={() => setActiveCategory(null)}
          className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150"
          style={!activeCategory
            ? { backgroundColor: 'rgba(0,0,0,0.08)', color: 'inherit' }
            : { color: 'rgba(128,128,128,0.6)' }
          }
        >
          All
        </button>
        {categories.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(isActive ? null : cat.id)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150"
              style={isActive
                ? { backgroundColor: cat.color, color: '#fff', boxShadow: `0 0 8px ${cat.color}55` }
                : { backgroundColor: cat.color + '22', color: cat.color }
              }
            >
              {cat.label}
            </button>
          );
        })}
        <span className="ml-auto text-[11px] text-gray-300/70 dark:text-gray-800 tabular-nums">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
}
