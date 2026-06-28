import { Train, Ticket, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { RegisterForm } from "../../components/auth/RegisterForm";
import trainImage from "../../../../assets/train.jpg";

const perks = [
  { icon: Ticket,      title: "Instant confirmation",  desc: "Get your PNR in seconds"         },
  { icon: Clock,       title: "5-min seat hold",       desc: "Reserve while you fill details"  },
  { icon: ShieldCheck, title: "Safe & encrypted",       desc: "Your data is always protected"  },
  { icon: Sparkles,    title: "Free to use",            desc: "No booking fees for members"    },
];

export function RegisterPage() {
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

        {/* Hero copy + perks */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold leading-tight drop-shadow-sm">
              Your journey<br />starts here.
            </h2>
            <p className="text-blue-100/90 text-lg leading-relaxed max-w-sm">
              Create a free account and book train tickets to any destination
              across India in under 2 minutes.
            </p>
          </div>

          <div className="space-y-3">
            {perks.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/15 flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-blue-200/80">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer line */}
        <p className="relative z-10 text-xs text-blue-300/70">
          Free to create · No booking fee for account holders
        </p>
      </div>

      {/* Right — form panel */}
      <div className="flex items-center justify-center p-6 bg-white overflow-y-auto">
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
              <h1 className="text-2xl font-bold text-slate-900">Create an account</h1>
              <p className="text-sm text-slate-500 mt-1.5">
                Book train tickets across India
              </p>
            </div>
            <RegisterForm />
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            By registering you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
