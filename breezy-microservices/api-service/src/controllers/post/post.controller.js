import postService from '../../services/post/post.service.js';

export async function getPostById(req, res, next) {
  try {
    const post = await postService.getPostById(req.params.id);
    return res.json(post);
  } catch (error) {
    return next(error);
  }
}
