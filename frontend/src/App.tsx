import { Navigate, Route, Routes } from "react-router-dom";

import { getToken } from "./api/auth";
import { AppointmentDetailsPage } from "./pages/AppointmentDetailsPage";
import { CalendarPage } from "./pages/CalendarPage";
import { LoginPage } from "./pages/LoginPage";
import { MastersPage } from "./pages/MastersPage";
import { NewAppointmentPage } from "./pages/NewAppointmentPage";
import { TodayPage } from "./pages/TodayPage";
import { EditAppointmentPage } from "./pages/EditAppointmentPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/today"
        element={
          <ProtectedRoute>
            <TodayPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/appointments/new"
        element={
          <ProtectedRoute>
            <NewAppointmentPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/appointments/:id"
        element={
          <ProtectedRoute>
            <AppointmentDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
  path="/appointments/:id/edit"
  element={
    <ProtectedRoute>
      <EditAppointmentPage />
    </ProtectedRoute>
  }
/>
      <Route
        path="/masters"
        element={
          <ProtectedRoute>
            <MastersPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  );
}