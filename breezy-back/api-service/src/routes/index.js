import { Router } from 'express';
import postRouter from './post/post.routes.js';
import commentRouter from './post/comment.routes.js';
import authRouter from './auth/auth.routes.js';
import feedRouter from './feed/feed.routes.js';
import conversationRouter from './conversation/conversation.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/feed', feedRouter);
router.use('/conversations', conversationRouter);

export default router;
