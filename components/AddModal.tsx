"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  SearchResult,
  ItemType,
  Item,
  BulkReviewItem,
  ExtractionResponse,
} from "@/types";
import { generatePlaceholderCover } from "@/lib/placeholder";

type Step =
  | "choose"
  | "search"
  | "configure"
  | "quote"
  | "screenshot"
  | "screenshot-processing"
  | "screenshot-unknown"
  | "bulk"
  | "bulk-review"
  | "bulk-importing";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const YEARS = Array.from({ length: 12 }, (_, i) => 2026 - i);

interface SelectedSource {
  item_id: string | null;
  title: string;
  creator: string;
  coverUrl: string | null;
  type: ItemType;
}

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  prefillQuoteItem?: Item | null;
  vaultItems?: Item[];
}

export default function AddModal({
  isOpen,
  onClose,
  onSaved,
  prefillQuoteItem,
  vaultItems = [],
}: AddModalProps) {
  // ── Item search state ──
  const [step, setStep] = useState<Step>("choose");
  const [searchType, setSearchType] = useState<ItemType>("movie");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [status, setStatus] = useState("");
  const [finishedMonth, setFinishedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [finishedYear, setFinishedYear] = useState(new Date().getFullYear());
  const [progress, setProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Quote state ──
  const [quoteText, setQuoteText] = useState("");
  const [quoteType, setQuoteType] = useState<ItemType>("book");
  const [sourceQuery, setSourceQuery] = useState("");
  const debouncedSourceQuery = useDebounce(sourceQuery, 300);
  const [vaultResults, setVaultResults] = useState<Item[]>([]);
  const [apiResults, setApiResults] = useState<SearchResult[]>([]);
  const [isSourceSearching, setIsSourceSearching] = useState(false);
  const [selectedSource, setSelectedSource] = useState<SelectedSource | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customCreator, setCustomCreator] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [isSavingQuote, setIsSavingQuote] = useState(false);
  const quoteInputRef = useRef<HTMLTextAreaElement>(null);

  // ── Screenshot state ──
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [aiIdentified, setAiIdentified] = useState<string | null>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // ── Bulk state ──
  const [bulkType, setBulkType] = useState<ItemType>("movie");
  const [bulkText, setBulkText] = useState("");
  const [bulkItems, setBulkItems] = useState<BulkReviewItem[]>([]);
  const [isBulkSearching, setIsBulkSearching] = useState(false);
  const [bulkFrom, setBulkFrom] = useState<"manual" | "screenshot">("manual");
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  // ── Reset on close ──
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("choose");
        setSearchType("movie");
        setQuery(""); setResults([]); setSelected(null);
        setStatus(""); setProgress(0); setCoverFile(null); setSearchError(false);
        setQuoteText(""); setSourceQuery(""); setVaultResults([]); setApiResults([]);
        setSelectedSource(null); setCustomTitle(""); setCustomCreator("");
        setShowCustomForm(false); setQuoteType("book");
        setScreenshotError(null); setAiIdentified(null);
        setBulkType("movie"); setBulkText(""); setBulkItems([]);
        setIsBulkSearching(false); setBulkProgress({ current: 0, total: 0 });
      }, 300);
    }
  }, [isOpen]);

  // ── Pre-fill quote from CoverCard shortcut ──
  useEffect(() => {
    if (isOpen && prefillQuoteItem) {
      setStep("quote");
      setQuoteType(prefillQuoteItem.type);
      setSelectedSource({
        item_id: prefillQuoteItem.id,
        title: prefillQuoteItem.title,
        creator: prefillQuoteItem.creator ?? "",
        coverUrl: prefillQuoteItem.cover_image_url,
        type: prefillQuoteItem.type,
      });
      setTimeout(() => quoteInputRef.current?.focus(), 150);
    }
  }, [isOpen, prefillQuoteItem]);

  // ── Focus search input ──
  useEffect(() => {
    if (step === "search") setTimeout(() => searchInputRef.current?.focus(), 100);
    if (step === "quote" && !prefillQuoteItem)
      setTimeout(() => quoteInputRef.current?.focus(), 100);
  }, [step, prefillQuoteItem]);

  // ── Item debounced search ──
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]); setIsSearching(false); return;
    }
    setIsSearching(true); setSearchError(false);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&type=${searchType}`)
      .then((r) => r.json())
      .then((d) => { setResults(d.results ?? []); setIsSearching(false); })
      .catch(() => { setSearchError(true); setIsSearching(false); });
  }, [debouncedQuery, searchType]);

  useEffect(() => { setQuery(""); setResults([]); }, [searchType]);

  // ── Quote source search (vault + API) ──
  useEffect(() => {
    if (!debouncedSourceQuery || debouncedSourceQuery.length < 2) {
      setVaultResults([]); setApiResults([]); return;
    }
    setIsSourceSearching(true);
    Promise.all([
      fetch(`/api/items/search?q=${encodeURIComponent(debouncedSourceQuery)}&type=${quoteType}`)
        .then((r) => r.json()),
      fetch(`/api/search?q=${encodeURIComponent(debouncedSourceQuery)}&type=${quoteType}`)
        .then((r) => r.json()),
    ])
      .then(([vaultData, apiData]) => {
        setVaultResults(vaultData.items ?? []);
        setApiResults(apiData.results ?? []);
        setIsSourceSearching(false);
      })
      .catch(() => setIsSourceSearching(false));
  }, [debouncedSourceQuery, quoteType]);

  useEffect(() => {
    setSourceQuery(""); setVaultResults([]); setApiResults([]);
  }, [quoteType]);

  // ── Handlers ──
  const handleSelect = (result: SearchResult) => {
    setSelected(result);
    setStatus(result.type === "movie" ? "watched" : "read");
    setStep("configure");
  };

  const handleSaveItem = async () => {
    if (!selected) return;
    setIsSaving(true);
    try {
      let coverImageUrl = selected.coverUrl;
      if (!coverImageUrl && coverFile) {
        coverImageUrl = await uploadCover(coverFile, selected.sourceId);
      }
      if (!coverImageUrl) {
        const blob = await generatePlaceholderCover(selected.title, selected.type);
        coverImageUrl = await uploadCover(
          new File([blob], "placeholder.png", { type: "image/png" }),
          `placeholder-${selected.sourceId}`
        );
      }
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selected.type,
          title: selected.title,
          creator: selected.creator || null,
          year: selected.year,
          cover_image_url: coverImageUrl,
          status,
          progress: status === "reading" ? progress : null,
          finished_month: status === "watched" || status === "read" ? finishedMonth : null,
          finished_year: status === "watched" || status === "read" ? finishedYear : null,
          imdb_id: selected.type === "movie" ? selected.sourceId : null,
          openlibrary_id: selected.type === "book" ? selected.sourceId : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSaved();
    } catch (err) {
      console.error("Save item error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveQuote = async () => {
    const text = quoteText.trim();
    if (!text) return;
    setIsSavingQuote(true);
    try {
      const sourceTitle = selectedSource?.title ?? customTitle.trim();
      const sourceCreator = selectedSource?.creator ?? customCreator.trim();
      if (!sourceTitle) return;

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          type: selectedSource?.type ?? quoteType,
          source_item_id: selectedSource?.item_id ?? null,
          source_title: sourceTitle,
          source_creator: sourceCreator,
        }),
      });
      if (!res.ok) throw new Error("Failed to save quote");
      onSaved();
    } catch (err) {
      console.error("Save quote error:", err);
    } finally {
      setIsSavingQuote(false);
    }
  };

  // ── Screenshot handlers ──
  const runBulkSearch = useCallback(
    async (
      rawItems: Array<{ title: string; creator?: string; year?: number; type: ItemType }>
    ) => {
      setIsBulkSearching(true);
      setStep("bulk-review");

      const searched = await Promise.all(
        rawItems.slice(0, 20).map(async (item) => {
          try {
            const res = await fetch(
              `/api/search?q=${encodeURIComponent(item.title)}&type=${item.type}`
            );
            const data = await res.json();
            const first: SearchResult | undefined = data.results?.[0];
            return {
              title: first?.title ?? item.title,
              creator: first?.creator ?? item.creator ?? "",
              year: first?.year ?? item.year ?? null,
              coverUrl: first?.coverUrl ?? null,
              sourceId: first?.sourceId ?? `bulk-${Date.now()}-${Math.random()}`,
              type: item.type,
              status: item.type === "movie" ? "watched" : "read",
              alreadyInVault: false,
              checked: true,
            } as BulkReviewItem;
          } catch {
            return {
              title: item.title,
              creator: item.creator ?? "",
              year: item.year ?? null,
              coverUrl: null,
              sourceId: `bulk-${Date.now()}-${Math.random()}`,
              type: item.type,
              status: item.type === "movie" ? "watched" : "read",
              alreadyInVault: false,
              checked: true,
            } as BulkReviewItem;
          }
        })
      );

      const vaultTitlesLower = vaultItems.map((v) => v.title.toLowerCase());
      const withDuplicates = searched.map((item) => {
        const inVault = vaultTitlesLower.includes(item.title.toLowerCase());
        return { ...item, alreadyInVault: inVault, checked: !inVault };
      });

      setBulkItems(withDuplicates);
      setIsBulkSearching(false);
    },
    [vaultItems]
  );

  const handleExtractionResult = useCallback(
    async (result: ExtractionResponse) => {
      switch (result.kind) {
        case "movie":
        case "book": {
          const label = result.creator
            ? `${result.title} — ${result.creator}`
            : result.title;
          console.log("[screenshot] identified as", result.kind, ":", label);
          setAiIdentified(label);
          setSearchType(result.kind);
          setQuery(result.title);
          setStep("search");
          break;
        }
        case "quote":
          setQuoteText(result.text ?? "");
          if (result.source_title) {
            setSelectedSource({
              item_id: null,
              title: result.source_title,
              creator: result.source_creator ?? "",
              coverUrl: null,
              type: result.source_type ?? "book",
            });
          }
          setStep("quote");
          break;
        case "list":
          setBulkFrom("screenshot");
          await runBulkSearch(result.items);
          break;
        default:
          setStep("screenshot-unknown");
      }
    },
    [runBulkSearch]
  );

  const handleScreenshotSelect = useCallback(
    async (file: File) => {
      console.log("[screenshot] file selected:", file.name, file.type, `${(file.size / 1024).toFixed(1)} KB`);
      const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!ALLOWED.includes(file.type)) {
        setScreenshotError("Use JPEG, PNG, WebP, or GIF images.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setScreenshotError("Image must be under 5 MB.");
        return;
      }
      setScreenshotError(null);
      setStep("screenshot-processing");
      console.log("[screenshot] posting to /api/extract...");
      try {
        const formData = new FormData();
        formData.append("image", file);
        const res = await fetch("/api/extract", { method: "POST", body: formData });
        console.log("[screenshot] /api/extract status:", res.status);
        const result = await res.json();
        console.log("[screenshot] extract result:", result);
        if (result.error) throw new Error(result.error);
        await handleExtractionResult(result);
      } catch (err) {
        console.error("[screenshot] error:", err);
        setStep("screenshot-unknown");
      }
    },
    [handleExtractionResult]
  );

  const handleBulkSearch = async () => {
    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 20);
    if (!lines.length) return;
    setBulkFrom("manual");
    await runBulkSearch(lines.map((title) => ({ title, type: bulkType })));
  };

  const handleBulkImport = async () => {
    const toImport = bulkItems.filter((item) => item.checked && !item.alreadyInVault);
    if (!toImport.length) return;

    setStep("bulk-importing");
    setBulkProgress({ current: 0, total: toImport.length });

    for (let i = 0; i < toImport.length; i++) {
      const item = toImport[i];
      const isSynthetic = item.sourceId.startsWith("bulk-");
      try {
        await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: item.type,
            title: item.title,
            creator: item.creator || null,
            year: item.year,
            cover_image_url: item.coverUrl,
            status: item.status,
            progress: null,
            finished_month: null,
            finished_year: null,
            imdb_id: item.type === "movie" && !isSynthetic ? item.sourceId : null,
            openlibrary_id: item.type === "book" && !isSynthetic ? item.sourceId : null,
          }),
        });
      } catch (err) {
        console.error("Import item error:", err);
      }
      setBulkProgress({ current: i + 1, total: toImport.length });
      if (i < toImport.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    onSaved();
  };

  if (!isOpen) return null;

  const showFinished = status === "watched" || status === "read";
  const showProgress = status === "reading";
  const noCover = selected && !selected.coverUrl && !coverFile;
  const hasSourceResults = vaultResults.length > 0 || apiResults.length > 0;
  const canSaveQuote =
    quoteText.trim().length > 0 &&
    (selectedSource !== null || customTitle.trim().length > 0);
  const bulkToImportCount = bulkItems.filter((i) => i.checked && !i.alreadyInVault).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-t-2xl bg-vault-elevated border-t border-vault-card-border animate-slide-up max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="shrink-0 pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/10 mx-auto" />
        </div>

        <div className="overflow-y-auto px-6 pb-8">

          {/* ── Step: Choose ── */}
          {step === "choose" && (
            <div>
              <h2 className="font-heading text-lg text-vault-text mb-6">Add to Vault</h2>
              <div className="flex flex-col gap-3">
                <ActionButton
                  emoji="&#128269;"
                  title="Type a title"
                  sub="Search movies and books"
                  onClick={() => setStep("search")}
                />
                <ActionButton
                  emoji="&#128247;"
                  title="Screenshot"
                  sub="Extract from an image"
                  onClick={() => { setScreenshotError(null); setStep("screenshot"); }}
                />
                <ActionButton
                  emoji="&#9997;&#65039;"
                  title="Save a quote"
                  sub="Save a line from a book or film"
                  onClick={() => setStep("quote")}
                />
                <ActionButton
                  emoji="&#128229;"
                  title="Bulk import"
                  sub="Paste a list of titles"
                  onClick={() => setStep("bulk")}
                />
              </div>
            </div>
          )}

          {/* ── Step: Search ── */}
          {step === "search" && (
            <div>
              <StepHeader title="Search" onBack={() => { setAiIdentified(null); setStep("choose"); }} />
              {aiIdentified && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-vault-warm/[0.08] border border-vault-warm/20">
                  <span className="text-xs text-vault-warm shrink-0">✦ AI identified</span>
                  <p className="text-xs font-body text-vault-warm flex-1 truncate">{aiIdentified}</p>
                  <button onClick={() => setAiIdentified(null)} className="text-vault-warm/40 hover:text-vault-warm text-xs shrink-0">✕</button>
                </div>
              )}
              <TypeToggle value={searchType} onChange={setSearchType} />
              <SearchInput
                ref={searchInputRef}
                value={query}
                onChange={setQuery}
                placeholder={`Search ${searchType === "movie" ? "movies" : "books"}...`}
              />
              {isSearching && <ResultsSkeleton />}
              {searchError && <SearchError />}
              {!isSearching && !searchError && debouncedQuery.length >= 2 && results.length === 0 && (
                <EmptyResults />
              )}
              {!isSearching && results.length > 0 && (
                <ResultsList results={results} onSelect={handleSelect} />
              )}
            </div>
          )}

          {/* ── Step: Configure ── */}
          {step === "configure" && selected && (
            <div>
              <StepHeader
                title="Configure"
                onBack={() => { setSelected(null); setCoverFile(null); setStep("search"); }}
              />

              {/* Preview */}
              <div className="flex gap-4 mb-6">
                <div className="w-16 h-24 rounded-lg overflow-hidden bg-vault-card-bg border border-vault-card-border shrink-0">
                  {selected.coverUrl || coverFile ? (
                    <img
                      src={coverFile ? URL.createObjectURL(coverFile) : selected.coverUrl!}
                      alt={selected.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">
                      {selected.type === "movie" ? "🎬" : "📚"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm font-body text-vault-text font-medium">{selected.title}</p>
                  {selected.creator && <p className="text-xs text-vault-muted mt-1">{selected.creator}</p>}
                  {selected.year && <p className="text-xs text-vault-muted/60 mt-0.5">{selected.year}</p>}
                </div>
              </div>

              {/* Cover upload */}
              {noCover && (
                <div className="mb-6 p-4 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02]">
                  <p className="text-xs text-vault-muted font-body mb-3">No cover found</p>
                  <div className="flex gap-3 items-center">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-xs font-body text-vault-text hover:bg-white/[0.1] transition-colors"
                    >
                      Upload cover
                    </button>
                    <span className="text-xs text-vault-muted/60">or we&apos;ll create a placeholder</span>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setCoverFile(f); }}
                  />
                </div>
              )}

              {/* Status */}
              <div className="mb-5">
                <Label>Status</Label>
                <div className="flex flex-wrap gap-2">
                  {(selected.type === "movie"
                    ? [{ value: "watched", label: "Watched" }, { value: "want_to", label: "Want to Watch" }]
                    : [{ value: "read", label: "Read" }, { value: "reading", label: "Reading" }, { value: "want_to", label: "Want to Read" }]
                  ).map((s) => (
                    <StatusPill key={s.value} label={s.label} active={status === s.value} onClick={() => setStatus(s.value)} />
                  ))}
                </div>
              </div>

              {/* Finished date */}
              {showFinished && (
                <div className="mb-5">
                  <Label>When did you {status === "watched" ? "watch" : "read"} it?</Label>
                  <div className="flex gap-3">
                    <select value={finishedMonth} onChange={(e) => setFinishedMonth(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-sm font-body text-vault-text focus:outline-none focus:border-vault-warm/40 appearance-none cursor-pointer">
                      {MONTHS.map((m) => <option key={m} value={m} className="bg-vault-elevated">{m}</option>)}
                    </select>
                    <select value={finishedYear} onChange={(e) => setFinishedYear(parseInt(e.target.value))}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-sm font-body text-vault-text focus:outline-none focus:border-vault-warm/40 appearance-none cursor-pointer">
                      {YEARS.map((y) => <option key={y} value={y} className="bg-vault-elevated">{y}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Progress */}
              {showProgress && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2.5">
                    <Label>Progress</Label>
                    <span className="text-sm font-body text-vault-warm font-medium">{progress}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={progress}
                    onChange={(e) => setProgress(parseInt(e.target.value))} className="w-full" />
                </div>
              )}

              <SaveButton onClick={handleSaveItem} disabled={isSaving} label={isSaving ? "Saving..." : "Save to Vault"} />
            </div>
          )}

          {/* ── Step: Quote ── */}
          {step === "quote" && (
            <div>
              <StepHeader
                title="Save a quote"
                onBack={() => {
                  if (prefillQuoteItem) { onClose(); }
                  else { setSelectedSource(null); setStep("choose"); }
                }}
              />

              <textarea
                ref={quoteInputRef}
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                placeholder="Paste or type a quote..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-[14px] text-white/[0.82] leading-[1.7] focus:outline-none focus:border-vault-warm/40 transition-colors resize-none mb-5 font-quote italic placeholder:not-italic placeholder:font-body placeholder:text-vault-muted"
              />

              <div>
                <Label>Source</Label>

                {selectedSource ? (
                  <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    {selectedSource.coverUrl && (
                      <div className="w-8 h-12 rounded overflow-hidden shrink-0">
                        <img src={selectedSource.coverUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body text-vault-text truncate">{selectedSource.title}</p>
                      {selectedSource.creator && (
                        <p className="text-xs text-vault-muted truncate">{selectedSource.creator}</p>
                      )}
                    </div>
                    <button
                      onClick={() => { setSelectedSource(null); setShowCustomForm(false); }}
                      className="text-vault-muted hover:text-vault-text text-xs shrink-0 px-1"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <TypeToggle value={quoteType} onChange={setQuoteType} className="mb-3" />
                    <SearchInput
                      value={sourceQuery}
                      onChange={setSourceQuery}
                      placeholder={`Search ${quoteType === "movie" ? "movies" : "books"}...`}
                      className="mb-3"
                    />

                    {isSourceSearching && <ResultsSkeleton count={2} />}

                    {!isSourceSearching && hasSourceResults && (
                      <div className="flex flex-col gap-1 mb-3">
                        {vaultResults.length > 0 && (
                          <>
                            <p className="text-[10px] text-vault-muted/60 font-body uppercase tracking-wider mb-1.5">
                              From your vault
                            </p>
                            {vaultResults.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => setSelectedSource({
                                  item_id: item.id,
                                  title: item.title,
                                  creator: item.creator ?? "",
                                  coverUrl: item.cover_image_url,
                                  type: item.type,
                                })}
                                className="flex gap-3 items-center p-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left w-full"
                              >
                                <div className="w-8 h-12 rounded overflow-hidden bg-vault-card-bg shrink-0">
                                  {item.cover_image_url
                                    ? <img src={item.cover_image_url} alt="" className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center text-[10px]">{item.type === "movie" ? "🎬" : "📚"}</div>
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-body text-vault-text truncate">{item.title}</p>
                                  {item.creator && <p className="text-xs text-vault-muted truncate">{item.creator}</p>}
                                </div>
                                <span className="text-[10px] text-vault-warm shrink-0">In vault</span>
                              </button>
                            ))}
                          </>
                        )}

                        {apiResults.length > 0 && (
                          <>
                            <p className="text-[10px] text-vault-muted/60 font-body uppercase tracking-wider mb-1.5 mt-3">
                              From the web
                            </p>
                            {apiResults.map((r) => (
                              <button
                                key={r.sourceId}
                                onClick={() => setSelectedSource({
                                  item_id: null,
                                  title: r.title,
                                  creator: r.creator,
                                  coverUrl: r.coverUrl,
                                  type: r.type,
                                })}
                                className="flex gap-3 items-center p-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left w-full"
                              >
                                <div className="w-8 h-12 rounded overflow-hidden bg-vault-card-bg shrink-0">
                                  {r.coverUrl
                                    ? <img src={r.coverUrl} alt="" className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center text-[10px]">{r.type === "movie" ? "🎬" : "📚"}</div>
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-body text-vault-text truncate">{r.title}</p>
                                  {r.creator && <p className="text-xs text-vault-muted truncate">{r.creator}</p>}
                                </div>
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    )}

                    {!showCustomForm ? (
                      <button
                        onClick={() => setShowCustomForm(true)}
                        className="text-xs text-vault-muted hover:text-vault-text transition-colors font-body mt-1"
                      >
                        + Enter source manually
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2 mt-2">
                        <input
                          type="text"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder="Title"
                          className="w-full px-3 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-sm font-body text-vault-text placeholder:text-vault-muted focus:outline-none focus:border-vault-warm/40"
                        />
                        <input
                          type="text"
                          value={customCreator}
                          onChange={(e) => setCustomCreator(e.target.value)}
                          placeholder={quoteType === "movie" ? "Director" : "Author"}
                          className="w-full px-3 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-sm font-body text-vault-text placeholder:text-vault-muted focus:outline-none focus:border-vault-warm/40"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <SaveButton
                onClick={handleSaveQuote}
                disabled={isSavingQuote || !canSaveQuote}
                label={isSavingQuote ? "Saving..." : "Save Quote"}
                className="mt-6"
              />
            </div>
          )}

          {/* ── Step: Screenshot ── */}
          {step === "screenshot" && (
            <div>
              <StepHeader title="Screenshot" onBack={() => setStep("choose")} />

              {/* Camera button */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-4 mb-3 rounded-xl border border-vault-warm/30 bg-vault-warm/[0.06] text-vault-warm font-body text-sm hover:bg-vault-warm/[0.1] transition-colors"
              >
                <span className="text-lg">📸</span>
                Take a photo
              </button>

              {/* File upload drop zone */}
              <div
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-white/[0.08] bg-white/[0.02] cursor-pointer hover:border-white/[0.15] hover:bg-white/[0.04] transition-all"
                onClick={() => screenshotInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleScreenshotSelect(file);
                }}
              >
                <div className="text-center">
                  <p className="text-sm font-body text-vault-muted">Upload a screenshot</p>
                  <p className="text-[10px] text-vault-muted/50 font-body mt-1">JPEG, PNG, WebP · max 5 MB</p>
                </div>
              </div>

              {screenshotError && (
                <p className="text-sm text-red-400/70 font-body mt-3 text-center">{screenshotError}</p>
              )}

              <input
                ref={screenshotInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleScreenshotSelect(file);
                }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleScreenshotSelect(file);
                }}
              />
            </div>
          )}

          {/* ── Step: Screenshot processing ── */}
          {step === "screenshot-processing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-vault-warm border-t-transparent animate-spin" />
              <p className="text-sm font-body text-vault-muted">Analysing screenshot...</p>
            </div>
          )}

          {/* ── Step: Screenshot unknown ── */}
          {step === "screenshot-unknown" && (
            <div>
              <StepHeader title="Screenshot" onBack={() => setStep("choose")} />
              <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                <span className="text-4xl">🤔</span>
                <div>
                  <p className="text-sm font-body text-vault-text">Couldn&apos;t identify this screenshot</p>
                  <p className="text-xs text-vault-muted mt-1.5 leading-relaxed">
                    Try a clearer image of a movie poster, book cover, or list
                  </p>
                </div>
                <button
                  onClick={() => { setScreenshotError(null); setStep("screenshot"); }}
                  className="px-4 py-2 rounded-lg bg-white/[0.06] text-sm font-body text-vault-text hover:bg-white/[0.1] transition-colors"
                >
                  Try another image
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Bulk ── */}
          {step === "bulk" && (
            <div>
              <StepHeader title="Bulk import" onBack={() => setStep("choose")} />
              <TypeToggle value={bulkType} onChange={setBulkType} />
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={bulkType === "movie"
                  ? "One title per line:\nThe Godfather\nThere Will Be Blood\n2001: A Space Odyssey"
                  : "One title per line:\nThe Brothers Karamazov\nMidnight's Children\nOne Hundred Years of Solitude"
                }
                rows={7}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-sm font-body text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-warm/40 resize-none mb-5 leading-relaxed"
              />
              <SaveButton
                onClick={handleBulkSearch}
                disabled={!bulkText.trim()}
                label="Find these"
              />
            </div>
          )}

          {/* ── Step: Bulk review ── */}
          {step === "bulk-review" && (
            <div>
              <StepHeader
                title={
                  isBulkSearching
                    ? "Searching..."
                    : `Review (${bulkToImportCount} to import)`
                }
                onBack={() => setStep(bulkFrom === "screenshot" ? "choose" : "bulk")}
              />

              {isBulkSearching ? (
                <ResultsSkeleton count={5} />
              ) : (
                <>
                  <div className="flex flex-col gap-1 mb-6">
                    {bulkItems.map((item, idx) => (
                      <BulkReviewRow
                        key={`${item.sourceId}-${idx}`}
                        item={item}
                        onToggle={(checked) =>
                          setBulkItems((prev) =>
                            prev.map((p, i) => i === idx ? { ...p, checked } : p)
                          )
                        }
                        onStatusChange={(s) =>
                          setBulkItems((prev) =>
                            prev.map((p, i) => i === idx ? { ...p, status: s } : p)
                          )
                        }
                      />
                    ))}
                  </div>
                  <SaveButton
                    onClick={handleBulkImport}
                    disabled={bulkToImportCount === 0}
                    label={`Import ${bulkToImportCount} item${bulkToImportCount !== 1 ? "s" : ""}`}
                  />
                </>
              )}
            </div>
          )}

          {/* ── Step: Bulk importing ── */}
          {step === "bulk-importing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-5">
              <p className="text-sm font-body text-vault-text">
                Importing {bulkProgress.current} of {bulkProgress.total}...
              </p>
              <div className="w-full bg-white/[0.06] rounded-full h-1.5">
                <div
                  className="bg-vault-warm h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${bulkProgress.total ? (bulkProgress.current / bulkProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared sub-components ──

function ActionButton({
  emoji, title, sub, onClick, disabled,
}: {
  emoji: string; title: string; sub: string;
  onClick?: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-colors w-full
        ${disabled
          ? "bg-white/[0.02] border-white/[0.04] opacity-40 cursor-not-allowed"
          : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]"
        }`}
    >
      <span className="text-xl">{emoji}</span>
      <div>
        <p className="text-sm font-body text-vault-text">{title}</p>
        <p className="text-xs text-vault-muted mt-0.5">{sub}</p>
      </div>
    </button>
  );
}

function StepHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <button onClick={onBack} className="text-vault-muted hover:text-vault-text transition-colors text-sm">
        &#8592;
      </button>
      <h2 className="font-heading text-lg text-vault-text">{title}</h2>
    </div>
  );
}

function TypeToggle({
  value, onChange, className = "mb-4",
}: {
  value: ItemType; onChange: (t: ItemType) => void; className?: string;
}) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {(["movie", "book"] as ItemType[]).map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-4 py-1.5 rounded-full text-sm font-body transition-all ${
            value === t
              ? "border border-vault-warm/60 bg-vault-warm/[0.15] text-vault-warm"
              : "border border-white/[0.08] text-white/[0.45] hover:text-white/60"
          }`}
        >
          {t === "movie" ? "Movie" : "Book"}
        </button>
      ))}
    </div>
  );
}

import React from "react";
const SearchInput = React.forwardRef<
  HTMLInputElement,
  { value: string; onChange: (v: string) => void; placeholder: string; className?: string }
>(({ value, onChange, placeholder, className = "mb-4" }, ref) => (
  <div className={`relative ${className}`}>
    <input
      ref={ref}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-sm font-body text-vault-text placeholder:text-vault-muted focus:outline-none focus:border-vault-warm/40 transition-colors"
    />
    {value && (
      <button
        onClick={() => onChange("")}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-muted hover:text-vault-text text-xs"
      >
        ✕
      </button>
    )}
  </div>
));
SearchInput.displayName = "SearchInput";

function ResultsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 items-center">
          <div className="w-12 h-[72px] rounded bg-vault-card-bg animate-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-3/4 rounded bg-vault-card-bg animate-shimmer" />
            <div className="h-3 w-1/2 rounded bg-vault-card-bg animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchError() {
  return (
    <p className="text-sm text-red-400/70 font-body text-center py-8">
      Search failed — check your connection and try again.
    </p>
  );
}

function EmptyResults() {
  return (
    <p className="text-sm text-vault-muted font-body text-center py-8">
      No results — try a different spelling
    </p>
  );
}

function ResultsList({ results, onSelect }: { results: SearchResult[]; onSelect: (r: SearchResult) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {results.map((r) => (
        <button
          key={r.sourceId}
          onClick={() => onSelect(r)}
          className="flex gap-3 items-center p-2 rounded-xl hover:bg-white/[0.03] transition-colors text-left w-full"
        >
          <div className="w-12 h-[72px] rounded overflow-hidden bg-vault-card-bg border border-vault-card-border shrink-0">
            {r.coverUrl
              ? <img src={r.coverUrl} alt={r.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-vault-muted text-[10px]">{r.type === "movie" ? "🎬" : "📚"}</div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body text-vault-text truncate">{r.title}</p>
            {r.creator && <p className="text-xs text-vault-muted truncate mt-0.5">{r.creator}</p>}
            {r.year && <p className="text-xs text-vault-muted/60 mt-0.5">{r.year}</p>}
          </div>
        </button>
      ))}
    </div>
  );
}

function StatusPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-body transition-all ${
        active
          ? "border border-vault-warm/60 bg-vault-warm/[0.15] text-vault-warm"
          : "border border-white/[0.08] text-white/[0.45] hover:text-white/60"
      }`}
    >
      {label}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-vault-muted font-body mb-2.5 uppercase tracking-wider">{children}</p>
  );
}

