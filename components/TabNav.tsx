"use client";

import { Tab } from "@/types";

interface TabNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { key: Tab; label: string }[] = [
  { key: "movies", label: "Movies" },
  { key: "books", label: "Books" },
  { key: "quotes", label: "Quotes" },
];

export default function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="flex gap-1 px-4 pt-2 pb-3">
      {tabs.map(({ key, label }) => {
        const isActive = activeTab === key;
        const accentColor =
          key === "books" ? "vault-warm" : "vault-cool";

        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`
              relative px-4 py-2 text-sm font-body tracking-wide rounded-lg
              transition-all duration-200
              ${
                isActive
                  ? `text-${accentColor} bg-white/[0.04]`
                  : "text-vault-muted hover:text-vault-text hover:bg-white/[0.02]"
              }
            `}
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
    </nav>
  );
}
