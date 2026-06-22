import mongoose from "mongoose";
import User from "../../databases/postgresql/models/user/user.js"; // TODO : Voir pour le mettre sur AuthService
import Post from "../../databases/mongodb/models/post/post.js";
import Comment from "../../databases/mongodb/models/comment/comment.js";
import Post_Like from "../../databases/postgresql/models/interaction/post_likes.js";
import Post_Star from "../../databases/postgresql/models/interaction/post_stars.js";

function isValidPostId(postId) {
    return mongoose.Types.ObjectId.isValid(postId);
}

function timeLabel(date) {
    const diffMinutes = Math.floor(
        (Date.now() - new Date(date).getTime()) / 60000
    );

    if (diffMinutes < 1) return "A l'instant";
    if (diffMinutes < 60) return `${diffMinutes} min`;

    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours < 24) return `${diffHours} h`;

    return new Date(date).toLocaleDateString();
}

async function getPosts({ userId, category }) {
    const query = category ? { category } : {};

    const posts = await Post.find({
        status: "published",
        ...query,
    }).sort({
        created_at: -1,
    });

    const authorIds = [
        ...new Set(
            posts.map(post => post.author_id)
        ),
    ];

    const users = authorIds.length
        ? await User.findAll({
            where: {
                id: authorIds,
            },
        })
        : [];

    const usersById = new Map(
        users.map(user => [
            user.id,
            user,
        ])
    );

    const postIds = posts.map(
        post => String(post._id)
    );

    const [likes, stars] = await Promise.all([
        Post_Like.findAll({
            where: {
                user_id: userId,
                post_id: postIds,
            },
        }),

        Post_Star.findAll({
            where: {
                user_id: userId,
                post_id: postIds,
            },
        }),
    ]);

    const liked = new Set(
        likes.map(like => like.post_id)
    );

    const starred = new Set(
        stars.map(star => star.post_id)
    );

    return posts.map(post => {
        const id = String(post._id);
        const author = usersById.get(post.author_id);

        return {
            id,
            authorName: author?.name || "Utilisateur inconnu",
            authorUsername: author?.username || "",
            avatar: author?.avatar || "",
            content: post.content,
            timestamp: timeLabel(post.created_at),
            likes: post.likes_count || 0,
            comments: post.comments_count || 0,
            shares: post.reposts_count || 0,
            likedByUser: liked.has(id),
            starredByUser: starred.has(id),
            category: post.category || "for-you",
            image: post.media?.[0] || undefined,
        };
    });
}

async function createPost({
    userId,
    content,
    category = "for-you",
    image = "",
}) {
    const text = String(content || "").trim();

    if (!text) {
        throw new Error(
            "Le contenu du post est obligatoire."
        );
    }

    const post = await Post.create({
        author_id: userId,
        content: text,
        category,
        media: image ? [image] : [],
        status: "published",
        created_at: new Date(),
        updated_at: new Date(),
    });


    const author = await User.findOne({
        where: {
            id: userId,
        },
    });


    return {
        id: String(post._id),
        authorName: author?.name || "Utilisateur inconnu",
        authorUsername: author?.username || "",
        avatar: author?.avatar || "",
        content: post.content,
        timestamp: timeLabel(post.created_at),
        likes: 0,
        comments: 0,
        shares: 0,
        likedByUser: false,
        starredByUser: false,
        category: post.category,
        image: post.media?.[0] || undefined,
    };
}

async function getComments({ postId }) {

    if (postId && !isValidPostId(postId)) {
        throw new Error(
            "Identifiant de post invalide."
        );
    }

    const query = {
        status: "published",
    };

    if (postId) {
        query.post_id = postId;
    }

    const comments = await Comment.find(query)
        .sort({
            created_at: 1,
        });

    const authorIds = [
        ...new Set(
            comments.map(
                comment => comment.author_id
            )
        ),
    ];

    const users = authorIds.length
        ? await User.findAll({
            where: {
                id: authorIds,
            },
        })
        : [];

    const usersById = new Map(
        users.map(user => [
            user.id,
            user,
        ])
    );

    const grouped = {};

    for (const comment of comments) {

        const key = String(
            comment.post_id
        );

        const author = usersById.get(
            comment.author_id
        );


        if (!grouped[key]) {
            grouped[key] = [];
        }

        grouped[key].push({
            id: String(comment._id),

            author: author?.name || "Utilisateur inconnu",

            username: author?.username || "",

            text: comment.content,

            parentCommentId: comment.parent_comment_id || null,

            repliesCount: comment.replies_count || 0,

            time: timeLabel(comment.created_at),
        });
    }

    return postId
        ? {
            [postId]: grouped[postId] || [],
        }
        : grouped;
}

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

async function toggleLike({userId, postId}) {

    if (!isValidPostId(postId)) {
        throw new Error(
            "Identifiant de post invalide."
        );
    }

    const post = await Post.findById(postId);

    if (!post || post.status !== "published") {
        throw new Error(
            "Post introuvable."
        );
    }

    const id = String(post._id);

    const existing = await Post_Like.findOne({
        where: {
            user_id: userId,
            post_id: id,
        },
    });

    if (existing) {
        await existing.destroy();
        post.likes_count = Math.max(0, (post.likes_count || 0) - 1
        );

    } else {

        await Post_Like.create({
            user_id: userId,
            post_id: id,
        });

        post.likes_count = (post.likes_count || 0) + 1;
    }


    post.updated_at = new Date();

    await post.save();


    return {
        id,
        likes: post.likes_count,
        likedByUser: !existing,
    };
}

async function toggleStar({userId, postId}) {

    if (!isValidPostId(postId)) {
        throw new Error(
            "Identifiant de post invalide."
        );
    }

    const post = await Post.findById(postId);

    if (!post || post.status !== "published") {
        throw new Error(
            "Post introuvable."
        );
    }

    const id = String(post._id);

    const existing = await Post_Star.findOne({
        where: {
            user_id: userId,
            post_id: id,
        },
    });

    if (existing) {
        await existing.destroy();
    } else {
        await Post_Star.create({
            user_id: userId,
            post_id: id,
        });
    }

    return {
        id,
        starredByUser: !existing,
    };
}

export default {
    getPosts,
    createPost,
    getComments,
    createPostComment,
    toggleLike,
    toggleStar,
};
