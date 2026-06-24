import postService from '../../services/post/post.service.js';

export async function getPostById(req, res) {
    const id = req.params.id;
    const post = await postService.getPostById(id);
    res.status(200).json({ test: post });
}
