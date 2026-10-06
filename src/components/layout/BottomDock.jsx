import { useState, useRef, useEffect } from "react";
import {
  Pin,
  Clock,
  Bell,
  HelpCircle,
  X,
  Keyboard,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export default function BottomDock({
  recentItems = [],
  onNavigate,
  reminderCount = 0,
  reminders = [],
  sidebarCollapsed = false,
  pins = null,
  appName = "Nexora Enterprise CRM",
}) {
  const [activeModal, setActiveModal] = useState(null); // 'recents' | 'reminders' | 'help' | 'pins'
  const dockRef = useRef(null);

  // Close modal on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dockRef.current && !dockRef.current.contains(e.target)) {
        setActiveModal(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside
      ref={dockRef}
      aria-label="Quick utilities and recent items dock"
      className={`fixed bottom-0 right-0 z-30 flex h-7 items-center justify-between border-t border-slate-200 bg-white/95 px-3 text-[11px] font-medium text-slate-500 backdrop-blur-xs transition-all duration-200 left-0 ${
        sidebarCollapsed ? "md:left-[68px]" : "md:left-[240px]"
      }`}
    >
      {/* Left Utilities */}
      <div className="flex items-center gap-1">
        {/* My Pins */}
        <button
          type="button"
          onClick={() =>
            setActiveModal(activeModal === "pins" ? null : "pins")
          }
          className={`flex items-center gap-1 rounded px-2 py-0.5 transition ${
            activeModal === "pins"
              ? "bg-violet-100 text-violet-700 font-semibold"
              : "hover:bg-slate-100 hover:text-slate-800"
          }`}
        >
          <Pin size={11} className="rotate-45 text-slate-400" />
          <span>My Pins</span>
        </button>

        <span className="text-slate-300">|</span>

        {/* Recent Items */}
        <button
          type="button"
          onClick={() =>
            setActiveModal(activeModal === "recents" ? null : "recents")
          }
          className={`flex items-center gap-1 rounded px-2 py-0.5 transition ${
            activeModal === "recents"
              ? "bg-violet-100 text-violet-700 font-semibold"
              : "hover:bg-slate-100 hover:text-slate-800"
          }`}
        >
          <Clock size={11} className="text-slate-400" />
          <span>Recent Items</span>
        </button>

        <span className="text-slate-300">|</span>

        {/* Reminders with badge */}
        <button
          type="button"
          onClick={() =>
            setActiveModal(activeModal === "reminders" ? null : "reminders")
          }
          className={`flex items-center gap-1.5 rounded px-2 py-0.5 transition ${
            activeModal === "reminders"
              ? "bg-violet-100 text-violet-700 font-semibold"
              : "hover:bg-slate-100 hover:text-slate-800"
          }`}
        >
          <Bell size={11} className="text-slate-400" />
          <span>Reminders</span>
          {reminderCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
              {reminderCount}
            </span>
          )}
        </button>
      </div>

      {/* Right Utilities */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            setActiveModal(activeModal === "help" ? null : "help")
          }
          className={`flex items-center gap-1 rounded px-2 py-0.5 transition ${
            activeModal === "help"
              ? "bg-violet-100 text-violet-700 font-semibold"
              : "hover:bg-slate-100 hover:text-slate-800"
          }`}
        >
          <HelpCircle size={11} className="text-slate-400" />
          <span>Help</span>
        </button>

        <span className="hidden sm:inline text-[10px] text-slate-400">
          {appName}
        </span>
      </div>

      {/* Popovers / Drawers */}

      {/* 1. Recent Items Popover */}
      {activeModal === "recents" && (
        <div className="absolute bottom-8 left-3 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Clock size={14} className="text-violet-600" />
              <span>Recently Visited Records</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          </div>

          <div className="mt-2 divide-y divide-slate-50 max-h-56 overflow-y-auto">
            {recentItems.length > 0 ? (
              recentItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (onNavigate) onNavigate(item.module, item.id);
                    setActiveModal(null);
                  }}
                  className="flex w-full items-center justify-between py-1.5 px-1 hover:bg-slate-50 rounded text-left transition"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {item.module} · {item.subtitle || "View details"}
                    </p>
                  </div>
                  <ChevronRight size={13} className="text-slate-300 shrink-0" />
                </button>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                No recent items in this session.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Reminders Popover */}
      {activeModal === "reminders" && (
        <div className="absolute bottom-8 left-20 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Bell size={14} className="text-rose-600" />
              <span>Active Reminders & Alerts</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          </div>

          <div className="mt-2 divide-y divide-slate-50 max-h-56 overflow-y-auto">
            {reminders.length > 0 ? (
              reminders.map((rem, idx) => (
                <div key={idx} className="py-2 px-1">
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      size={13}
                      className="text-amber-500 shrink-0 mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800">
                        {rem.title}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {rem.message}
                      </p>
                      {rem.date && (
                        <p className="text-[9px] font-medium text-slate-400 mt-0.5">
                          Due: {rem.date}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                <CheckCircle2
                  size={20}
                  className="text-emerald-500 mx-auto mb-1"
                />
                All clear! No overdue reminders.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. My Pins Popover */}
      {activeModal === "pins" && (
        <div className="absolute bottom-8 left-3 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Pin size={14} className="text-violet-600 rotate-45" />
              <span>Pinned Modules & Views</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          </div>

          <div className="mt-2 space-y-1">
            {(
              pins || [
                { id: "clients", label: "Clients (360°)" },
                { id: "requirements", label: "Leads & Enquiries" },
                { id: "projects", label: "Projects Master" },
                { id: "billing", label: "AMC & Invoices" },
                { id: "tickets", label: "Support Tickets" },
              ]
            ).map((pin) => (
              <button
                key={pin.id}
                type="button"
                onClick={() => {
                  if (onNavigate) onNavigate(pin.id);
                  setActiveModal(null);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition"
              >
                <span>{pin.label}</span>
                <ChevronRight size={12} className="text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Help & Shortcuts Popover */}
      {activeModal === "help" && (
        <div className="absolute bottom-8 right-3 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Keyboard size={14} className="text-violet-600" />
              <span>Keyboard Shortcuts & Help</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Omni Search</span>
              <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                Ctrl + K
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Toggle Sidebar</span>
              <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                Ctrl + B
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Close Modals / Drawers</span>
              <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                ESC
              </kbd>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

