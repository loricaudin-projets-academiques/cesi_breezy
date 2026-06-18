const express = require('express');

const router = express.Router();

router.use('/posts', require('./post/post.routes'));
router.use('/auth', require('./auth/auth.routes'));
router.use('/feed', require('./feed/feed.routes'));
router.use('/conversations', require('./conversation/conversation.routes'));
router.use('/uploads', require('./upload/upload.routes'));

module.exports = router;
