import { useEffect, useRef, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "../../../../shared/utils/cn";

interface HoldCountdownProps {
  expiresAt: string;
  onExpired?: () => void;
}

export function HoldCountdown({ expiresAt, onExpired }: HoldCountdownProps) {
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    const tick = () => {
      const secs = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
      );
      setRemaining(secs);
      if (secs === 0) onExpiredRef.current?.();
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const mins = String(Math.floor(remaining / 60)).padStart(2, "0");
  const secs = String(remaining % 60).padStart(2, "0");
  const isUrgent = remaining < 60;
  const isVeryUrgent = remaining < 30;

  return (
    <div
      className={cn(
        "border-b",
        isUrgent ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
      )}
    >
      <div className="max-w-[1200px] mx-auto px-8 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {isUrgent ? (
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          ) : (
            <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
          )}
          <span
            className={cn(
              "text-sm font-medium",
              isUrgent ? "text-red-700" : "text-amber-800"
            )}
          >
            {isUrgent
              ? "Hurry! Your seat hold is about to expire"
              : "Seats held — complete booking before time runs out"}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {isVeryUrgent && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
          <span
            className={cn(
              "font-mono font-bold text-xl tracking-widest",
              isUrgent ? "text-red-600" : "text-brand-accent"
            )}
          >
            {mins}:{secs}
          </span>
        </div>
      </div>
    </div>
  );
}
