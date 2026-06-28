import { ChevronDown } from "lucide-react";
import { SearchForm }      from "../../components/home/SearchForm";
import { StatsBar }        from "../../components/home/StatsBar";
import { PopularRoutes }   from "../../components/home/PopularRoutes";
import { HowItWorks }      from "../../components/home/HowItWorks";
import { WhyIRCTC }         from "../../components/home/WhyIRCTC";
import heroImageTrain from "../../../../assets/train.jpg";

export function HomePage() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden bg-cover bg-center bg-no-repeat flex items-center min-h-[78vh]"
        style={{ backgroundImage: `url(${heroImageTrain})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/60 to-blue-900/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />

        <div className="relative z-10 w-full px-4 py-16 text-white">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-1 text-sm font-medium">
              🚆 India's Trusted Railway Booking
            </span>
            <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight">
              Book Train Tickets
            </h1>
            <p className="mt-4 text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
              Fast, secure and reliable railway ticket booking with real-time
              availability and instant confirmation.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <SearchForm />
          </div>

          {/* Scroll hint */}
          <div className="flex justify-center mt-10">
            <div className="flex flex-col items-center gap-1 text-white/40 text-xs animate-bounce">
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Below-fold content ───────────────────────────────────────────── */}
      <StatsBar />
      <PopularRoutes />
      <HowItWorks />
      <WhyIRCTC />
    </div>
  );
}
