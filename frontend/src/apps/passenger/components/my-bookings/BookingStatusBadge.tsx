const STATUS_STYLES: Record<string, string> = {
  CONFIRMED:  "bg-green-100 text-green-800 border-green-200",
  CANCELLED:  "bg-red-100 text-red-800 border-red-200",
  PENDING:    "bg-amber-100 text-amber-800 border-amber-200",
  WAITLISTED: "bg-blue-100 text-blue-800 border-blue-200",
};

const STATUS_DOT: Record<string, string> = {
  CONFIRMED:  "bg-green-500",
  CANCELLED:  "bg-red-500",
  PENDING:    "bg-amber-500",
  WAITLISTED: "bg-blue-500",
};

export function BookingStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          STATUS_DOT[status] ?? "bg-slate-400"
        }`}
      />
      {status}
    </span>
  );
}
