import Post from "../../databases/mongodb/models/post/post.js";
import User from "../../databases/postgresql/models/user/user.js";
import fs from "fs/promises";

const POSTS_DATA_URL = new URL("../../data/post/post.json", import.meta.url);

export default async function runPostSeed() {
  const data = await fs.readFile(POSTS_DATA_URL, "utf8");
  const posts = JSON.parse(data);
  const usernames = [...new Set(posts.map((post) => post.author_username))];
  const users = await User.findAll({ where: { username: usernames } });
  const usersByUsername = new Map(users.map((user) => [user.username, user.id]));

  for (const post of posts) {
    const authorId = usersByUsername.get(post.author_username);

    if (!authorId) {
      throw new Error(`Post ${post._id}: unknown author ${post.author_username}`);
    }

    await Post.findOneAndUpdate(
      { _id: post._id },
      {
        author_id: authorId,
        title: post.title || "",
        content: post.content,
        category: post.category || "for-you",
        tags: post.tags || [],
        media: post.media || [],
        mentions: post.mentions || [],
        visibility: post.visibility || "public",
        status: post.status || "published",
        pinned: Boolean(post.pinned),
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        reposts_count: post.reposts_count || 0,
        created_at: new Date(post.created_at),
        updated_at: new Date(post.updated_at || post.created_at),
        deleted_at: null,
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`PostSeed completed: ${posts.length} posts ready`);
}
