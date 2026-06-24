import Post from "../../databases/mongodb/models/post/post.js";
import fs from 'fs/promises';

export default async function runPostSeed() {
    const data = await fs.readFile('src/data/post/posts.json', 'utf8');

    const posts = JSON.parse(data);

    for (const post of posts) {
        const existing = await Post.findOne({
            _id: post._id
        });

        if (existing) {
            continue;
        }
        
        await Post.create({
            _id: post._id,
            author_id: post.author_id,
            content: post.content,
            tags: post.tags,
            media: post.media,
            mentions: post.mentions,
            visibility: post.visibility,
            status: post.status,
            created_at: post.created_at,
            updated_at: post.updated_at,
            deleted_at: post.deleted_at
        });
        //
        console.log(`Post ${post._id} created`);
    }
    console.log("PostSeed completed");
}
