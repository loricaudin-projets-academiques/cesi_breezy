import { Router } from "express";
import mongoose from "mongoose";

import User from "../../databases/postgresql/models/user/user.js";
import Post from "../../databases/mongodb/models/post/post.js";
import Comment from "../../databases/mongodb/models/comment/comment.js";
import Post_Like from "../../databases/postgresql/models/interaction/post_likes.js";
import Post_Star from "../../databases/postgresql/models/interaction/post_stars.js";
import Follow from "../../databases/postgresql/models/follow/follows.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { normalizeUsername } from "../../utils/user.js";
import { deleteLocalUploads, storeGalleryImages } from "../../utils/media.js";

const router = Router();

function isValidPostId(postId) {
  return mongoose.Types.ObjectId.isValid(postId);
}

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
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "A l'instant";
  if (diffMinutes < 60) return `${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h`;

  return new Date(date).toLocaleDateString();
}

async function authorsById(posts) {
  const authorIds = [...new Set(posts.map((post) => post.author_id))];
  const users = authorIds.length
    ? await User.findAll({ where: { id: authorIds } })
    : [];

  return new Map(users.map((user) => [user.id, user]));
}

async function interactionSets(userId, posts) {
  const postIds = posts.map((post) => String(post._id));
  const [likes, stars] = await Promise.all([
    postIds.length ? Post_Like.findAll({ where: { user_id: userId, post_id: postIds } }) : [],
    postIds.length ? Post_Star.findAll({ where: { user_id: userId, post_id: postIds } }) : [],
  ]);

  return {
    liked: new Set(likes.map((like) => like.post_id)),
    starred: new Set(stars.map((star) => star.post_id)),
  };
}

function postToDto(post, author, interactions, currentUser) {
  const postId = String(post._id);

  return {
    id: postId,
    authorName: author?.name || "Utilisateur inconnu",
    authorUsername: author?.username || "",
    avatar: author?.avatar || "",
    title: post.title || "",
    content: post.content,
    timestamp: timeLabel(post.created_at),
    createdAt: post.created_at?.toISOString?.() || new Date(post.created_at).toISOString(),
    likes: post.likes_count || 0,
    comments: post.comments_count || 0,
    shares: post.reposts_count || 0,
    likedByUser: interactions.liked.has(postId),
    starredByUser: interactions.starred.has(postId),
    category: post.category || "for-you",
    image: post.media?.[0] || undefined,
    images: post.media || [],
    archived: post.status === "archived",
    pinned: Boolean(post.pinned),
    canArchive: currentUser.id === post.author_id,
    canManage: currentUser.id === post.author_id,
  };
}

async function postsToDtos(posts, currentUser) {
  const authors = await authorsById(posts);
  const interactions = await interactionSets(currentUser.id, posts);

  return posts.map((post) => postToDto(post, authors.get(post.author_id), interactions, currentUser));
}

async function friendIdsFor(userId) {
  const [outgoing, incoming] = await Promise.all([
    Follow.findAll({ where: { follower_id: userId } }),
    Follow.findAll({ where: { followed_id: userId } }),
  ]);
  const outgoingIds = new Set(outgoing.map((follow) => follow.followed_id));
  const incomingIds = new Set(incoming.map((follow) => follow.follower_id));
  return new Set([...outgoingIds].filter((id) => incomingIds.has(id)));
}

async function filterPrivatePosts(posts, currentUser) {
  const authors = await authorsById(posts);
  const currentFriendIds = await friendIdsFor(currentUser.id);

  return posts.filter((post) => {
    const author = authors.get(post.author_id);
    if (!author) return false;
    if (author.id === currentUser.id) return true;
    if (!author.isPrivate) return true;
    return currentFriendIds.has(author.id);
  });
}

async function getVisiblePosts(query = {}) {
  return Post.find({
    status: "published",
    ...query,
  }).sort({ pinned: -1, created_at: -1 });
}

