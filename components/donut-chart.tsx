"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

type DonutData = {
  name: string;
  value: number;
  color: string;
  detail: string;
};

const defaultData: DonutData[] = [
  {
    name: "Aktif",
    value: 0,
    color: "#22c55e",
    detail: "MoU: 0 | MoA: 0 | IA: 0",
  },
  {
    name: "Kadaluarsa",
    value: 0,
    color: "#facc15",
    detail: "MoU: 0 | MoA: 0 | IA: 0",
  },
  {
    name: "Perpanjangan",
    value: 0,
    color: "#3b82f6",
    detail: "MoU: 0 | MoA: 0 | IA: 0",
  },
  {
    name: "Tidak Aktif",
    value: 0,
    color: "#f97316",
    detail: "MoU: 0 | MoA: 0 | IA: 0",
  },
];

export function DonutChart({ data = defaultData }: { data?: DonutData[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const chartData = data.length > 0 ? data : defaultData;
  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Dokumen Kerjasama
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col items-center">
          {/* DONUT */}
          <div className="relative w-52 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  cursor="pointer"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={
                        activeIndex === null || activeIndex === index ? 1 : 0.25
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* TEKS TENGAH */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              {activeIndex !== null ? (
                <>
                  <p
                    className="text-xs font-medium"
                    style={{ color: chartData[activeIndex].color }}
                  >
                    {chartData[activeIndex].name}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {chartData[activeIndex].value} Data
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">Total dokumen</p>
                  <p className="text-2xl font-bold text-foreground">
                    {total} Data
                  </p>
                </>
              )}
            </div>

            {/* TOOLTIP FLOAT */}
            {activeIndex !== null && (
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md text-xs text-white shadow-md transition-colors"
                style={{ backgroundColor: chartData[activeIndex].color }}
              >
                {chartData[activeIndex].name} : {chartData[activeIndex].value} Data
              </div>
            )}
          </div>

          {/* LEGEND (HOVER = AKTIFKAN DONUT) */}
          <div className="mt-6 w-full space-y-4">
            {chartData.map((item, index) => {
              const isActive = activeIndex === index;

              return (
                <div
                  key={index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`flex items-center justify-between text-sm cursor-pointer rounded-md px-2 py-1 transition
                    ${isActive ? "bg-muted" : "hover:bg-muted/40"}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: item.color,
                        opacity: activeIndex === null || isActive ? 1 : 0.25,
                      }}
                    />
                    <div>
                      <p
                        className="font-medium"
                        style={{
                          color: isActive ? item.color : undefined,
                        }}
                      >
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">Jumlah</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">{item.value} Data</p>
                    <p
                      className="text-xs"
                      style={{
                        color: isActive ? item.color : undefined,
                      }}
                    >
                      {item.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
