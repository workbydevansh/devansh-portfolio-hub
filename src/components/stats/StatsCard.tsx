import type { ReactNode } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { cn } from "@/lib/utils";

type StatsCardProps = {
  label: string;
  value?: number | string | null;
  icon?: ReactNode;
  className?: string;
};

export function StatsCard({ label, value, icon, className }: StatsCardProps) {
  const displayValue =
    typeof value === "number" ? value.toLocaleString("en") : value ?? "Not synced";

  return (
    <GlassCard className={cn("p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{displayValue}</p>
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
