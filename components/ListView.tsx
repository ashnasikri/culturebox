"use client";

import { Item } from "@/types";
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
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ListViewProps {
  items: Item[];
  isLoading?: boolean;
  onItemTap?: (item: Item) => void;
  onReorder?: (newOrder: Item[]) => void;
}

function GripLines() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor">
      <rect x="0" y="0" width="14" height="2" rx="1" />
      <rect x="0" y="5" width="14" height="2" rx="1" />
      <rect x="0" y="10" width="14" height="2" rx="1" />
    </svg>
  );
}

function SortableListRow({
  item,
  isLast,
  onTap,
}: {
  item: Item;
  isLast: boolean;
  onTap: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const isWantTo = item.status === "want_to";
  const isReading = item.status === "reading";
  const isFinished = item.status === "watched" || item.status === "read";

  const statusLine = isFinished
    ? `✓ ${item.status === "watched" ? "Watched" : "Read"}${
        item.finished_month ? ` · ${item.finished_month} ${item.finished_year ?? ""}` : ""
      }`
    : isReading
    ? `Reading · ${item.progress ?? 0}%`
    : item.type === "movie"
    ? "Want to Watch"
    : "Want to Read";

  const statusColor = isFinished
    ? "text-vault-text/70"
    : isReading
    ? "text-vault-warm"
    : "text-vault-muted/60";

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className={`flex items-center ${!isLast ? "border-b border-white/[0.05]" : ""} ${isWantTo ? "opacity-50" : ""}`}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        {...attributes}
        className="pr-3 py-4 cursor-grab active:cursor-grabbing select-none text-vault-muted/25 hover:text-vault-muted/60 transition-colors shrink-0"
        style={{ touchAction: "none" }}
        title="Drag to reorder"
      >
        <GripLines />
      </div>

      {/* Row content */}
      <button
        onClick={onTap}
        className="flex items-center gap-4 py-4 text-left flex-1 min-w-0 transition-colors hover:bg-white/[0.02] active:bg-white/[0.04]"
      >
        <div className="flex-1 min-w-0">
          <p className="font-body font-semibold text-vault-text text-[15px] leading-snug truncate">
            {item.title}
          </p>
          <p className="text-xs text-vault-muted font-body mt-0.5 truncate">
            {[item.creator, item.year].filter(Boolean).join(" · ")}
          </p>
          <p className={`text-xs font-body mt-1.5 ${statusColor}`}>{statusLine}</p>
          {item.notes && (
            <p className="text-[11px] font-body mt-1 truncate" style={{ color: "rgba(255,255,255,0.3)" }}>
              {item.notes}
            </p>
          )}
          {isReading && (
            <div className="mt-1.5 h-[2px] w-full max-w-[160px] bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-vault-warm"
                style={{ width: `${item.progress ?? 0}%` }}
              />
            </div>
          )}
        </div>

        <div className="w-12 h-[60px] rounded-md overflow-hidden bg-vault-card-bg border border-vault-card-border shrink-0">
          {item.cover_image_url ? (
            <img
              src={item.cover_image_url}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-vault-muted text-xs">
              {item.type === "movie" ? "🎬" : "📖"}
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

export default function ListView({ items, isLoading, onItemTap, onReorder }: ListViewProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 500, tolerance: 5 } })
  );

  if (isLoading) {
    return (
      <div className="flex flex-col px-4 pb-24">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-4 border-b border-white/[0.05]">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/5 rounded bg-vault-card-bg animate-shimmer" />
              <div className="h-3 w-2/5 rounded bg-vault-card-bg animate-shimmer" />
              <div className="h-3 w-1/3 rounded bg-vault-card-bg animate-shimmer" />
            </div>
            <div className="w-12 h-[60px] rounded bg-vault-card-bg animate-shimmer shrink-0" />
          </div>
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
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col px-4 pb-24">
          {items.map((item, idx) => (
            <SortableListRow
              key={item.id}
              item={item}
              isLast={idx === items.length - 1}
              onTap={() => onItemTap?.(item)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
