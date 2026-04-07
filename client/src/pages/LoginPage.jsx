import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-surface">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-ink-950 text-center">AAU File Management</h1>
        <p className="text-center text-sm text-ink-500 mt-2 mb-10">Sign in with your institutional account</p>
        <form onSubmit={onSubmit} className="space-y-6 border-t border-b border-line py-8">
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">
              Email
            </label>
            <input
              type="email"
              autoComplete="username"
              className="w-full border border-line px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full border border-line px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 text-sm font-semibold bg-accent text-white hover:bg-ink-900 transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
