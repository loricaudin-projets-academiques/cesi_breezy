import { Op } from "sequelize";
import { Router } from "express";

import User from "../../databases/postgresql/models/user/user.js";
import Follow from "../../databases/postgresql/models/follow/follows.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { normalizeUsername, toPublicUser } from "../../utils/user.js";
import { storeProfilePhoto } from "../../utils/media.js";

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
    canViewPrivate: currentUserId === user.id || !user.isPrivate || flags.isFriend,
  };
}

router.get("/me", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) {
    return;
  }

  return res.json(toPublicUser(currentUser));
});

router.patch("/me", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) {
    return;
  }

  const updates = {};
  for (const field of ["bio", "note", "language"]) {
    if (typeof req.body[field] === "string") {
      updates[field] = req.body[field].trim();
    }
  }

  if (typeof req.body.isPrivate === "boolean") {
    updates.isPrivate = req.body.isPrivate;
  }

  if (typeof req.body.notificationsEnabled === "boolean") {
    updates.notificationsEnabled = req.body.notificationsEnabled;
  }

  if (req.body.music && typeof req.body.music === "object") {
    updates.music = {
      ...currentUser.music,
      ...req.body.music,
    };
  }

  if (typeof req.body.avatar === "string") {
    updates.avatar = await storeProfilePhoto(currentUser.id, req.body.avatar.trim());
  }

  await currentUser.update(updates);
  return res.json(toPublicUser(currentUser));
});

router.get("/search", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) {
    return;
  }

  const query = String(req.query.q || "").trim();
  if (!query) {
    return res.json([]);
  }

  const normalizedQuery = normalizeUsername(query);
  const users = await User.findAll({
    where: {
      id: { [Op.ne]: currentUser.id },
      [Op.or]: [
        { name: { [Op.iLike]: `%${query}%` } },
        { username: { [Op.iLike]: `%${normalizedQuery || query}%` } },
      ],
    },
    order: [["username", "ASC"]],
    limit: 20,
  });

  return res.json(await Promise.all(users.map((user) => userWithRelation(currentUser.id, user))));
});

router.get("/profile/:username", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) {
    return;
  }

  const targetUsername = normalizeUsername(req.params.username);
  const targetUser = await User.findOne({ where: { username: targetUsername } });

  if (!targetUser) {
    return res.status(404).json({ message: "Utilisateur introuvable." });
  }

  return res.json(await userWithRelation(currentUser.id, targetUser));
});

router.post("/:username/follow", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) {
    return;
  }

  const targetUsername = normalizeUsername(req.params.username);
  const targetUser = await User.findOne({ where: { username: targetUsername } });
  if (!targetUser) {
    return res.status(404).json({ message: "Utilisateur introuvable." });
  }

  if (targetUser.id === currentUser.id) {
    return res.status(400).json({ message: "Impossible de te suivre toi-meme." });
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
      ...(reverseFollow ? [
        currentUser.increment("friends"),
        targetUser.increment("friends"),
      ] : []),
    ]);
    await refreshUsers(currentUser, targetUser);
  }

  return res.status(created ? 201 : 200).json({
    followId: follow.id,
    ...(await userWithRelation(currentUser.id, targetUser)),
  });
});

router.delete("/:username/follow", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) {
    return;
  }

  const targetUsername = normalizeUsername(req.params.username);
  const targetUser = await User.findOne({ where: { username: targetUsername } });
  if (!targetUser) {
    return res.status(404).json({ message: "Utilisateur introuvable." });
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
      ...(reverseFollow ? [
        currentUser.decrement("friends"),
        targetUser.decrement("friends"),
      ] : []),
    ]);
    await refreshUsers(currentUser, targetUser);
  }

  return res.json(await userWithRelation(currentUser.id, targetUser));
});

router.get("/:type", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) {
    return;
  }

  const type = req.params.type;
  if (!["followers", "following", "friends"].includes(type)) {
    return res.status(404).json({ message: "Liste introuvable." });
  }

  const outgoing = await Follow.findAll({ where: { follower_id: currentUser.id } });
  const incoming = await Follow.findAll({ where: { followed_id: currentUser.id } });
  const outgoingIds = new Set(outgoing.map((follow) => follow.followed_id));
  const incomingIds = new Set(incoming.map((follow) => follow.follower_id));

  let ids = [];
  if (type === "followers") {
    ids = [...incomingIds];
  } else if (type === "following") {
    ids = [...outgoingIds];
  } else {
    ids = [...outgoingIds].filter((id) => incomingIds.has(id));
  }

  if (ids.length === 0) {
    return res.json([]);
  }

  const users = await User.findAll({
    where: { id: { [Op.in]: ids } },
    order: [["username", "ASC"]],
  });

  return res.json(await Promise.all(users.map((user) => userWithRelation(currentUser.id, user))));
});

export default router;
