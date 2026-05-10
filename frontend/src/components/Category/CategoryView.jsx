import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useContexts } from '../../hooks/useContexts';
import { useCategories } from '../../context/CategoriesContext';
import api from '../../api/client';
import CardModal from '../Cards/CardModal';

const COLUMNS = [
  { id: 'pending',  label: 'Pending',     dotClass: 'bg-amber-400',   colBg: 'bg-amber-500/[0.035] dark:bg-amber-500/[0.04]',    colBorder: 'border-amber-200/30 dark:border-amber-500/[0.08]',     headerBorder: 'border-amber-200/25 dark:border-amber-500/[0.06]',  headerColor: 'text-amber-500/80 dark:text-amber-400/70',   countColor: 'text-amber-500/60 dark:text-amber-400/50'   },
  { id: 'ongoing',  label: 'In Progress',  dotClass: 'bg-blue-400',    colBg: 'bg-blue-500/[0.035] dark:bg-blue-500/[0.04]',      colBorder: 'border-blue-200/30 dark:border-blue-500/[0.08]',       headerBorder: 'border-blue-200/25 dark:border-blue-500/[0.06]',    headerColor: 'text-blue-500/80 dark:text-blue-400/70',     countColor: 'text-blue-500/60 dark:text-blue-400/50'     },
  { id: 'done',     label: 'Done',         dotClass: 'bg-emerald-400', colBg: 'bg-emerald-500/[0.025] dark:bg-emerald-500/[0.03]', colBorder: 'border-emerald-200/25 dark:border-emerald-500/[0.07]', headerBorder: 'border-emerald-200/20 dark:border-emerald-500/[0.06]', headerColor: 'text-emerald-500/80 dark:text-emerald-400/70', countColor: 'text-emerald-500/60 dark:text-emerald-400/50' },
];

const TYPE_CONFIG = {
  task:    { accent: 'border-l-indigo-400/80',  badge: 'bg-indigo-100/80 dark:bg-indigo-500/[0.14] text-indigo-600 dark:text-indigo-300/90',   label: 'Task'    },
  note:    { accent: 'border-l-emerald-400/80', badge: 'bg-emerald-100/80 dark:bg-emerald-500/[0.14] text-emerald-600 dark:text-emerald-300/90', label: 'Note'    },
  video:   { accent: 'border-l-rose-400/80',    badge: 'bg-rose-100/80 dark:bg-rose-500/[0.14] text-rose-600 dark:text-rose-300/90',             label: 'Video'   },
  snippet: { accent: 'border-l-amber-400/80',   badge: 'bg-amber-100/80 dark:bg-amber-500/[0.14] text-amber-600 dark:text-amber-300/90',         label: 'Code'    },
  link:    { accent: 'border-l-cyan-400/80',    badge: 'bg-cyan-100/80 dark:bg-cyan-500/[0.14] text-cyan-600 dark:text-cyan-300/90',             label: 'Link'    },
  file:    { accent: 'border-l-slate-400/80',   badge: 'bg-slate-100/80 dark:bg-slate-500/[0.14] text-slate-500 dark:text-slate-400/80',         label: 'File'    },
};

