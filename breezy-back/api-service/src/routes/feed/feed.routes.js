const express = require("express");

const {
  users,
  posts,
  commentsByPost,
  likedPostsByUser,
  starredPostsByUser
} = require("../../data/memory-store").default;
const { createId } = require("../../utils/ids");
const { requireAuth } = require("../../middlewares/auth.middleware");
const { removeVideoByUrl } = require("../../utils/video");

const router = express.Router();

function nowLabel() {
  return "A l'instant";
}

function getSet(map, key) {
  if (!map.has(key)) {
    map.set(key, new Set());
  }

  return map.get(key);
}

function getPostForUser(post, username) {
  const liked = getSet(likedPostsByUser, username);
  const starred = getSet(starredPostsByUser, username);

  return {
    ...post,
    likedByUser: liked.has(post.id),
    starredByUser: starred.has(post.id),
  };
}

router.get("/posts", requireAuth, (req, res) => {
  const category = req.query.category;
  const visiblePosts = category
    ? posts.filter((post) => post.category === category)
    : posts;

  return res.json(visiblePosts.map((post) => getPostForUser(post, req.user.username)));
});

router.post("/posts", requireAuth, (req, res) => {
  const currentUser = users.get(req.user.username);

  if (!currentUser) {
    return res.status(401).json({ message: "Utilisateur introuvable." });
  }

  const content = String(req.body.content || "").trim();
  const category = req.body.category || "for-you";

  if (!content) {
    return res.status(400).json({ message: "Le contenu du post est obligatoire." });
  }

  const post = {
    id: createId("post"),
    authorName: currentUser.name,
    authorUsername: currentUser.username,
    avatar: currentUser.avatar,
    content,
    timestamp: nowLabel(),
    likes: 0,
    comments: 0,
    shares: 0,
    likedByUser: false,
    starredByUser: false,
    category,
    image: req.body.image || undefined,
    video: req.body.video || undefined,
  };

  posts.unshift(post);
  return res.status(201).json(getPostForUser(post, req.user.username));
});

router.delete("/posts/:postId", requireAuth, (req, res) => {
  const idx = posts.findIndex((p) => p.id === req.params.postId);
  if (idx === -1) return res.status(404).json({ message: "Post introuvable." });

  const [removed] = posts.splice(idx, 1);
  if (removed.video) removeVideoByUrl(removed.video);
  commentsByPost.get(removed.id)?.forEach((c) => c.video && removeVideoByUrl(c.video));
  commentsByPost.delete(removed.id);

  return res.status(204).end();
});

router.get("/comments", requireAuth, (req, res) => {
  const postId = req.query.postId;

  if (postId) {
    return res.json({ [postId]: commentsByPost.get(postId) || [] });
  }

  return res.json(Object.fromEntries(commentsByPost.entries()));
});

router.post("/posts/:postId/comments", requireAuth, (req, res) => {
  const post = posts.find((item) => item.id === req.params.postId);
  const currentUser = users.get(req.user.username);

  if (!post) {
    return res.status(404).json({ message: "Post introuvable." });
  }

  const text = String(req.body.text || "").trim();
  const video = req.body.video || undefined;

  if (!text && !video) {
    return res.status(400).json({ message: "Le commentaire est vide." });
  }

  const comment = {
    author: currentUser.name,
    username: currentUser.username,
    text,
    video,
    time: nowLabel(),
  };
  const comments = commentsByPost.get(post.id) || [];
  commentsByPost.set(post.id, [...comments, comment]);
  post.comments += 1;

  return res.status(201).json(comment);
});

router.post("/posts/:postId/like", requireAuth, (req, res) => {
  const post = posts.find((item) => item.id === req.params.postId);
  if (!post) {
    return res.status(404).json({ message: "Post introuvable." });
  }

  const liked = getSet(likedPostsByUser, req.user.username);
  if (liked.has(post.id)) {
    liked.delete(post.id);
    post.likes = Math.max(0, post.likes - 1);
  } else {
    liked.add(post.id);
    post.likes += 1;
  }

  return res.json(getPostForUser(post, req.user.username));
});

router.post("/posts/:postId/star", requireAuth, (req, res) => {
  const post = posts.find((item) => item.id === req.params.postId);
  if (!post) {
    return res.status(404).json({ message: "Post introuvable." });
  }

  const starred = getSet(starredPostsByUser, req.user.username);
  if (starred.has(post.id)) {
    starred.delete(post.id);
  } else {
    starred.add(post.id);
  }

  return res.json(getPostForUser(post, req.user.username));
});

module.exports = router;
