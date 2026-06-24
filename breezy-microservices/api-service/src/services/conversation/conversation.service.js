import User from "../../databases/postgresql/models/user/user.js";
import Follow from "../../databases/postgresql/models/follow/follows.js";
import Conversation from "../../databases/mongodb/models/message/conversation.js";
import PrivateMessage from "../../databases/mongodb/models/message/private_message.js";
import { createHttpError } from "../../utils/httpError.js";
import { normalizeUsername } from "../../utils/user.js";
import { storeGalleryImages } from "../../utils/media.js";

const PARIS_TIME_ZONE = "Europe/Paris";

async function getCurrentUser(authUser) {
  const user = await User.findOne({
    where: authUser.id ? { id: authUser.id } : { username: authUser.username },
  });

  if (!user) {
    throw createHttpError(401, "Utilisateur introuvable.");
  }

  return user;
}

function timeLabel(date) {
  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PARIS_TIME_ZONE,
  });
}

function messageToDto(message, currentUserId) {
  return {
    id: String(message._id),
    sender: message.sender_id === currentUserId ? "me" : "them",
    text: message.content,
    media: message.media || [],
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

  const unreadCount = await PrivateMessage.countDocuments({
    conversation_id: conversation._id,
    sender_id: { $ne: currentUser.id },
    is_read: false,
  });

  return {
    id: String(conversation._id),
    name: otherUser?.name || "Utilisateur inconnu",
    username: otherUser?.username || "",
    avatar: otherUser?.avatar || "",
    lastMessage: lastMessage?.content || (lastMessage?.media?.length ? "📷 Image" : "Conversation démarrée"),
    unreadCount,
    time: lastMessage ? timeLabel(lastMessage.created_at) : "À l'instant",
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

async function getConversationFriend(currentUser, conversation) {
  const otherUserId = conversation?.participants_ids.find((id) => id !== currentUser.id);

  if (!otherUserId || !(await areFriends(currentUser.id, otherUserId))) {
    throw createHttpError(403, "Vous devez être amis pour discuter.");
  }

  return otherUserId;
}

async function listConversations({ authUser }) {
  const currentUser = await getCurrentUser(authUser);
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

  return Promise.all(friendConversations.map((conversation) => conversationToDto(conversation, currentUser)));
}

async function openConversation({ authUser, username }) {
  const currentUser = await getCurrentUser(authUser);
  const targetUsername = normalizeUsername(username);

  if (!targetUsername) {
    throw createHttpError(400, "Nom d'utilisateur du contact obligatoire.");
  }

  const targetUser = await User.findOne({ where: { username: targetUsername } });
  if (!targetUser) {
    throw createHttpError(404, "Utilisateur introuvable. Créez d'abord ce compte ou vérifiez le pseudo.");
  }

  if (targetUser.id === currentUser.id) {
    throw createHttpError(400, "Impossible d'ouvrir un chat avec toi-même.");
  }

  if (!(await areFriends(currentUser.id, targetUser.id))) {
    throw createHttpError(403, "Vous devez vous suivre mutuellement pour discuter.");
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

  return {
    status,
    data: await conversationToDto(conversation, currentUser),
  };
}

async function findConversationForCurrentUser({ authUser, conversationId }) {
  const currentUser = await getCurrentUser(authUser);
  const conversation = await Conversation.findById(conversationId);

  if (!conversation || !conversation.participants_ids.includes(currentUser.id)) {
    throw createHttpError(404, "Conversation introuvable.");
  }

  await getConversationFriend(currentUser, conversation);
  return { currentUser, conversation };
}

async function listMessages({ authUser, conversationId }) {
  const { currentUser, conversation } = await findConversationForCurrentUser({ authUser, conversationId });
  const messages = await PrivateMessage.find({ conversation_id: conversation._id }).sort({ created_at: 1 });
  return messages.map((message) => messageToDto(message, currentUser.id));
}

async function sendMessage({ authUser, conversationId, text, images = [] }) {
  const { currentUser, conversation } = await findConversationForCurrentUser({ authUser, conversationId });
  const cleanText = String(text || "").trim();
  const rawImages = Array.isArray(images) ? images.slice(0, 5) : [];

  if (!cleanText && rawImages.length === 0) {
    throw createHttpError(400, "Le message est vide.");
  }

  const media = rawImages.length > 0
    ? await storeGalleryImages(currentUser.id, rawImages)
    : [];

  const message = await PrivateMessage.create({
    conversation_id: conversation._id,
    sender_id: currentUser.id,
    content: cleanText,
    media,
    is_read: false,
    created_at: new Date(),
    updated_at: new Date(),
  });

  conversation.last_message_id = message._id;
  conversation.updated_at = new Date();
  await conversation.save();

  return messageToDto(message, currentUser.id);
}

async function markMessagesRead({ authUser, conversationId }) {
  const { currentUser, conversation } = await findConversationForCurrentUser({ authUser, conversationId });
  await PrivateMessage.updateMany(
    { conversation_id: conversation._id, sender_id: { $ne: currentUser.id }, is_read: false },
    { $set: { is_read: true, updated_at: new Date() } }
  );
}

function createAutoReply({ message, contact }) {
  const cleanMessage = String(message || "").trim();
  const contactName = contact?.name || "ton contact";

  if (!cleanMessage) {
    throw createHttpError(400, "Le message est vide.");
  }

  const lowered = cleanMessage.toLowerCase();
  if (lowered.includes("salut") || lowered.includes("hello") || lowered.includes("hey")) {
    return { reply: `Salut ! ${contactName} te répond depuis l'API Breezy.` };
  }

  return { reply: `Message reçu par ${contactName} : "${cleanMessage}"` };
}

export {
  createAutoReply,
  listConversations,
  listMessages,
  markMessagesRead,
  openConversation,
  sendMessage,
};
