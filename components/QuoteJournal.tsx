"use client";

import { Quote } from "@/types";
import QuoteCard from "./QuoteCard";

interface QuoteJournalProps {
  quotes: Quote[];
  isLoading?: boolean;
}

export default function QuoteJournal({ quotes, isLoading }: QuoteJournalProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-4 pb-24">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl h-28 animate-shimmer"
            style={{ borderLeft: "3px solid rgba(255,255,255,0.06)" }}
          />
        ))}
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-vault-muted font-body text-sm text-center px-8">
        <p>No quotes yet</p>
        <p className="text-xs mt-1 opacity-60 leading-relaxed">
          Save passages and dialogues you love
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-24">
      {quotes.map((quote) => (
        <QuoteCard key={quote.id} quote={quote} />
      ))}
    </div>
  );
}
