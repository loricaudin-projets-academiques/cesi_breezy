const express = require('express');

const router = express.Router();

const commentController = require('../../controllers/post/comment.controller');

router.post('/', commentController.createPostComment);

module.exports = router;