function SaveButton({
  onClick, disabled, label, className = "mt-2",
}: {
  onClick: () => void; disabled: boolean; label: string; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 rounded-xl font-body font-bold text-sm text-vault-bg transition-opacity disabled:opacity-40 ${className}`}
      style={{ background: "linear-gradient(135deg, #a89882, #8a7d6b)" }}
    >
      {label}
    </button>
  );
}

function BulkReviewRow({
  item,
  onToggle,
  onStatusChange,
}: {
  item: BulkReviewItem;
  onToggle: (checked: boolean) => void;
  onStatusChange: (status: string) => void;
}) {
  const statusOptions =
    item.type === "movie"
      ? [
          { value: "watched", label: "Watched" },
          { value: "want_to", label: "Want to watch" },
        ]
      : [
          { value: "read", label: "Read" },
          { value: "reading", label: "Reading" },
          { value: "want_to", label: "Want to read" },
        ];

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-xl transition-opacity ${
        item.alreadyInVault ? "opacity-40" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={item.checked && !item.alreadyInVault}
        disabled={item.alreadyInVault}
        onChange={(e) => onToggle(e.target.checked)}
        className="w-4 h-4 rounded shrink-0 cursor-pointer"
      />

      <div className="w-10 h-[60px] rounded overflow-hidden bg-vault-card-bg shrink-0">
        {item.coverUrl ? (
          <img src={item.coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px]">
            {item.type === "movie" ? "🎬" : "📚"}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-body text-vault-text truncate">{item.title}</p>
        {item.creator && (
          <p className="text-xs text-vault-muted truncate mt-0.5">{item.creator}</p>
        )}
        {item.year && (
          <p className="text-xs text-vault-muted/60 mt-0.5">{item.year}</p>
        )}
      </div>

      {item.alreadyInVault ? (
        <span className="text-[10px] text-vault-warm shrink-0 px-2 py-1 rounded-full bg-vault-warm/10">
          In vault
        </span>
      ) : (
        <select
          value={item.status}
          onChange={(e) => onStatusChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="text-[11px] font-body text-vault-muted bg-white/[0.05] border border-white/[0.08] rounded-lg px-2 py-1 focus:outline-none shrink-0 cursor-pointer"
        >
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value} className="bg-vault-elevated text-vault-text">
              {s.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

async function uploadCover(file: File, id: string): Promise<string> {
  const ext = file.type.split("/")[1] || "png";
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", `${Date.now()}-${id.replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = await res.json();
  return data.url;
}
