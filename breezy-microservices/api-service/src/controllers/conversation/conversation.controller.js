import {
  createAutoReply,
  listConversations,
  listMessages,
  markMessagesRead,
  openConversation,
  sendMessage,
} from "../../services/conversation/conversation.service.js";

async function fetchConversations(req, res, next) {
  try {
    return res.json(await listConversations({ authUser: req.user }));
  } catch (error) {
    return next(error);
  }
}

async function createConversation(req, res, next) {
  try {
    const result = await openConversation({
      authUser: req.user,
      username: req.body.username,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    return next(error);
  }
}

async function fetchMessages(req, res, next) {
  try {
    return res.json(await listMessages({
      authUser: req.user,
      conversationId: req.params.conversationId,
    }));
  } catch (error) {
    return next(error);
  }
}

async function createMessage(req, res, next) {
  try {
    const images = Array.isArray(req.body.images) ? req.body.images : [];
    const message = await sendMessage({
      authUser: req.user,
      conversationId: req.params.conversationId,
      text: req.body.text,
      images,
    });
    return res.status(201).json(message);
  } catch (error) {
    return next(error);
  }
}

async function readMessages(req, res, next) {
  try {
    await markMessagesRead({ authUser: req.user, conversationId: req.params.conversationId });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
}

function reply(req, res, next) {
  try {
    return res.json(createAutoReply({
      message: req.body.message,
      contact: req.body.contact,
    }));
  } catch (error) {
    return next(error);
  }
}

export {
  createConversation,
  createMessage,
  fetchConversations,
  fetchMessages,
  readMessages,
  reply,
};
