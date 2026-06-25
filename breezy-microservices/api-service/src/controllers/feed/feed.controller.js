import {
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
} from "../../services/feed/feed.service.js";


async function fetchPosts(req, res, next) {
  try {
    const category = String(req.query.category || "").trim();
    const page = Number.parseInt(String(req.query.page || "1"), 10);
    const limit = Number.parseInt(String(req.query.limit || "20"), 10);
    return res.json(await getFeedPosts({ authUser: req.user, category, page, limit }));
  } catch (error) {
    return next(error);
  }
}

async function fetchUserPosts(req, res, next) {
  try {
    const posts = await getUserPosts({
      authUser: req.user,
      username: req.params.username,
    });
    return res.json(posts);
  } catch (error) {
    return next(error);
  }
}

async function fetchArchivedPosts(req, res, next) {
  try {
    return res.json(await getArchivedPosts({ authUser: req.user }));
  } catch (error) {
    return next(error);
  }
}

async function publishPost(req, res, next) {
  try {
    const image = String(req.body.image || "").trim();
    const images = Array.isArray(req.body.images)
      ? req.body.images.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 5)
      : [];

    const tags = Array.isArray(req.body.tags) ? req.body.tags : [];

    const post = await createPost({
      authUser: req.user,
      title: String(req.body.title || "").trim(),
      content: req.body.content,
      category: req.body.category || "for-you",
      image,
      images,
      tags,
    });

    return res.status(201).json(post);
  } catch (error) {
    return next(error);
  }
}

async function archivePost(req, res, next) {
  try {
    return res.json(await toggleArchive({ authUser: req.user, postId: req.params.postId }));
  } catch (error) {
    return next(error);
  }
}

async function pinPost(req, res, next) {
  try {
    return res.json(await togglePin({ authUser: req.user, postId: req.params.postId }));
  } catch (error) {
    return next(error);
  }
}

async function removePost(req, res, next) {
  try {
    return res.json(await deletePost({ authUser: req.user, postId: req.params.postId }));
  } catch (error) {
    return next(error);
  }
}

async function fetchComments(req, res, next) {
  try {
    const postId = req.query.postId ? String(req.query.postId) : "";
    const page = Number.parseInt(String(req.query.page || "1"), 10);
    const limit = Number.parseInt(String(req.query.limit || "20"), 10);
    return res.json(await getComments({ postId, page, limit }));
  } catch (error) {
    return next(error);
  }
}

async function addComment(req, res, next) {
  try {
    const comment = await createComment({
      authUser: req.user,
      postId: req.params.postId,
      text: req.body.text,
      parentCommentId: req.body.parentCommentId || null,
    });
    return res.status(201).json(comment);
  } catch (error) {
    return next(error);
  }
}

async function fetchCommentReplies(req, res, next) {
  try {
    return res.json(await getCommentReplies({ commentId: req.params.commentId }));
  } catch (error) {
    return next(error);
  }
}

async function searchByTag(req, res, next) {
  try {
    const tag = String(req.query.tag || "").trim();
    const page = Number.parseInt(String(req.query.page || "1"), 10);
    const limit = Number.parseInt(String(req.query.limit || "20"), 10);
    return res.json(await searchPostsByTag({ authUser: req.user, tag, page, limit }));
  } catch (error) {
    return next(error);
  }
}

async function likePost(req, res, next) {
  try {
    return res.json(await toggleLike({ authUser: req.user, postId: req.params.postId }));
  } catch (error) {
    return next(error);
  }
}

async function starPost(req, res, next) {
  try {
    return res.json(await toggleStar({ authUser: req.user, postId: req.params.postId }));
  } catch (error) {
    return next(error);
  }
}

async function modifyPost(req, res, next) {
  try {
    const post = await updatePost({
      authUser: req.user,
      postId: req.params.postId,
      title: String(req.body.title || "").trim(),
      content: req.body.content,
    });
    return res.json(post);
  } catch (error) {
    return next(error);
  }
}

export {
  addComment,
  archivePost,
  fetchArchivedPosts,
  fetchCommentReplies,
  fetchComments,
  fetchPosts,
  fetchUserPosts,
  likePost,
  pinPost,
  publishPost,
  removePost,
  searchByTag,
  starPost,
  modifyPost,
};
