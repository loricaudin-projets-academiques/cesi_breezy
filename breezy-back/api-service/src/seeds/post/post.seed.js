import Post from "../../databases/mongodb/models/post/post.js";
import fs from 'fs/promises';

export default async function runPostSeed() {
    const data = await fs.readFile('src/data/post/post.json', 'utf8');

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
            content: post.content,
            tags: post.tags,
            media: post.media,
            mentions: post.mentions,
            visibility: post.visibility,
            status: post.status
        });
        //
        console.log(`Post ${post._id} created`);
    }
    console.log("PostSeed completed");
}
