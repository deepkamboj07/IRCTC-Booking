import { Train, MapPin } from "lucide-react";
import { LoginForm } from "../../components/auth/LoginForm";
import trainImage from "../../../../assets/train.jpg";

const stats = [
  { label: "Train routes",     value: "500+" },
  { label: "Cities connected", value: "200+" },
  { label: "Daily passengers", value: "10M+" },
  { label: "On-time rate",     value: "94%"  },
];

export function LoginPage() {
  return (
    <div className="flex-1 grid lg:grid-cols-2">
      {/* Left — train image panel */}
      <div
        className="hidden lg:flex flex-col justify-between text-white p-12 relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${trainImage})` }}
      >
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-blue-900/80 to-slate-900/75" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1.5 border border-white/20">
            <Train className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">IRCTC Booking</span>
        </div>

        {/* Hero copy + stats */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold leading-tight drop-shadow-sm">
              Travel smarter<br />across India.
            </h2>
            <p className="text-blue-100/90 text-lg leading-relaxed max-w-sm">
              Book confirmed train tickets, check real-time seat availability,
              and manage all your journeys in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {stats.map(({ label, value }) => (
              <div
                key={label}
                className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3.5 border border-white/15"
              >
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-blue-200 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer line */}
        <div className="relative z-10 flex items-center gap-2 text-blue-200/80 text-sm">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          Serving the entire Indian railway network
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo — only visible on small screens */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="bg-brand-primary rounded-lg p-1.5">
              <Train className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-brand-primary">IRCTC Booking</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="mb-7 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-light mb-4">
                <Train className="w-6 h-6 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
              <p className="text-sm text-slate-500 mt-1.5">
                Sign in to access your bookings
              </p>
            </div>
            <LoginForm />
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            By signing in you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
