import { Router } from "express";

import {
  deleteAllNotifications,
  deleteNotification,
  fetchNotifications,
  fetchUnreadCount,
  readAllNotifications,
  readNotification,
} from "../../controllers/notification/notification.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, fetchNotifications);
router.get("/unread-count", requireAuth, fetchUnreadCount);
router.post("/read-all", requireAuth, readAllNotifications);
router.post("/:notificationId/read", requireAuth, readNotification);
router.delete("/", requireAuth, deleteAllNotifications);
router.delete("/:notificationId", requireAuth, deleteNotification);

export default router;
