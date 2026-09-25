import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(window.atob(base64), (character) => character.charCodeAt(0));
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const navigate = useNavigate();

  async function loadNotifications() {
    try {
      const { data } = await api.get("/notifications/me");
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      setNotifications([]);
    }
  }

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 15000);
    return () => window.clearInterval(interval);
  }, []);

  async function openNotification(notification) {
    try {
      await api.patch(`/notifications/${notification._id}/read`);
      setNotifications((current) =>
        current.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((current) => Math.max(current - (notification.isRead ? 0 : 1), 0));
    } catch (error) {
      return;
    }
    setOpen(false);
    navigate(notification.link);
  }

  async function markAllRead() {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      return;
    }
  }

  async function enablePush() {
    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!publicKey || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      await api.post("/push/subscribe", subscription.toJSON());
      setPushEnabled(true);
    } catch (error) {
      setPushEnabled(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="btn-secondary relative px-3 py-2"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open notifications"
      >
        Notifications
        {unreadCount > 0 && (
          <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-neutral-200 bg-white p-3 shadow-soft dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="font-black">Notifications</h2>
            {unreadCount > 0 && (
              <button type="button" className="text-xs font-semibold underline" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
          {import.meta.env.VITE_VAPID_PUBLIC_KEY && (
            <button
              type="button"
              className="mb-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-left text-xs font-semibold dark:border-neutral-700"
              onClick={enablePush}
              disabled={pushEnabled}
            >
              {pushEnabled ? "Push notifications enabled" : "Enable phone notifications"}
            </button>
          )}
          <div className="grid max-h-80 gap-2 overflow-y-auto">
            {notifications.length ? (
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  className={`rounded-lg p-3 text-left text-sm ${notification.isRead ? "bg-neutral-50 dark:bg-neutral-800" : "bg-neutral-100 dark:bg-neutral-700"}`}
                  onClick={() => openNotification(notification)}
                >
                  <p className="font-bold">{notification.title}</p>
                  <p className="mt-1 text-neutral-600 dark:text-neutral-300">{notification.message}</p>
                </button>
              ))
            ) : (
              <p className="py-5 text-center text-sm text-neutral-500">No notifications yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
