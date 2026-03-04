"use client";

import { useState } from "react";
import { Quote } from "@/types";

interface QuoteCardProps {
  quote: Quote;
  onDeleted?: (id: string) => void;
}

const TYPE_EMOJI: Record<string, string> = { book: "📖", movie: "🎬" };

export default function QuoteCard({ quote, onDeleted }: QuoteCardProps) {
  const isBook = quote.type === "book";
  const accent = isBook ? "#c4b5a0" : "#7a8ba0";
  const accentClass = isBook ? "text-vault-warm" : "text-vault-cool";
  const bgClass = isBook ? "bg-vault-warm/[0.15]" : "bg-vault-cool/[0.15]";

  const [confirming, setConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      onDeleted?.(quote.id);
    } catch (err) {
      console.error("Quote delete error:", err);
      setIsDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div
      className="group relative rounded-xl pl-4 pr-3 py-5 transition-colors"
      style={{
        background: "rgba(255,255,255,0.015)",
        borderLeft: `3px solid ${accent}`,
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.015)")
      }
    >
      <blockquote
        className="font-quote italic text-[14px] leading-[1.7] mb-3 pr-6"
        style={{ color: "rgba(255,255,255,0.82)" }}
      >
        &ldquo;{quote.text}&rdquo;
      </blockquote>

      <div className="flex items-center gap-2.5">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-body ${accentClass} ${bgClass}`}>
          {TYPE_EMOJI[quote.type]} {quote.type}
        </span>
        <span className="text-[12px] font-body truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
          {quote.source_title}
          {quote.source_creator ? ` — ${quote.source_creator}` : ""}
        </span>
      </div>

      {/* Delete controls */}
      {confirming ? (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
          <span className="text-xs font-body flex-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            Remove this quote?
          </span>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3 py-1 rounded-lg text-xs font-body disabled:opacity-40"
            style={{
              background: "rgba(255,80,80,0.12)",
              border: "1px solid rgba(255,80,80,0.25)",
              color: "rgba(255,80,80,0.85)",
            }}
          >
            {isDeleting ? "..." : "Delete"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="px-3 py-1 rounded-lg text-xs font-body text-vault-muted hover:text-vault-text border border-white/[0.08]"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-md transition-opacity opacity-0 group-hover:opacity-100 hover:bg-white/[0.06]"
          style={{ color: "rgba(255,255,255,0.3)" }}
          title="Delete quote"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
