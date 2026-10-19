import type { CSSProperties, ReactNode } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { cn } from "@/lib/utils";

type StatsCardProps = {
  label: string;
  value?: number | string | null;
  icon?: ReactNode;
  className?: string;
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

export function StatsCard({ label, value, icon, className }: StatsCardProps) {
  const displayValue =
    typeof value === "number" ? value.toLocaleString("en") : value ?? "Not synced";

  return (
    <GlassCard className={cn("p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-white tabular-nums">
            {typeof value === "number" ? (
              <ResolvingNumber text={displayValue} />
            ) : (
              displayValue
            )}
          </p>
        </div>
        {icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
            {icon}
          </div>
        ) : null}
      </div>
    </GlassCard>
  );
}
