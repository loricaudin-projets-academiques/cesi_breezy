import { Op } from "sequelize";

import User from "../databases/postgresql/models/user.js";
import Follow from "../databases/postgresql/models/follows.js";
import Notification from "../databases/postgresql/models/notification.js";
import { createHttpError } from "../utils/httpError.js";
import { normalizeUsername, toPublicUser } from "../utils/user.js";
import { storeProfilePhoto } from "../utils/media.js";

async function getCurrentUser(authUser) {
  if (!authUser?.id) {
    throw createHttpError(401, "Token invalide.");
  }

  const user = await User.findOne({ where: { id: authUser.id } });

  if (!user) {
    throw createHttpError(401, "Utilisateur introuvable.");
  }

  return user;
}

async function relationFlags(currentUserId, targetUserId) {
  const [followedByMe, followsMe] = await Promise.all([
    Follow.findOne({ where: { follower_id: currentUserId, followed_id: targetUserId } }),
    Follow.findOne({ where: { follower_id: targetUserId, followed_id: currentUserId } }),
  ]);

  return {
    followedByMe: Boolean(followedByMe),
    followsMe: Boolean(followsMe),
    isFriend: Boolean(followedByMe && followsMe),
  };
}

async function refreshUsers(...users) {
  await Promise.all(users.map((user) => user.reload()));
}

async function userWithRelation(currentUserId, user) {
  const flags = await relationFlags(currentUserId, user.id);
  return {
    ...toPublicUser(user),
    ...flags,
  };
}

async function getMe({ authUser }) {
  return toPublicUser(await getCurrentUser(authUser));
}

async function updateMe({ authUser, updates: rawUpdates }) {
  const currentUser = await getCurrentUser(authUser);
  const updates = {};

  for (const field of ["name", "bio", "note", "language", "theme"]) {
    if (typeof rawUpdates[field] === "string") {
      updates[field] = rawUpdates[field].trim();
    }
  }

  if (updates.name && updates.name.length > 80) {
    throw createHttpError(400, "Le nom ne peut pas dépasser 80 caractères.");
  }

  if (updates.note && updates.note.length > 10000) {
    throw createHttpError(400, "La note ne peut pas dépasser 10000 caractères.");
  }

  if (typeof rawUpdates.notificationsEnabled === "boolean") {
    updates.notificationsEnabled = rawUpdates.notificationsEnabled;
  }

  if (typeof rawUpdates.ambientGlow === "boolean") {
    updates.ambientGlow = rawUpdates.ambientGlow;
  }

  if (typeof rawUpdates.avatar === "string") {
    updates.avatar = await storeProfilePhoto(currentUser.id, rawUpdates.avatar.trim());
  }

  await currentUser.update(updates);
  return toPublicUser(currentUser);
}

async function searchUsers({ authUser, query }) {
  const currentUser = await getCurrentUser(authUser);
  const cleanQuery = String(query || "").trim();

  if (!cleanQuery) {
    return [];
  }

  const normalizedQuery = normalizeUsername(cleanQuery);
  const users = await User.findAll({
    where: {
      id: { [Op.ne]: currentUser.id },
      [Op.or]: [
        { name: { [Op.iLike]: `%${cleanQuery}%` } },
        { username: { [Op.iLike]: `%${normalizedQuery || cleanQuery}%` } },
      ],
    },
    order: [["username", "ASC"]],
    limit: 20,
  });

  return Promise.all(users.map((user) => userWithRelation(currentUser.id, user)));
}

async function getPublicProfile({ authUser, username }) {
  const currentUser = await getCurrentUser(authUser);
  const targetUsername = normalizeUsername(username);
  const targetUser = await User.findOne({ where: { username: targetUsername } });

  if (!targetUser) {
    throw createHttpError(404, "Utilisateur introuvable.");
  }

  return userWithRelation(currentUser.id, targetUser);
}

async function followUser({ authUser, username }) {
  const currentUser = await getCurrentUser(authUser);
  const targetUsername = normalizeUsername(username);
  const targetUser = await User.findOne({ where: { username: targetUsername } });

  if (!targetUser) {
    throw createHttpError(404, "Utilisateur introuvable.");
  }

  if (targetUser.id === currentUser.id) {
    throw createHttpError(400, "Impossible de te suivre toi-même.");
  }

  const [follow, created] = await Follow.findOrCreate({
    where: {
      follower_id: currentUser.id,
      followed_id: targetUser.id,
    },
    defaults: {
      follower_id: currentUser.id,
      followed_id: targetUser.id,
    },
  });

  if (created) {
    const reverseFollow = await Follow.findOne({
      where: {
        follower_id: targetUser.id,
        followed_id: currentUser.id,
      },
    });

    await Promise.all([
      currentUser.increment("following"),
      targetUser.increment("followers"),
      ...(reverseFollow ? [currentUser.increment("friends"), targetUser.increment("friends")] : []),
    ]);
    await Notification.create({
      recipient_id: targetUser.id,
      actor_id: currentUser.id,
      type: "follow",
      target_type: "profile",
      target_id: targetUser.id,
      metadata: {},
      is_read: false,
    });
    await refreshUsers(currentUser, targetUser);
  }

  return {
    status: created ? 201 : 200,
    data: {
      followId: follow.id,
      ...(await userWithRelation(currentUser.id, targetUser)),
    },
  };
}

async function unfollowUser({ authUser, username }) {
  const currentUser = await getCurrentUser(authUser);
  const targetUsername = normalizeUsername(username);
  const targetUser = await User.findOne({ where: { username: targetUsername } });

  if (!targetUser) {
    throw createHttpError(404, "Utilisateur introuvable.");
  }

  const reverseFollow = await Follow.findOne({
    where: {
      follower_id: targetUser.id,
      followed_id: currentUser.id,
    },
  });

  const deleted = await Follow.destroy({
    where: {
      follower_id: currentUser.id,
      followed_id: targetUser.id,
    },
  });

  if (deleted) {
    await Promise.all([
      currentUser.decrement("following"),
      targetUser.decrement("followers"),
      ...(reverseFollow ? [currentUser.decrement("friends"), targetUser.decrement("friends")] : []),
    ]);
    await refreshUsers(currentUser, targetUser);
  }

  return userWithRelation(currentUser.id, targetUser);
}

async function getRelationList({ authUser, type }) {
  const currentUser = await getCurrentUser(authUser);

  if (!["followers", "following", "friends"].includes(type)) {
    throw createHttpError(404, "Liste introuvable.");
  }

  const outgoing = await Follow.findAll({ where: { follower_id: currentUser.id } });
  const incoming = await Follow.findAll({ where: { followed_id: currentUser.id } });
  const outgoingIds = new Set(outgoing.map((follow) => follow.followed_id));
  const incomingIds = new Set(incoming.map((follow) => follow.follower_id));

  const ids = type === "followers"
    ? [...incomingIds]
    : type === "following"
      ? [...outgoingIds]
      : [...outgoingIds].filter((id) => incomingIds.has(id));

  if (ids.length === 0) {
    return [];
  }

  const users = await User.findAll({
    where: { id: { [Op.in]: ids } },
    order: [["username", "ASC"]],
  });

  return Promise.all(users.map((user) => userWithRelation(currentUser.id, user)));
}

export {
  followUser,
  getMe,
  getPublicProfile,
  getRelationList,
  searchUsers,
  unfollowUser,
  updateMe,
};
