import { Router } from "express";

import {
  fetchMe,
  fetchPublicProfile,
  fetchRelationList,
  findUsers,
  follow,
  patchMe,
  unfollow,
} from "../../controllers/user/user.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/me", requireAuth, fetchMe);
router.patch("/me", requireAuth, patchMe);
router.get("/search", requireAuth, findUsers);
router.get("/profile/:username", requireAuth, fetchPublicProfile);
router.post("/:username/follow", requireAuth, follow);
router.delete("/:username/follow", requireAuth, unfollow);
router.get("/:type", requireAuth, fetchRelationList);

export default router;
