import {
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
} from "../../services/feed/feed.service.js";

async function fetchPosts(req, res, next) {
  try {
    const category = String(req.query.category || "").trim();
    const posts = await getFeedPosts({ authUser: req.user, category });
    return res.json(posts);
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

    const post = await createPost({
      authUser: req.user,
      title: String(req.body.title || "").trim(),
      content: req.body.content,
      category: req.body.category || "for-you",
      image,
      images,
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
    });
    return res.status(201).json(comment);
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

export {
  addComment,
  archivePost,
  fetchArchivedPosts,
  fetchComments,
  fetchPosts,
  fetchUserPosts,
  likePost,
  pinPost,
  publishPost,
  removePost,
  starPost,
};
