import commentService from "../../services/post/comment.service.js";

export async function createPostComment(req, res) {
    try {
        const postId = req.params.id;
        const { content, parentCommentId } = req.body;

        const userId = req.user.id;

        const comment = await commentService.createComment({
            postId,
            userId,
            content,
            parentCommentId
        });

        return res.status(201).json(comment);

    } catch (err) {
        return res.status(400).json({
            message: err.message
        });
    }
}
