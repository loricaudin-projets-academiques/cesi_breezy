import { Router } from "express";

import {
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

export default router;
