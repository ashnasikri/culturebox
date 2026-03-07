"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#c4b5a0", "#e0d5c4", "#8a7d6b", "#d4a574", "#ffffff"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  w: number;
  h: number;
  swayAmp: number;
  swaySpeed: number;
  swayOffset: number;
}

interface ConfettiProps {
  onDone: () => void;
}

export default function Confetti({ onDone }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 120,
      vx: (Math.random() - 0.5) * 2,
      vy: 2.5 + Math.random() * 3,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 9,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w: 6 + Math.random() * 8,
      h: 3 + Math.random() * 5,
      swayAmp: 1 + Math.random() * 2,
      swaySpeed: 0.02 + Math.random() * 0.03,
      swayOffset: Math.random() * Math.PI * 2,
    }));

    const DURATION = 5000;
    const FADE_START = 3500;
    const start = performance.now();
    let rafId: number;

    const animate = (now: number) => {
      const elapsed = now - start;
      const alpha = elapsed < FADE_START ? 1 : 1 - (elapsed - FADE_START) / (DURATION - FADE_START);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = Math.max(0, alpha);

      for (const p of particles) {
        p.x += p.vx + Math.sin(elapsed * p.swaySpeed + p.swayOffset) * p.swayAmp;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (elapsed < DURATION) {
        rafId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onDoneRef.current();
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 200 }}
    />
  );
}
