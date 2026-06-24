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
const MAX_PAGE_SIZE = 20;

function paginationValues(page = 1, limit = MAX_PAGE_SIZE) {
  const currentPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const pageSize = Math.min(
    Math.max(Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : MAX_PAGE_SIZE, 1),
    MAX_PAGE_SIZE
  );

  return {
    skip: (currentPage - 1) * pageSize,
    limit: pageSize,
  };
}

function isValidPostId(postId) {
  return mongoose.Types.ObjectId.isValid(postId);
}

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
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "A l'instant";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} h`;
  }

  return new Date(date).toLocaleDateString("fr-FR", { timeZone: PARIS_TIME_ZONE });
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
    if (!author) {
      return false;
    }
    if (author.id === currentUser.id) {
      return true;
    }
    if (!author.isPrivate) {
      return true;
    }
    return currentFriendIds.has(author.id);
  });
}

async function getVisiblePosts(query = {}, page = 1, limit = MAX_PAGE_SIZE) {
  const pagination = paginationValues(page, limit);
  return Post.find({
    status: "published",
    ...query,
  })
    .sort({ pinned: -1, created_at: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);
}

async function getFeedPosts({ authUser, category, page = 1, limit = MAX_PAGE_SIZE }) {
  const currentUser = await getCurrentUser(authUser);
  let query;

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
      return [];
    }

    query = { author_id: { $in: visibleAuthorIds } };
  } else {
    query = { author_id: { $ne: currentUser.id } };
  }

  const posts = await filterPrivatePosts(await getVisiblePosts(query, page, limit), currentUser);
  return postsToDtos(posts, currentUser);
}

async function getUserPosts({ authUser, username, page = 1, limit = MAX_PAGE_SIZE }) {
  const currentUser = await getCurrentUser(authUser);
  const targetUsername = normalizeUsername(username);
  const targetUser = await User.findOne({ where: { username: targetUsername } });

  if (!targetUser) {
    throw createHttpError(404, "Utilisateur introuvable.");
  }

  if (targetUser.isPrivate && targetUser.id !== currentUser.id) {
    const flags = await Promise.all([
      Follow.findOne({ where: { follower_id: currentUser.id, followed_id: targetUser.id } }),
      Follow.findOne({ where: { follower_id: targetUser.id, followed_id: currentUser.id } }),
    ]);
    if (!flags[0] || !flags[1]) {
      return [];
    }
  }

  const posts = await getVisiblePosts({ author_id: targetUser.id }, page, limit);
  return postsToDtos(posts, currentUser);
}

async function getArchivedPosts({ authUser, page = 1, limit = MAX_PAGE_SIZE }) {
  const currentUser = await getCurrentUser(authUser);
  const pagination = paginationValues(page, limit);
  const posts = await Post.find({
    status: "archived",
    author_id: currentUser.id,
  })
    .sort({ pinned: -1, created_at: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  return postsToDtos(posts, currentUser);
}

async function createPost({ authUser, title, content, category = "for-you", image = "", images = [] }) {
  const currentUser = await getCurrentUser(authUser);
  const text = String(content || "").trim();

  if (!text) {
    throw createHttpError(400, "Le contenu du post est obligatoire.");
  }
  if (String(title || "").length > 100) {
    throw createHttpError(400, "Le titre ne peut pas depasser 100 caracteres.");
  }
  if (text.length > 5000) {
    throw createHttpError(400, "Le contenu ne peut pas depasser 5000 caracteres.");
  }

  const media = await storeGalleryImages(
    currentUser.id,
    [...images, ...(image ? [image] : [])].slice(0, 5)
  );

  const post = await Post.create({
    author_id: currentUser.id,
    title,
    content: text,
    category,
    media,
    status: "published",
    created_at: new Date(),
    updated_at: new Date(),
  });

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
  const pageSize = paginationValues(1, limit).limit;
  const query = { status: "published" };
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
      author: author?.name || "Utilisateur inconnu",
      username: author?.username || "",
      text: comment.content,
      time: timeLabel(comment.created_at),
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

async function createComment({ authUser, postId, text }) {
  const currentUser = await getCurrentUser(authUser);

  if (!isValidPostId(postId)) {
    throw createHttpError(400, "Identifiant de post invalide.");
  }

  const post = await Post.findById(postId);
  if (!post || post.status !== "published") {
    throw createHttpError(404, "Post introuvable.");
  }

  const cleanText = String(text || "").trim();
  if (!cleanText) {
    throw createHttpError(400, "Le commentaire est vide.");
  }

  const comment = await Comment.create({
    post_id: post._id,
    author_id: currentUser.id,
    content: cleanText,
    status: "published",
    created_at: new Date(),
    updated_at: new Date(),
  });

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

  return {
    author: currentUser.name,
    username: currentUser.username,
    text: comment.content,
    time: timeLabel(comment.created_at),
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

export {
  createComment,
  createPost,
  deletePost,
  getArchivedPosts,
  getComments,
  getFeedPosts,
  getUserPosts,
  toggleArchive,
  toggleLike,
  togglePin,
  toggleStar,
};
