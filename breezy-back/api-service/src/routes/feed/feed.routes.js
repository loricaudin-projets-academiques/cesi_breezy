import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import { createPost, fetchComments, fetchPosts, createPostComment, likePost, starPost } from "../../controllers/post/feed.controller.js";

const router = Router();

router.get("/posts", requireAuth, fetchPosts);
router.post("/posts", requireAuth, createPost);
router.get("/comments", requireAuth, fetchComments);
router.post("/posts/:postId/comments", requireAuth, createPostComment);
router.post("/posts/:postId/like", requireAuth, likePost);
router.post("/posts/:postId/like", requireAuth, likePost);
router.post("/posts/:postId/star", requireAuth, starPost);

export default router;
