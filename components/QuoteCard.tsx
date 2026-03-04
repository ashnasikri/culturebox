import { Quote } from "@/types";

interface QuoteCardProps {
  quote: Quote;
}

const TYPE_EMOJI: Record<string, string> = { book: "📖", movie: "🎬" };

export default function QuoteCard({ quote }: QuoteCardProps) {
  const isBook = quote.type === "book";
  const accent = isBook ? "#c4b5a0" : "#7a8ba0";
  const accentClass = isBook ? "text-vault-warm" : "text-vault-cool";
  const bgClass = isBook ? "bg-vault-warm/[0.15]" : "bg-vault-cool/[0.15]";

  return (
    <div
      className="rounded-xl pl-4 pr-5 py-5 transition-colors"
      style={{
        background: "rgba(255,255,255,0.015)",
        borderLeft: `3px solid ${accent}`,
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.background =
          "rgba(255,255,255,0.04)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.background =
          "rgba(255,255,255,0.015)")
      }
    >
      <blockquote
        className="font-quote italic text-[14px] leading-[1.7] mb-3"
        style={{ color: "rgba(255,255,255,0.82)" }}
      >
        &ldquo;{quote.text}&rdquo;
      </blockquote>

      <div className="flex items-center gap-2.5">
        {/* Source type pill */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-body ${accentClass} ${bgClass}`}
        >
          {TYPE_EMOJI[quote.type]} {quote.type}
        </span>
        {/* Attribution */}
        <span
          className="text-[12px] font-body truncate"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          {quote.source_title}
          {quote.source_creator ? ` — ${quote.source_creator}` : ""}
        </span>
      </div>
    </div>
  );
}
