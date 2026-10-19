"use client";

import { useSyncExternalStore } from "react";
import { Ring } from "@/components/charts/ring";
import { RingCenter } from "@/components/charts/ring-center";
import { RingChart } from "@/components/charts/ring-chart";
import { EmptyChart } from "./ChartCard";

// Difficulty is ordered, so it takes one ordinal cyan ramp (validated against
// the card surface), never green/yellow/red, which are reserved for status.
const difficultyColors = ["#0e7490", "#06b6d4", "#67e8f9"];

const subscribe = () => () => {};

// The ring's animated center number (@number-flow/react) is a web component
// that cannot be server-rendered, so the ring mounts in the browser only; the
// server and hydration pass render a same-size placeholder instead.
function useIsBrowser() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

type DifficultyRingsProps = {
  solved: { easy: number | null; medium: number | null; hard: number | null };
  totals: { easy: number; medium: number; hard: number } | null;
};

export function DifficultyRings({ solved, totals }: DifficultyRingsProps) {
  const isBrowser = useIsBrowser();

  if (!totals) {
    return <EmptyChart />;
  }

  const rings = [
    { label: "Easy", value: solved.easy ?? 0, maxValue: totals.easy },
    { label: "Medium", value: solved.medium ?? 0, maxValue: totals.medium },
    { label: "Hard", value: solved.hard ?? 0, maxValue: totals.hard },
  ].map((ring, index) => ({ ...ring, color: difficultyColors[index] }));

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
      {isBrowser ? (
        <RingChart data={rings} size={220}>
          {rings.map((ring, index) => (
            <Ring key={ring.label} index={index} />
          ))}
          <RingCenter defaultLabel="Solved" />
        </RingChart>
      ) : (
        <div aria-hidden="true" className="size-[220px] shrink-0" />
      )}
      <ul className="w-full max-w-56 space-y-3">
        {rings.map((ring) => (
          <li key={ring.label} className="flex items-center gap-3 text-sm">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: ring.color }}
            />
            <span className="text-zinc-300">{ring.label}</span>
            <span className="ml-auto tabular-nums text-zinc-100">
              {ring.value.toLocaleString("en")}
              <span className="text-zinc-500"> / {ring.maxValue.toLocaleString("en")}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
