"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { motion } from "motion/react";

import Avatar from "../../components/Avatar";
import { AccountNotification } from "../../types";
import { api } from "../../services/api";
import { forceNavigate } from "../../utils/navigation";
import { getErrorMessage } from "../../utils/errors";
import { useBreezyApp } from "../BreezyAppProvider";

function formatParisDate(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const { triggerToast } = useBreezyApp();
  const [notifications, setNotifications] = useState<AccountNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<AccountNotification[]>("/notifications");
      setNotifications(data);
    } catch (error) {
      triggerToast(getErrorMessage(error, "Notifications indisponibles."));
    } finally {
      setIsLoading(false);
    }
  }, [triggerToast]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markRead = async (notification: AccountNotification) => {
    if (!notification.isRead) {
      setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, isRead: true } : item));
      void api.post(`/notifications/${notification.id}/read`);
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    await api.post("/notifications/read-all");
  };

  const openNotification = (notification: AccountNotification) => {
    void markRead(notification);
    if (notification.type === "follow") {
      forceNavigate(`/profile/${encodeURIComponent(notification.actor.username)}`);
      return;
    }
    forceNavigate(notification.targetId ? `/feed?post=${encodeURIComponent(notification.targetId)}` : "/feed");
  };

  return (
    <motion.div
      key="notifications-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 md:p-6 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Bell className="w-5 h-5 text-rose-300" />
          Notifications
        </h2>
        <button
          onClick={() => void markAllRead()}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[11px] font-bold flex items-center gap-1.5"
        >
          <CheckCheck className="w-4 h-4" />
          Tout lire
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-white/40 text-xs">Chargement...</div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center text-white/40 text-xs border border-white/5 rounded-2xl bg-white/[0.02]">
          Aucune notification pour l'instant.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => openNotification(notification)}
              className={`w-full text-left rounded-2xl border p-3 flex gap-3 transition ${
                notification.isRead
                  ? "border-white/5 bg-white/[0.02] text-white/70"
                  : "border-rose-400/25 bg-rose-500/10 text-white"
              }`}
            >
              <div
                onClick={(event) => {
                  event.stopPropagation();
                  void markRead(notification);
                  forceNavigate(`/profile/${encodeURIComponent(notification.actor.username)}`);
                }}
              >
                <Avatar
                  name={notification.actor.name}
                  username={notification.actor.username}
                  url={notification.actor.avatar}
                  className="w-11 h-11"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-5">
                  <span className="font-bold text-breezy-icy">{notification.actor.name}</span>{" "}
                  <span className="font-mono text-purple-300">{notification.actor.username}</span>{" "}
                  <span>{notification.text}</span>
                </p>
                {(notification.metadata?.excerpt || notification.metadata?.postTitle) && (
                  <p className="mt-1 text-xs text-white/45 truncate">
                    {notification.metadata.excerpt || notification.metadata.postTitle}
                  </p>
                )}
                <p className="mt-1 text-[10px] font-mono text-white/35">{formatParisDate(notification.createdAt)}</p>
              </div>
              {!notification.isRead && <span className="mt-2 w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
