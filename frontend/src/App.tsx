import { Navigate, Route, Routes } from "react-router-dom";

import { getToken } from "./api/auth";
import { AppointmentDetailsPage } from "./pages/AppointmentDetailsPage";
import { CalendarPage } from "./pages/CalendarPage";
import { LoginPage } from "./pages/LoginPage";
import { MastersPage } from "./pages/MastersPage";
import { NewAppointmentPage } from "./pages/NewAppointmentPage";
import { TodayPage } from "./pages/TodayPage";
import { EditAppointmentPage } from "./pages/EditAppointmentPage";
import { ClientDetailsPage } from "./pages/ClientDetailsPage";
import { ClientsPage } from "./pages/ClientsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { MorePage } from "./pages/MorePage";
import { RequestsPage } from "./pages/RequestsPage";
import { NewRequestPage } from "./pages/NewRequestPage";

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
  path="/profile"
  element={
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  }
/>

<Route
  path="/more"
  element={
    <ProtectedRoute>
      <MorePage />
    </ProtectedRoute>
  }
/>

<Route
  path="/requests"
  element={
    <ProtectedRoute>
      <RequestsPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/requests/new"
  element={
    <ProtectedRoute>
      <NewRequestPage />
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
  path="/clients"
  element={
    <ProtectedRoute>
      <ClientsPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/clients/:id"
  element={
    <ProtectedRoute>
      <ClientDetailsPage />
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