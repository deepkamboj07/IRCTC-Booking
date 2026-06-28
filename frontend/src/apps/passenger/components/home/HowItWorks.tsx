import { Search, LayoutGrid, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    step: "01",
    title: "Search Trains",
    description:
      "Enter your origin, destination and journey date. We'll show you all available trains with live seat counts.",
  },
  {
    icon: LayoutGrid,
    step: "02",
    title: "Pick Your Seat",
    description:
      "Choose your preferred class and select seats from the interactive coach seat map. Seats are held for 5 minutes.",
  },
  {
    icon: CheckCircle2,
    step: "03",
    title: "Confirm & Go",
    description:
      "Fill in passenger details and confirm your booking. Get your PNR instantly and you're all set to travel.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-14 bg-brand-light">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900">How It Works</h2>
          <p className="mt-2 text-slate-500 text-sm">Book your train ticket in three simple steps</p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-10 left-[22%] right-[22%] h-px bg-brand-primary/20" />

          {STEPS.map(({ icon: Icon, step, title, description }) => (
            <div key={step} className="flex flex-col items-center text-center relative">
              {/* Icon circle */}
              <div className="w-20 h-20 rounded-full bg-brand-primary flex flex-col items-center justify-center shadow-lg shadow-brand-primary/20 relative z-10 mb-4">
                <Icon className="w-7 h-7 text-white" />
              </div>

              {/* Step number */}
              <span className="text-xs font-bold text-brand-primary/60 tracking-widest uppercase mb-1">
                Step {step}
              </span>

              <h3 className="font-bold text-slate-900 text-base mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
