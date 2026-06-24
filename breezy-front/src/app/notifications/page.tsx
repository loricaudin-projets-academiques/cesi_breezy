"use client";

import React, { useEffect, useState } from "react";
import { Bell, CheckCheck, Trash2, X } from "lucide-react";
import { motion } from "motion/react";

import Avatar from "../../components/Avatar";
import { AccountNotification } from "../../types";
import { api } from "../../services/api";
import { forceNavigate } from "../../utils/navigation";
import { getErrorMessage } from "../../utils/errors";
import { useBreezyApp } from "../BreezyAppProvider";
import { useTranslation } from "../../hooks/useTranslation";

function formatParisDate(value: string | undefined | null, lang = "fr") {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString(lang === "en" ? "en-US" : "fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const notificationTranslations = {
  like: "notifications.liked",
  comment: "notifications.commented",
  reply: "notifications.replied",
  follow: "notifications.followed",
  friend: "notifications.friended",
} as const;

export default function NotificationsPage() {
  const { triggerToast } = useBreezyApp();
  const { t, lang } = useTranslation();
  const [notifications, setNotifications] = useState<AccountNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getNotificationText = (notification: AccountNotification) => {
    if (notification.type === "mention") {
      return notification.targetType === "comment"
        ? t("notifications.mentioned_comment")
        : t("notifications.mentioned_post");
    }
    const key = notificationTranslations[notification.type as keyof typeof notificationTranslations];
    return key ? t(key) : notification.text;
  };

  const loadNotifications = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const { data } = await api.get<AccountNotification[]>("/notifications");
      setNotifications((prev) => {
        if (silent && prev.length > 0) {
          const existingIds = new Set(prev.map((n) => n.id));
          const newOnes = data.filter((n) => !existingIds.has(n.id));
          return newOnes.length > 0 ? [...newOnes, ...prev] : prev;
        }
        return data;
      });
    } catch (error) {
      if (!silent) triggerToast(getErrorMessage(error, t('notifications.error')));
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
    const interval = setInterval(() => void loadNotifications(true), 15_000);

    const handleRefresh = () => {
      void loadNotifications();
    };
    window.addEventListener("breezy:refresh-current-tab", handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("breezy:refresh-current-tab", handleRefresh);
    };
  }, []);

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

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await api.delete(`/notifications/${id}`);
  };

  const deleteAll = async () => {
    setNotifications([]);
    await api.delete("/notifications");
  };

  const openNotification = (notification: AccountNotification) => {
    void markRead(notification);
    if (notification.type === "follow") {
      forceNavigate(`/profile/${encodeURIComponent(notification.actor.username)}`);
      return;
    }
    if (notification.type === "like" || notification.type === "comment" || notification.type === "reply") {
      forceNavigate(notification.targetId ? `/profile?post=${encodeURIComponent(notification.targetId)}${notification.type !== "like" ? "&expandComments=true" : ""}` : "/profile");
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
      className="p-3 md:p-4 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Bell className="w-4 h-4 text-rose-300" />
          {t('notifications.title')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void markAllRead()}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[11px] font-bold flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            {lang === 'en' ? 'Mark all read' : 'Tout lire'}
          </button>
          {notifications.length > 0 && (
            <button
              onClick={() => void deleteAll()}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-300 text-[11px] font-bold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-4 h-4" />
              {lang === 'en' ? 'Delete all' : 'Tout supprimer'}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-white/40 text-xs">{t('feed.loading')}</div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center text-white/40 text-xs border border-white/5 rounded-2xl bg-white/[0.02]">
          {t('notifications.empty')}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => openNotification(notification)}
              className={`notif-card w-full text-left rounded-2xl border p-3 flex gap-3 transition ${
                notification.isRead
                  ? "notif-read border-white/5 bg-white/[0.02] text-white/70"
                  : "notif-unread border-rose-400/25 bg-rose-500/10 text-white"
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
                  className="w-9 h-9"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-4">
                  <span className="font-bold text-breezy-icy">{notification.actor.name}</span>{" "}
                  <span className="font-mono text-purple-300">{notification.actor.username}</span>{" "}
                  <span>{getNotificationText(notification)}</span>
                </p>
                {(notification.metadata?.excerpt || notification.metadata?.postTitle) && (
                  <p className="mt-1 text-xs text-white/45 truncate">
                    {notification.metadata.excerpt || notification.metadata.postTitle}
                  </p>
                )}
                <p className="mt-1 text-[10px] font-mono text-white/35">{formatParisDate(notification.createdAt, lang)}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {!notification.isRead && <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />}
                <button
                  onClick={(e) => void deleteNotification(notification.id, e)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white/25 hover:text-rose-300 hover:bg-rose-500/15 transition"
                  title="Supprimer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
