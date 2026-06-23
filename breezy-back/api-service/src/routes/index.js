import { Router } from 'express';
import authRouter from './auth/auth.routes.js';
import feedRouter from './feed/feed.routes.js';
import conversationRouter from './conversation/conversation.routes.js';
import userRouter from './user/user.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/feed', feedRouter);
router.use('/conversations', conversationRouter);

export default router;
