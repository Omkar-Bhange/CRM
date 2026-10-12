import React, { Component } from "react";
import {
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  X,
  ArrowLeft,
  Home,
  LogOut,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from "lucide-react";
import Button from "./Button";

/**
 * Strips sensitive data like JWT tokens, passwords, and authorization headers
 * from error messages before logging or rendering.
 */
function sanitizeErrorMessage(msg) {
  if (!msg) return "An unexpected application error occurred.";
  return String(msg)
    .replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, "Bearer [REDACTED]")
    .replace(/eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g, "[TOKEN_REDACTED]")
    .replace(/(password|token|secret|apiKey)["']?\s*[:=]\s*["']?[^"',\s}]+/gi, "$1=[REDACTED]");
}

/**
 * Generates a short diagnostic reference ID to help users correlate reports.
 */
function generateErrorId() {
  return "ERR-" + Math.random().toString(36).substring(2, 9).toUpperCase();
}

/**
 * Enterprise ErrorBoundary Component
 * 
 * Catches unhandled React render and lifecycle exceptions in subtrees.
 * Supports levels:
 *  - "root": Application-wide fallback
 *  - "portal": Portal workspace fallback (Admin, Employee, Client)
 *  - "module": Section/page-level fallback (leaves navigation and surrounding UI intact)
 *  - "modal" | "drawer": Dialog-level fallback with close/dismiss support
 * 
 * Protects against:
 *  - Complete application crashes / blank white screens
 *  - Infinite retry crash loops (throttles retries to 3 per 10 seconds)
 *  - Sensitive stack trace leakage in production
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      lastErrorTime: 0,
      showDevDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
    };
  }

  componentDidCatch(error, errorInfo) {
    const now = Date.now();
    const sanitizedMsg = sanitizeErrorMessage(error?.message);

    this.setState((prev) => ({
      errorInfo,
      lastErrorTime: now,
      retryCount: now - prev.lastErrorTime < 10000 ? prev.retryCount + 1 : 1,
    }));

    // Safe console logging without leaking auth credentials
    console.error(
      `[ErrorBoundary:${this.props.moduleName || this.props.level || "General"}] Caught render error:`,
      {
        message: sanitizedMsg,
        componentStack: errorInfo?.componentStack,
      }
    );

    // Optional telemetry or custom event dispatch
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(
          new CustomEvent("app-render-error", {
            detail: {
              moduleName: this.props.moduleName || "unknown",
              level: this.props.level || "module",
              message: sanitizedMsg,
              timestamp: new Date().toISOString(),
            },
          })
        );
      } catch {
        // Ignore event dispatch failure
      }
    }
  }

  handleRetry = () => {
    const { retryCount, lastErrorTime } = this.state;
    const now = Date.now();

    // Prevent rapid infinite retry crash loops (max 3 retries within 10 seconds)
    if (retryCount >= 3 && now - lastErrorTime < 10000) {
      alert("This section encountered repeated errors. Please navigate to another section or reload the page.");
      return;
    }

    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (e) {
        console.warn("[ErrorBoundary] onReset callback failed:", e);
      }
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleNavigateToDashboard = () => {
    if (typeof this.props.onNavigateToDashboard === "function") {
      this.props.onNavigateToDashboard();
    } else {
      window.location.hash = "";
      this.handleRetry();
    }
  };

  toggleDevDetails = () => {
    this.setState((prev) => ({ showDevDetails: !prev.showDevDetails }));
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Custom fallback provided by consumer
    if (this.props.fallback) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          retry: this.handleRetry,
          errorId: this.state.errorId,
        });
      }
      return this.props.fallback;
    }

    const {
      level = "module",
      moduleName = "Section",
      onClose,
      onLogout,
    } = this.props;

    const { error, errorInfo, errorId, retryCount, showDevDetails } = this.state;
    const isDev = Boolean(import.meta.env?.DEV);
    const sanitizedMsg = sanitizeErrorMessage(error?.message);
    const isThrottled = retryCount >= 3;

    // -------------------------------------------------------------------------
    // 1. MODAL / DRAWER FALLBACK
    // -------------------------------------------------------------------------
    if (level === "modal" || level === "drawer") {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center bg-white rounded-2xl border border-rose-100 shadow-sm min-h-[220px]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-3.5">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <h3 className="text-sm font-semibold text-slate-900">
            Failed to render {moduleName}
          </h3>

          <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
            An unexpected error occurred while displaying this window. Unsaved input could not be rendered.
          </p>

          <span className="mt-2 text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
            Ref: {errorId}
          </span>

          <div className="mt-4 flex items-center gap-2">
            {!isThrottled && (
              <Button
                variant="outline"
                size="sm"
                icon={RotateCcw}
                onClick={this.handleRetry}
              >
                Retry Window
              </Button>
            )}

            {onClose && (
              <Button
                variant="secondary"
                size="sm"
                icon={X}
                onClick={onClose}
              >
                Close Window
              </Button>
            )}
          </div>

          {isDev && (
            <div className="mt-4 w-full text-left">
              <button
                type="button"
                onClick={this.toggleDevDetails}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
              >
                {showDevDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                Developer Details (Dev Only)
              </button>
              {showDevDetails && (
                <div className="mt-2 p-2 bg-slate-900 text-slate-100 rounded-lg text-[10px] font-mono overflow-auto max-h-40">
                  <div className="text-rose-400 font-bold">{sanitizedMsg}</div>
                  <pre className="mt-1 text-slate-300 whitespace-pre-wrap">
                    {errorInfo?.componentStack || error?.stack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // -------------------------------------------------------------------------
    // 2. ROOT / PORTAL WORKSPACE FALLBACK
    // -------------------------------------------------------------------------
    if (level === "root" || level === "portal") {
      return (
        <main className="flex min-h-screen w-full items-center justify-center bg-[#f8fafc] p-4 text-slate-900">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-lg">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <h1 className="mt-4 text-lg font-bold tracking-tight text-slate-900">
              {level === "root" ? "Application Workspace Error" : `${moduleName} Error`}
            </h1>

            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              The {moduleName.toLowerCase()} workspace encountered an unexpected rendering problem.
              Your authentication session remains active.
            </p>

            <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500">Incident Reference:</span>
              <span className="text-[11px] font-mono font-bold text-slate-700">{errorId}</span>
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              {!isThrottled && (
                <Button
                  variant="primary"
                  size="md"
                  icon={RotateCcw}
                  onClick={this.handleRetry}
                  className="w-full sm:w-auto"
                >
                  Try to Recover
                </Button>
              )}

              <Button
                variant="outline"
                size="md"
                icon={RefreshCw}
                onClick={this.handleReload}
                className="w-full sm:w-auto"
              >
                Reload Application
              </Button>

              {onLogout && (
                <Button
                  variant="ghost"
                  size="md"
                  icon={LogOut}
                  onClick={onLogout}
                  className="w-full sm:w-auto text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  Sign Out
                </Button>
              )}
            </div>

            {isDev && (
              <div className="mt-6 border-t border-slate-100 pt-4 text-left">
                <button
                  type="button"
                  onClick={this.toggleDevDetails}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                >
                  {showDevDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  Diagnostic Info (Development Mode Only)
                </button>
                {showDevDetails && (
                  <div className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-auto max-h-56">
                    <div className="text-rose-400 font-bold mb-1">{sanitizedMsg}</div>
                    <pre className="text-slate-300 whitespace-pre-wrap">
                      {errorInfo?.componentStack || error?.stack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      );
    }

    // -------------------------------------------------------------------------
    // 3. MODULE / SECTION FALLBACK (Default)
    // Preserves surrounding navigation, sidebar, topbar, and portal layout!
    // -------------------------------------------------------------------------
    return (
      <div className="enterprise-page w-full">
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <h2 className="mt-4 text-base font-semibold tracking-tight text-slate-900">
            Unable to load {moduleName}
          </h2>

          <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">
            A component rendering error occurred while loading this section.
            The rest of your workspace, navigation, and sidebar remain active.
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-mono text-slate-600">
            Ref: {errorId}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {!isThrottled && (
              <Button
                variant="primary"
                size="sm"
                icon={RotateCcw}
                onClick={this.handleRetry}
              >
                Retry {moduleName}
              </Button>
            )}

            {this.props.onNavigateToDashboard && (
              <Button
                variant="outline"
                size="sm"
                icon={Home}
                onClick={this.handleNavigateToDashboard}
              >
                Back to Dashboard
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={this.handleReload}
            >
              Reload Page
            </Button>
          </div>

          {isThrottled && (
            <p className="mt-3 text-[11px] font-medium text-rose-600">
              Multiple recovery attempts failed. Please switch to another module or reload the page.
            </p>
          )}

          {isDev && (
            <div className="mt-6 w-full max-w-2xl border-t border-slate-100 pt-4 text-left">
              <button
                type="button"
                onClick={this.toggleDevDetails}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
              >
                {showDevDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Diagnostic Stack (Dev Only — Hidden in Production)
              </button>
              {showDevDetails && (
                <div className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-auto max-h-56">
                  <div className="text-rose-400 font-bold mb-1">{sanitizedMsg}</div>
                  <pre className="text-slate-300 whitespace-pre-wrap">
                    {errorInfo?.componentStack || error?.stack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}
