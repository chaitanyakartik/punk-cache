import { useState } from 'react';
import { DndContext, closestCorners, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';

export const COLUMNS = [
  {
    id: 'pending',
    label: 'Pending',
    dotClass: 'bg-amber-400',
    glowClass: 'shadow-[0_0_5px_rgba(251,191,36,0.45)]',
    headerColor: 'text-amber-500/80 dark:text-amber-400/70',
    countColor: 'text-amber-500/60 dark:text-amber-400/50',
    colBg: 'bg-amber-500/[0.035] dark:bg-amber-500/[0.04]',
    colBorder: 'border-amber-200/30 dark:border-amber-500/[0.08]',
    headerBorder: 'border-amber-200/25 dark:border-amber-500/[0.06]',
    emptyText: 'No pending tasks',
    isOverRing: 'ring-1 ring-inset ring-amber-400/30',
  },
  {
    id: 'ongoing',
    label: 'In Progress',
    dotClass: 'bg-blue-400',
    glowClass: 'shadow-[0_0_5px_rgba(96,165,250,0.45)]',
    headerColor: 'text-blue-500/80 dark:text-blue-400/70',
    countColor: 'text-blue-500/60 dark:text-blue-400/50',
    colBg: 'bg-blue-500/[0.035] dark:bg-blue-500/[0.04]',
    colBorder: 'border-blue-200/30 dark:border-blue-500/[0.08]',
    headerBorder: 'border-blue-200/25 dark:border-blue-500/[0.06]',
    emptyText: 'Nothing in progress',
    isOverRing: 'ring-1 ring-inset ring-blue-400/30',
  },
  {
    id: 'done',
    label: 'Done',
    dotClass: 'bg-emerald-400',
    glowClass: 'shadow-[0_0_5px_rgba(52,211,153,0.40)]',
    headerColor: 'text-emerald-500/80 dark:text-emerald-400/70',
    countColor: 'text-emerald-500/60 dark:text-emerald-400/50',
    colBg: 'bg-emerald-500/[0.025] dark:bg-emerald-500/[0.03]',
    colBorder: 'border-emerald-200/25 dark:border-emerald-500/[0.07]',
    headerBorder: 'border-emerald-200/20 dark:border-emerald-500/[0.06]',
    emptyText: 'Completed cards appear here',
    isOverRing: 'ring-1 ring-inset ring-emerald-400/30',
  },
];

export default function KanbanBoard({ cards, onCardClick, onMoveCard }) {
  const [activeCard, setActiveCard] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragStart = ({ active }) => {
    setActiveCard(cards.find(c => c.id === active.id) || null);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveCard(null);
    if (!over) return;
    const card = cards.find(c => c.id === active.id);
    if (card && card.state !== over.id) {
      onMoveCard(card.id, over.id);
    }
  };

  const handleDragCancel = () => setActiveCard(null);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-3 gap-3.5 h-full">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            column={col}
            cards={cards.filter(c => c.state === col.id)}
            onCardClick={onCardClick}
            isDragging={!!activeCard}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
        {activeCard
          ? <KanbanCard card={activeCard} onClick={() => {}} isOverlay />
          : null}
      </DragOverlay>
    </DndContext>
  );
}
