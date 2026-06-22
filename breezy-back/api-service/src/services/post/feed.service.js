import Comment from "../../databases/mongodb/models/comment/comment.js";
import Post from "../../databases/mongodb/models/post/post.js";

async function getPostById(id) {
    const post = await Post.findById(id);
    return post;
}

async function createPostComment({ postId, userId, content, parentCommentId = null }) {

    const text = String(content || "").trim();

    if (!text) {
        throw new Error("Aucun commentaire n'est renseigné");
    }

    const post = await getPostById(postId);
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

export default { createPostComment };