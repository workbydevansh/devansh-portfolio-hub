"use client";

import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { BarYAxis } from "@/components/charts/bar-y-axis";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import type { LabeledCount } from "@/lib/stats/chart-data";
import { EmptyChart } from "./ChartCard";

type CountBarChartProps = {
  data: LabeledCount[];
  valueLabel: string;
  orientation?: "vertical" | "horizontal";
};

// One series, so every bar takes slot 1; bar length already shows magnitude.
export function CountBarChart({
  data,
  valueLabel,
  orientation = "vertical",
}: CountBarChartProps) {
  if (!data.length) {
    return <EmptyChart />;
  }

  const isHorizontal = orientation === "horizontal";

  return (
    <BarChart
      data={data}
      xDataKey="label"
      orientation={orientation}
      aspectRatio={isHorizontal ? "4 / 3" : "16 / 9"}
      margin={
        isHorizontal
          ? { left: 150, right: 16, top: 8, bottom: 8 }
          : { left: 12, right: 12 }
      }
    >
      <Grid
        horizontal={!isHorizontal}
        vertical={isHorizontal}
        strokeDasharray="none"
      />
      <Bar dataKey="count" fill="var(--chart-1)" lineCap={4} />
      {isHorizontal ? <BarYAxis showAllLabels /> : <BarXAxis maxLabels={8} />}
      <ChartTooltip
        showCrosshair={false}
        rows={(point) => [
          {
            color: "var(--chart-1)",
            label: valueLabel,
            value: Number(point.count).toLocaleString("en"),
          },
        ]}
      />
    </BarChart>
  );
}
