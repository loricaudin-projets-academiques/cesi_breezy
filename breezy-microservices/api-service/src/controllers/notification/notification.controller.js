import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  removeAllNotifications,
  removeNotification,
  unreadCount,
} from "../../services/notification/notification.service.js";

async function fetchNotifications(req, res, next) {
  try {
    return res.json(await listNotifications({ authUser: req.user }));
  } catch (error) {
    return next(error);
  }
}

async function fetchUnreadCount(req, res, next) {
  try {
    return res.json({ count: await unreadCount({ authUser: req.user }) });
  } catch (error) {
    return next(error);
  }
}

async function readNotification(req, res, next) {
  try {
    return res.json(await markNotificationRead({ authUser: req.user, notificationId: req.params.notificationId }));
  } catch (error) {
    return next(error);
  }
}

async function readAllNotifications(req, res, next) {
  try {
    return res.json(await markAllNotificationsRead({ authUser: req.user }));
  } catch (error) {
    return next(error);
  }
}

async function deleteNotification(req, res, next) {
  try {
    return res.json(await removeNotification({ authUser: req.user, notificationId: req.params.notificationId }));
  } catch (error) {
    return next(error);
  }
}

async function deleteAllNotifications(req, res, next) {
  try {
    return res.json(await removeAllNotifications({ authUser: req.user }));
  } catch (error) {
    return next(error);
  }
}

export {
  deleteAllNotifications,
  deleteNotification,
  fetchNotifications,
  fetchUnreadCount,
  readAllNotifications,
  readNotification,
};
