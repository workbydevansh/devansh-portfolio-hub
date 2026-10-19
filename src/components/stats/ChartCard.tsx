import type { ReactNode } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { cn } from "@/lib/utils";

type ChartCardProps = {
  title: string;
  description: ReactNode;
  // Every chart has a table twin, so no value is reachable only by hovering.
  table: { columns: [string, string]; rows: [string, string | number][] };
  className?: string;
  children: ReactNode;
};

export function ChartCard({
  title,
  description,
  table,
  className,
  children,
}: ChartCardProps) {
  return (
    <GlassCard className={cn("flex min-w-0 flex-col p-5", className)}>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-zinc-400">{description}</p>
      <div className="mt-5 min-w-0 flex-1">{children}</div>
      {table.rows.length ? (
        <details className="mt-4 text-sm">
          <summary className="w-fit cursor-pointer select-none text-zinc-400 transition-colors duration-200 hover:text-zinc-200">
            View as table
          </summary>
          <div className="mt-3 max-h-64 overflow-auto rounded-md border border-white/10">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-zinc-900 text-zinc-400">
                <tr>
                  <th className="px-3 py-2 font-medium">{table.columns[0]}</th>
                  <th className="px-3 py-2 text-right font-medium">
                    {table.columns[1]}
                  </th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map(([label, value], index) => (
                  <tr key={`${label}-${index}`} className="border-t border-white/5">
                    <td className="px-3 py-1.5 text-zinc-300">{label}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-zinc-100">
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </GlassCard>
  );
}

export function EmptyChart({ message = "No data synced yet." }: { message?: string }) {
  return (
    <p className="flex h-full min-h-40 items-center justify-center rounded-lg border border-dashed border-white/10 text-sm text-zinc-400">
      {message}
    </p>
  );
}
