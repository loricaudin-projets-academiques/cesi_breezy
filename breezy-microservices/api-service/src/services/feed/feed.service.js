import mongoose from "mongoose";

import User from "../../databases/postgresql/models/user/user.js";
import Post from "../../databases/mongodb/models/post/post.js";
import Comment from "../../databases/mongodb/models/comment/comment.js";
import Post_Like from "../../databases/postgresql/models/interaction/post_likes.js";
import Post_Star from "../../databases/postgresql/models/interaction/post_stars.js";
import Follow from "../../databases/postgresql/models/follow/follows.js";
import { normalizeUsername } from "../../utils/user.js";
import { deleteLocalUploads, storeGalleryImages } from "../../utils/media.js";
import { createHttpError } from "../../utils/httpError.js";
import { createNotification } from "../notification/notification.service.js";

const PARIS_TIME_ZONE = "Europe/Paris";

function isValidPostId(postId) {
  return mongoose.Types.ObjectId.isValid(postId);
}

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

function timeLabel(date) {
  const d = new Date(date);
  const diffMs = Date.now() - d.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `${diffMinutes} min`;

  const nowParis = new Date().toLocaleDateString("fr-FR", { timeZone: PARIS_TIME_ZONE });
  const dParis = d.toLocaleDateString("fr-FR", { timeZone: PARIS_TIME_ZONE });

  // Post du jour (>= 1h) : afficher l'heure réelle (HH:MM)
  if (nowParis === dParis) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: PARIS_TIME_ZONE });
  }

  // Post d'un autre jour : date + heure
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PARIS_TIME_ZONE,
  });
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
    tags: post.tags || [],
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

async function filterPrivatePosts(posts) {
  const authors = await authorsById(posts);
  return posts.filter((post) => !!authors.get(post.author_id));
}

async function getVisiblePosts(query = {}) {
  return Post.find({
    status: "published",
    ...query,
  }).sort({ pinned: -1, created_at: -1 });
}

async function getFeedPosts({ authUser, category, page = 1, limit = 20 }) {
  const currentUser = await getCurrentUser(authUser);
  const pageSize = Math.min(Math.max(Number.isFinite(Number(limit)) ? Number(limit) : 20, 1), 20);
  const currentPage = Math.max(Number.isFinite(Number(page)) ? Number(page) : 1, 1);
  const skip = (currentPage - 1) * pageSize;

  let mongoQuery;

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
      return { posts: [], page: currentPage, hasMore: false };
    }

    mongoQuery = { author_id: { $in: visibleAuthorIds } };
  } else {
    mongoQuery = {};
  }

  const fullQuery = { status: "published", ...mongoQuery };
  const [rawPosts, total] = await Promise.all([
    Post.find(fullQuery)
      .sort({ pinned: -1, created_at: -1 })
      .skip(skip)
      .limit(pageSize),
    Post.countDocuments(fullQuery),
  ]);

  const posts = await filterPrivatePosts(rawPosts);
  return {
    posts: await postsToDtos(posts, currentUser),
    page: currentPage,
    hasMore: skip + pageSize < total,
  };
}

async function getUserPosts({ authUser, username }) {
  const currentUser = await getCurrentUser(authUser);
  const targetUsername = normalizeUsername(username);
  const targetUser = await User.findOne({ where: { username: targetUsername } });

  if (!targetUser) {
    throw createHttpError(404, "Utilisateur introuvable.");
  }

  const posts = await getVisiblePosts({ author_id: targetUser.id });
  return postsToDtos(posts, currentUser);
}

async function getArchivedPosts({ authUser }) {
  const currentUser = await getCurrentUser(authUser);
  const posts = await Post.find({
    status: "archived",
    author_id: currentUser.id,
  }).sort({ pinned: -1, created_at: -1 });

  return postsToDtos(posts, currentUser);
}

