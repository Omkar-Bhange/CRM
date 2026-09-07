/**
 * Standard enterprise segmented tab control with smooth active surface and mobile horizontal scroll.
 */
export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = "",
  size = "md",
}) {
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-3.5 py-1.5 text-xs",
    lg: "px-4 py-2 text-sm",
  };

  return (
    <div
      className={`flex items-center gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 scrollbar-none ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange && onChange(tab.id)}
            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium rounded-md transition-all select-none ${
              sizeStyles[size] || sizeStyles.md
            } ${
              isActive
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
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
  );
}

