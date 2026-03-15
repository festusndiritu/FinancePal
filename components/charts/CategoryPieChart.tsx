"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { PieLabelRenderProps } from "recharts";
import type { ExpenseCategory } from "@/types";

type CategoryData = {
  category: ExpenseCategory;
  total:    number;
  percent:  number;
};

type Props = { data: CategoryData[] };

const CATEGORY_COLORS: Record<string, string> = {
  food:          "#f59e0b",
  transport:     "#3b82f6",
  utilities:     "#64748b",
  rent:          "#8b5cf6",
  education:     "#6366f1",
  entertainment: "#ec4899",
  health:        "#10b981",
  shopping:      "#f97316",
  savings:       "#14b8a6",
  other:         "#94a3b8",
};

// Build the label renderer with access to the grand total so we can compute
// percentage ourselves — never trust the `percent` prop from Recharts since
// its scale (0-1 vs 0-100) differs across versions.
function makeLabelRenderer(grandTotal: number) {
  return function LabelRenderer(props: PieLabelRenderProps) {
    const { cx, cy, midAngle, innerRadius, outerRadius, value } = props;

    if (
      cx === undefined || cy === undefined ||
      midAngle === undefined ||
      innerRadius === undefined || outerRadius === undefined ||
      value === undefined || grandTotal === 0
    ) return null;

    const pct = Math.round(((value as number) / grandTotal) * 100);
    if (pct < 4) return null; // skip tiny slices to avoid overlap

    const RADIAN = Math.PI / 180;
    const r = (innerRadius as number) + ((outerRadius as number) - (innerRadius as number)) * 0.5 + 20;
    const x = (cx as number) + r * Math.cos(-(midAngle as number) * RADIAN);
    const y = (cy as number) + r * Math.sin(-(midAngle as number) * RADIAN);

    return (
      <text
        x={x} y={y}
        fill="#1e293b"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={700}
      >
        {pct}%
      </text>
    );
  };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: CategoryData }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-bold capitalize text-slate-800">{item.name}</p>
      <p className="text-sm font-black text-slate-900">KES {item.value.toLocaleString()}</p>
      <p className="text-xs text-slate-500">{Math.round(item.payload.percent)}% of total</p>
    </div>
  );
}

export default function CategoryPieChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-sm font-semibold text-slate-500">No category data yet</p>
        <p className="text-xs text-slate-400">Add some expenses to see the breakdown.</p>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.total, 0);
  const renderLabel = makeLabelRenderer(total);

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            dataKey="total"
            nameKey="category"
            labelLine={false}
            label={renderLabel}
          >
            {data.map((entry) => (
              <Cell
                key={entry.category}
                fill={CATEGORY_COLORS[entry.category] ?? "#94a3b8"}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span className="text-xs font-semibold capitalize text-slate-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Breakdown list */}
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
        {data.map((item) => (
          <div key={item.category} className="flex items-center gap-3 px-4 py-3">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: CATEGORY_COLORS[item.category] ?? "#94a3b8" }}
            />
            <span className="flex-1 text-sm font-semibold capitalize text-slate-700">
              {item.category}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {Math.round(item.percent)}%
            </span>
            <span className="text-sm font-black text-slate-900">
              KES {item.total.toLocaleString()}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total</span>
          <span className="text-sm font-black text-slate-900">KES {total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}