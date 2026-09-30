"use client";

import React, { useMemo, useState } from "react";
import { RevenueDataPoint } from "@/types/analytics";

interface SalesBreakdownChartProps {
  data: readonly RevenueDataPoint[];
  currency?: string;
  storeName?: string;
}

export function SalesBreakdownChart({
  data,
  currency = "USD",
  storeName = "All Stores",
}: SalesBreakdownChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { points, areaPath, linePath, maxRevenue, yTicks } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], areaPath: "", linePath: "", maxRevenue: 0, yTicks: [] };
    }

    const max = Math.max(...data.map((d) => d.revenue), 100);
    const roundedMax = Math.ceil(max / 1000) * 1000;
    const ticks = [
      roundedMax,
      Math.round(roundedMax * 0.75),
      Math.round(roundedMax * 0.5),
      Math.round(roundedMax * 0.25),
      0,
    ];

    const width = 800;
    const height = 260;
    const paddingX = 40;
    const paddingY = 25;
    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingY * 2;

    const coords = data.map((d, i) => {
      const x = paddingX + (i / Math.max(1, data.length - 1)) * chartWidth;
      const normalizedY = (d.revenue / roundedMax) * chartHeight;
      const y = height - paddingY - normalizedY;
      return { x, y, data: d, index: i };
    });

    let line = "";
    if (coords.length > 0) {
      line = `M ${coords[0].x},${coords[0].y}`;
      for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[i];
        const p1 = coords[i + 1];
        const cpX = (p0.x + p1.x) / 2;
        line += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
      }
    }

    const first = coords[0] || { x: paddingX, y: height - paddingY };
    const last = coords[coords.length - 1] || { x: width - paddingX, y: height - paddingY };
    const area = `${line} L ${last.x},${height - paddingY} L ${first.x},${height - paddingY} Z`;

    return {
      points: coords,
      areaPath: area,
      linePath: line,
      maxRevenue: roundedMax,
      yTicks: ticks,
    };
  }, [data]);

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  return (
    <div className="bg-white rounded-[28px] p-6 border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all duration-300 hover:shadow-[0_16px_38px_rgba(0,0,0,0.05)] w-full">
      {/* Chart Card Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 tracking-tight">Revenue Stream</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Gross sales trend across {storeName}
          </p>
        </div>

        {activePoint && (
          <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200/80 px-3.5 py-1.5 rounded-full text-xs">
            <span className="text-zinc-500 font-medium">{activePoint.data.label}:</span>
            <span className="font-mono font-bold text-zinc-900">
              ${activePoint.data.revenue.toLocaleString()} {currency}
            </span>
            <span className="text-[11px] text-[#00875A] font-semibold font-mono">
              ({activePoint.data.ordersCount} orders)
            </span>
          </div>
        )}
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full h-72">
        <svg
          viewBox="0 0 800 280"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00875A" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#00875A" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Dashed Gridlines */}
          {yTicks.map((tick, i) => {
            const y = 25 + (i / (yTicks.length - 1)) * (260 - 50);
            return (
              <g key={`tick-${tick}-${i}`}>
                <line
                  x1="40"
                  y1={y}
                  x2="760"
                  y2={y}
                  stroke="#f1f5f9"
                  strokeDasharray="4 4"
                  strokeWidth="1.2"
                />
                <text
                  x="30"
                  y={y + 3}
                  textAnchor="end"
                  className="fill-zinc-400 text-[10px] font-mono select-none"
                >
                  ${tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#salesGradient)"
              className="transition-all duration-300"
            />
          )}

          {/* Stroke Curve */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#00875A"
              strokeWidth="3"
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          )}

          {/* Interactive Hover Zones & Glow Points */}
          {points.map((pt) => {
            const isHovered = hoveredIndex === pt.index;

            return (
              <g
                key={`point-${pt.index}`}
                onMouseEnter={() => setHoveredIndex(pt.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Invisible Hover Hitbox */}
                <rect
                  x={pt.x - 20}
                  y="0"
                  width="40"
                  height="280"
                  fill="transparent"
                />

                {/* Vertical Cursor Indicator Line */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1="25"
                    x2={pt.x}
                    y2="235"
                    stroke="#00875A"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  />
                )}

                {/* Outer Glow Circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 7 : 4}
                  fill="#ffffff"
                  stroke="#00875A"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-200"
                />

                {/* X-Axis Label */}
                <text
                  x={pt.x}
                  y="265"
                  textAnchor="middle"
                  className={`text-[11px] select-none font-medium transition-colors ${
                    isHovered ? "fill-zinc-900 font-bold" : "fill-zinc-400"
                  }`}
                >
                  {pt.data.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