function CategoryCard({ card, wsColor, onClick }) {
  const cfg = TYPE_CONFIG[card.type] || TYPE_CONFIG.task;
  const daysSince = Math.floor((Date.now() - new Date(card.updated_at)) / 86400000);

  return (
    <div
      onClick={() => onClick(card)}
      className={`cursor-pointer kanban-card rounded-xl border-l-[3px] ${cfg.accent} p-3.5`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide ${cfg.badge}`}>{cfg.label}</span>
        <span className="text-[10px] text-gray-300/80 dark:text-gray-700 tabular-nums font-mono">
          {daysSince === 0 ? 'today' : `${daysSince}d ago`}
        </span>
      </div>
      <p className="text-[13px] text-gray-800 dark:text-gray-200 line-clamp-2 leading-[1.45] font-[450] mb-2">
        {card.content}
      </p>
      {/* Workspace tag */}
      <div className="flex items-center gap-1.5">
        <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: wsColor }} />
        <span className="text-[10px] font-medium truncate" style={{ color: wsColor + 'cc' }}>
          {card.contextName}
        </span>
      </div>
    </div>
  );
}

export default function CategoryView() {
  const { categoryId } = useParams();
  const { categories } = useCategories();
  const { contexts, loading: ctxLoading } = useContexts();
  const [cards, setCards] = useState([]);
  const [colorMap, setColorMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalCard, setModalCard] = useState(null);
  const [modalContextId, setModalContextId] = useState(null);

  const category = categories.find(c => c.id === categoryId);
  const catContexts = contexts.filter(c => c.category === categoryId);

  useEffect(() => {
    if (ctxLoading) return;
    if (catContexts.length === 0) { setLoading(false); return; }

    const colors = {};
    catContexts.forEach(c => { colors[c.id] = c.color || '#8b5cf6'; });
    setColorMap(colors);

    Promise.all(catContexts.map(c => api.get(`/contexts/${c.id}`))).then(full => {
      const enriched = [];
      full.forEach(ctx => {
        ctx.cards.forEach(card => enriched.push({ ...card, contextId: ctx.id, contextName: ctx.name }));
      });
      setCards(enriched);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [ctxLoading, categoryId, catContexts.length]);

  const handleCardClick = (card) => {
    setModalContextId(card.contextId);
    setModalCard(card);
  };

  const handleSave = async (form) => {
    if (!modalCard || !modalContextId) return;
    await api.put(`/cards/${modalContextId}/${modalCard.id}`, { content: form.content, meta: form.meta });
    if (form.state !== modalCard.state) {
      await api.put(`/cards/${modalContextId}/${modalCard.id}/state`, { state: form.state });
    }
    // Refresh cards
    const full = await Promise.all(catContexts.map(c => api.get(`/contexts/${c.id}`)));
    const enriched = [];
    full.forEach(ctx => {
      ctx.cards.forEach(card => enriched.push({ ...card, contextId: ctx.id, contextName: ctx.name }));
    });
    setCards(enriched);
    setModalCard(null);
  };


  if (!category) return (
    <div className="h-full flex items-center justify-center">
      <p className="text-[13px] text-gray-400 dark:text-gray-600">Category not found.</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-7 py-4 shrink-0
        border-b border-black/[0.06] dark:border-white/[0.05]
        bg-white/25 dark:bg-white/[0.018] backdrop-blur-sm">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: category.color, boxShadow: `0 0 8px ${category.color}66` }}
        />
        <div>
          <h1 className="text-[17px] font-bold text-gray-900 dark:text-white tracking-tight">
            {category.label}
            <span className="ml-2 text-[13px] font-normal text-gray-400 dark:text-gray-600">General</span>
          </h1>
          <p className="text-[11px] text-gray-400/80 dark:text-gray-600 mt-0.5">
            {catContexts.length} workspace{catContexts.length !== 1 ? 's' : ''} · {cards.length} cards
          </p>
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div className="h-full flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-indigo-400/40 border-t-indigo-500 animate-spin" />
        </div>
      ) : catContexts.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center gap-2">
          <p className="text-[13px] text-gray-400/80 dark:text-gray-600">No workspaces in {category.label} yet.</p>
          <p className="text-[11px] text-gray-400/50 dark:text-gray-700">Use the + in the tab bar to create one.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden px-5 py-4">
          <div className="grid grid-cols-3 gap-3.5 h-full">
            {COLUMNS.map(col => {
              const colCards = cards.filter(c => c.state === col.id);
              return (
                <div key={col.id} className={`flex flex-col rounded-2xl border ${col.colBorder} ${col.colBg} overflow-hidden`}>
                  <div className={`flex items-center gap-2 px-4 py-3 border-b ${col.headerBorder} shrink-0`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${col.dotClass}`} />
                    <span className={`text-[11px] font-bold uppercase tracking-[0.08em] ${col.headerColor}`}>{col.label}</span>
                    <span className={`ml-auto text-[11px] font-mono font-semibold ${col.countColor}`}>{colCards.length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                    {colCards.length === 0 ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="w-6 h-6 rounded-full border border-dashed border-gray-200/80 dark:border-gray-700/60" />
                      </div>
                    ) : colCards.map(card => (
                      <CategoryCard
                        key={card.id}
                        card={card}
                        wsColor={colorMap[card.contextId] || '#8b5cf6'}
                        onClick={handleCardClick}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modalCard && (
        <CardModal
          card={modalCard}
          onSave={handleSave}
          onClose={() => setModalCard(null)}
          contextId={modalContextId}
        />
      )}
    </div>
  );
}
