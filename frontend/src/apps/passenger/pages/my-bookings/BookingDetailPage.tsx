import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Train,
  CalendarDays,
  MapPin,
  Banknote,
  Clock,
  XCircle,
} from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { Skeleton } from "../../../../shared/components/ui/skeleton";
import { useBooking } from "../../../../shared/api/bookings.api";
import { formatDate } from "../../../../shared/utils/date.utils";
import { BookingStatusBadge } from "../../components/my-bookings/BookingStatusBadge";
import { CancelBookingDialog } from "../../components/my-bookings/CancelBookingDialog";

// ─── Constants ────────────────────────────────────────────────────────────────

const BERTH_LABELS: Record<string, string> = {
  LOWER:      "Lower",
  MIDDLE:     "Middle",
  UPPER:      "Upper",
  SIDE_LOWER: "Side Lower",
  SIDE_UPPER: "Side Upper",
};

const BERTH_STYLE: Record<string, string> = {
  LOWER:      "bg-green-50 text-green-700 border-green-200",
  MIDDLE:     "bg-amber-50 text-amber-700 border-amber-200",
  UPPER:      "bg-blue-50 text-blue-700 border-blue-200",
  SIDE_LOWER: "bg-orange-50 text-orange-700 border-orange-200",
  SIDE_UPPER: "bg-slate-100 text-slate-600 border-slate-200",
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-slate-100">
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[760px] mx-auto px-8 py-5 animate-pulse space-y-3">
          <Skeleton className="h-3 w-48" />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-44" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
        </div>
      </div>
      <div className="max-w-[760px] mx-auto w-full px-6 py-6 space-y-4 animate-pulse">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function BookingDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: booking, isLoading, isError } = useBooking(id);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (isLoading) return <PageSkeleton />;

  if (isError || !booking) {
    return (
      <div className="flex-1 flex flex-col bg-slate-100">
        <div className="max-w-[760px] mx-auto w-full px-6 py-16 text-center">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Train className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-semibold text-slate-700 mb-1">Booking not found</p>
            <p className="text-sm text-slate-400 mb-6">
              This booking doesn't exist or you don't have access to it.
            </p>
            <Button variant="outline" onClick={() => navigate("/my-bookings")}>
              Back to My Bookings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const canCancel = booking.status === "CONFIRMED";

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
            <button
              onClick={() => navigate("/my-bookings")}
              className="hover:text-brand-primary transition-colors"
            >
              My Bookings
            </button>
            <span>/</span>
            <span className="text-slate-700 font-mono font-semibold tracking-wider">
              {booking.pnr}
            </span>
          </nav>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                PNR Number
              </p>
              <p className="font-mono font-bold tracking-[0.15em] text-3xl text-brand-primary leading-none">
                {booking.pnr}
              </p>
              <p className="text-sm text-slate-500 mt-1.5">
                {booking.schedule.train.name} ·{" "}
                {formatDate(booking.schedule.journeyDate)}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <BookingStatusBadge status={booking.status} />
              {canCancel && (
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-9"
                  onClick={() => setCancelOpen(true)}
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="max-w-[760px] mx-auto w-full px-6 py-6 space-y-4">

        {/* Journey details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Journey Details
            </p>
          </div>
          <div className="p-6 grid grid-cols-2 gap-x-8 gap-y-5 text-sm">

            <div className="flex items-start gap-2.5">
              <Train className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Train</p>
                <p className="font-semibold text-slate-800">
                  {booking.schedule.train.name}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  #{booking.schedule.train.trainNumber}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CalendarDays className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Journey Date</p>
                <p className="font-semibold text-slate-800">
                  {formatDate(booking.schedule.journeyDate)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 mb-0.5">From</p>
                <p className="font-semibold text-slate-800">
                  {booking.fromStation.name}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {booking.fromStation.code}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-brand-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 mb-0.5">To</p>
                <p className="font-semibold text-slate-800">
                  {booking.toStation.name}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {booking.toStation.code}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Banknote className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Total Fare</p>
                <p className="text-xl font-bold text-brand-primary">
                  ₹{Number(booking.totalFare).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Booked On</p>
                <p className="font-semibold text-slate-800">
                  {formatDate(booking.createdAt)}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Passengers table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Passengers
            </p>
            <span className="text-xs text-slate-500 tabular-nums">
              {booking.passengers.length} seat{booking.passengers.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase tracking-wide">
                  <th className="px-6 py-3 text-left font-semibold w-8">#</th>
                  <th className="px-6 py-3 text-left font-semibold">Name</th>
                  <th className="px-6 py-3 text-left font-semibold">Age</th>
                  <th className="px-6 py-3 text-left font-semibold">Gender</th>
                  <th className="px-6 py-3 text-left font-semibold">Seat</th>
                  <th className="px-6 py-3 text-left font-semibold">Berth</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {booking.passengers.map((p, i) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-500">
                          {i + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-800">
                      {p.name}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 tabular-nums">
                      {p.age}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {p.gender.charAt(0) + p.gender.slice(1).toLowerCase()}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-mono font-bold text-brand-primary tabular-nums">
                        #{p.seat?.seatNumber ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          BERTH_STYLE[p.seat?.berthType ?? ""] ??
                          "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {BERTH_LABELS[p.seat?.berthType ?? ""] ??
                          p.seat?.berthType ??
                          "—"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <BookingStatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Back action */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-4 flex items-center gap-3">
          <Button
            variant="outline"
            className="h-10"
            onClick={() => navigate("/my-bookings")}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to My Bookings
          </Button>
        </div>

      </div>

      {/* Cancel dialog */}
      <CancelBookingDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        bookingId={booking.id}
        pnr={booking.pnr}
        onSuccess={() => navigate("/my-bookings")}
      />
    </div>
  );
}
