const express = require('express');

const router = express.Router();

const postController = require('../../controllers/post/post.controller');

router.get('/:id', postController.getPostById);

module.exports = router;