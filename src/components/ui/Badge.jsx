/**
 * Unified Badge component with consistent subtle tinted styling and status dots.
 */
export default function Badge({
  children,
  variant,
  status,
  size = "sm",
  showDot = true,
  className = "",
}) {
  // Infer variant from status string if variant is not explicitly provided
  const resolvedVariant = variant || getVariantFromStatus(status || children);

  const variantStyles = {
    // Success / Completed / Active
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dot-emerald-500",
    // In Progress / Blue
    info: "bg-blue-50 text-blue-700 border-blue-200/80 dot-blue-500",
    // Primary / Violet
    primary: "bg-violet-50 text-violet-700 border-violet-200/80 dot-violet-600",
    // Warning / Pending / On Hold / Medium
    warning: "bg-amber-50 text-amber-700 border-amber-200/80 dot-amber-500",
    // Danger / Critical / Overdue / High
    danger: "bg-rose-50 text-rose-700 border-rose-200/80 dot-rose-500",
    // Orange / High
    orange: "bg-orange-50 text-orange-700 border-orange-200/80 dot-orange-500",
    // Neutral / Planned / Low / Draft / Inactive
    neutral: "bg-slate-100 text-slate-700 border-slate-200 dot-slate-400",
  };

  const sizeStyles = {
    xs: "text-[10px] px-2 py-0.5 gap-1",
    sm: "text-[11px] px-2.5 py-0.5 gap-1.5",
    md: "text-xs px-3 py-1 gap-1.5",
  };

  const styleConfig = variantStyles[resolvedVariant] || variantStyles.neutral;

  // Extract dot color class
  const dotColor =
    resolvedVariant === "success"
      ? "bg-emerald-500"
      : resolvedVariant === "info"
      ? "bg-blue-500"
      : resolvedVariant === "primary"
      ? "bg-violet-600"
      : resolvedVariant === "warning"
      ? "bg-amber-500"
      : resolvedVariant === "danger"
      ? "bg-rose-500"
      : resolvedVariant === "orange"
      ? "bg-orange-500"
      : "bg-slate-400";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${styleConfig} ${
        sizeStyles[size] || sizeStyles.sm
      } ${className}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />}
      <span className="truncate">{children || status}</span>
    </span>
  );
}

function getVariantFromStatus(text) {
  if (!text) return "neutral";
  const lower = String(text).toLowerCase().trim();

  if (
    lower.includes("complete") ||
    lower === "active" ||
    lower === "paid" ||
    lower === "approved" ||
    lower === "installed" ||
    lower === "working"
  ) {
    return "success";
  }

  if (
    lower.includes("progress") ||
    lower === "running" ||
    lower === "testing" ||
    lower === "open"
  ) {
    return "info";
  }

  if (
    lower === "pending" ||
    lower === "on hold" ||
    lower === "hold" ||
    lower === "waiting" ||
    lower === "medium"
  ) {
    return "warning";
  }

  if (
    lower === "critical" ||
    lower === "overdue" ||
    lower === "cancelled" ||
    lower === "rejected" ||
    lower === "urgent" ||
    lower === "blocked"
  ) {
    return "danger";
  }

  if (lower === "high") {
    return "orange";
  }

  if (lower === "planned" || lower === "assigned" || lower === "low" || lower === "inactive") {
    return "neutral";
  }

  return "neutral";
}

