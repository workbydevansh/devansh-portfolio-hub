import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Empty form fields are stored as null rather than "".
export function nullableValue(value: string) {
  return value.trim() || null;
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

// Formatters are built once; constructing Intl formatters is not free.
const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
  timeZoneName: "short",
});

export function formatDate(date: string | null, fallback = "Not added") {
  return date ? dateFormatter.format(new Date(date)) : fallback;
}

export function formatDateTime(date: string | null | undefined, fallback: string) {
  return date ? dateTimeFormatter.format(new Date(date)) : fallback;
}
