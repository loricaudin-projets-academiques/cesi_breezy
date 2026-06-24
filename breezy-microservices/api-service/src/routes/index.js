import { Router } from 'express';
import postRouter from './post/post.routes.js';
import commentRouter from './post/comment.routes.js';
import feedRouter from './feed/feed.routes.js';
import conversationRouter from './conversation/conversation.routes.js';
import userRouter from './user/user.routes.js';
import notificationRouter from './notification/notification.routes.js';

const router = Router();

router.use('/posts', postRouter);
router.use('/posts/:id/comments', commentRouter);
router.use('/users', userRouter);
router.use('/feed', feedRouter);
router.use('/conversations', conversationRouter);
router.use('/notifications', notificationRouter);

export default router;
