"use client";

import { useState, useEffect, useCallback } from "react";
import { Tab, Item, Quote } from "@/types";
import TabNav from "@/components/TabNav";
import FAB from "@/components/FAB";
import CoverGrid from "@/components/CoverGrid";
import QuoteJournal from "@/components/QuoteJournal";
import AddModal from "@/components/AddModal";
import Toast from "@/components/Toast";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("movies");
  const [modalOpen, setModalOpen] = useState(false);
  const [prefillQuoteItem, setPrefillQuoteItem] = useState<Item | null>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(true);

  const [toast, setToast] = useState({ message: "", visible: false });

  const showToast = (message: string) =>
    setToast({ message, visible: true });

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
      prev.map((item) =>
        item.id === id ? { ...item, cover_image_url: newUrl } : item
      )
    );
  };

  const handleQuickQuote = (item: Item) => {
    setPrefillQuoteItem(item);
    setModalOpen(true);
  };

  const movieItems = items.filter((i) => i.type === "movie");
  const bookItems = items.filter((i) => i.type === "book");

  return (
    <main className="min-h-screen min-h-dvh max-w-lg mx-auto">
      <header className="px-4 pt-12 pb-2">
        <h1 className="font-heading text-2xl tracking-tight text-vault-text">
          Vault
        </h1>
      </header>

      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      <section className="mt-2">
        {activeTab === "movies" && (
          <CoverGrid
            items={movieItems}
            isLoading={isLoadingItems}
            onCoverUpdate={handleCoverUpdate}
            onQuickQuote={handleQuickQuote}
          />
        )}
        {activeTab === "books" && (
          <CoverGrid
            items={bookItems}
            isLoading={isLoadingItems}
            onCoverUpdate={handleCoverUpdate}
            onQuickQuote={handleQuickQuote}
          />
        )}
        {activeTab === "quotes" && (
          <QuoteJournal quotes={quotes} isLoading={isLoadingQuotes} />
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

      <Toast
        message={toast.message}
        isVisible={toast.visible}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </main>
  );
}
