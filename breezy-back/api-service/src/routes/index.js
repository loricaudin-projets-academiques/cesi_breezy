import { Router } from 'express';
import postRouter from './post/post.routes.js';
import commentRouter from './post/comment.routes.js';
import authRouter from './auth/auth.routes.js';
import feedRouter from './feed/feed.routes.js';
import conversationRouter from './conversation/conversation.routes.js';
import userRouter from './user/user.routes.js';

const router = Router();

router.use('/posts', postRouter);
router.use('/posts/:id/comments', commentRouter);
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/feed', feedRouter);
router.use('/conversations', conversationRouter);

export default router;
