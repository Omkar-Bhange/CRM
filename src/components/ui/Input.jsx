/**
 * Standard enterprise Form Input component with label, error, hint, and icon slots.
 */
export default function Input({
  label,
  error,
  hint,
  icon: Icon,
  iconPosition = "left",
  required = false,
  className = "",
  containerClassName = "",
  id,
  type = "text",
  disabled = false,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-semibold text-slate-700"
        >
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && iconPosition === "left" && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          disabled={disabled}
          className={`h-10 w-full rounded-lg border bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-600 focus:ring-3 focus:ring-violet-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
            error
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/15"
              : "border-slate-200 hover:border-slate-300"
          } ${Icon && iconPosition === "left" ? "pl-9" : ""} ${
            Icon && iconPosition === "right" ? "pr-9" : ""
          } ${className}`}
          {...props}
        />
        {Icon && iconPosition === "right" && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-[11px] font-medium text-rose-600">{error}</p>}
      {!error && hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

