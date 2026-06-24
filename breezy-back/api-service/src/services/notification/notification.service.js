import { Op } from "sequelize";

import Notification from "../../databases/postgresql/models/notification/notification.js";
import User from "../../databases/postgresql/models/user/user.js";
import { createHttpError } from "../../utils/httpError.js";

async function getCurrentUser(authUser) {
  const user = await User.findOne({
    where: authUser.id ? { id: authUser.id } : { username: authUser.username },
  });

  if (!user) {
    throw createHttpError(401, "Utilisateur introuvable.");
  }

  return user;
}

async function createNotification({ recipientId, actorId, type, targetType, targetId = null, metadata = {} }) {
  if (!recipientId || !actorId || recipientId === actorId) {
    return null;
  }

  return Notification.create({
    recipient_id: recipientId,
    actor_id: actorId,
    type,
    target_type: targetType,
    target_id: targetId ? String(targetId) : null,
    metadata,
    is_read: false,
  });
}

function notificationText(notification) {
  if (notification.type === "follow") {
    return "s'est abonne a vous";
  }
  if (notification.type === "like") {
    return "a aime votre publication";
  }
  if (notification.type === "comment") {
    return "a commente votre publication";
  }
  if (notification.type === "reply") {
    return "a repondu a votre commentaire";
  }
  if (notification.type === "mention") {
    return "vous a mentionne";
  }
  return "a interagi avec vous";
}

async function listNotifications({ authUser }) {
  const currentUser = await getCurrentUser(authUser);
  const notifications = await Notification.findAll({
    where: { recipient_id: currentUser.id },
    order: [["created_at", "DESC"]],
    limit: 20,
  });

  const actorIds = [...new Set(notifications.map((notification) => notification.actor_id))];
  const actors = actorIds.length ? await User.findAll({ where: { id: { [Op.in]: actorIds } } }) : [];
  const actorsById = new Map(actors.map((actor) => [actor.id, actor]));

  return notifications.map((notification) => {
    const actor = actorsById.get(notification.actor_id);
    return {
      id: notification.id,
      type: notification.type,
      targetType: notification.target_type,
      targetId: notification.target_id,
      isRead: notification.is_read,
      createdAt: notification.created_at,
      text: notificationText(notification),
      metadata: notification.metadata || {},
      actor: {
        id: actor?.id || notification.actor_id,
        name: actor?.name || "Utilisateur",
        username: actor?.username || "",
        avatar: actor?.avatar || "",
      },
    };
  });
}

async function unreadCount({ authUser }) {
  const currentUser = await getCurrentUser(authUser);
  return Notification.count({
    where: {
      recipient_id: currentUser.id,
      is_read: false,
    },
  });
}

async function markNotificationRead({ authUser, notificationId }) {
  const currentUser = await getCurrentUser(authUser);
  await Notification.update(
    { is_read: true, read_at: new Date() },
    { where: { id: notificationId, recipient_id: currentUser.id } }
  );
  return { ok: true };
}

async function markAllNotificationsRead({ authUser }) {
  const currentUser = await getCurrentUser(authUser);
  await Notification.update(
    { is_read: true, read_at: new Date() },
    { where: { recipient_id: currentUser.id, is_read: false } }
  );
  return { ok: true };
}

export {
  createNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadCount,
};
