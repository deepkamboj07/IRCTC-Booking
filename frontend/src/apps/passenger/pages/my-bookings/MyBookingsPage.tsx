import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ticket, Train, Plus, AlertCircle } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { Skeleton } from "../../../../shared/components/ui/skeleton";
import { PaginationRow } from "../../../../shared/components/ui/TablePagination";
import { useMyBookings } from "../../../../shared/api/bookings.api";
import { BookingCard } from "../../components/my-bookings/BookingCard";

const LIMIT = 8;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
      <div className="flex">
        <div className="w-1 bg-slate-200 flex-shrink-0" />
        <div className="flex-1 px-5 py-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-2.5 w-8" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-4 w-44" />
          <div className="flex items-center justify-between pt-3.5 border-t border-slate-100">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-7 w-28 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MyBookingsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useMyBookings({ page, limit: LIMIT });

  const total = data?.meta.total ?? 0;

  return (
    <div className="flex-1 flex flex-col bg-slate-100">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[760px] mx-auto px-8 py-5">

          <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-3">
            <button
              onClick={() => navigate("/")}
              className="hover:text-brand-primary transition-colors"
            >
              Home
            </button>
            <span>/</span>
            <span className="text-slate-700 font-medium">My Bookings</span>
          </nav>

          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
              <p className="text-sm text-slate-500 mt-1">
                {isLoading
                  ? "Loading your bookings…"
                  : `${total} booking${total !== 1 ? "s" : ""} total`}
              </p>
            </div>
            <Button
              className="bg-brand-accent hover:bg-brand-accentHov text-white h-10 flex-shrink-0"
              onClick={() => navigate("/")}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Book a Train
            </Button>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[760px] mx-auto w-full px-6 py-6 space-y-3">

        {/* Loading */}
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}

        {/* Error */}
        {isError && (
          <div className="bg-white rounded-xl border border-red-200 shadow-sm px-5 py-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">
              Failed to load bookings. Please refresh to try again.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && total === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-light flex items-center justify-center">
              <Ticket className="w-8 h-8 text-brand-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">No bookings yet</h2>
              <p className="text-sm text-slate-500 mt-1 max-w-xs">
                You haven't booked any train tickets yet. Start by searching for a train.
              </p>
            </div>
            <Button
              className="bg-brand-primary hover:bg-brand-hover text-white"
              onClick={() => navigate("/")}
            >
              <Train className="w-4 h-4 mr-1.5" />
              Search Trains
            </Button>
          </div>
        )}

        {/* Booking list */}
        {!isLoading && !isError && data && data.data.length > 0 && (
          <>
            {data.data.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}

            {/* Pagination */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-3.5">
              <PaginationRow
                page={page}
                totalPages={data.meta.totalPages}
                total={total}
                onPageChange={setPage}
              />
            </div>
          </>
        )}

      </div>
    </div>
  );
}
