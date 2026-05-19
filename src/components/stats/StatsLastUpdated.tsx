import { Clock3 } from "lucide-react";

type StatsLastUpdatedProps = {
  value?: string | null;
};

function formatLastUpdated(value?: string | null) {
  if (!value) {
    return "Last updated: Not synced";
  }

  return `Last updated: ${new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  }).format(new Date(value))}`;
}

export function StatsLastUpdated({ value }: StatsLastUpdatedProps) {
  return (
    <p className="inline-flex items-center gap-2 text-sm text-slate-400">
      <Clock3 size={15} />
      {formatLastUpdated(value)}
    </p>
  );
}
