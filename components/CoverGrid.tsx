"use client";

import { Item } from "@/types";
import CoverCard from "./CoverCard";

interface CoverGridProps {
  items: Item[];
  isLoading?: boolean;
  onCoverUpdate?: (id: string, newUrl: string) => void;
  onQuickQuote?: (item: Item) => void;
  onItemTap?: (item: Item) => void;
}

export default function CoverGrid({
  items,
  isLoading,
  onCoverUpdate,
  onQuickQuote,
  onItemTap,
}: CoverGridProps) {
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

  return (
    <div className="grid grid-cols-3 gap-3 px-4 pb-24">
      {items.map((item) => (
        <CoverCard
          key={item.id}
          item={item}
          onCoverUpdate={onCoverUpdate}
          onQuickQuote={onQuickQuote}
          onItemTap={onItemTap}
        />
      ))}
    </div>
  );
}
