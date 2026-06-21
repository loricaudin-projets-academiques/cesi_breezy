import Comment from "../../databases/mongodb/models/comment/comment.js";
import fs from 'fs/promises';

export default async function runCommentSeed() {
    const data = await fs.readFile('src/data/comment/comments.json', 'utf8');

    const comments = JSON.parse(data);

    for (const comment of comments) {
        const existing = await Comment.findOne({
            _id: comment._id
        });

        if (existing) {
            continue;
        }
        
        await Comment.create({
            _id: comment._id,
            post_id: comment.post_id,
            parent_comment_id: comment.parent_comment_id,
            author_id: comment.author_id,
            content: comment.content,
            visibility: comment.visibility,
            status: comment.status,
            created_at: comment.created_at,
            updated_at: comment.updated_at,
            deleted_at: comment.deleted_at
        });
        //
        console.log(`Comment ${comment._id} created`);
    }
    console.log("CommentSeed completed");
}
