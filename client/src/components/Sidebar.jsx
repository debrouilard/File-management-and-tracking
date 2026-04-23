import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function itemCls({ isActive }) {
  const base = "block px-4 py-3 text-sm font-medium transition-colors";
  const hover = "hover:bg-brand-hover hover:text-[#222222]";
  const normal = "text-white";
  const active = "bg-brand-hover text-[#222222]";
  return [base, hover, isActive ? active : normal].join(" ");
}

export function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="bg-brand-sidebar min-h-[calc(100vh-104px)]">
      <nav className="py-4">
        <NavLink to="/dashboard" className={itemCls}>
          Dashboard
        </NavLink>
        <NavLink to="/documents" className={itemCls}>
          Documents
        </NavLink>
        <NavLink to="/reports" className={itemCls}>
          Reports
        </NavLink>
        {user?.role === "ADMIN" && (
          <NavLink to="/admin" className={itemCls}>
            Admin Dashboard
          </NavLink>
        )}
      </nav>
    </aside>
  );
}

