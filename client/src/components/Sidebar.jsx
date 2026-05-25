import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function itemCls({ isActive }) {
  const base =
    "flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium rounded-md transition-colors";
  const normal = "text-white hover:bg-brand-hover hover:text-[#222222]";
  const active = "bg-brand-hover text-[#222222]";
  return [base, isActive ? active : normal].join(" ");
}

function Icon({ name }) {
  const cls = "w-4 h-4";
  if (name === "dashboard")
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5h8.25V3H3v10.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 21H21V10.5h-8.25V21z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3H21v6h-8.25V3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15h8.25v6H3v-6z" />
      </svg>
    );
  if (name === "documents")
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5A3.375 3.375 0 0010.125 2.25H8.25A2.25 2.25 0 006 4.5v15A2.25 2.25 0 008.25 21.75h7.5A2.25 2.25 0 0018 19.5v-.75"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 13.5h6.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5h3.75" />
      </svg>
    );
  if (name === "reports")
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5V4.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 16.5l3-3 2.25 2.25 5.25-6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 19.5H4.5" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a3.75 3.75 0 110 7.5 3.75 3.75 0 010-7.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 20.25a7.5 7.5 0 00-15 0" />
    </svg>
  );
}

export function Sidebar({ topOffsetPx = 0 }) {
  const { user } = useAuth();

  return (
    <aside
      className="fixed left-0 w-[240px] bg-brand-sidebar text-white"
      style={{ top: topOffsetPx, height: `calc(100vh - ${topOffsetPx}px)` }}
    >
      <div className="px-4 pt-5 pb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Quick Menu</p>
      </div>
      <nav className="px-3 pb-4 space-y-1">
        <NavLink to="/dashboard" className={itemCls}>
          <Icon name="dashboard" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/documents" className={itemCls}>
          <Icon name="documents" />
          <span>Documents</span>
        </NavLink>
        <NavLink to="/reports" className={itemCls}>
          <Icon name="reports" />
          <span>Reports</span>
        </NavLink>
        {user?.role === "ADMIN" && (
          <NavLink to="/admin" className={itemCls}>
            <Icon name="admin" />
            <span>Admin Dashboard</span>
          </NavLink>
        )}
      </nav>
    </aside>
  );
}

