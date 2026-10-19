"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils";

type FilterChipsProps<T extends string> = {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
};

// The selected highlight slides between chips so the filter change is legible.
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: FilterChipsProps<T>) {
  const pillId = useId();

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((option) => {
        const isActive = option === value;

        return (
          <button
            key={option}
            type="button"
            aria-pressed={isActive}
            className={cn(
              "relative rounded-md border px-3 py-2 text-sm font-medium transition-[color,background-color,border-color,scale] duration-200 ease-out active:scale-[0.96]",
              isActive
                ? "border-transparent text-cyan-100"
                : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10 hover:text-white",
            )}
            onClick={() => onChange(option)}
          >
            {isActive ? (
              <motion.span
                layoutId={pillId}
                aria-hidden="true"
                className="absolute inset-0 rounded-[inherit] bg-cyan-300/15 ring-1 ring-cyan-300/40"
                transition={{ type: "spring", duration: 0.35, bounce: 0 }}
              />
            ) : null}
            <span className="relative">{option}</span>
          </button>
        );
      })}
    </div>
  );
}
