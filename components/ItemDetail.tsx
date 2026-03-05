"use client";

import { useState, useEffect, useRef } from "react";
import { Item } from "@/types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const YEARS = Array.from({ length: 12 }, (_, i) => 2026 - i);

interface ItemDetailProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (item: Item) => void;
  onCoverUpdated: (id: string, newUrl: string) => void;
  onDeleted: (id: string) => void;
  linkedQuotesCount: number;
  onShowToast: (msg: string) => void;
}

export default function ItemDetail({
  item,
  isOpen,
  onClose,
  onUpdated,
  onCoverUpdated,
  onDeleted,
  linkedQuotesCount,
  onShowToast,
}: ItemDetailProps) {
  const [status, setStatus] = useState("");
  const [finishedMonth, setFinishedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [finishedYear, setFinishedYear] = useState(new Date().getFullYear());
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cascadeQuotes, setCascadeQuotes] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item) {
      setStatus(item.status);
      setFinishedMonth(item.finished_month ?? MONTHS[new Date().getMonth()]);
      setFinishedYear(item.finished_year ?? new Date().getFullYear());
      setProgress(item.progress ?? 0);
      setNotes(item.notes ?? "");
      setShowDeleteConfirm(false);
      setCascadeQuotes(false);
      setJustSaved(false);
    }
  }, [item]);

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !item) return;
    setIsUploadingCover(true);
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
      onCoverUpdated(item.id, url);
      onShowToast("Cover updated");
    } catch (err) {
      console.error("Cover upload error:", err);
    } finally {
      setIsUploadingCover(false);
      e.target.value = "";
    }
  };

  if (!isOpen || !item) return null;

  const showFinished = status === "watched" || status === "read";
  const showProgress = status === "reading";

  const statusOptions =
    item.type === "movie"
      ? [
          { value: "watched", label: "Watched" },
          { value: "want_to", label: "Want to Watch" },
        ]
      : [
          { value: "read", label: "Read" },
          { value: "reading", label: "Reading" },
          { value: "want_to", label: "Want to Read" },
        ];

  const hasChanges =
    status !== item.status ||
    (showFinished &&
      (finishedMonth !== item.finished_month ||
        finishedYear !== (item.finished_year ?? 0))) ||
    (showProgress && progress !== (item.progress ?? 0)) ||
    notes !== (item.notes ?? "");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const patch: Record<string, unknown> = {
        status,
        progress: showProgress ? progress : null,
        finished_month: showFinished ? finishedMonth : null,
        finished_year: showFinished ? finishedYear : null,
        notes: notes.trim() || null,
      };
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      // Update list state without closing the sheet
      onUpdated(data.item);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1800);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const qs = cascadeQuotes ? "?cascade_quotes=true" : "";
      const res = await fetch(`/api/items/${item.id}${qs}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      onDeleted(item.id);
      onClose();
      onShowToast("Removed from vault");
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-t-2xl border-t border-vault-card-border animate-slide-up max-h-[90vh] flex flex-col"
        style={{ background: "#1a1a28" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle + close */}
        <div className="shrink-0 pt-3 pb-1 relative">
          <div className="w-10 h-1 rounded-full bg-white/10 mx-auto" />
          <button
            onClick={onClose}
            className="absolute right-4 top-2 w-7 h-7 flex items-center justify-center rounded-full text-vault-muted hover:text-vault-text transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="1" y1="1" x2="11" y2="11" />
              <line x1="11" y1="1" x2="1" y2="11" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-10">
          {/* Cover + title */}
          <div className="flex flex-col items-center text-center mb-6 mt-2">
            <div className="relative rounded-lg overflow-hidden mb-2 bg-vault-card-bg border border-vault-card-border">
              {item.cover_image_url ? (
                <img
                  src={item.cover_image_url}
                  alt={item.title}
                  className="h-[200px] w-auto object-cover"
                />
              ) : (
                <div className="h-[160px] w-[107px] flex items-center justify-center text-vault-muted text-4xl">
                  {item.type === "movie" ? "🎬" : "📚"}
                </div>
              )}
              {isUploadingCover && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-vault-warm border-t-transparent animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploadingCover}
              className="text-xs text-vault-muted hover:text-vault-text transition-colors font-body mb-3 disabled:opacity-40"
            >
              {isUploadingCover ? "Uploading…" : "Change cover"}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
            <h2 className="font-heading text-lg text-vault-text leading-tight px-4">
              {item.title}
            </h2>
            {item.creator && (
              <p className="text-sm text-vault-muted font-body mt-1">{item.creator}</p>
            )}
            {item.year && (
              <p className="text-xs text-vault-muted/50 font-body mt-0.5">{item.year}</p>
            )}
          </div>

          {/* ── Delete confirmation ── */}
          {showDeleteConfirm ? (
            <div className="flex flex-col gap-3">
              <div
                className="p-4 rounded-xl text-center"
                style={{
                  background: "rgba(255,80,80,0.06)",
                  border: "1px solid rgba(255,80,80,0.14)",
                }}
              >
                <p className="text-sm font-body" style={{ color: "rgba(255,255,255,0.8)" }}>
                  Remove{" "}
                  <span className="font-medium text-white">{item.title}</span>{" "}
                  from your vault?
                </p>

                {linkedQuotesCount > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-body mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
                      This item has {linkedQuotesCount} linked quote
                      {linkedQuotesCount !== 1 ? "s" : ""}.
                    </p>
                    <div className="flex gap-2 justify-center">
                      {[
                        { val: false, label: "Keep quotes" },
                        { val: true, label: "Delete quotes too" },
                      ].map(({ val, label }) => (
                        <button
                          key={String(val)}
                          onClick={() => setCascadeQuotes(val)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-body border transition-colors ${
                            cascadeQuotes === val
                              ? "border-white/20 bg-white/10 text-white"
                              : "border-white/[0.06] text-white/40 hover:text-white/60"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full py-3 rounded-xl font-body text-sm font-medium transition-opacity disabled:opacity-40"
                style={{
                  background: "rgba(255,80,80,0.15)",
                  border: "1px solid rgba(255,80,80,0.3)",
                  color: "rgba(255,80,80,0.9)",
                }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>

              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-sm font-body text-vault-muted hover:text-vault-text transition-colors text-center py-1"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              {/* Status pills */}
              <div className="mb-5">
                <p className="text-xs text-vault-muted font-body mb-2.5 uppercase tracking-wider">
                  Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStatus(s.value)}
                      className={`px-4 py-1.5 rounded-full text-sm font-body transition-all ${
                        status === s.value
                          ? "border border-vault-warm/60 bg-vault-warm/[0.15] text-vault-warm"
                          : "border border-white/[0.08] text-white/[0.45] hover:text-white/60"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Finished date */}
              {showFinished && (
                <div className="mb-5">
                  <p className="text-xs text-vault-muted font-body mb-2.5 uppercase tracking-wider">
                    {status === "watched" ? "Watched" : "Read"} in
                  </p>
                  <div className="flex gap-3">
                    <select
                      value={finishedMonth}
                      onChange={(e) => setFinishedMonth(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-sm font-body text-vault-text focus:outline-none focus:border-vault-warm/40 appearance-none cursor-pointer"
                    >
                      {MONTHS.map((m) => (
                        <option key={m} value={m} className="bg-[#1a1a28]">{m}</option>
                      ))}
                    </select>
                    <select
                      value={finishedYear}
                      onChange={(e) => setFinishedYear(parseInt(e.target.value))}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-sm font-body text-vault-text focus:outline-none focus:border-vault-warm/40 appearance-none cursor-pointer"
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y} className="bg-[#1a1a28]">{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Progress */}
              {showProgress && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-xs text-vault-muted font-body uppercase tracking-wider">
                      Progress
                    </p>
                    <span className="text-sm font-body text-vault-warm font-medium">
                      {progress}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={progress}
                    onChange={(e) => setProgress(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="mb-6">
                <p className="text-[11px] text-vault-muted/60 font-body uppercase tracking-[0.06em] mb-2">
                  Notes
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write your thoughts..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-[14px] leading-[1.7] focus:outline-none transition-colors resize-y font-quote italic placeholder:not-italic placeholder:font-body"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.82)",
                    minHeight: "120px",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(196,181,160,0.3)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
                />
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="w-full py-3 rounded-xl font-body font-bold text-sm transition-all mb-8"
                style={justSaved
                  ? { background: "rgba(196,181,160,0.12)", color: "rgba(196,181,160,0.7)", border: "1px solid rgba(196,181,160,0.2)" }
                  : { background: "linear-gradient(135deg, #a89882, #8a7d6b)", color: "#1a1a28", opacity: (isSaving || !hasChanges) ? 0.3 : 1 }
                }
              >
                {isSaving ? "Saving..." : justSaved ? "✓ Saved" : "Save Changes"}
              </button>

              {/* Delete */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm font-body transition-colors"
                  style={{ color: "rgba(255,100,100,0.55)" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "rgba(255,100,100,0.8)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "rgba(255,100,100,0.55)")
                  }
                >
                  Delete {item.title}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
