import { Link, Outlet, useNavigate } from "react-router-dom";
import { Train, LogOut, Ticket } from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "../../hooks/useAuth";
import { ChatWidget } from "../chat/ChatWidget";

export function PassengerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-brand-primary text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity"
          >
            <div className="bg-white/20 rounded-lg p-1.5">
              <Train className="w-5 h-5" />
            </div>
            IRCTC Booking
          </Link>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/my-bookings"
                  className="flex items-center gap-1.5 text-sm text-blue-100 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
                >
                  <Ticket className="w-4 h-4" />
                  My Bookings
                </Link>
                <div className="h-5 w-px bg-white/20" />
                <span className="text-sm text-blue-100 hidden sm:block">
                  {user.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/15 hover:text-white gap-1.5"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/15 hover:text-white"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="sm"
                    className="bg-brand-accent hover:bg-brand-accent-hov text-white font-semibold shadow-sm"
                  >
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-brand-primary/5 border-t border-slate-200 py-6 h-[calc(4rem+1px)] flex items-center justify-center">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} IRCTC Booking. All rights reserved.
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
