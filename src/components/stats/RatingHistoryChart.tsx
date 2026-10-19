"use client";

import { useMemo } from "react";
import { Area, AreaChart } from "@/components/charts/area-chart";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";
import type { RatingPoint } from "@/lib/stats/chart-data";
import { EmptyChart } from "./ChartCard";

// One platform's rating over time. Two rating systems never share an axis.
export function RatingHistoryChart({ points }: { points: RatingPoint[] }) {
  const data = useMemo(
    () =>
      points.map((point) => ({
        date: new Date(point.date),
        rating: point.rating,
        contest: point.contest,
      })),
    [points],
  );

  if (data.length < 2) {
    return <EmptyChart message="Rating history appears after two rated contests." />;
  }

  return (
    <AreaChart data={data} aspectRatio="16 / 9" margin={{ left: 12, right: 12 }}>
      <Grid horizontal strokeDasharray="none" />
      <Area
        dataKey="rating"
        fill="var(--chart-line-primary)"
        fillOpacity={0.28}
        strokeWidth={2}
      />
      <XAxis />
      <ChartTooltip
        rows={(point) => [
          {
            color: "var(--chart-line-primary)",
            label: String(point.contest || "Rating"),
            value: Number(point.rating).toLocaleString("en"),
          },
        ]}
      />
    </AreaChart>
  );
}
