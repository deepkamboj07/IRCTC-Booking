import { Routes, Route, Navigate } from "react-router-dom";
import { PassengerLayout } from "./shared/components/layout/PassengerLayout";
import { AdminLayout } from "./shared/components/layout/AdminLayout";
import { ProtectedRoute } from "./shared/components/layout/ProtectedRoute";
import { LoginPage }           from "./apps/passenger/pages/auth/LoginPage";
import { RegisterPage }        from "./apps/passenger/pages/auth/RegisterPage";
import { HomePage }            from "./apps/passenger/pages/home/HomePage";
import { SearchResultsPage }   from "./apps/passenger/pages/search-results/SearchResultsPage";
import { SeatSelectionPage }   from "./apps/passenger/pages/seat-selection/SeatSelectionPage";
import { BookingFormPage }     from "./apps/passenger/pages/booking/BookingFormPage";
import { BookingConfirmPage }  from "./apps/passenger/pages/booking/BookingConfirmPage";
import { MyBookingsPage }      from "./apps/passenger/pages/my-bookings/MyBookingsPage";
import { BookingDetailPage }   from "./apps/passenger/pages/my-bookings/BookingDetailPage";

function Placeholder({ name }: { name: string }) {
  return (
    <div className="p-8 text-slate-500 text-sm">
      <span className="font-mono bg-slate-100 rounded px-2 py-1">{name}</span>
      {" "}— coming soon
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Passenger app */}
      <Route element={<PassengerLayout />}>
        <Route path="/"         element={<HomePage />} />
        <Route path="/search"   element={<SearchResultsPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/seats/:scheduleId/:coachId"  element={<SeatSelectionPage />} />
          <Route path="/booking/form"                element={<BookingFormPage />} />
          <Route path="/booking/confirm/:pnr"        element={<BookingConfirmPage />} />
          <Route path="/my-bookings"                 element={<MyBookingsPage />} />
          <Route path="/my-bookings/:id"             element={<BookingDetailPage />} />
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
