import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Train, MapPin, CalendarDays, LayoutDashboard, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const navItems = [
  { to: "/admin",          label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/stations", label: "Stations",  icon: MapPin },
  { to: "/admin/trains",   label: "Trains",    icon: Train },
  { to: "/admin/bookings", label: "Bookings",  icon: CalendarDays },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 bg-brand-primary text-white flex flex-col flex-shrink-0 shadow-xl">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 gap-2.5 border-b border-white/15">
          <div className="bg-white/20 rounded-lg p-1.5">
            <Train className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight">IRCTC Admin</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-5 px-3 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-white/15 p-3">
          {user && (
            <div className="px-3 py-2 mb-1">
              <p className="text-xs font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-blue-200 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 bg-slate-50 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