router.get("/posts", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) return;

  const category = String(req.query.category || "").trim();
  let query = {};

  if (category === "following" || category === "friends") {
    const [outgoing, incoming] = await Promise.all([
      Follow.findAll({ where: { follower_id: currentUser.id } }),
      category === "friends" ? Follow.findAll({ where: { followed_id: currentUser.id } }) : [],
    ]);
    const outgoingIds = new Set(outgoing.map((follow) => follow.followed_id));
    const incomingIds = new Set(incoming.map((follow) => follow.follower_id));
    const visibleAuthorIds = category === "friends"
      ? [...outgoingIds].filter((id) => incomingIds.has(id))
      : [...outgoingIds];

    if (visibleAuthorIds.length === 0) {
      return res.json([]);
    }

    query = { author_id: { $in: visibleAuthorIds } };
  } else {
    query = { author_id: { $ne: currentUser.id } };
  }

  const posts = await filterPrivatePosts(await getVisiblePosts(query), currentUser);

  return res.json(await postsToDtos(posts, currentUser));
});

router.get("/users/:username/posts", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) return;

  const targetUsername = normalizeUsername(req.params.username);
  const targetUser = await User.findOne({ where: { username: targetUsername } });

  if (!targetUser) {
    return res.status(404).json({ message: "Utilisateur introuvable." });
  }

  if (targetUser.isPrivate && targetUser.id !== currentUser.id) {
    const flags = await Promise.all([
      Follow.findOne({ where: { follower_id: currentUser.id, followed_id: targetUser.id } }),
      Follow.findOne({ where: { follower_id: targetUser.id, followed_id: currentUser.id } }),
    ]);
    if (!flags[0] || !flags[1]) {
      return res.json([]);
    }
  }

  const posts = await getVisiblePosts({ author_id: targetUser.id });
  return res.json(await postsToDtos(posts, currentUser));
});

router.get("/archive/posts", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) return;

  const posts = await Post.find({
    status: "archived",
    author_id: currentUser.id,
  }).sort({ pinned: -1, created_at: -1 });

  return res.json(await postsToDtos(posts, currentUser));
});

router.post("/posts", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) return;

  const content = String(req.body.content || "").trim();
  const title = String(req.body.title || "").trim().slice(0, 120);
  const category = req.body.category || "for-you";
  const image = String(req.body.image || "").trim();
  const images = Array.isArray(req.body.images)
    ? req.body.images.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 5)
    : [];
  const media = await storeGalleryImages(currentUser.id, [...images, ...(image ? [image] : [])].slice(0, 5));

  if (!content) {
    return res.status(400).json({ message: "Le contenu du post est obligatoire." });
  }

  const post = await Post.create({
    author_id: currentUser.id,
    title,
    content,
    category,
    media,
    status: "published",
    created_at: new Date(),
    updated_at: new Date(),
  });

  return res.status(201).json((await postsToDtos([post], currentUser))[0]);
});

router.post("/posts/:postId/archive", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) return;

  if (!isValidPostId(req.params.postId)) {
    return res.status(400).json({ message: "Identifiant de post invalide." });
  }

  const post = await Post.findById(req.params.postId);
  if (!post || post.author_id !== currentUser.id || post.status === "deleted") {
    return res.status(404).json({ message: "Post introuvable." });
  }

  post.status = post.status === "archived" ? "published" : "archived";
  post.updated_at = new Date();
  await post.save();

  return res.json((await postsToDtos([post], currentUser))[0]);
});

router.post("/posts/:postId/pin", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) return;

  if (!isValidPostId(req.params.postId)) {
    return res.status(400).json({ message: "Identifiant de post invalide." });
  }

  const post = await Post.findById(req.params.postId);
  if (!post || post.author_id !== currentUser.id || post.status === "deleted") {
    return res.status(404).json({ message: "Post introuvable." });
  }

  post.pinned = !post.pinned;
  post.updated_at = new Date();
  await post.save();

  return res.json((await postsToDtos([post], currentUser))[0]);
});

