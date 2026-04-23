import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export function ChangePasswordPage() {
  const { applySession, user } = useAuth();
  const nav = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      applySession(res);
      nav("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Could not update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-surface">
      <div className="w-full max-w-md">
        <h1 className="font-display text-2xl text-ink-950 text-center">Set a new password</h1>
        <p className="text-center text-sm text-ink-500 mt-2 mb-8">
          {user?.mustResetPassword
            ? "Your administrator requires you to change your password before continuing."
            : "Update your password."}
        </p>
        <form onSubmit={onSubmit} className="space-y-6 border-t border-b border-line py-8">
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">
              Current password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full border border-line px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">
              New password (min 8 characters)
            </label>
            <input
              type="password"
              autoComplete="new-password"
              className="w-full border border-line px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-semibold bg-accent text-white hover:bg-ink-900 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save and continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
