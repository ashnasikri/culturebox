"use client";

import { useRef, useState } from "react";
import { Item } from "@/types";
import ProgressBar from "./ProgressBar";

interface CoverCardProps {
  item: Item;
  onCoverUpdate?: (id: string, newUrl: string) => void;
  onQuickQuote?: (item: Item) => void;
  onItemTap?: (item: Item) => void;
  dragListeners?: Record<string, unknown>;
  dragAttributes?: Record<string, unknown>;
}

export default function CoverCard({
  item,
  onCoverUpdate,
  onQuickQuote,
  onItemTap,
  dragListeners,
  dragAttributes,
}: CoverCardProps) {
  const isWantTo = item.status === "want_to";
  const isReading = item.status === "reading";
  const isFinished = item.status === "watched" || item.status === "read";

  const wantToBadge = item.type === "movie" ? "WATCHLIST" : "TO READ";
  const finishedLabel =
    isFinished && item.finished_month
      ? `\u2713 ${item.finished_month} ${item.finished_year ?? ""}`
      : isFinished
        ? "\u2713"
        : null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleClick = () => onItemTap?.(item);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const ext = file.type.split("/")[1] || "jpg";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", `${Date.now()}-${item.id}.${ext}`);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const { url } = await uploadRes.json();
      if (!url) throw new Error("Upload failed");

      const patchRes = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover_image_url: url }),
      });
      if (!patchRes.ok) throw new Error("DB update failed");

      onCoverUpdate?.(item.id, url);
    } catch (err) {
      console.error("Cover update error:", err);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div
      className={`group relative flex flex-col cursor-pointer ${isWantTo ? "want-to-item" : ""}`}
      onClick={handleClick}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-vault-card-bg border border-vault-card-border">
        {item.cover_image_url ? (
          <img
            src={item.cover_image_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-vault-muted text-xs font-body">
            No cover
          </div>
        )}

        {/* Uploading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-vault-warm border-t-transparent animate-spin" />
          </div>
        )}

        {/* Action icons — hover (desktop) */}
        {!isUploading && (
          <div className="absolute top-1.5 left-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="w-6 h-6 rounded-md bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80"
              title="Change cover"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
            {onQuickQuote && (
              <button
                onClick={(e) => { e.stopPropagation(); onQuickQuote(item); }}
                className="w-6 h-6 rounded-md bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80"
                title="Save a quote"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Want-to badge */}
        {isWantTo && (
          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-body tracking-wider bg-black/60 text-vault-muted backdrop-blur-sm uppercase">
            {wantToBadge}
          </span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2">
          <p className="text-[11px] font-body text-white leading-tight truncate">{item.title}</p>
          {item.creator && (
            <p className="text-[10px] text-white/60 truncate mt-0.5">{item.creator}</p>
          )}
          <div className="flex items-center justify-between mt-0.5">
            {item.year && <span className="text-[10px] text-white/40">{item.year}</span>}
            {finishedLabel && <span className="text-[10px] text-vault-warm">{finishedLabel}</span>}
          </div>
        </div>

        {/* Reading progress bar */}
        {isReading && item.progress != null && (
          <div className="absolute bottom-0 left-0 right-0 p-1">
            <ProgressBar progress={item.progress} />
          </div>
        )}

        {/* Notes indicator */}
        {(item.note_count ?? 0) > 0 && (
          <div
            className="absolute bottom-2 left-2 w-2 h-2 rounded-full"
            style={{ background: "#c4b5a0", boxShadow: "0 0 6px rgba(196,181,160,0.5)" }}
          />
        )}

        {/* Drag handle — only rendered when dragging is enabled */}
        {dragListeners && (
          <div
            {...(dragListeners as React.HTMLAttributes<HTMLDivElement>)}
            {...(dragAttributes as React.HTMLAttributes<HTMLDivElement>)}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-md bg-black/50 backdrop-blur-sm flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
            style={{ touchAction: "none" }}
            title="Drag to reorder"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="rgba(255,255,255,0.6)">
              <circle cx="2" cy="2" r="1.2" />
              <circle cx="8" cy="2" r="1.2" />
              <circle cx="2" cy="8" r="1.2" />
              <circle cx="8" cy="8" r="1.2" />
            </svg>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
