import { Link } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext.jsx";

export function NotificationsPage() {
  const { items, markRead, markAllRead } = useNotifications();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4 mb-6">
        <div>
          <h1 className="font-display text-2xl text-ink-950">Notifications</h1>
          <p className="text-sm text-ink-500 mt-1">Real-time alerts for routing events on your files.</p>
        </div>
        <button
          type="button"
          onClick={() => markAllRead()}
          className="text-xs font-medium text-accent border border-accent px-3 py-1.5 hover:bg-accent hover:text-white transition-colors"
        >
          Mark all as read
        </button>
      </div>
      <div className="border border-line divide-y divide-line">
        {items.length === 0 && (
          <p className="px-4 py-12 text-center text-sm text-ink-500">You have no notifications.</p>
        )}
        {items.map((n) => (
          <div
            key={n.id}
            className={`px-4 py-4 flex flex-wrap gap-4 justify-between ${n.read ? "bg-surface" : "bg-white"}`}
          >
            <div>
              <p className={`text-sm ${n.read ? "text-ink-600" : "text-ink-900 font-medium"}`}>
                {n.message}
              </p>
              <p className="text-xs text-ink-500 mt-1 font-mono">
                {n.fileRecord?.senderDept?.prefix && n.fileRecord?.fileNumber != null
                  ? `${n.fileRecord.senderDept.prefix}-${n.fileRecord.fileNumber}`
                  : "—"}{" "}
                · {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!n.read && (
                <button
                  type="button"
                  className="text-xs text-accent underline-offset-2 hover:underline"
                  onClick={() => markRead(n.id)}
                >
                  Mark read
                </button>
              )}
              {n.fileRecordId && (
                <Link to={`/files/${n.fileRecordId}`} className="text-xs text-ink-500 hover:text-accent">
                  Open file
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
