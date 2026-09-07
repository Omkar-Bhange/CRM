/**
 * Standard enterprise ProgressBar component.
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  showLabel = false,
  size = "md",
  color = "violet",
  className = "",
}) {
  const percentage = Math.min(Math.max(Math.round((Number(value || 0) / max) * 100), 0), 100);

  const sizeStyles = {
    xs: "h-1.5",
    sm: "h-2",
    md: "h-2.5",
    lg: "h-3",
  };

  const colorStyles = {
    violet: "bg-violet-600",
    emerald: "bg-emerald-600",
    blue: "bg-blue-600",
    amber: "bg-amber-500",
    rose: "bg-rose-600",
  };

  const barColor = colorStyles[color] || colorStyles.violet;

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="font-medium text-slate-600">Progress</span>
          <span className="font-semibold text-slate-900">{percentage}%</span>
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-slate-100 ${sizeStyles[size] || sizeStyles.sm}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

