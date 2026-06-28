import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ArrowRight,
  Train,
  CalendarDays,
  MapPin,
  Banknote,
  ListOrdered,
  Search,
} from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { Skeleton } from "../../../../shared/components/ui/skeleton";
import { useBookingByPnr } from "../../../../shared/api/bookings.api";
import { formatDate } from "../../../../shared/utils/date.utils";

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
        <div className="max-w-[720px] mx-auto px-8 py-5 animate-pulse space-y-2">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-7 w-56" />
        </div>
      </div>
      <div className="max-w-[720px] mx-auto w-full px-6 py-6 space-y-4 animate-pulse">
        <div className="rounded-2xl overflow-hidden">
          <Skeleton className="h-44 w-full rounded-none" />
          <div className="bg-white border border-t-0 border-slate-200 px-8 py-6 space-y-3 rounded-b-2xl">
            <Skeleton className="h-3 w-20 mx-auto" />
            <Skeleton className="h-10 w-48 mx-auto" />
            <Skeleton className="h-4 w-56 mx-auto" />
          </div>
        </div>
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function BookingConfirmPage() {
  const { pnr = "" } = useParams();
  const navigate = useNavigate();
  const { data: booking, isLoading, isError } = useBookingByPnr(pnr);

  if (isLoading) return <PageSkeleton />;

  if (isError || !booking) {
    return (
      <div className="flex-1 flex flex-col bg-slate-100">
        <div className="max-w-[720px] mx-auto w-full px-6 py-16 text-center">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Train className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-semibold text-slate-700 mb-1">
              Booking not found
            </p>
            <p className="text-sm text-slate-400 mb-6">
              No booking found for PNR: {pnr}
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="mx-auto"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-100">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[720px] mx-auto px-8 py-5">

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
              {pnr}
            </span>
          </nav>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Booking Confirmed
                </h1>
                <p className="text-sm text-slate-500">
                  {booking.schedule.train.name} ·{" "}
                  {formatDate(booking.schedule.journeyDate)}
                </p>
              </div>
            </div>

            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 border border-green-200 px-3 py-1.5 rounded-full flex-shrink-0">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              CONFIRMED
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="max-w-[720px] mx-auto w-full px-6 py-6 space-y-4">

        {/* ── Success hero + PNR ────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden shadow-md">
          {/* Green gradient top */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-8 py-10 text-center text-white">
            <div className="w-16 h-16 rounded-full bg-white/20 border border-white/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-9 h-9 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-1.5">Booking Confirmed!</h2>
            <p className="text-green-100 text-sm">
              Your tickets are booked — see you on the train!
            </p>
          </div>

          {/* PNR */}
          <div className="bg-white border border-t-0 border-green-200 rounded-b-2xl px-8 py-6 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              PNR Number
            </p>
            <p className="font-mono font-bold tracking-[0.2em] text-4xl text-brand-primary">
              {booking.pnr}
            </p>
            <div className="flex items-center justify-center gap-2 mt-3 text-sm text-slate-500">
              <span className="font-medium text-slate-700">
                {booking.fromStation.code}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-brand-accent" />
              <span className="font-medium text-slate-700">
                {booking.toStation.code}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>{formatDate(booking.schedule.journeyDate)}</span>
            </div>
          </div>
        </div>

        {/* ── Journey details ───────────────────────────────────────────────── */}
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
                  ₹{booking.totalFare}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Status</p>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  {booking.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Passenger table ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Passengers
            </p>
            <span className="text-xs text-slate-500 tabular-nums">
              {booking.passengers.length} seat{booking.passengers.length !== 1 ? "s" : ""}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase tracking-wide">
                <th className="px-6 py-3 text-left font-semibold w-8">#</th>
                <th className="px-6 py-3 text-left font-semibold">Name</th>
                <th className="px-6 py-3 text-left font-semibold">Age</th>
                <th className="px-6 py-3 text-left font-semibold">Gender</th>
                <th className="px-6 py-3 text-left font-semibold">Seat</th>
                <th className="px-6 py-3 text-left font-semibold">Berth</th>
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
                  <td className="px-6 py-3.5 text-slate-500 capitalize">
                    {p.gender.charAt(0) + p.gender.slice(1).toLowerCase()}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-mono font-bold text-brand-primary tabular-nums">
                      #{p.seat.seatNumber}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        BERTH_STYLE[p.seat.berthType] ?? "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {BERTH_LABELS[p.seat.berthType] ?? p.seat.berthType}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-4 flex items-center gap-3">
          <Button
            className="bg-brand-primary hover:bg-brand-hover text-white h-10"
            onClick={() => navigate("/my-bookings")}
          >
            <ListOrdered className="w-4 h-4 mr-2" />
            View My Bookings
          </Button>
          <Button
            variant="outline"
            className="h-10"
            onClick={() => navigate("/")}
          >
            <Search className="w-4 h-4 mr-2" />
            Book Another Train
          </Button>
        </div>

      </div>
    </div>
  );
}
