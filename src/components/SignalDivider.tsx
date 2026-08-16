// src/components/SignalDivider.tsx
//
// Elemento assinatura: barra tipo "spectrum analyzer", usada como divisor.
// Hover funciona normal no desktop (mouse). Em touch, :hover/:active só
// duram enquanto o dedo encosta na tela — por isso o toque aciona um
// estado com timeout, mantendo a animação rodando por mais alguns
// segundos depois que o dedo solta.

"use client";

import { useEffect, useRef, useState } from "react";

const PLAY_DURATION_MS = 2000;

export function SignalDivider({ className = "" }: { className?: string }) {
  const [playing, setPlaying] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function trigger() {
    setPlaying(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setPlaying(false), PLAY_DURATION_MS);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const bars = [3, 6, 4, 8, 5, 9, 4, 7, 3, 6, 5, 8, 4, 6, 3];

  return (
    <div
      aria-hidden="true"
      onTouchStart={trigger}
      onClick={trigger}
      className={`group flex items-end gap-[0.1875rem] h-4 transition-opacity cursor-default hover:opacity-100 ${playing ? "opacity-100" : "opacity-60"} ${className}`}
    >
      {bars.map((h, i) => (
        <span
          key={i}
          className={`w-[0.1875rem] origin-bottom bg-gradient-to-t from-accent/70 to-accent-2/70 transition-transform group-hover:animate-[signal-bounce_0.7s_ease-in-out_infinite] ${
            playing ? "animate-[signal-bounce_0.7s_ease-in-out_infinite]" : ""
          }`}
          style={{
            height: `${h * 0.125}rem`,
            animationDelay: `${i * 70}ms`,
          }}
        />
      ))}
    </div>
  );
}
