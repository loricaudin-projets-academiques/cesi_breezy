import { Router } from 'express';
import { createPostComment } from '../../controllers/post/comment.controller.js';

const router = Router();

router.post('/', createPostComment);

export default router;