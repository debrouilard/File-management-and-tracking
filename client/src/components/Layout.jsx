import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { NotificationBell } from "./NotificationBell.jsx";

function navCls({ isActive }) {
  return [
    "text-sm font-medium border-b-2 pb-1 transition-colors",
    isActive ? "border-accent text-ink-900" : "border-transparent text-ink-500 hover:text-ink-900",
  ].join(" ");
}

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-xl text-ink-950 tracking-tight">AAU File Management</p>
            <p className="text-xs text-ink-500 mt-0.5">School document exchange & tracking</p>
          </div>
          <nav className="flex flex-wrap items-center gap-6">
            <NavLink to="/dashboard" className={navCls}>
              Dashboard
            </NavLink>
            <NavLink to="/files/new" className={navCls}>
              New file
            </NavLink>
            <NavLink to="/search" className={navCls}>
              Search
            </NavLink>
            <NavLink to="/notifications" className={navCls}>
              Notifications
            </NavLink>
            {user?.role === "ADMIN" && (
              <NavLink to="/admin" className={navCls}>
                Admin
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="text-right text-xs leading-tight">
              <p className="font-medium text-ink-900">{user?.name}</p>
              <p className="text-ink-500">{user?.department?.prefix}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="text-xs font-medium text-ink-500 hover:text-accent2 underline-offset-2 hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        <Outlet />
      </main>
      <footer className="border-t border-line py-6 text-center text-xs text-ink-500">
        <Link to="/dashboard" className="hover:text-ink-700">
          AAU File Management
        </Link>
        <span className="mx-2">·</span>
        <span>Internal use</span>
      </footer>
    </div>
  );
}
