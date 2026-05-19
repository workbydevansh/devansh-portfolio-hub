import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  label: string;
  variant: "success" | "warning" | "info" | "neutral";
};

const badgeVariants: Record<StatusBadgeProps["variant"], string> = {
  success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  warning: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  info: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200",
  neutral: "border-slate-400/20 bg-slate-400/10 text-slate-200",
};

export function StatusBadge({ label, variant }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium",
        badgeVariants[variant],
      )}
    >
      {label}
    </span>
  );
}
