const express = require("express");

const { requireAuth } = require("../../middlewares/auth.middleware");
const { createId } = require("../../utils/ids");
const { normalizeUsername } = require("../utils/user");

const router = express.Router();
const conversationsByUser = new Map();

function getConversations(username) {
  if (!conversationsByUser.has(username)) {
    conversationsByUser.set(username, []);
  }

  return conversationsByUser.get(username);
}

router.get("/", requireAuth, (req, res) => {
  return res.json(getConversations(req.user.username));
});

router.post("/", requireAuth, (req, res) => {
  const name = String(req.body.name || "").trim();
  const username = normalizeUsername(req.body.username);

  if (!name || !username) {
    return res.status(400).json({ message: "Nom et nom d'utilisateur du contact sont obligatoires." });
  }

  const conversations = getConversations(req.user.username);
  const existing = conversations.find((conversation) => conversation.username === username);
  if (existing) {
    return res.json(existing);
  }

  const conversation = {
    id: createId("conv"),
    name,
    username,
    avatar: req.body.avatar || "",
    lastMessage: "Conversation demarree",
    unreadCount: 0,
    time: "A l'instant",
    online: true,
    messages: [],
  };

  conversations.unshift(conversation);
  return res.status(201).json(conversation);
});

router.post("/:conversationId/messages", requireAuth, (req, res) => {
  const conversations = getConversations(req.user.username);
  const conversation = conversations.find((item) => item.id === req.params.conversationId);

  if (!conversation) {
    return res.status(404).json({ message: "Conversation introuvable." });
  }

  const text = String(req.body.text || "").trim();
  if (!text) {
    return res.status(400).json({ message: "Le message est vide." });
  }

  const message = {
    id: createId("msg"),
    sender: "me",
    text,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  conversation.messages.push(message);
  conversation.lastMessage = text;
  conversation.time = "A l'instant";

  return res.status(201).json(message);
});

router.post("/reply", requireAuth, (req, res) => {
  const message = String(req.body.message || "").trim();
  const contact = req.body.contact || {};
  const contactName = contact.name || "ton contact";

  if (!message) {
    return res.status(400).json({ message: "Le message est vide." });
  }

  const lowered = message.toLowerCase();
  if (lowered.includes("salut") || lowered.includes("hello") || lowered.includes("hey")) {
    return res.json({ reply: `Salut ! ${contactName} te repond depuis l'API Breezy.` });
  }

  return res.json({ reply: `Message recu par ${contactName} : "${message}"` });
});

module.exports = router;
