import { Zap, ShieldCheck, MapPin, Timer } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Real-time Availability",
    description:
      "See live seat counts across all classes — Sleeper, 3AC, 2AC and First Class — updated instantly.",
    accent: "bg-amber-50 text-amber-600",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Reliable",
    description:
      "JWT-based authentication with bcrypt password hashing. Your data is always safe with us.",
    accent: "bg-green-50 text-green-600",
  },
  {
    icon: MapPin,
    title: "Pan-India Network",
    description:
      "62+ major railway stations across all zones — from Amritsar to Thiruvananthapuram, Dibrugarh to Mumbai.",
    accent: "bg-blue-50 text-blue-600",
  },
  {
    icon: Timer,
    title: "5-Minute Seat Hold",
    description:
      "Selected seats are instantly reserved for you via Redis — no one else can grab them while you complete booking.",
    accent: "bg-purple-50 text-purple-600",
  },
];

export function WhyIRCTC() {
  return (
    <section className="py-14 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900">Why Choose IRCTC?</h2>
          <p className="mt-2 text-slate-500 text-sm">
            Built with modern technology for a seamless booking experience
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map(({ icon: Icon, title, description, accent }) => (
            <div
              key={title}
              className="flex gap-4 p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white transition-colors"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
