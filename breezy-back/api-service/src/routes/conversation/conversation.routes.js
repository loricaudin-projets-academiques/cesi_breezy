import { Router } from "express";

import {
  createConversation,
  createMessage,
  fetchConversations,
  fetchMessages,
  reply,
} from "../../controllers/conversation/conversation.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, fetchConversations);
router.post("/", requireAuth, createConversation);
router.get("/:conversationId/messages", requireAuth, fetchMessages);
router.post("/:conversationId/messages", requireAuth, createMessage);
router.post("/reply", requireAuth, reply);

export default router;
