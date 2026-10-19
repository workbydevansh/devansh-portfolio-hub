import { Clock3 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

type StatsLastUpdatedProps = {
  value?: string | null;
};


export function StatsLastUpdated({ value }: StatsLastUpdatedProps) {
  return (
    <p className="inline-flex items-center gap-2 text-sm text-zinc-400">
      <Clock3 size={15} />
      Last updated: {formatDateTime(value, "Not synced")}
    </p>
  );
}
