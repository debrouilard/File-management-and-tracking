import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { io } from "socket.io-client";
import { api } from "../services/api.js";
import { useAuth } from "./AuthContext.jsx";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    const rows = await api("/notifications");
    setItems(rows);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    refresh();
  }, [isAuthenticated, refresh]);

  useEffect(() => {
    if (!token) return undefined;
    const base = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const s = io(base, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket"],
    });
    const push = (payload) => {
      setItems((prev) => [
        {
          id: payload.notificationId,
          fileId: payload.fileId,
          message: payload.message,
          read: payload.read,
          createdAt: payload.timestamp,
        },
        ...prev.filter((x) => x.id !== payload.notificationId),
      ]);
    };
    s.on("file_sent", push);
    s.on("file_received", push);
    s.on("file_rejected", push);
    return () => s.disconnect();
  }, [token]);

  const markRead = useCallback(async (id) => {
    await api(`/notifications/${id}/read`, { method: "PATCH" });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(async () => {
    await api("/notifications/read-all", { method: "POST" });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unread = items.filter((n) => !n.read).length;

  const value = useMemo(
    () => ({
      items,
      unread,
      open,
      setOpen,
      refresh,
      markRead,
      markAllRead,
    }),
    [items, unread, open, refresh, markRead, markAllRead]
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
