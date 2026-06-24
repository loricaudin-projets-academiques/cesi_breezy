import { Router } from "express";

import {
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
} from "../../controllers/feed/feed.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/posts", requireAuth, fetchPosts);
router.get("/users/:username/posts", requireAuth, fetchUserPosts);
router.get("/archive/posts", requireAuth, fetchArchivedPosts);
router.post("/posts", requireAuth, publishPost);
router.post("/posts/:postId/archive", requireAuth, archivePost);
router.post("/posts/:postId/pin", requireAuth, pinPost);
router.delete("/posts/:postId", requireAuth, removePost);
router.get("/comments", requireAuth, fetchComments);
router.post("/posts/:postId/comments", requireAuth, addComment);
router.post("/posts/:postId/like", requireAuth, likePost);
router.post("/posts/:postId/star", requireAuth, starPost);

export default router;
