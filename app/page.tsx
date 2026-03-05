"use client";

import { useState, useEffect, useCallback } from "react";
import { Tab, Item, Quote } from "@/types";
import TabNav from "@/components/TabNav";
import FAB from "@/components/FAB";
import CoverGrid from "@/components/CoverGrid";
import ListView from "@/components/ListView";
import QuoteJournal from "@/components/QuoteJournal";
import AddModal from "@/components/AddModal";
import ItemDetail from "@/components/ItemDetail";
import Toast from "@/components/Toast";

const VIEW_STORAGE_KEYS: Record<string, string> = {
  movies: "vault-view-movies",
  books: "vault-view-books",
};

function loadViewPref(tab: string): "grid" | "list" {
  if (typeof window === "undefined") return "grid";
  return (localStorage.getItem(VIEW_STORAGE_KEYS[tab]) as "grid" | "list") ?? "grid";
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("movies");
  const [viewModes, setViewModes] = useState<Record<string, "grid" | "list">>({
    movies: "grid",
    books: "grid",
  });

  // Load persisted preferences on mount
  useEffect(() => {
    setViewModes({
      movies: loadViewPref("movies"),
      books: loadViewPref("books"),
    });
  }, []);

  const viewMode = activeTab === "quotes" ? "list" : (viewModes[activeTab] ?? "grid");

  const handleViewModeChange = (mode: "grid" | "list") => {
    if (activeTab === "quotes") return;
    setViewModes((prev) => ({ ...prev, [activeTab]: mode }));
    localStorage.setItem(VIEW_STORAGE_KEYS[activeTab], mode);
  };
  const [modalOpen, setModalOpen] = useState(false);
  const [prefillQuoteItem, setPrefillQuoteItem] = useState<Item | null>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(true);

  const [detailItem, setDetailItem] = useState<Item | null>(null);

  const [toast, setToast] = useState({ message: "", visible: false });
  const showToast = (message: string) => setToast({ message, visible: true });

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/items");
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (err) {
      console.error("Failed to fetch items:", err);
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await fetch("/api/quotes");
      const data = await res.json();
      setQuotes(data.quotes ?? []);
    } catch (err) {
      console.error("Failed to fetch quotes:", err);
    } finally {
      setIsLoadingQuotes(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchQuotes();
  }, [fetchItems, fetchQuotes]);

  const handleSaved = () => {
    setModalOpen(false);
    setPrefillQuoteItem(null);
    fetchItems();
    fetchQuotes();
    showToast("Added to vault");
  };

  const handleClose = () => {
    setModalOpen(false);
    setPrefillQuoteItem(null);
  };

  const handleCoverUpdate = (id: string, newUrl: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, cover_image_url: newUrl } : item))
    );
  };

  const handleQuickQuote = (item: Item) => {
    setPrefillQuoteItem(item);
    setModalOpen(true);
  };

  // ItemDetail callbacks
  const handleItemUpdated = (updated: Item) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setDetailItem(null);
  };

  const handleItemDeleted = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    // Remove linked quotes from local state too (already deleted server-side if cascade)
    setDetailItem(null);
    // Refetch quotes to reflect any cascade delete
    fetchQuotes();
  };

  const handleQuoteDeleted = (id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    showToast("Quote deleted");
  };

  const handleReorder = async (type: "movie" | "book", newOrder: Item[]) => {
    // Optimistic update — replace items of this type with new order
    setItems((prev) => {
      const others = prev.filter((i) => i.type !== type);
      return [...others, ...newOrder];
    });
    // Persist positions
    await fetch("/api/items/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: newOrder.map((i) => i.id) }),
    });
  };

  const movieItems = items.filter((i) => i.type === "movie");
  const bookItems = items.filter((i) => i.type === "book");

  const linkedQuotesCount = detailItem
    ? quotes.filter((q) => q.source_item_id === detailItem.id).length
    : 0;

  const sharedGridProps = {
    isLoading: isLoadingItems,
    onCoverUpdate: handleCoverUpdate,
    onQuickQuote: handleQuickQuote,
    onItemTap: setDetailItem,
  };

  return (
    <main className="min-h-screen min-h-dvh max-w-lg mx-auto">
      <header className="px-4 pt-12 pb-2">
        <h1 className="font-heading text-2xl tracking-tight text-vault-text">Vault</h1>
      </header>

      <TabNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      <section className="mt-2">
        {activeTab === "movies" && viewMode === "grid" && (
          <CoverGrid items={movieItems} {...sharedGridProps} onReorder={(o) => handleReorder("movie", o)} />
        )}
        {activeTab === "movies" && viewMode === "list" && (
          <ListView
            items={movieItems}
            isLoading={isLoadingItems}
            onItemTap={setDetailItem}
            onReorder={(o) => handleReorder("movie", o)}
          />
        )}
        {activeTab === "books" && viewMode === "grid" && (
          <CoverGrid items={bookItems} {...sharedGridProps} onReorder={(o) => handleReorder("book", o)} />
        )}
        {activeTab === "books" && viewMode === "list" && (
          <ListView
            items={bookItems}
            isLoading={isLoadingItems}
            onItemTap={setDetailItem}
            onReorder={(o) => handleReorder("book", o)}
          />
        )}
        {activeTab === "quotes" && (
          <QuoteJournal
            quotes={quotes}
            isLoading={isLoadingQuotes}
            onDeleteQuote={handleQuoteDeleted}
          />
        )}
      </section>

      <FAB onClick={() => { setPrefillQuoteItem(null); setModalOpen(true); }} />

      <AddModal
        isOpen={modalOpen}
        onClose={handleClose}
        onSaved={handleSaved}
        prefillQuoteItem={prefillQuoteItem}
        vaultItems={items}
      />

      <ItemDetail
        item={detailItem}
        isOpen={detailItem !== null}
        onClose={() => setDetailItem(null)}
        onUpdated={handleItemUpdated}
        onDeleted={handleItemDeleted}
        linkedQuotesCount={linkedQuotesCount}
        onShowToast={showToast}
      />

      <Toast
        message={toast.message}
        isVisible={toast.visible}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </main>
  );
}
