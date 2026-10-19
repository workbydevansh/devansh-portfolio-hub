"use client";

import { useEffect, useRef } from "react";
import DrapeBackground from "@/components/kokonutui/drape-background";

// Site background: Kokonut UI's Drape (a WebGL cloth in a light breeze) in its
// dark variant. It sits behind every public page, so content would swallow
// the pointer; one document listener forwards mouse movement to the cloth
// (push only, no grabbing, so clicks and text selection stay untouched) and
// also drives the light that follows the cursor across glass cards. Work is
// batched to one update per frame and never re-renders React.
export function AmbientBackground() {
  const drapeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    if (!finePointer.matches) {
      return;
    }

    let frame = 0;
    let lastEvent: PointerEvent | null = null;
    const drape = () => drapeRef.current?.firstElementChild ?? null;

    function update() {
      frame = 0;

      if (!lastEvent) {
        return;
      }

      const { clientX, clientY, target } = lastEvent;

      drape()?.dispatchEvent(
        new PointerEvent("pointermove", { clientX, clientY, pointerType: "mouse" }),
      );

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
      if (!event.relatedTarget) {
        drape()?.dispatchEvent(new PointerEvent("pointerleave"));
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
    <div aria-hidden="true" className="ambient" ref={drapeRef}>
      <DrapeBackground className="absolute inset-0 h-full min-h-0">
        {null}
      </DrapeBackground>
      <div className="ambient-grain" />
    </div>
  );
}
