"use client";

import { Item } from "@/types";
import CoverCard from "./CoverCard";
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CoverGridProps {
  items: Item[];
  isLoading?: boolean;
  onCoverUpdate?: (id: string, newUrl: string) => void;
  onQuickQuote?: (item: Item) => void;
  onItemTap?: (item: Item) => void;
  onReorder?: (newOrder: Item[]) => void;
}

function GripDots() {
  return (
    <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor">
      <circle cx="2.5" cy="2.5" r="1.5" />
      <circle cx="8" cy="2.5" r="1.5" />
      <circle cx="13.5" cy="2.5" r="1.5" />
      <circle cx="2.5" cy="7.5" r="1.5" />
      <circle cx="8" cy="7.5" r="1.5" />
      <circle cx="13.5" cy="7.5" r="1.5" />
    </svg>
  );
}

function SortableCard({
  item,
  onCoverUpdate,
  onQuickQuote,
  onItemTap,
}: {
  item: Item;
  onCoverUpdate?: (id: string, newUrl: string) => void;
  onQuickQuote?: (item: Item) => void;
  onItemTap?: (item: Item) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className="flex flex-col"
    >
      <CoverCard
        item={item}
        onCoverUpdate={onCoverUpdate}
        onQuickQuote={onQuickQuote}
        onItemTap={onItemTap}
      />
      {/* Drag handle below card */}
      <div
        {...listeners}
        {...attributes}
        className="flex justify-center items-center py-1 cursor-grab active:cursor-grabbing select-none text-vault-muted/25 hover:text-vault-muted/60 transition-colors"
        style={{ touchAction: "none" }}
        title="Drag to reorder"
      >
        <GripDots />
      </div>
    </div>
  );
}

export default function CoverGrid({
  items,
  isLoading,
  onCoverUpdate,
  onQuickQuote,
  onItemTap,
  onReorder,
}: CoverGridProps) {
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 500, tolerance: 5 } })
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3 px-4 pb-24">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-lg animate-shimmer" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-vault-muted font-body text-sm">
        <p>Nothing here yet</p>
        <p className="text-xs mt-1 opacity-60">Tap + to add your first one</p>
      </div>
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    onReorder?.(arrayMove(items, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 gap-3 px-4 pb-24">
          {items.map((item) => (
            <SortableCard
              key={item.id}
              item={item}
              onCoverUpdate={onCoverUpdate}
              onQuickQuote={onQuickQuote}
              onItemTap={onItemTap}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
