import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function ProtectedRoute({ children, adminOnly }) {
  const { isAuthenticated, user } = useAuth();
  const loc = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }

  if (user?.mustResetPassword && loc.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (!user?.mustResetPassword && loc.pathname === "/change-password") {
    return <Navigate to="/dashboard" replace />;
  }

  if (adminOnly && user?.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
