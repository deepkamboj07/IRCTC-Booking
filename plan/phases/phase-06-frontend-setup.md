# Phase 6 — Frontend Setup

## Goal
Set up the entire frontend foundation:
- Install all dependencies + shadcn
- Configure Tailwind with "Rail Blue" brand tokens
- Build shared utilities: `api.client`, `extractError`, `date.utils`, `useDebounce`, `useAuth`
- Build shared UI primitives: `Field`, `SectionCard`, `DataTable`, `TablePagination`
- Build layouts: `PassengerLayout`, `AdminLayout`, `ProtectedRoute`
- Wire up `main.tsx` (QueryClientProvider + BrowserRouter) and `App.tsx` (route tree)

## Working Directory
All commands from `frontend/`

---

## Step 1 — Install Dependencies

```bash
cd frontend
npm install axios react-router-dom @tanstack/react-query @tanstack/react-query-devtools react-hook-form @hookform/resolvers zod date-fns
```

---

## Step 2 — Initialize shadcn

```bash
npx shadcn@latest init
```

Prompts / answers:
- Style: **New York**
- Base color: **Slate**
- CSS variables: **Yes**

Then add these components:
```bash
npx shadcn@latest add button input select checkbox badge table dialog tabs skeleton calendar popover command separator radio-group alert card textarea switch avatar dropdown-menu sheet tooltip
```

---

## Step 3 — Tailwind Config — Add Brand Tokens

In `tailwind.config.ts`, extend the colors:

```typescript
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary:    "#1E40AF",   // Deep blue — nav, headings, primary buttons
          hover:      "#1E3A8A",   // Darker on hover
          light:      "#EFF6FF",   // Light blue backgrounds, badges
          accent:     "#F97316",   // Orange — CTAs, "Book Now", countdown timer
          accentHov:  "#EA580C",   // Orange hover
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

## Step 4 — Directory Structure to Create

```bash
mkdir -p src/apps/passenger/pages/home
mkdir -p src/apps/passenger/pages/auth
mkdir -p src/apps/passenger/pages/search-results
mkdir -p src/apps/passenger/pages/seat-selection
mkdir -p src/apps/passenger/pages/booking
mkdir -p src/apps/passenger/pages/my-bookings
mkdir -p src/apps/passenger/components/home
mkdir -p src/apps/passenger/components/search-results
mkdir -p src/apps/passenger/components/seat-selection
mkdir -p src/apps/passenger/components/booking
mkdir -p src/apps/admin/pages/dashboard
mkdir -p src/apps/admin/pages/stations
mkdir -p src/apps/admin/pages/trains
mkdir -p src/apps/admin/pages/bookings
mkdir -p src/apps/admin/components/stations
mkdir -p src/apps/admin/components/trains
mkdir -p src/shared/api
mkdir -p src/shared/components/ui
mkdir -p src/shared/components/layout
mkdir -p src/shared/components/station-combobox
mkdir -p src/shared/hooks
mkdir -p src/shared/utils
mkdir -p src/shared/types
```

---

## Step 5 — Shared Utilities

### `src/shared/utils/api.client.ts`
```typescript
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("irtc_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("irtc_token");
      localStorage.removeItem("irtc_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
```

### `src/shared/utils/extractError.ts`
```typescript
import axios from "axios";

export function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? err.message ?? "Request failed";
  }
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred";
}
```

### `src/shared/utils/date.utils.ts`
```typescript
import { format, parseISO } from "date-fns";

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMM yyyy");
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMM yyyy, HH:mm");
}

export function toApiDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
```

---

## Step 6 — Shared Hooks

### `src/shared/hooks/useDebounce.ts`
```typescript
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
```

### `src/shared/hooks/useAuth.ts`
```typescript
import { useState, useCallback } from "react";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "PASSENGER" | "ADMIN";
}

function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("irtc_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);

  const login = useCallback((userData: AuthUser, token: string) => {
    localStorage.setItem("irtc_token", token);
    localStorage.setItem("irtc_user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("irtc_token");
    localStorage.removeItem("irtc_user");
    setUser(null);
  }, []);

  return { user, login, logout, isAuthenticated: !!user };
}
```

---

## Step 7 — Shared UI Primitives

### `src/shared/components/ui/Field.tsx`
```tsx
interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, required, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
```

### `src/shared/components/ui/SectionCard.tsx`
```tsx
interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  overflowVisible?: boolean;
}

