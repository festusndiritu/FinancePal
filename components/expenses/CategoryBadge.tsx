import { Badge } from "@/components/ui/badge";
import type { ExpenseCategory } from "@/types";

const colorMap: Record<ExpenseCategory, string> = {
  food: "bg-amber-100 text-amber-900",
  transport: "bg-blue-100 text-blue-900",
  utilities: "bg-slate-100 text-slate-900",
  rent: "bg-violet-100 text-violet-900",
  education: "bg-indigo-100 text-indigo-900",
  entertainment: "bg-pink-100 text-pink-900",
  health: "bg-emerald-100 text-emerald-900",
  shopping: "bg-orange-100 text-orange-900",
  savings: "bg-teal-100 text-teal-900",
  other: "bg-zinc-100 text-zinc-900",
};

type CategoryBadgeProps = {
  category: ExpenseCategory;
};

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <Badge className={colorMap[category]} variant="secondary">
      {category}
    </Badge>
  );
}
