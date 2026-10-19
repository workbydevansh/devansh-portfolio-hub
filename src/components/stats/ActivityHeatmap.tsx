"use client";

import { useMemo } from "react";
import {
  HeatmapCells,
  HeatmapChart,
  type HeatmapColumn,
  HeatmapInteractionBoundary,
  HeatmapInteractionProvider,
  HeatmapLegend,
  HeatmapTooltip,
  HeatmapXAxis,
  HeatmapYAxis,
} from "@/components/charts/heatmap";
import type { DailyCount } from "@/lib/stats/chart-data";
import { EmptyChart } from "./ChartCard";

const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });
const dayLabel = new Intl.DateTimeFormat("en", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

// Levels come from quartiles of this person's active days, so the colors
// separate light, typical and heavy days instead of saturating at 4+.
function levelFor(count: number, thresholds: number[]) {
  if (count <= 0) {
    return 0;
  }

  const level = thresholds.findIndex((threshold) => count <= threshold);
  return level === -1 ? 4 : level + 1;
}

export function ActivityHeatmap({ days }: { days: DailyCount[] }) {
  const { columns, countsByDay } = useMemo(() => {
    const counts = new Map(days.map((day) => [day.date, day.count]));
    const active = days
      .map((day) => day.count)
      .filter((count) => count > 0)
      .sort((a, b) => a - b);
    const quantile = (share: number) =>
      active[Math.floor((active.length - 1) * share)] ?? 0;
    const thresholds = [quantile(0.25), quantile(0.5), quantile(0.75)];

    const today = new Date(`${dayKey.format(new Date())}T12:00:00`);
    // First Sunday on or after the 1st of the month eleven months back.
    const start = new Date(today.getFullYear(), today.getMonth() - 11, 1, 12);
    start.setDate(start.getDate() + ((7 - start.getDay()) % 7));
    const weekCount = Math.floor((today.getTime() - start.getTime()) / 604_800_000) + 1;

    const weeks: HeatmapColumn[] = [];

    for (let week = 0; week < weekCount; week += 1) {
      const bins = [];

      for (let weekday = 0; weekday < 7; weekday += 1) {
        const date = new Date(start);
        date.setDate(start.getDate() + week * 7 + weekday);

        if (date > today) {
          break;
        }

        const count = counts.get(dayKey.format(date)) ?? 0;
        bins.push({ bin: weekday, count: levelFor(count, thresholds), date });
      }

      weeks.push({ bin: week, bins });
    }

    return { columns: weeks, countsByDay: counts };
  }, [days]);

  if (!days.length) {
    return <EmptyChart />;
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="min-w-[640px]">
        <HeatmapInteractionProvider>
          <HeatmapInteractionBoundary>
            <HeatmapChart data={columns} layout="fluid">
              <HeatmapCells />
              <HeatmapXAxis />
              <HeatmapYAxis />
              <HeatmapTooltip
                formatLabel={(_, date) => {
                  const count = countsByDay.get(dayKey.format(date)) ?? 0;
                  return `${count} submission${count === 1 ? "" : "s"} · ${dayLabel.format(date)}`;
                }}
              />
            </HeatmapChart>
            <HeatmapLegend className="mt-3" align="end" />
          </HeatmapInteractionBoundary>
        </HeatmapInteractionProvider>
      </div>
    </div>
  );
}
