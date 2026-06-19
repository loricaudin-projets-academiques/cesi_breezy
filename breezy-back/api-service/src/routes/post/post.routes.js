import { Router } from 'express';
import { getPostById } from '../../controllers/post/post.controller.js';

const router = Router();

router.get('/:id', getPostById);

export default router;