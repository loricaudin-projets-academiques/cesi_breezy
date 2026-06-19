import { sequelize } from "../../config/databases/postgresql.js";

import Post from "../../databases/mongodb/models/post/post.js";
import fs from 'fs/promises';

export default async function runPostSeed() {
    try {
        const data = await fs.readFile('src/data/post/post.json', 'utf8');

        const posts = JSON.parse(data);
        console.log(posts);

        for (const post of posts) {
            const existing = await Post.findOne({
                where: { _id: post._id || null }
            });

            if (existing) {
                continue;
            }
            
            await Post.create({
                id: post.id,
                content: post.content,
                tags: post.tags,
                media: post.media,
                mentions: post.mentions,
                visibility: post.visibility,
                status: post.status
            });
            //
            console.log(`Post ${post.id} created`);
        }
        console.log("Seed completed");
        process.exit(0);
    } catch (err) {
        throw err;
    }
}
