import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export const TYPE_CONFIG = {
  task:    { accent: 'border-l-indigo-400/80',  badge: 'bg-indigo-100/80 dark:bg-indigo-500/[0.14] text-indigo-600 dark:text-indigo-300/90',   label: 'Task'    },
  note:    { accent: 'border-l-emerald-400/80', badge: 'bg-emerald-100/80 dark:bg-emerald-500/[0.14] text-emerald-600 dark:text-emerald-300/90', label: 'Note'    },
  video:   { accent: 'border-l-rose-400/80',    badge: 'bg-rose-100/80 dark:bg-rose-500/[0.14] text-rose-600 dark:text-rose-300/90',             label: 'Video'   },
  snippet: { accent: 'border-l-amber-400/80',   badge: 'bg-amber-100/80 dark:bg-amber-500/[0.14] text-amber-600 dark:text-amber-300/90',         label: 'Code'    },
  link:    { accent: 'border-l-cyan-400/80',    badge: 'bg-cyan-100/80 dark:bg-cyan-500/[0.14] text-cyan-600 dark:text-cyan-300/90',             label: 'Link'    },
  file:    { accent: 'border-l-slate-400/80',   badge: 'bg-slate-100/80 dark:bg-slate-500/[0.14] text-slate-500 dark:text-slate-400/80',         label: 'File'    },
};

// ── Task card — compact checkbox row ─────────────────────────────────────────
function TaskCard({ card }) {
  const done = card.state === 'done';
  return (
    <div className="flex items-start gap-2.5">
      <div className={`mt-0.5 w-4 h-4 shrink-0 rounded-full border-[1.5px] flex items-center justify-center transition-colors
        ${done
          ? 'bg-indigo-500 border-indigo-500'
          : 'border-indigo-300/60 dark:border-indigo-500/40'
        }`}
      >
        {done && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <p className={`text-[13px] leading-[1.4] font-[450] flex-1 min-w-0
        ${done ? 'line-through text-gray-400/70 dark:text-gray-600' : 'text-gray-800 dark:text-gray-200'}`}>
        {card.content}
      </p>
    </div>
  );
}

// ── Note card — heading + body preview ───────────────────────────────────────
function NoteCard({ card }) {
  const lines = (card.content || '').split('\n').filter(Boolean);
  const heading = lines[0] || 'Untitled note';
  const preview = lines.slice(1).join(' ').slice(0, 120);
  return (
    <div>
      <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 leading-snug line-clamp-1">
        {heading}
      </p>
      {preview && (
        <p className="text-[11px] text-gray-400/80 dark:text-gray-600 mt-1 leading-relaxed line-clamp-2">
          {preview}
        </p>
      )}
    </div>
  );
}

// ── Video card — thumbnail-first ─────────────────────────────────────────────
function VideoCard({ card }) {
  return (
    <div>
      {card.meta?.thumbnail_url ? (
        <div className="rounded-lg overflow-hidden mb-2.5 -mx-0.5">
          <img
            src={card.meta.thumbnail_url}
            alt=""
            className="w-full h-[110px] object-cover"
          />
        </div>
      ) : null}
      <p className="text-[13px] font-[500] text-gray-800 dark:text-gray-200 leading-snug line-clamp-2">
        {card.content || card.meta?.url}
      </p>
      {card.meta?.author && (
        <p className="text-[10px] text-gray-400/60 dark:text-gray-600 mt-1 truncate">
          {card.meta.author}
        </p>
      )}
    </div>
  );
}

// ── Snippet card ──────────────────────────────────────────────────────────────
function SnippetCard({ card }) {
  return (
    <div>
      <p className="text-[13px] text-gray-800 dark:text-gray-200 font-[450] line-clamp-1">{card.content}</p>
      {card.meta?.language && (
        <span className="inline-block mt-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded
          bg-amber-500/10 dark:bg-amber-500/[0.12] text-amber-600 dark:text-amber-400/80">
          {card.meta.language}
        </span>
      )}
    </div>
  );
}

// ── Link card ─────────────────────────────────────────────────────────────────
function LinkCard({ card }) {
  let domain = '';
  try { domain = new URL(card.meta?.url || '').hostname.replace('www.', ''); } catch { domain = card.meta?.url || ''; }
  return (
    <div>
      <p className="text-[13px] text-gray-800 dark:text-gray-200 font-[450] line-clamp-2">{card.content}</p>
      {domain && (
        <p className="text-[10px] text-cyan-500/70 dark:text-cyan-400/50 mt-1.5 truncate font-mono">{domain}</p>
      )}
    </div>
  );
}

// ── File card ─────────────────────────────────────────────────────────────────
function FileCard({ card }) {
  return (
    <div>
      <p className="text-[13px] text-gray-800 dark:text-gray-200 font-[450] line-clamp-1">{card.content}</p>
      {card.meta?.filename && (
        <p className="text-[10px] text-gray-400/60 dark:text-gray-600 mt-1.5 truncate font-mono">{card.meta.filename}</p>
      )}
    </div>
  );
}

// ── Main KanbanCard ───────────────────────────────────────────────────────────
export default function KanbanCard({ card, onClick, isOverlay }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });

  const cfg = TYPE_CONFIG[card.type] || TYPE_CONFIG.task;
  const daysSince = Math.floor((Date.now() - new Date(card.updated_at)) / 86400000);
  const timeLabel = daysSince === 0 ? 'today' : daysSince === 1 ? '1d ago' : `${daysSince}d ago`;
  const isVideo = card.type === 'video';

  const style = { transform: CSS.Translate.toString(transform) };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && onClick(card)}
      className={`kanban-card rounded-xl border-l-[3px] ${cfg.accent} transition-all duration-150
        ${isVideo ? 'p-0 overflow-hidden' : card.type === 'task' ? 'px-3 py-2' : 'p-3.5'}
        ${isDragging ? 'opacity-40 cursor-grabbing' : 'cursor-pointer hover:scale-[1.01]'}
        ${isOverlay ? 'rotate-[1.5deg] shadow-2xl scale-[1.03] cursor-grabbing' : ''}`}
    >
      {/* Video cards: thumbnail flush to top, meta below */}
      {isVideo ? (
        <div className="p-3.5 pt-0">
          <VideoCard card={card} />
          <div className="flex items-center justify-between mt-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className="text-[10px] text-gray-300/80 dark:text-gray-700 tabular-nums font-mono">{timeLabel}</span>
          </div>
        </div>
      ) : (
        <>
          {/* Non-video: badge + time on top */}
          {card.type !== 'task' && (
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide ${cfg.badge}`}>
                {cfg.label}
              </span>
              <span className="text-[10px] text-gray-300/80 dark:text-gray-700 tabular-nums font-mono shrink-0">{timeLabel}</span>
            </div>
          )}

          {card.type === 'task'    && <TaskCard card={card} />}
          {card.type === 'note'    && <NoteCard card={card} />}
          {card.type === 'snippet' && <SnippetCard card={card} />}
          {card.type === 'link'    && <LinkCard card={card} />}
          {card.type === 'file'    && <FileCard card={card} />}
        </>
      )}
    </div>
  );
}
