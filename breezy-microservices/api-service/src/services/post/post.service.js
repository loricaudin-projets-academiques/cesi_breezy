import mongoose from "mongoose";

import Post from "../../databases/mongodb/models/post/post.js";
import User from "../../databases/postgresql/models/user/user.js";
import { createHttpError } from "../../utils/httpError.js";

async function getPostById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError(400, "Identifiant de post invalide.");
  }

  const post = await Post.findById(id);

  if (!post || post.status === "deleted") {
    throw createHttpError(404, "Post introuvable.");
  }

  const author = await User.findOne({ where: { id: post.author_id } });

  return {
    id: String(post._id),
    authorName: author?.name || "Utilisateur inconnu",
    authorUsername: author?.username || "",
    avatar: author?.avatar || "",
    title: post.title || "",
    content: post.content,
    createdAt: post.created_at?.toISOString?.() || new Date(post.created_at).toISOString(),
    likes: post.likes_count || 0,
    comments: post.comments_count || 0,
    shares: post.reposts_count || 0,
    category: post.category || "for-you",
    images: post.media || [],
    archived: post.status === "archived",
    pinned: Boolean(post.pinned),
  };
}

export default { getPostById };
