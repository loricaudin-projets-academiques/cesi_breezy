import { Router } from "express";

import User from "../../databases/postgresql/models/user/user.js";
import Follow from "../../databases/postgresql/models/follow/follows.js";
import Conversation from "../../databases/mongodb/models/message/conversation.js";
import PrivateMessage from "../../databases/mongodb/models/message/private_message.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { normalizeUsername } from "../../utils/user.js";

const router = Router();

async function getCurrentUser(req, res) {
  const user = await User.findOne({
    where: req.user.id ? { id: req.user.id } : { username: req.user.username },
  });

  if (!user) {
    res.status(401).json({ message: "Utilisateur introuvable." });
    return null;
  }

  return user;
}

function timeLabel(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function messageToDto(message, currentUserId) {
  return {
    id: String(message._id),
    sender: message.sender_id === currentUserId ? "me" : "them",
    text: message.content,
    time: timeLabel(message.created_at),
  };
}

async function conversationToDto(conversation, currentUser) {
  const otherUserId = conversation.participants_ids.find((id) => id !== currentUser.id);
  const [otherUser, messages, lastMessage] = await Promise.all([
    User.findByPk(otherUserId),
    PrivateMessage.find({ conversation_id: conversation._id }).sort({ created_at: 1 }),
    conversation.last_message_id
      ? PrivateMessage.findById(conversation.last_message_id)
      : PrivateMessage.findOne({ conversation_id: conversation._id }).sort({ created_at: -1 }),
  ]);

  return {
    id: String(conversation._id),
    name: otherUser?.name || "Utilisateur inconnu",
    username: otherUser?.username || "",
    avatar: otherUser?.avatar || "",
    lastMessage: lastMessage?.content || "Conversation demarree",
    unreadCount: 0,
    time: lastMessage ? timeLabel(lastMessage.created_at) : "A l'instant",
    online: true,
    messages: messages.map((message) => messageToDto(message, currentUser.id)),
  };
}

async function findConversationForUsers(currentUserId, targetUserId) {
  return Conversation.findOne({
    participants_ids: {
      $all: [currentUserId, targetUserId],
      $size: 2,
    },
  });
}

async function areFriends(userId, targetUserId) {
  const [outgoing, incoming] = await Promise.all([
    Follow.findOne({ where: { follower_id: userId, followed_id: targetUserId } }),
    Follow.findOne({ where: { follower_id: targetUserId, followed_id: userId } }),
  ]);

  return Boolean(outgoing && incoming);
}

async function getConversationFriend(req, res, currentUser, conversation) {
  const otherUserId = conversation?.participants_ids.find((id) => id !== currentUser.id);

  if (!otherUserId || !(await areFriends(currentUser.id, otherUserId))) {
    res.status(403).json({ message: "Vous devez etre amis pour discuter." });
    return null;
  }

  return otherUserId;
}

router.get("/", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) {
    return;
  }

  const conversations = await Conversation.find({
    participants_ids: currentUser.id,
  }).sort({ updated_at: -1 });

  const friendConversations = [];
  for (const conversation of conversations) {
    const otherUserId = conversation.participants_ids.find((id) => id !== currentUser.id);
    if (otherUserId && await areFriends(currentUser.id, otherUserId)) {
      friendConversations.push(conversation);
    }
  }

  return res.json(await Promise.all(friendConversations.map((conversation) => conversationToDto(conversation, currentUser))));
});

router.post("/", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) {
    return;
  }

  const username = normalizeUsername(req.body.username);
  if (!username) {
    return res.status(400).json({ message: "Nom d'utilisateur du contact obligatoire." });
  }

  const targetUser = await User.findOne({ where: { username } });
  if (!targetUser) {
    return res.status(404).json({ message: "Utilisateur introuvable. Cree d'abord ce compte ou verifie le pseudo." });
  }

  if (targetUser.id === currentUser.id) {
    return res.status(400).json({ message: "Impossible d'ouvrir un chat avec toi-meme." });
  }

  if (!(await areFriends(currentUser.id, targetUser.id))) {
    return res.status(403).json({ message: "Vous devez vous suivre mutuellement pour discuter." });
  }

  let conversation = await findConversationForUsers(currentUser.id, targetUser.id);
  let status = 200;

  if (!conversation) {
    conversation = await Conversation.create({
      participants_ids: [currentUser.id, targetUser.id],
      created_at: new Date(),
      updated_at: new Date(),
    });
    status = 201;
  }

  return res.status(status).json(await conversationToDto(conversation, currentUser));
});

router.get("/:conversationId/messages", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) {
    return;
  }

  const conversation = await Conversation.findById(req.params.conversationId);
  if (!conversation || !conversation.participants_ids.includes(currentUser.id)) {
    return res.status(404).json({ message: "Conversation introuvable." });
  }

  if (!(await getConversationFriend(req, res, currentUser, conversation))) {
    return;
  }

  const messages = await PrivateMessage.find({ conversation_id: conversation._id }).sort({ created_at: 1 });
  return res.json(messages.map((message) => messageToDto(message, currentUser.id)));
});

router.post("/:conversationId/messages", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) {
    return;
  }

  const conversation = await Conversation.findById(req.params.conversationId);
  if (!conversation || !conversation.participants_ids.includes(currentUser.id)) {
    return res.status(404).json({ message: "Conversation introuvable." });
  }

  if (!(await getConversationFriend(req, res, currentUser, conversation))) {
    return;
  }

  const text = String(req.body.text || "").trim();
  if (!text) {
    return res.status(400).json({ message: "Le message est vide." });
  }

  const message = await PrivateMessage.create({
    conversation_id: conversation._id,
    sender_id: currentUser.id,
    content: text,
    media: [],
    is_read: false,
    created_at: new Date(),
    updated_at: new Date(),
  });

  conversation.last_message_id = message._id;
  conversation.updated_at = new Date();
  await conversation.save();

  return res.status(201).json(messageToDto(message, currentUser.id));
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

export default router;
