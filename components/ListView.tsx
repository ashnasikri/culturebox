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
  itemType?: "movie" | "book";
}

// ─── Books timeline view ──────────────────────────────────────────────────────

const MONTH_ORDER: Record<string, number> = {
  January: 1, February: 2, March: 3, April: 4,
  May: 5, June: 6, July: 7, August: 8,
  September: 9, October: 10, November: 11, December: 12,
};

function BookSectionHeader({
  type,
  label,
}: {
  type: "reading" | "month" | "want_to" | "earlier";
  label?: string;
}) {
  if (type === "reading") {
    return (
      <div className="flex items-center gap-2">
        <span>📖</span>
        <span
          className="font-body uppercase tracking-[0.06em]"
          style={{ color: "#c4b5a0", fontSize: 11, fontWeight: 500 }}
        >
          Currently Reading
        </span>
      </div>
    );
  }

  if (type === "want_to") {
    return (
      <div className="flex items-center gap-2">
        <span>📋</span>
        <span
          className="font-body uppercase tracking-[0.06em]"
          style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, fontWeight: 500 }}
        >
          Want to Read
        </span>
      </div>
    );
  }

  // month or earlier — text + extending divider line
  return (
    <div className="flex items-center gap-3">
      <span
        className="font-body uppercase tracking-[0.06em] shrink-0"
        style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 500 }}
      >
        {label ?? "Earlier"}
      </span>
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
    </div>
  );
}

function BookTimelineRow({
  item,
  isLast,
  onTap,
  isWantTo,
}: {
  item: Item;
  isLast: boolean;
  onTap: () => void;
  isWantTo?: boolean;
}) {
  return (
    <button
      onClick={onTap}
      className={`flex items-center gap-4 w-full py-3.5 px-4 text-left transition-colors hover:bg-white/[0.02] active:bg-white/[0.04] ${
        !isLast ? "border-b border-white/[0.05]" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <p
          className="font-body font-semibold text-[14px] leading-snug truncate"
          style={{ color: isWantTo ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.87)" }}
        >
          {item.title}
        </p>
        <p
          className="font-body text-[12px] mt-0.5 truncate"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          {item.creator}
        </p>
        {item.status === "reading" && (
          <div className="flex items-center gap-2 mt-2">
            <div
              className="rounded-full overflow-hidden"
              style={{ width: 80, height: 3, background: "rgba(255,255,255,0.1)" }}
            >
              <div
                className="h-full rounded-full bg-vault-warm"
                style={{ width: `${item.progress ?? 0}%` }}
              />
            </div>
            <span
              className="font-body text-[11px]"
              style={{ color: "rgba(196,181,160,0.8)" }}
            >
              {item.progress ?? 0}%
            </span>
          </div>
        )}
      </div>

      <div
        className="rounded overflow-hidden shrink-0"
        style={{
          width: 44,
          height: 66,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          filter: isWantTo ? "grayscale(1)" : undefined,
          opacity: isWantTo ? 0.5 : 1,
        }}
      >
        {item.cover_image_url ? (
          <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-vault-muted text-xs">
            📖
          </div>
        )}
      </div>
    </button>
  );
}

function BooksTimelineView({
  items,
  onItemTap,
}: {
  items: Item[];
  onItemTap?: (item: Item) => void;
}) {
  const readingItems = [...items.filter((i) => i.status === "reading")].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const wantToItems = [...items.filter((i) => i.status === "want_to")].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Group read items by month+year
  const monthMap = new Map<string, { month: string; year: number; items: Item[] }>();
  const earlierItems: Item[] = [];

  for (const item of items.filter((i) => i.status === "read")) {
    if (item.finished_month && item.finished_year) {
      const key = `${item.finished_year}-${item.finished_month}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, { month: item.finished_month, year: item.finished_year, items: [] });
      }
      monthMap.get(key)!.items.push(item);
    } else {
      earlierItems.push(item);
    }
  }

  const monthGroups = Array.from(monthMap.values()).sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return (MONTH_ORDER[b.month] ?? 0) - (MONTH_ORDER[a.month] ?? 0);
  });

  for (const g of monthGroups) {
    g.items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  earlierItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  function SectionCard({ sectionItems, isWantTo }: { sectionItems: Item[]; isWantTo?: boolean }) {
    if (isWantTo) {
      return (
        <div className="mt-3">
          {sectionItems.map((item, idx) => (
            <BookTimelineRow
              key={item.id}
              item={item}
              isLast={idx === sectionItems.length - 1}
              onTap={() => onItemTap?.(item)}
              isWantTo
            />
          ))}
        </div>
      );
    }
    return (
      <div
        className="mt-3 rounded-xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}
      >
        {sectionItems.map((item, idx) => (
          <BookTimelineRow
            key={item.id}
            item={item}
            isLast={idx === sectionItems.length - 1}
            onTap={() => onItemTap?.(item)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 pb-24 gap-5">
      {readingItems.length > 0 && (
        <div>
          <BookSectionHeader type="reading" />
          <SectionCard sectionItems={readingItems} />
        </div>
      )}

      {monthGroups.map((g) => (
        <div key={`${g.year}-${g.month}`}>
          <BookSectionHeader
            type="month"
            label={`${g.month.toUpperCase()} ${g.year}`}
          />
          <SectionCard sectionItems={g.items} />
        </div>
      ))}

      {earlierItems.length > 0 && (
        <div>
          <BookSectionHeader type="earlier" />
          <SectionCard sectionItems={earlierItems} />
        </div>
      )}

      {wantToItems.length > 0 && (
        <div>
          <BookSectionHeader type="want_to" />
          <SectionCard sectionItems={wantToItems} isWantTo />
        </div>
      )}
    </div>
  );
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
          {(item.note_count ?? 0) > 0 && (
            <p className="text-[11px] font-body mt-1" style={{ color: "rgba(196,181,160,0.5)" }}>
              {item.note_count} {item.note_count === 1 ? "note" : "notes"}
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

export default function ListView({ items, isLoading, onItemTap, onReorder, itemType }: ListViewProps) {
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

  // Books get the timeline view
  if (itemType === "book") {
    return <BooksTimelineView items={items} onItemTap={onItemTap} />;
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
