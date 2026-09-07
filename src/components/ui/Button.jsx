import { Loader2 } from "lucide-react";

/**
 * Enterprise standard button component.
 * Variants: primary | secondary | outline | ghost | danger
 * Sizes: sm (32px) | md (40px) | lg (44px)
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  type = "button",
  className = "",
  onClick,
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-all select-none rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:opacity-50";

  const sizeClasses = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-10 px-4 text-xs gap-2",
    lg: "h-11 px-5 text-sm gap-2.5",
  };

  const variantClasses = {
    primary:
      "bg-violet-600 text-white shadow-xs hover:bg-violet-700 active:bg-violet-800",
    secondary:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300",
    outline:
      "border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100",
    ghost:
      "text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200",
    danger:
      "bg-rose-600 text-white shadow-xs hover:bg-rose-700 active:bg-rose-800",
    "danger-outline":
      "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 active:bg-rose-200",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.primary
      } ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-current shrink-0" />
      ) : (
        Icon && iconPosition === "left" && <Icon className="h-4 w-4 shrink-0" />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === "right" && (
        <Icon className="h-4 w-4 shrink-0" />
      )}
    </button>
  );
}

