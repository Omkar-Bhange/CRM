import { useState } from "react";
import { Filter, X, RotateCcw } from "lucide-react";

export default function FilterPanel({
  filters = [],
  values = {},
  onChange,
  onReset,
  isOpen = false,
  onToggle,
}) {
  const activeCount = Object.values(values).filter(
    (v) => v !== "" && v !== "All" && v != null
  ).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${
          activeCount > 0
            ? "border-violet-300 bg-violet-50 text-violet-700"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        <Filter size={13} className={activeCount > 0 ? "text-violet-600" : "text-slate-400"} />
        <span>Filter</span>
        {activeCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10 z-30 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Filter Records
            </span>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:underline"
              >
                <RotateCcw size={11} />
                Reset all
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filters.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  {field.label}
                </label>
                {field.type === "select" ? (
                  <select
                    value={values[field.key] || "All"}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:border-violet-500 focus:outline-hidden"
                  >
                    {field.options.map((opt) => {
                      const val = typeof opt === "string" ? opt : opt.value;
                      const label = typeof opt === "string" ? opt : opt.label;
                      return (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                ) : field.type === "date" ? (
                  <input
                    type="date"
                    value={values[field.key] || ""}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:border-violet-500 focus:outline-hidden"
                  >
                  </input>
                ) : (
                  <input
                    type="text"
                    value={values[field.key] || ""}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    placeholder={field.placeholder || ""}
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:border-violet-500 focus:outline-hidden"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={onToggle}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

