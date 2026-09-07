import { ChevronDown } from "lucide-react";

/**
 * Standard enterprise Select dropdown component.
 */
export default function Select({
  label,
  error,
  hint,
  required = false,
  className = "",
  containerClassName = "",
  id,
  options = [],
  children,
  disabled = false,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-xs font-semibold text-slate-700"
        >
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          disabled={disabled}
          className={`h-10 w-full appearance-none rounded-lg border bg-white pl-3 pr-9 text-xs text-slate-900 outline-none transition focus:border-violet-600 focus:ring-3 focus:ring-violet-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
            error
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/15"
              : "border-slate-200 hover:border-slate-300"
          } ${className}`}
          {...props}
        >
          {children ||
            options.map((opt) => {
              const val = typeof opt === "object" ? opt.value : opt;
              const lbl = typeof opt === "object" ? opt.label : opt;
              return (
                <option key={val} value={val}>
                  {lbl}
                </option>
              );
            })}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      </div>
      {error && <p className="mt-1 text-[11px] font-medium text-rose-600">{error}</p>}
      {!error && hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

