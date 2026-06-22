import feedService from "../../services/post/feed.service.js";

function nowLabel() {
    return "A l'instant";
}

function getSet(map, key) {
    if (!map.has(key)) {
        map.set(key, new Set());
    }

    return map.get(key);
}

function getPostForUser(post, username) {
    const liked = getSet(likedPostsByUser, username);
    const starred = getSet(starredPostsByUser, username);

    return {
        ...post,
        likedByUser: liked.has(post.id),
        starredByUser: starred.has(post.id),
    };
}

async function fetchPosts(req, res) {
    const userId = req.user.id;
    const category = req.query.category;

    const data = await feedService.getPosts({
        userId,
        category,
    });

    res.json(data);
}

async function createPost(req, res) {

    const userId = req.user.id;

    const content = req.body.content;
    const category = req.body.category;
    const image = req.body.image;


    const result = await feedService.createPost({
        userId,
        content,
        category,
        image,
    });


    if (result.error) {
        return res
            .status(result.status)
            .json(result.error);
    }


    res
        .status(201)
        .json(result.data);
};


async function fetchComments(req, res) {

    const postId = req.query.postId;


    const result = await feedService.getAllComments({
        postId,
    });


    if (result.error) {
        return res
            .status(result.status)
            .json(result.error);
    }


    res.json(result.data);
}

async function createPostComment(req, res) {
    try {
        const postId = req.params.postId;
        const { content, parentCommentId } = req.body;

        const currentUserId = req.user.id;

        const comment = await feedService.createPostComment({
            postId,
            currentUserId,
            content,
            parentCommentId
        });

        return res.status(201).json(comment);

    } catch (err) {
        return res.status(400).json({
            message: err.message
        });
    }
};

async function toggleLikePost(req, res) {

    const userId = req.user.id;
    const postId = req.params.postId;


    const result = await feedService.toggleLike({
        userId,
        postId,
    });


    if (result.error) {
        return res
            .status(result.status)
            .json(result.error);
    }

    res.json(result.data);
}

async function toggleStarPost(req, res) {

    const userId = req.user.id;
    const postId = req.params.postId;


    const result = await feedService.toggleStar({
        userId,
        postId,
    });

    if (result.error) {
        return res
            .status(result.status)
            .json(result.error);
    }

    res.json(result.data);
}

export {
    fetchPosts,
    createPost,
    fetchComments,
    createPostComment,
    toggleLikePost,
    toggleStarPost,
};
