export function BookingCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="flex">
        <div className="w-1 bg-slate-200 flex-shrink-0" />
        <div className="flex-1 p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="h-2.5 w-8 bg-slate-100 rounded" />
              <div className="h-6 w-32 bg-slate-100 rounded" />
            </div>
            <div className="h-5 w-20 bg-slate-100 rounded-full" />
          </div>
          <div className="h-4 w-48 bg-slate-100 rounded" />
          <div className="h-4 w-56 bg-slate-100 rounded" />
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="h-5 w-20 bg-slate-100 rounded" />
            <div className="h-4 w-24 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
