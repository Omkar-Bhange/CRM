import { ArrowLeft } from "lucide-react";

export default function DetailLayout({
  title,
  subtitle,
  badge,
  onBack,
  backLabel = "Back to list",
  actions = [],
  tabs = [],
  activeTab,
  onTabChange,
  metrics = [],
  children,
}) {
  return (
    <div className="space-y-4">
      {/* Detail Header Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        {/* Back Link */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft size={14} />
            <span>{backLabel}</span>
          </button>
        )}

        {/* Title, Badge & Actions Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 truncate">
                {title}
              </h1>
              {badge}
            </div>
            {subtitle && (
              <p className="mt-1 text-xs text-slate-500 font-medium truncate">
                {subtitle}
              </p>
            )}
          </div>

          {/* Action Buttons Toolbar */}
          {actions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {actions.map((act, i) => {
                const Icon = act.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={act.onClick}
                    disabled={act.disabled}
                    className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                      act.variant === "primary"
                        ? "bg-violet-600 text-white shadow-xs hover:bg-violet-700 active:scale-95"
                        : act.variant === "danger"
                        ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    } disabled:opacity-50`}
                  >
                    {Icon && <Icon size={14} />}
                    <span>{act.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Key Metrics Chips / Summary items */}
        {metrics.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-4 lg:grid-cols-6">
            {metrics.map((m, i) => (
              <div key={i} className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {m.label}
                </span>
                <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                  {m.value || "—"}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tab Navigation */}
        {tabs.length > 0 && (
          <div className="mt-4 -mb-5 -mx-5 border-t border-slate-200 bg-slate-50/50 px-5 flex items-center gap-1 overflow-x-auto custom-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange && onTabChange(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-semibold transition shrink-0 whitespace-nowrap ${
                    isActive
                      ? "border-violet-600 text-violet-700 bg-white shadow-xs rounded-t-lg"
                      : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                  }`}
                >
                  {TabIcon && (
                    <TabIcon
                      size={14}
                      className={isActive ? "text-violet-600" : "text-slate-400"}
                    />
                  )}
                  <span>{tab.label}</span>
                  {typeof tab.count === "number" && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        isActive
                          ? "bg-violet-100 text-violet-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        {children}
      </div>
    </div>
  );
}

