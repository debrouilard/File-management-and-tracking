import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext.jsx";

export function NotificationBell() {
  const { items, unread, open, setOpen, markRead, markAllRead } = useNotifications();
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [setOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="relative p-1.5 rounded border border-line hover:bg-white text-ink-700"
        aria-label="Notifications"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.109A8.25 8.25 0 005.25 7.5v.109a8.967 8.967 0 00-2.311 6.962 23.848 23.848 0 005.454 1.31m4.714 0a23.877 23.877 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-accent2 text-white text-[10px] leading-[1.1rem] text-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 border border-line bg-white shadow-lg z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-line">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Alerts</p>
            <button
              type="button"
              className="text-xs text-accent hover:underline"
              onClick={() => markAllRead()}
            >
              Mark all read
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto divide-y divide-line">
            {items.length === 0 && (
              <li className="px-3 py-6 text-sm text-ink-500 text-center">No notifications yet</li>
            )}
            {items.slice(0, 20).map((n) => (
              <li key={n.id} className="px-3 py-2 text-sm">
                <button
                  type="button"
                  className={`text-left w-full ${n.read ? "text-ink-500" : "text-ink-900 font-medium"}`}
                  onClick={() => {
                    if (!n.read) markRead(n.id);
                  }}
                >
                  <span className="block">{n.message}</span>
                  <span className="text-xs text-ink-500 mt-0.5">
                    {n.fileId} · {new Date(n.createdAt).toLocaleString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-line px-3 py-2 text-center">
            <Link to="/notifications" className="text-xs text-accent" onClick={() => setOpen(false)}>
              Open full list
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
