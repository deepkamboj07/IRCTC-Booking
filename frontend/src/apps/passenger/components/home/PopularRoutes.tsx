import { useNavigate } from "react-router-dom";
import { ArrowRight, TrendingUp } from "lucide-react";
import { toApiDate } from "../../../../shared/utils/date.utils";

const ROUTES = [
  { from: "NDLS", fromName: "New Delhi",        to: "CSMT", toName: "Mumbai CSMT",      trains: 2 },
  { from: "NDLS", fromName: "New Delhi",        to: "HWH",  toName: "Howrah",           trains: 2 },
  { from: "NZM",  fromName: "Hazrat Nizamuddin",to: "MAS",  toName: "Chennai Central",  trains: 1 },
  { from: "NDLS", fromName: "New Delhi",        to: "SBC",  toName: "KSR Bengaluru",    trains: 1 },
  { from: "HWH",  fromName: "Howrah",           to: "MAS",  toName: "Chennai Central",  trains: 1 },
  { from: "CSMT", fromName: "Mumbai CSMT",      to: "AMR",  toName: "Amritsar",         trains: 2 },
  { from: "CSMT", fromName: "Mumbai CSMT",      to: "PUNE", toName: "Pune",             trains: 1 },
  { from: "NDLS", fromName: "New Delhi",        to: "GHY",  toName: "Guwahati",         trains: 1 },
];

export function PopularRoutes() {
  const navigate = useNavigate();
  const today = toApiDate(new Date());

  return (
    <section className="py-14 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Popular Routes</h2>
            <p className="text-sm text-slate-500">Click to see today's availability</p>
          </div>
        </div>

        {/* Route grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ROUTES.map((r) => (
            <button
              key={`${r.from}-${r.to}`}
              onClick={() =>
                navigate(`/search?from=${r.from}&to=${r.to}&date=${today}`)
              }
              className="group text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-primary hover:shadow-md transition-all duration-200"
            >
              {/* Station pair */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{r.from}</p>
                  <p className="text-xs text-slate-400 truncate">{r.fromName}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-brand-primary flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                <div className="flex-1 min-w-0 text-right">
                  <p className="font-bold text-slate-800 text-sm truncate">{r.to}</p>
                  <p className="text-xs text-slate-400 truncate">{r.toName}</p>
                </div>
              </div>

              {/* Train count badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs bg-brand-light text-brand-primary font-semibold px-2 py-0.5 rounded-full">
                  {r.trains} {r.trains === 1 ? "train" : "trains"}
                </span>
                <span className="text-xs text-slate-400 group-hover:text-brand-primary transition-colors">
                  Check →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
