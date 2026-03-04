import { ItemStatus } from "@/types";

interface StatusBadgeProps {
  status: ItemStatus;
  finishedMonth?: string | null;
  finishedYear?: number | null;
}

const statusLabels: Record<string, string> = {
  watched: "Watched",
  read: "Read",
  reading: "Reading",
  want_to: "Want to",
};

export default function StatusBadge({
  status,
  finishedMonth,
  finishedYear,
}: StatusBadgeProps) {
  const label = statusLabels[status] ?? status;
  const isFinished = status === "watched" || status === "read";
  const finishedText =
    isFinished && finishedMonth
      ? `${finishedMonth}${finishedYear ? ` ${finishedYear}` : ""}`
      : null;

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-body tracking-wide
        ${
          status === "reading"
            ? "bg-vault-warm/15 text-vault-warm"
            : status === "want_to"
              ? "bg-white/[0.04] text-vault-muted"
              : "bg-white/[0.06] text-vault-text"
        }
      `}
    >
      {isFinished && <span className="opacity-60">&#10003;</span>}
      {finishedText ?? label}
    </span>
  );
}