export function SectionCard({ title, icon, children, overflowVisible }: SectionCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 ${overflowVisible ? "" : "overflow-hidden"}`}>
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
        {icon && <span className="text-brand-primary">{icon}</span>}
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
```

### `src/shared/components/ui/TablePagination.tsx`
```tsx
import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({ page, totalPages, total, onPageChange }: TablePaginationProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="text-sm text-slate-600">
        {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
```

---

## Step 8 — Layouts

### `src/shared/components/layout/ProtectedRoute.tsx`
```tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface ProtectedRouteProps {
  requiredRole?: "PASSENGER" | "ADMIN";
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/" replace />;

  return <Outlet />;
}
```

### `src/shared/components/layout/PassengerLayout.tsx`
```tsx
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Train, User, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "../../hooks/useAuth";

export function PassengerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-brand-primary text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <Train className="w-5 h-5" />
            IRCTC Booking
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/my-bookings" className="text-sm text-blue-100 hover:text-white">
                  My Bookings
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-brand-hover"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-brand-hover">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-brand-accent hover:bg-brand-accentHov text-white">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

### `src/shared/components/layout/AdminLayout.tsx`
```tsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Train, MapPin, CalendarDays, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const navItems = [
  { to: "/admin",           label: "Dashboard",  icon: LayoutDashboard, exact: true },
  { to: "/admin/stations",  label: "Stations",   icon: MapPin },
  { to: "/admin/trains",    label: "Trains",     icon: Train },
  { to: "/admin/bookings",  label: "Bookings",   icon: CalendarDays },
];

export function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 bg-brand-primary text-white flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 font-bold text-lg border-b border-brand-hover">
          <Train className="w-5 h-5 mr-2" />
          IRCTC Admin
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? "bg-white/20 font-medium" : "text-blue-100 hover:bg-white/10"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="flex items-center gap-2 px-6 py-4 text-sm text-blue-200 hover:text-white border-t border-brand-hover"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 bg-slate-50 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

---

## Step 9 — `src/main.tsx`

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "./index.css";
import App from "./App";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
```

---

## Step 10 — `src/App.tsx` (Route Tree Shell)

```tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { PassengerLayout } from "./shared/components/layout/PassengerLayout";
import { AdminLayout } from "./shared/components/layout/AdminLayout";
import { ProtectedRoute } from "./shared/components/layout/ProtectedRoute";

// Pages wired up in later phases — placeholders for now
const Placeholder = ({ name }: { name: string }) => (
  <div className="p-8 text-slate-600">{name} — coming soon</div>
);

export default function App() {
  return (
    <Routes>
      {/* Passenger app */}
      <Route element={<PassengerLayout />}>
        <Route path="/"               element={<Placeholder name="HomePage" />} />
        <Route path="/search"         element={<Placeholder name="SearchResultsPage" />} />
        <Route path="/login"          element={<Placeholder name="LoginPage" />} />
        <Route path="/register"       element={<Placeholder name="RegisterPage" />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/seats/:scheduleId/:coachId" element={<Placeholder name="SeatSelectionPage" />} />
          <Route path="/booking/form"               element={<Placeholder name="BookingFormPage" />} />
          <Route path="/booking/confirm/:pnr"       element={<Placeholder name="BookingConfirmPage" />} />
          <Route path="/my-bookings"                element={<Placeholder name="MyBookingsPage" />} />
          <Route path="/my-bookings/:id"            element={<Placeholder name="BookingDetailPage" />} />
        </Route>
      </Route>

      {/* Admin app */}
      <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin"           element={<Placeholder name="AdminDashboard" />} />
          <Route path="/admin/stations"  element={<Placeholder name="StationsPage" />} />
          <Route path="/admin/trains"    element={<Placeholder name="TrainsPage" />} />
          <Route path="/admin/bookings"  element={<Placeholder name="AdminBookingsPage" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

---

## Verification Checklist

```bash
cd frontend && npm run dev
```
- Opens on `http://localhost:5173`
- No console errors
- Passenger navbar shows (navy blue, IRCTC Booking logo)
- `/login` shows "LoginPage — coming soon"
- `/admin` redirects to `/login` (ProtectedRoute blocks unauthenticated)
- React Query DevTools button visible (bottom-right corner)

## Gotchas
- shadcn generates `components/ui/` inside `src/` by default — after init, check `components.json` and make sure the path is `src/shared/components/ui` by editing it, or move generated files manually
- `index.css` must import Tailwind layers: `@tailwind base; @tailwind components; @tailwind utilities;`
- The `useAuth` hook reads from `localStorage` — it won't persist across tab sessions if using `sessionStorage`
- `VITE_API_URL` in `.env` must start with `VITE_` to be exposed to the browser bundle
- Import `date-fns` functions individually — don't import the whole library
