import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "default" | "green" | "amber" | "red" | "blue";

const toneStyles: Record<Tone, { bg: string; icon: string }> = {
  default: { bg: "bg-slate-100", icon: "text-slate-600" },
  green: { bg: "bg-emerald-100", icon: "text-emerald-600" },
  amber: { bg: "bg-amber-100", icon: "text-amber-600" },
  red: { bg: "bg-red-100", icon: "text-red-600" },
  blue: { bg: "bg-blue-100", icon: "text-blue-600" },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  sub?: string;
  tone?: Tone;
}) {
  const styles = toneStyles[tone];
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <div className={cn("p-2 rounded-lg", styles.bg)}>
          <Icon className={cn("h-4 w-4", styles.icon)} />
        </div>
      </div>
      <div className="text-3xl font-bold tracking-tight mb-1">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
