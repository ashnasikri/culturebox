"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!password || isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/");
        router.refresh();
      } else {
        setError("Wrong password");
        setShake(true);
        setTimeout(() => setShake(false), 400);
        setPassword("");
        inputRef.current?.focus();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen min-h-dvh flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(170deg, #0d0d14, #12121f, #161625)" }}
    >
      <div className="flex flex-col items-center gap-6" style={{ width: 280 }}>
        {/* Logo */}
        <h1
          className="font-heading text-[32px] tracking-tight select-none"
          style={{
            background: "linear-gradient(135deg, #c4b5a0, #a89882)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          vault
        </h1>

        {/* Input + button */}
        <div className="flex flex-col gap-3 w-full">
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Enter password"
            className="w-full font-body text-[14px] text-white placeholder:text-white/30 focus:outline-none transition-colors"
            style={{
              padding: "14px 16px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.05)",
              border: error
                ? "1px solid rgba(255,100,100,0.5)"
                : "1px solid rgba(255,255,255,0.1)",
              animation: shake ? "vault-shake 0.35s ease" : undefined,
            }}
            autoComplete="current-password"
          />

          {error && (
            <p
              className="font-body text-[12px] text-center -mt-1"
              style={{ color: "rgba(255,100,100,0.6)" }}
            >
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading || !password}
            className="w-full font-body font-bold text-[14px] transition-opacity disabled:opacity-40"
            style={{
              padding: "14px 16px",
              borderRadius: 8,
              background: "linear-gradient(135deg, #a89882, #8a7d6b)",
              color: "#1a1a28",
            }}
          >
            {isLoading ? "Unlocking…" : "Unlock"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes vault-shake {
          0%   { transform: translateX(0); }
          25%  { transform: translateX(-4px); }
          50%  { transform: translateX(4px); }
          75%  { transform: translateX(-4px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </main>
  );
}
