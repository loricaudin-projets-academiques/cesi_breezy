const express = require('express');

const router = express.Router();

router.use('/posts', require('./post/post.routes'));

module.exports = router;