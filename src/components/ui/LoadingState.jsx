import { Loader2 } from "lucide-react";

/**
 * Standard enterprise LoadingState component with spinner and message.
 */
export default function LoadingState({
  message = "Loading data...",
  minHeight = "min-h-[280px]",
  className = "",
}) {
  return (
    <div
      className={`flex ${minHeight} flex-col items-center justify-center p-6 text-center ${className}`}
    >
      <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
      <p className="mt-3 text-xs font-medium text-slate-600">{message}</p>
    </div>
  );
}