async function notifyMentions({ texts, actorId, postId, postTitle = "" }) {
  const rawMentions = texts.flatMap((t) =>
    [...(String(t || "").matchAll(/\B@(\w{1,50})/g))].map((m) => `@${m[1].toLowerCase()}`)
  );
  const uniqueMentions = [...new Set(rawMentions)].slice(0, 5);
  if (!uniqueMentions.length) return uniqueMentions;

  const mentionedUsers = await User.findAll({ where: { username: uniqueMentions } });

  await Promise.all(
    mentionedUsers
      .filter((u) => u.id !== actorId)
      .map((u) =>
        createNotification({
          recipientId: u.id,
          actorId,
          type: "mention",
          targetType: "post",
          targetId: postId,
          metadata: { excerpt: texts.filter(Boolean).join(" ").slice(0, 160), postTitle },
        }).catch(() => null)
      )
  );

  return uniqueMentions.map((m) => m.slice(1));
}

async function createPost({ authUser, title, content, category = "for-you", image = "", images = [], tags = [] }) {
  const currentUser = await getCurrentUser(authUser);
  const text = String(content || "").trim();

  if (!text) {
    throw createHttpError(400, "Le contenu du post est obligatoire.");
  }
  if (String(title || "").length > 100) {
    throw createHttpError(400, "Le titre ne peut pas dépasser 100 caractères.");
  }
  if (text.length > 280) {
    throw createHttpError(400, "Le contenu ne peut pas dépasser 280 caractères.");
  }

  const cleanTags = Array.isArray(tags)
    ? [...new Set(
        tags
          .map((t) => String(t || "").toLowerCase().replace(/^#+/, "").replace(/[^a-z0-9_]/g, "").trim())
          .filter((t) => t.length > 0 && t.length <= 20)
      )].slice(0, 5)
    : [];

  const media = await storeGalleryImages(
    currentUser.id,
    [...images, ...(image ? [image] : [])].slice(0, 5)
  );

  const post = await Post.create({
    author_id: currentUser.id,
    title,
    content: text,
    category,
    tags: cleanTags,
    media,
    status: "published",
    created_at: new Date(),
    updated_at: new Date(),
  });

  const mentionedUsernames = await notifyMentions({
    texts: [title, text].filter(Boolean),
    actorId: currentUser.id,
    postId: post._id,
    postTitle: title || text.slice(0, 80),
  });

  if (mentionedUsernames.length) {
    post.mentions = mentionedUsernames;
    await post.save();
  }

  return (await postsToDtos([post], currentUser))[0];
}

async function findOwnPost({ authUser, postId }) {
  const currentUser = await getCurrentUser(authUser);

  if (!isValidPostId(postId)) {
    throw createHttpError(400, "Identifiant de post invalide.");
  }

  const post = await Post.findById(postId);
  if (!post || post.author_id !== currentUser.id || post.status === "deleted") {
    throw createHttpError(404, "Post introuvable.");
  }

  return { currentUser, post };
}

async function toggleArchive({ authUser, postId }) {
  const { currentUser, post } = await findOwnPost({ authUser, postId });

  post.status = post.status === "archived" ? "published" : "archived";
  post.updated_at = new Date();
  await post.save();

  return (await postsToDtos([post], currentUser))[0];
}

async function togglePin({ authUser, postId }) {
  const { currentUser, post } = await findOwnPost({ authUser, postId });

  post.pinned = !post.pinned;
  post.updated_at = new Date();
  await post.save();

  return (await postsToDtos([post], currentUser))[0];
}

async function deletePost({ authUser, postId }) {
  const { post } = await findOwnPost({ authUser, postId });

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

  return { id: String(post._id), deleted: true };
}

async function getComments({ postId, page = 1, limit = 20 }) {
  if (postId && !isValidPostId(postId)) {
    throw createHttpError(400, "Identifiant de post invalide.");
  }

  const currentPage = Number.isFinite(page) && page > 0 ? page : 1;
  const pageSize = Math.min(Math.max(Number.isFinite(limit) && limit > 0 ? limit : 20, 1), 20);
  // Uniquement les commentaires de premier niveau (pas les réponses)
  const query = { status: "published", parent_comment_id: null };
  if (postId) {
    query.post_id = postId;
  }

  const [comments, total] = await Promise.all([
    Comment.find(query)
      .sort({ created_at: 1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize),
    Comment.countDocuments(query),
  ]);
  const authorIds = [...new Set(comments.map((comment) => comment.author_id))];
  const users = authorIds.length ? await User.findAll({ where: { id: authorIds } }) : [];
  const usersById = new Map(users.map((user) => [user.id, user]));

  const items = comments.map((comment) => {
    const author = usersById.get(comment.author_id);
    return {
      id: String(comment._id),
      author: author?.name || "Utilisateur inconnu",
      username: author?.username || "",
      text: comment.content,
      time: timeLabel(comment.created_at),
      repliesCount: comment.replies_count || 0,
    };
  });

  return {
    comments: items,
    page: currentPage,
    limit: pageSize,
    total,
    hasMore: currentPage * pageSize < total,
  };
}

async function getCommentReplies({ commentId }) {
  if (!isValidPostId(commentId)) {
    throw createHttpError(400, "Identifiant de commentaire invalide.");
  }

  const replies = await Comment.find({
    parent_comment_id: new mongoose.Types.ObjectId(commentId),
    status: "published",
  }).sort({ created_at: 1 });

  if (!replies.length) return [];

  const authorIds = [...new Set(replies.map((r) => r.author_id))];
  const users = await User.findAll({ where: { id: authorIds } });
  const usersById = new Map(users.map((u) => [u.id, u]));

  return replies.map((reply) => {
    const author = usersById.get(reply.author_id);
    return {
      id: String(reply._id),
      author: author?.name || "Utilisateur inconnu",
      username: author?.username || "",
      text: reply.content,
      time: timeLabel(reply.created_at),
      repliesCount: reply.replies_count || 0,
    };
  });
}

async function createComment({ authUser, postId, text, parentCommentId = null }) {
  const currentUser = await getCurrentUser(authUser);

  if (!isValidPostId(postId)) {
    throw createHttpError(400, "Identifiant de post invalide.");
  }

  const post = await Post.findById(postId);
  if (!post || post.status !== "published") {
    throw createHttpError(404, "Post introuvable.");
  }

  let parentComment = null;
  if (parentCommentId) {
    if (!isValidPostId(parentCommentId)) {
      throw createHttpError(400, "Identifiant de commentaire parent invalide.");
    }
    parentComment = await Comment.findById(parentCommentId);
    if (!parentComment || parentComment.status !== "published") {
      throw createHttpError(404, "Commentaire parent introuvable.");
    }
  }

  const cleanText = String(text || "").trim();
  if (!cleanText) {
    throw createHttpError(400, "Le commentaire est vide.");
  }

  const comment = await Comment.create({
    post_id: post._id,
    parent_comment_id: parentComment ? parentComment._id : null,
    author_id: currentUser.id,
    content: cleanText,
    status: "published",
    created_at: new Date(),
    updated_at: new Date(),
  });

  if (parentComment) {
    parentComment.replies_count = (parentComment.replies_count || 0) + 1;
    parentComment.updated_at = new Date();
    await parentComment.save();

    await createNotification({
      recipientId: parentComment.author_id,
      actorId: currentUser.id,
      type: "reply",
      targetType: "comment",
      targetId: comment._id,
      metadata: {
        excerpt: cleanText.slice(0, 160),
        postTitle: post.title || post.content.slice(0, 80),
      },
    });
  } else {
    post.comments_count = (post.comments_count || 0) + 1;
    post.updated_at = new Date();
    await post.save();

    await createNotification({
      recipientId: post.author_id,
      actorId: currentUser.id,
      type: "comment",
      targetType: "post",
      targetId: post._id,
      metadata: {
        excerpt: cleanText.slice(0, 160),
        postTitle: post.title || post.content.slice(0, 80),
      },
    });
  }

  const commentMentions = await notifyMentions({
    texts: [cleanText],
    actorId: currentUser.id,
    postId: post._id,
    postTitle: post.title || post.content.slice(0, 80),
  });

  if (commentMentions.length) {
    comment.mentions = commentMentions;
    await comment.save();
  }

  return {
    id: String(comment._id),
    author: currentUser.name,
    username: currentUser.username,
    text: comment.content,
    time: timeLabel(comment.created_at),
    repliesCount: 0,
  };
}

async function findPublishedPost({ authUser, postId }) {
  const currentUser = await getCurrentUser(authUser);

  if (!isValidPostId(postId)) {
    throw createHttpError(400, "Identifiant de post invalide.");
  }

  const post = await Post.findById(postId);
  if (!post || post.status !== "published") {
    throw createHttpError(404, "Post introuvable.");
  }

  return { currentUser, post };
}

async function toggleLike({ authUser, postId }) {
  const { currentUser, post } = await findPublishedPost({ authUser, postId });
  const id = String(post._id);
  const existing = await Post_Like.findOne({ where: { user_id: currentUser.id, post_id: id } });

  if (existing) {
    await existing.destroy();
    post.likes_count = Math.max(0, (post.likes_count || 0) - 1);
  } else {
    await Post_Like.create({ user_id: currentUser.id, post_id: id });
    post.likes_count = (post.likes_count || 0) + 1;
    await createNotification({
      recipientId: post.author_id,
      actorId: currentUser.id,
      type: "like",
      targetType: "post",
      targetId: post._id,
      metadata: {
        excerpt: post.title || post.content.slice(0, 120),
      },
    });
  }

  post.updated_at = new Date();
  await post.save();

  return (await postsToDtos([post], currentUser))[0];
}

async function toggleStar({ authUser, postId }) {
  const { currentUser, post } = await findPublishedPost({ authUser, postId });
  const id = String(post._id);
  const existing = await Post_Star.findOne({ where: { user_id: currentUser.id, post_id: id } });

  if (existing) {
    await existing.destroy();
  } else {
    await Post_Star.create({ user_id: currentUser.id, post_id: id });
  }

  return (await postsToDtos([post], currentUser))[0];
}

async function searchPostsByTag({ authUser, tag, page = 1, limit = 20 }) {
  const currentUser = await getCurrentUser(authUser);
  const cleanTag = String(tag || "").toLowerCase().replace(/^#+/, "").replace(/[^a-z0-9_]/g, "").trim();

  if (!cleanTag) return { posts: [], page: 1, hasMore: false };

  const pageSize = Math.min(Math.max(Number.isFinite(Number(limit)) ? Number(limit) : 20, 1), 20);
  const currentPage = Math.max(Number.isFinite(Number(page)) ? Number(page) : 1, 1);
  const skip = (currentPage - 1) * pageSize;

  const fullQuery = { status: "published", tags: cleanTag };
  const [rawPosts, total] = await Promise.all([
    Post.find(fullQuery)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(pageSize),
    Post.countDocuments(fullQuery),
  ]);

  return {
    posts: await postsToDtos(rawPosts, currentUser),
    page: currentPage,
    hasMore: skip + pageSize < total,
  };
}

async function updatePost({ authUser, postId, title, content }) {
  const { currentUser, post } = await findOwnPost({ authUser, postId });

  const text = String(content || "").trim();
  if (!text) {
    throw createHttpError(400, "Le contenu du post est obligatoire.");
  }
  if (String(title || "").length > 100) {
    throw createHttpError(400, "Le titre ne peut pas dépasser 100 caractères.");
  }
  if (text.length > 280) {
    throw createHttpError(400, "Le contenu ne peut pas dépasser 280 caractères.");
  }

  post.title = title;
  post.content = text;
  post.updated_at = new Date();
  await post.save();

  return (await postsToDtos([post], currentUser))[0];
}

export {
  createComment,
  createPost,
  deletePost,
  getArchivedPosts,
  getCommentReplies,
  getComments,
  getFeedPosts,
  getUserPosts,
  searchPostsByTag,
  toggleArchive,
  toggleLike,
  togglePin,
  toggleStar,
  updatePost,
};
