import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCards } from '../../hooks/useCards';
import KanbanBoard from './KanbanBoard';
import CardModal from '../Cards/CardModal';
import NoteEditor from '../Notes/NoteEditor';

const CARD_TYPES = [
  { id: 'task',    label: 'Tasks',    color: '#6366f1' },
  { id: 'note',    label: 'Notes',    color: '#10b981' },
  { id: 'video',   label: 'Videos',   color: '#f43f5e' },
  { id: 'snippet', label: 'Snippets', color: '#f59e0b' },
  { id: 'link',    label: 'Links',    color: '#3b82f6' },
  { id: 'file',    label: 'Files',    color: '#94a3b8' },
];

export default function Workspace() {
  const { contextId } = useParams();
  const navigate = useNavigate();
  const { context, loading, createCard, updateCard, moveCard, refresh } = useCards(contextId);
  const [modalCard, setModalCard] = useState(null); // null | 'new' | card object
  const [noteCard, setNoteCard] = useState(null);   // null | note card object
  const [typeFilter, setTypeFilter] = useState(null); // null | card type string

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-indigo-400/40 border-t-indigo-500 animate-spin" />
        <p className="text-[13px] text-gray-400 dark:text-gray-600">Loading workspace…</p>
      </div>
    </div>
  );

  if (!context) return (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      <p className="text-[13px] text-gray-400 dark:text-gray-600">Workspace not found.</p>
      <button
        onClick={() => navigate('/')}
        className="text-[13px] text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
      >
        ← Back home
      </button>
    </div>
  );

  const handleCardClick = (card) => {
    if (card.type === 'note') {
      setNoteCard(card);
    } else {
      setModalCard(card);
    }
  };

  const handleSave = async (form) => {
    if (modalCard === 'new') {
      await createCard({ type: form.type, content: form.content, meta: form.meta });
    } else {
      await updateCard(modalCard.id, { content: form.content, meta: form.meta });
      if (form.state !== modalCard.state) await moveCard(modalCard.id, form.state);
    }
    setModalCard(null);
  };


  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-7 py-4 shrink-0
        border-b border-black/[0.06] dark:border-white/[0.05]
        bg-white/25 dark:bg-white/[0.018] backdrop-blur-sm">
        <div>
          <h1 className="text-[17px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
            {context.name}
          </h1>
          <p className="text-[11px] text-gray-400/80 dark:text-gray-600 mt-0.5 tabular-nums">
            {context.cards.length} {context.cards.length === 1 ? 'card' : 'cards'}
          </p>
        </div>
        <button
          onClick={() => setModalCard('new')}
          className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold
            bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl
            shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35
            hover:-translate-y-0.5 transition-all duration-150"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Card
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden px-5 py-4">
        <KanbanBoard
          cards={typeFilter ? context.cards.filter(c => c.type === typeFilter) : context.cards}
          onCardClick={handleCardClick}
          onMoveCard={moveCard}
        />
      </div>

      {/* Bottom filter bar */}
      <div className="shrink-0 flex items-center gap-1.5 px-5 py-2
        border-t border-black/[0.05] dark:border-white/[0.05]
        bg-white/20 dark:bg-white/[0.012] backdrop-blur-sm">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400/50 dark:text-gray-700 mr-1">
          Filter
        </span>
        {CARD_TYPES.map(t => {
          const count = context.cards.filter(c => c.type === t.id).length;
          if (count === 0) return null;
          const active = typeFilter === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTypeFilter(active ? null : t.id)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-150"
              style={active
                ? { backgroundColor: t.color + '20', color: t.color, border: `1px solid ${t.color}55` }
                : { backgroundColor: 'transparent', color: 'var(--color-gray-400)', border: '1px solid transparent' }
              }
            >
              {t.label}
              <span
                className="text-[10px] font-mono tabular-nums px-1 rounded"
                style={{ backgroundColor: active ? t.color + '30' : 'rgba(0,0,0,0.06)', color: active ? t.color : 'inherit' }}
              >
                {count}
              </span>
            </button>
          );
        })}
        {typeFilter && (
          <button
            onClick={() => setTypeFilter(null)}
            className="ml-auto text-[10px] text-gray-400/60 dark:text-gray-700 hover:text-gray-500 dark:hover:text-gray-500 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Card modal (non-note types + new card) */}
      {modalCard !== null && (
        <CardModal
          card={modalCard === 'new' ? null : modalCard}
          onSave={handleSave}
          onClose={() => setModalCard(null)}
          contextId={contextId}
        />
      )}

      {/* Note editor */}
      {noteCard !== null && (
        <NoteEditor
          card={noteCard}
          contextId={contextId}
          onClose={() => setNoteCard(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
