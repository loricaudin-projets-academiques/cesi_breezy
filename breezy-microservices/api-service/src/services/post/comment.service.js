import Comment from "../../databases/mongodb/models/comment/comment.js";
import postService from "./post.service.js";

async function createComment({ postId, userId, content, parentCommentId = null }) {

    const text = String(content || "").trim();

    if (!text) {
        throw new Error("Aucun commentaire n'est renseigné");
    }

    const post = await postService.getPostById(postId);
    if (!post && !parentCommentId) {
        throw new Error("Post introuvable");
    }

    if (parentCommentId) {
        const parent = await Comment.findById(parentCommentId);
        if (!parent) {
            throw new Error("Commentaire parent introuvable");
        }
    }

    const comment = await Comment.create({
        post_id: postId,
        parent_comment_id: parentCommentId,
        author_id: userId,
        content: text,
        status: "published"
    });

    if (parentCommentId) {
        await Comment.findByIdAndUpdate(parentCommentId, {
            $inc: { replies_count: 1 }
        });
    }

    return comment;
}

export default { createComment };