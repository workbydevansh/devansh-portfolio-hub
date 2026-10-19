"use client";

import { useEffect, useRef } from "react";

// One pointer listener drives both the background spotlight and the light that
// follows the cursor across glass cards. Work is batched to one update per
// frame and written straight to transforms and CSS variables, so React never
// re-renders while the pointer moves.
export function AmbientBackground() {
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!finePointer.matches) {
      return;
    }

    let frame = 0;
    let lastEvent: PointerEvent | null = null;

    function update() {
      frame = 0;

      if (!lastEvent) {
        return;
      }

      const { clientX, clientY, target } = lastEvent;
      const spotlight = spotlightRef.current;

      if (spotlight && !reducedMotion.matches) {
        spotlight.style.transform = `translate3d(${clientX}px, ${clientY}px, 0)`;
        spotlight.dataset.active = "true";
      }

      let card =
        target instanceof Element
          ? target.closest<HTMLElement>(".glass-card")
          : null;

      // Nested cards are all hovered at once, so each gets its own coordinates.
      while (card) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--pointer-x", `${clientX - rect.left}px`);
        card.style.setProperty("--pointer-y", `${clientY - rect.top}px`);
        card = card.parentElement?.closest<HTMLElement>(".glass-card") ?? null;
      }
    }

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") {
        return;
      }

      lastEvent = event;

      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    }

    function handlePointerOut(event: PointerEvent) {
      if (!event.relatedTarget && spotlightRef.current) {
        spotlightRef.current.dataset.active = "false";
      }
    }

    document.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerout", handlePointerOut);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerout", handlePointerOut);
    };
  }, []);

  return (
    <div aria-hidden="true" className="ambient">
      <div className="ambient-blob ambient-blob-teal" />
      <div className="ambient-blob ambient-blob-indigo" />
      <div className="ambient-blob ambient-blob-cyan" />
      <div className="ambient-grid" />
      <div ref={spotlightRef} className="ambient-spotlight" />
      <div className="ambient-grain" />
    </div>
  );
}
