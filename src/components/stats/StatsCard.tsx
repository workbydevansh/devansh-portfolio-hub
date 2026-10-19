import type { CSSProperties, ReactNode } from "react";
import { GlassCard } from "@/components/shared/GlassCard";

type StatsCardProps = {
  label: string;
  value?: number | string | null;
  detail?: string;
  icon?: ReactNode;
};

// The real number is in the markup from the first render; each digit only
// resolves into place, so the value is never wrong while it animates.
function ResolvingNumber({ text }: { text: string }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {Array.from(text).map((character, index) => (
          <span
            key={index}
            className="digit"
            style={{ "--i": index } as CSSProperties}
          >
            {character}
          </span>
        ))}
      </span>
    </>
  );
}

// A headline number: the number is the chart.
export function StatsCard({ label, value, detail, icon }: StatsCardProps) {
  const displayValue =
    typeof value === "number" ? value.toLocaleString("en") : value ?? "Not synced";

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">{label}</p>
        {icon ? <span className="text-cyan-300">{icon}</span> : null}
      </div>
      <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
        {typeof value === "number" ? (
          <ResolvingNumber text={displayValue} />
        ) : (
          displayValue
        )}
      </p>
      {detail ? <p className="mt-2 text-sm text-zinc-400">{detail}</p> : null}
    </GlassCard>
  );
}
