import postService from '../../services/post/post.service';
import CommentService from '../../services/post/post.service';

export async function createPostComment(req, res) {
    const id = req.params['id'];
    const post = await postService.getPostById(id);

    try {
        res.status(200).json({ message: "Success" });
    } catch (err) {
        res.status(400).json({ message: `Error: ${err}` });
    }
    
}
