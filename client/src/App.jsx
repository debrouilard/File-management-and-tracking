import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { FileTrackingPage } from "./pages/FileTrackingPage.jsx";
import { FileUploadPage } from "./pages/FileUploadPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { NotificationsPage } from "./pages/NotificationsPage.jsx";
import { SearchPage } from "./pages/SearchPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/files/new" element={<FileUploadPage />} />
        <Route path="/files/:id" element={<FileTrackingPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
