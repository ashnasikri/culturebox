"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onHide: () => void;
}

export default function Toast({ message, isVisible, onHide }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onHide, 2500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-[60] animate-toast-in pointer-events-none">
      <div className="px-4 py-2.5 rounded-xl bg-vault-elevated border border-vault-card-border text-sm font-body text-vault-text shadow-lg whitespace-nowrap">
        {message}
      </div>
    </div>
  );
}
