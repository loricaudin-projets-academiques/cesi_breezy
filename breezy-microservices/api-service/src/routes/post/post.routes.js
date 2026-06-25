import { Router } from 'express';
import { getPostById } from '../../controllers/post/post.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/:id', requireAuth, getPostById);

export default router;
