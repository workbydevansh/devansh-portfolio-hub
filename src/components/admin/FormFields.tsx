import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const fieldClassName =
  "w-full rounded-md border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-white outline-none transition-colors duration-200 placeholder:text-zinc-500 focus:border-cyan-300/40 focus:bg-white/10";

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-2 block text-sm font-medium text-zinc-200">
      {children}
    </span>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className={fieldClassName}
      />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        required={required}
        className={cn(fieldClassName, "resize-y")}
      />
    </label>
  );
}

export function FileInput({
  label,
  accept,
  hint,
  onFileChange,
  children,
}: {
  label: string;
  accept: string;
  hint: string;
  onFileChange: (file: File | null) => void;
  children?: ReactNode;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        type="file"
        accept={accept}
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        className="w-full rounded-md border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-zinc-200 file:mr-4 file:rounded-md file:border-0 file:bg-cyan-300/15 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-cyan-100 hover:file:bg-cyan-300/25"
      />
      <p className="mt-2 text-xs text-zinc-400">{hint}</p>
      {children}
    </label>
  );
}

// Success or error feedback; renders nothing when there is no message.
export function Notice({
  tone,
  message,
  className,
}: {
  tone: "error" | "success";
  message: string;
  className?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        tone === "error"
          ? "border-rose-400/25 bg-rose-400/10 text-rose-200"
          : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
        className,
      )}
    >
      {message}
    </p>
  );
}

export const primaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/15 px-4 py-3 text-sm font-semibold text-cyan-100 transition-colors duration-200 hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-70";

export const secondaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-zinc-100 transition-colors duration-200 hover:bg-white/10";
