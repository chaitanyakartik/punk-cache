import { useDroppable } from '@dnd-kit/core';
import KanbanCard from './KanbanCard';

function EmptyColumn({ text, isOver }) {
  return (
    <div className={`flex-1 flex flex-col items-center justify-center gap-2 py-10 rounded-xl transition-all duration-150 ${isOver ? 'bg-white/30 dark:bg-white/[0.04]' : ''}`}>
      <div className={`w-6 h-6 rounded-full border border-dashed transition-colors duration-150 ${isOver ? 'border-gray-400/50 dark:border-gray-500' : 'border-gray-200/80 dark:border-gray-700/60'}`} />
      <p className="text-[11px] text-gray-300/80 dark:text-gray-700 text-center">{text}</p>
    </div>
  );
}

export default function KanbanColumn({ column, cards, onCardClick, isDragging }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className={`flex flex-col rounded-2xl border overflow-hidden transition-all duration-150
      ${column.colBorder} ${column.colBg}
      ${isOver ? column.isOverRing : ''}`}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${column.headerBorder} shrink-0`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${column.dotClass} ${column.glowClass}`} />
        <span className={`text-[11px] font-bold uppercase tracking-[0.08em] ${column.headerColor}`}>
          {column.label}
        </span>
        <span className={`ml-auto text-[11px] font-mono font-semibold ${column.countColor}`}>
          {cards.length}
        </span>
      </div>

      {/* Cards drop zone */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {cards.length === 0
          ? <EmptyColumn text={column.emptyText} isOver={isOver} />
          : cards.map(card => (
              <KanbanCard key={card.id} card={card} onClick={onCardClick} />
            ))
        }
        {/* Extra drop target padding when dragging over non-empty column */}
        {isDragging && cards.length > 0 && (
          <div className={`h-12 rounded-xl border border-dashed transition-all duration-150
            ${isOver
              ? `${column.colBorder} opacity-70`
              : 'border-transparent opacity-0'
            }`}
          />
        )}
      </div>
    </div>
  );
}