router.delete("/posts/:postId", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) return;

  if (!isValidPostId(req.params.postId)) {
    return res.status(400).json({ message: "Identifiant de post invalide." });
  }

  const post = await Post.findById(req.params.postId);
  if (!post || post.author_id !== currentUser.id || post.status === "deleted") {
    return res.status(404).json({ message: "Post introuvable." });
  }

  await deleteLocalUploads(post.media || []);
  post.status = "deleted";
  post.deleted_at = new Date();
  post.updated_at = new Date();
  post.media = [];
  post.pinned = false;
  await post.save();

  await Comment.updateMany({ post_id: post._id }, { status: "deleted", deleted_at: new Date(), updated_at: new Date() });
  await Promise.all([
    Post_Like.destroy({ where: { post_id: String(post._id) } }),
    Post_Star.destroy({ where: { post_id: String(post._id) } }),
  ]);

  return res.json({ id: String(post._id), deleted: true });
});

router.get("/comments", requireAuth, async (req, res) => {
  const postId = req.query.postId ? String(req.query.postId) : "";

  if (postId && !isValidPostId(postId)) {
    return res.status(400).json({ message: "Identifiant de post invalide." });
  }

  const query = { status: "published" };
  if (postId) {
    query.post_id = postId;
  }

  const comments = await Comment.find(query).sort({ created_at: 1 });
  const authorIds = [...new Set(comments.map((comment) => comment.author_id))];
  const users = authorIds.length ? await User.findAll({ where: { id: authorIds } }) : [];
  const usersById = new Map(users.map((user) => [user.id, user]));

  const grouped = {};
  for (const comment of comments) {
    const key = String(comment.post_id);
    const author = usersById.get(comment.author_id);
    if (!grouped[key]) {
      grouped[key] = [];
    }

    grouped[key].push({
      author: author?.name || "Utilisateur inconnu",
      username: author?.username || "",
      text: comment.content,
      time: timeLabel(comment.created_at),
    });
  }

  return res.json(postId ? { [postId]: grouped[postId] || [] } : grouped);
});

router.post("/posts/:postId/comments", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) return;

  if (!isValidPostId(req.params.postId)) {
    return res.status(400).json({ message: "Identifiant de post invalide." });
  }

  const post = await Post.findById(req.params.postId);
  if (!post || post.status !== "published") {
    return res.status(404).json({ message: "Post introuvable." });
  }

  const text = String(req.body.text || "").trim();
  if (!text) {
    return res.status(400).json({ message: "Le commentaire est vide." });
  }

  const comment = await Comment.create({
    post_id: post._id,
    author_id: currentUser.id,
    content: text,
    status: "published",
    created_at: new Date(),
    updated_at: new Date(),
  });

  post.comments_count = (post.comments_count || 0) + 1;
  post.updated_at = new Date();
  await post.save();

  return res.status(201).json({
    author: currentUser.name,
    username: currentUser.username,
    text: comment.content,
    time: timeLabel(comment.created_at),
  });
});

router.post("/posts/:postId/like", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) return;

  if (!isValidPostId(req.params.postId)) {
    return res.status(400).json({ message: "Identifiant de post invalide." });
  }

  const post = await Post.findById(req.params.postId);
  if (!post || post.status !== "published") {
    return res.status(404).json({ message: "Post introuvable." });
  }

  const postId = String(post._id);
  const existing = await Post_Like.findOne({ where: { user_id: currentUser.id, post_id: postId } });

  if (existing) {
    await existing.destroy();
    post.likes_count = Math.max(0, (post.likes_count || 0) - 1);
  } else {
    await Post_Like.create({ user_id: currentUser.id, post_id: postId });
    post.likes_count = (post.likes_count || 0) + 1;
  }

  post.updated_at = new Date();
  await post.save();

  return res.json((await postsToDtos([post], currentUser))[0]);
});

router.post("/posts/:postId/star", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) return;

  if (!isValidPostId(req.params.postId)) {
    return res.status(400).json({ message: "Identifiant de post invalide." });
  }

  const post = await Post.findById(req.params.postId);
  if (!post || post.status !== "published") {
    return res.status(404).json({ message: "Post introuvable." });
  }

  const postId = String(post._id);
  const existing = await Post_Star.findOne({ where: { user_id: currentUser.id, post_id: postId } });

  if (existing) {
    await existing.destroy();
  } else {
    await Post_Star.create({ user_id: currentUser.id, post_id: postId });
  }

  return res.json((await postsToDtos([post], currentUser))[0]);
});

export default router;
