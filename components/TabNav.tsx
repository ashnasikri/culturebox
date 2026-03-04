"use client";

import { Tab } from "@/types";

interface TabNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
}

const tabs: { key: Tab; label: string }[] = [
  { key: "movies", label: "Movies" },
  { key: "books", label: "Books" },
  { key: "quotes", label: "Quotes" },
];

export default function TabNav({
  activeTab,
  onTabChange,
  viewMode = "grid",
  onViewModeChange,
}: TabNavProps) {
  const showToggle = activeTab !== "quotes" && onViewModeChange;

  return (
    <nav className="flex items-center gap-1 px-4 pt-2 pb-3">
      <div className="flex gap-1 flex-1">
        {tabs.map(({ key, label }) => {
          const isActive = activeTab === key;
          const accentColor = key === "books" ? "vault-warm" : "vault-cool";
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`relative px-4 py-2 text-sm font-body tracking-wide rounded-lg transition-all duration-200 ${
                isActive
                  ? `text-${accentColor} bg-white/[0.04]`
                  : "text-vault-muted hover:text-vault-text hover:bg-white/[0.02]"
              }`}
            >
              {label}
              {isActive && (
                <span
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-${accentColor}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {showToggle && (
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              viewMode === "grid"
                ? "bg-white/[0.08] text-vault-text"
                : "text-vault-muted hover:text-vault-text"
            }`}
            title="Grid view"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <rect x="0" y="0" width="7" height="7" rx="1.5" />
              <rect x="9" y="0" width="7" height="7" rx="1.5" />
              <rect x="0" y="9" width="7" height="7" rx="1.5" />
              <rect x="9" y="9" width="7" height="7" rx="1.5" />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              viewMode === "list"
                ? "bg-white/[0.08] text-vault-text"
                : "text-vault-muted hover:text-vault-text"
            }`}
            title="List view"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="0" y1="3" x2="16" y2="3" />
              <line x1="0" y1="8" x2="16" y2="8" />
              <line x1="0" y1="13" x2="16" y2="13" />
            </svg>
          </button>
        </div>
      )}
    </nav>
  );
}
