import { ArrowDownRight, ArrowUpRight } from "lucide-react";

/**
 * Standard enterprise KPI / Metric card.
 */
export default function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  iconClass = "bg-violet-50 text-violet-600",
  trend,
  trendValue,
  onClick,
  className = "",
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition-all ${
        onClick ? "cursor-pointer hover:border-slate-300 hover:shadow-sm" : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {value}
            </h3>
            {trend && (
              <span
                className={`inline-flex items-center text-[11px] font-semibold ${
                  trend === "up"
                    ? "text-emerald-600"
                    : trend === "down"
                    ? "text-rose-600"
                    : "text-slate-500"
                }`}
              >
                {trend === "up" ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : trend === "down" ? (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                ) : null}
                {trendValue}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-[11px] text-slate-500 truncate">{description}</p>
          )}
        </div>
        {Icon && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

