import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";

const BRAND_BAR = "h-1.5 w-full bg-gradient-to-r from-brand-headerFrom to-brand-headerTo shrink-0";
const INPUT_ROW =
  "flex rounded-md border border-ink-300 overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-accent/25 focus-within:border-accent transition-shadow duration-200";

function IconBox({ children }) {
  return (
    <div
      className="w-12 shrink-0 min-h-[44px] bg-[#f0f2f4] grid place-items-center border-r border-ink-300"
      aria-hidden
    >
      {children}
    </div>
  );
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

function ForgotPasswordModal({ open, onClose }) {
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIdentifier("");
    setError("");
    setDone(false);
    setBusy(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: identifier.trim() }),
      });
      setDone(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-white rounded-lg border border-line shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={BRAND_BAR} />
        <div className="p-6">
          <h2 id="forgot-title" className="font-display text-xl text-accent">
            Reset password
          </h2>
          <p className="text-sm text-ink-500 mt-2 leading-relaxed">
            Enter the email address or username associated with your account. An administrator will review your request
            and set a temporary password.
          </p>

          {done ? (
            <div className="mt-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
              If an account matches your details, your request was submitted. Please contact your administrator if you
              need urgent access.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {error && (
                <p className="text-sm text-red-700 rounded-md border border-red-200 bg-red-50 px-3 py-2">{error}</p>
              )}
              <div>
                <label htmlFor="forgot-identifier" className="block text-xs font-medium text-ink-500 mb-1.5">
                  Email or username
                </label>
                <input
                  id="forgot-identifier"
                  type="text"
                  autoComplete="username"
                  className="w-full rounded-md border border-ink-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-shadow"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  minLength={3}
                  maxLength={254}
                  disabled={busy}
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2.5 text-sm font-medium text-ink-700 border border-line rounded-md hover:bg-surface transition-colors"
                  onClick={onClose}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2.5 text-sm font-semibold rounded-md bg-accent text-white hover:brightness-95 transition-all disabled:opacity-50"
                >
                  {busy ? "Submitting…" : "Submit request"}
                </button>
              </div>
            </form>
          )}

          {done && (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="px-4 py-2.5 text-sm font-semibold rounded-md bg-accent text-white hover:brightness-95 transition-colors"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);

  if (isAuthenticated) {
    const to = loc.state?.from?.pathname || "/dashboard";
    return <Navigate to={to} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await login(email.trim(), password);
      nav(loc.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-10 bg-surface">
      <div className="w-full max-w-[420px] bg-white rounded-lg border border-line shadow-md overflow-hidden transition-shadow hover:shadow-lg">
        <div className={BRAND_BAR} />
        <div className="px-6 sm:px-8 pt-8 pb-10">
          <h1 className="font-display text-[1.65rem] sm:text-[1.75rem] leading-snug text-accent tracking-tight">
            Login to your account
          </h1>
          <p className="text-xs text-ink-500 mt-2 font-sans">AAU Document Management System</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5 text-left">
            {error && (
              <p className="text-sm text-red-700 rounded-md border border-red-200 bg-red-50 px-3 py-2" role="alert">
                {error}
              </p>
            )}

            <div className={INPUT_ROW}>
              <IconBox>
                <PersonIcon />
              </IconBox>
              <input
                type="email"
                name="username"
                autoComplete="username"
                inputMode="email"
                placeholder="User name"
                className="flex-1 min-w-0 px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 bg-white focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={INPUT_ROW}>
              <IconBox>
                <LockIcon />
              </IconBox>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                className="flex-1 min-w-0 px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 bg-white focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 text-sm font-semibold rounded-md bg-accent text-white shadow-sm hover:brightness-[0.97] active:brightness-95 transition-all duration-200"
            >
              Login
            </button>
          </form>

          <div className="mt-4 text-left">
            <button
              type="button"
              className="font-display text-sm text-ink-500 hover:text-accent underline-offset-4 hover:underline transition-colors duration-200"
              onClick={() => setForgotOpen(true)}
            >
              Forgot Password?
            </button>
          </div>
        </div>
      </div>

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
}
