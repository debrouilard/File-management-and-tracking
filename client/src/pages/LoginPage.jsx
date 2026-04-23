import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function IconBox({ children }) {
  return <div className="w-12 h-11 bg-[#E5E7EB] grid place-items-center border-r border-line">{children}</div>;
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-ink-700" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a7.5 7.5 0 0115 0" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-ink-700" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V7.875a4.5 4.5 0 10-9 0V10.5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 10.5h10.5a1.5 1.5 0 011.5 1.5v6.75a1.5 1.5 0 01-1.5 1.5H6.75a1.5 1.5 0 01-1.5-1.5V12a1.5 1.5 0 011.5-1.5z"
      />
    </svg>
  );
}

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (isAuthenticated) {
    const to = loc.state?.from?.pathname || "/dashboard";
    return <Navigate to={to} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      nav(loc.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-6 bg-surface">
      <div className="w-full max-w-md bg-white border border-line">
        <div className="h-2 bg-[#1E3A5F]" />
        <div className="p-6">
          <h1 className="text-lg font-semibold text-ink-950 text-center">AAU Document Management System</h1>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {error && <p className="text-sm text-red-700">{error}</p>}

            <div>
              <label className="block text-xs text-ink-500 mb-1">User ID</label>
              <div className="flex border border-line">
                <IconBox>
                  <PersonIcon />
                </IconBox>
                <input
                  type="text"
                  autoComplete="username"
                  className="flex-1 px-3 py-2 text-sm focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-ink-500 mb-1">Password</label>
              <div className="flex border border-line">
                <IconBox>
                  <LockIcon />
                </IconBox>
                <input
                  type="password"
                  autoComplete="current-password"
                  className="flex-1 px-3 py-2 text-sm focus:outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                className="text-xs text-ink-700 underline-offset-2 hover:underline"
                onClick={() => setError("Please contact your department administrator to reset your password.")}
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="w-full py-2.5 text-sm font-semibold bg-[#1E3A5F] text-white">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
