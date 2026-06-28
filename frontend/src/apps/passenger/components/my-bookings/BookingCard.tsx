import { useNavigate } from "react-router-dom";
import { Train, ArrowRight, ChevronRight, Users, CalendarDays } from "lucide-react";
import type { Booking } from "../../../../shared/api/bookings.api";
import { formatDate } from "../../../../shared/utils/date.utils";
import { BookingStatusBadge } from "./BookingStatusBadge";

const ACCENT: Record<string, string> = {
  CONFIRMED:  "bg-green-500",
  CANCELLED:  "bg-red-400",
  PENDING:    "bg-amber-400",
  WAITLISTED: "bg-blue-400",
};

interface BookingCardProps {
  booking: Booking;
}

export function BookingCard({ booking }: BookingCardProps) {
  const navigate = useNavigate();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/my-bookings/${booking.id}`)}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/my-bookings/${booking.id}`)}
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-brand-primary/40 hover:shadow-md cursor-pointer transition-all group"
    >
      <div className="flex">
        {/* Status-coloured left accent */}
        <div
          className={`w-1 flex-shrink-0 ${ACCENT[booking.status] ?? "bg-slate-300"}`}
        />

        <div className="flex-1 px-5 py-4">
          {/* Row 1: PNR + status + chevron */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                PNR
              </p>
              <p className="font-mono font-bold tracking-widest text-brand-primary text-xl leading-none">
                {booking.pnr}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <BookingStatusBadge status={booking.status} />
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-primary transition-colors" />
            </div>
          </div>

          {/* Row 2: train */}
          <div className="flex items-center gap-2 mt-3">
            <div className="bg-brand-primary/10 rounded-md p-1 flex-shrink-0">
              <Train className="w-3.5 h-3.5 text-brand-primary" />
            </div>
            <span className="font-semibold text-slate-800 text-sm truncate">
              {booking.schedule.train.name}
            </span>
            <span className="text-slate-400 text-xs font-mono flex-shrink-0">
              #{booking.schedule.train.trainNumber}
            </span>
          </div>

          {/* Row 3: route + date */}
          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="font-bold text-slate-700">{booking.fromStation.code}</span>
            <ArrowRight className="w-3.5 h-3.5 text-brand-accent flex-shrink-0" />
            <span className="font-bold text-slate-700">{booking.toStation.code}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
            <span className="flex items-center gap-1 text-slate-500">
              <CalendarDays className="w-3.5 h-3.5" />
              {formatDate(booking.schedule.journeyDate)}
            </span>
          </div>

          {/* Row 4: fare + passengers */}
          <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Fare
              </p>
              <p className="font-bold text-brand-primary text-base mt-0.5">
                ₹{Number(booking.totalFare).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>
                {booking.passengers.length}{" "}
                {booking.passengers.length === 1 ? "passenger" : "passengers"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
