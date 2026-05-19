import { cn } from "@/lib/utils";

type DVLogoProps = {
  className?: string;
};

export function DVLogo({ className }: DVLogoProps) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-300/25 bg-slate-950/70 text-sm font-bold text-white shadow-lg shadow-cyan-950/30",
        className,
      )}
      aria-label="Devansh Portfolio Hub"
    >
      DV
    </div>
  );
}
