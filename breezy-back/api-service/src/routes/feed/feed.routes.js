import { Router } from "express";
import mongoose from "mongoose";

import User from "../../databases/postgresql/models/user/user.js";
import Post from "../../databases/mongodb/models/post/post.js";
import Comment from "../../databases/mongodb/models/comment/comment.js";
import Post_Like from "../../databases/postgresql/models/interaction/post_likes.js";
import Post_Star from "../../databases/postgresql/models/interaction/post_stars.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { normalizeUsername } from "../../utils/user.js";

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

function postToDto(post, author, interactions) {
  const postId = String(post._id);

  return {
    id: postId,
    authorName: author?.name || "Utilisateur inconnu",
    authorUsername: author?.username || "",
    avatar: author?.avatar || "",
    content: post.content,
    timestamp: timeLabel(post.created_at),
    likes: post.likes_count || 0,
    comments: post.comments_count || 0,
    shares: post.reposts_count || 0,
    likedByUser: interactions.liked.has(postId),
    starredByUser: interactions.starred.has(postId),
    category: post.category || "for-you",
    image: post.media?.[0] || undefined,
  };
}

async function postsToDtos(posts, currentUser) {
  const authors = await authorsById(posts);
  const interactions = await interactionSets(currentUser.id, posts);

  return posts.map((post) => postToDto(post, authors.get(post.author_id), interactions));
}

async function getVisiblePosts(query = {}) {
  return Post.find({
    status: "published",
    ...query,
  }).sort({ created_at: -1 });
}

router.get("/posts", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) return;

  const category = String(req.query.category || "").trim();
  const query = category ? { category } : {};
  const posts = await getVisiblePosts(query);

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

  const posts = await getVisiblePosts({ author_id: targetUser.id });
  return res.json(await postsToDtos(posts, currentUser));
});

router.post("/posts", requireAuth, async (req, res) => {
  const currentUser = await getCurrentUser(req, res);
  if (!currentUser) return;

  const content = String(req.body.content || "").trim();
  const category = req.body.category || "for-you";
  const image = String(req.body.image || "").trim();

  if (!content) {
    return res.status(400).json({ message: "Le contenu du post est obligatoire." });
  }

  const post = await Post.create({
    author_id: currentUser.id,
    content,
    category,
    media: image ? [image] : [],
    status: "published",
    created_at: new Date(),
    updated_at: new Date(),
  });

  return res.status(201).json((await postsToDtos([post], currentUser))[0]);
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
