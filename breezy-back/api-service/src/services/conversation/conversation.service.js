import User from "../../databases/postgresql/models/user/user.js";
import Follow from "../../databases/postgresql/models/follow/follows.js";
import Conversation from "../../databases/mongodb/models/message/conversation.js";
import PrivateMessage from "../../databases/mongodb/models/message/private_message.js";
import { createHttpError } from "../../utils/httpError.js";
import { normalizeUsername } from "../../utils/user.js";

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
    time: timeLabel(message.created_at),
  };
}

async function conversationToDto(conversation, currentUser) {
  const otherUserId = conversation.participants_ids.find((id) => id !== currentUser.id);
  const [otherUser, messages, lastMessage] = await Promise.all([
    User.findByPk(otherUserId),
    PrivateMessage.find({ conversation_id: conversation._id }).sort({ created_at: -1 }).limit(20),
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
    online: false,
    messages: messages.reverse().map((message) => messageToDto(message, currentUser.id)),
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
    throw createHttpError(403, "Vous devez etre amis pour discuter.");
  }

  return otherUserId;
}

async function listConversations({ authUser }) {
  const currentUser = await getCurrentUser(authUser);
  const conversations = await Conversation.find({
    participants_ids: currentUser.id,
  }).sort({ updated_at: -1 }).limit(20);

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
    throw createHttpError(404, "Utilisateur introuvable. Cree d'abord ce compte ou verifie le pseudo.");
  }

  if (targetUser.id === currentUser.id) {
    throw createHttpError(400, "Impossible d'ouvrir un chat avec toi-meme.");
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
  const messages = await PrivateMessage.find({ conversation_id: conversation._id })
    .sort({ created_at: -1 })
    .limit(20);
  return messages.reverse().map((message) => messageToDto(message, currentUser.id));
}

async function sendMessage({ authUser, conversationId, text }) {
  const { currentUser, conversation } = await findConversationForCurrentUser({ authUser, conversationId });
  const cleanText = String(text || "").trim();

  if (!cleanText) {
    throw createHttpError(400, "Le message est vide.");
  }
  if (cleanText.length > 5000) {
    throw createHttpError(400, "Le message ne peut pas depasser 5000 caracteres.");
  }

  const message = await PrivateMessage.create({
    conversation_id: conversation._id,
    sender_id: currentUser.id,
    content: cleanText,
    media: [],
    is_read: false,
    created_at: new Date(),
    updated_at: new Date(),
  });

  conversation.last_message_id = message._id;
  conversation.updated_at = new Date();
  await conversation.save();

  return messageToDto(message, currentUser.id);
}

function createAutoReply({ message, contact }) {
  const cleanMessage = String(message || "").trim();
  const contactName = contact?.name || "ton contact";

  if (!cleanMessage) {
    throw createHttpError(400, "Le message est vide.");
  }

  const lowered = cleanMessage.toLowerCase();
  if (lowered.includes("salut") || lowered.includes("hello") || lowered.includes("hey")) {
    return { reply: `Salut ! ${contactName} te repond depuis l'API Breezy.` };
  }

  return { reply: `Message recu par ${contactName} : "${cleanMessage}"` };
}

export {
  createAutoReply,
  listConversations,
  listMessages,
  openConversation,
  sendMessage,
};
