import { users, posts, commentsByPost, likedPostsByUser, starredPostsByUser } from "../../data/memory-store.js";
import { createId } from "../../utils/ids.js";
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
    const category = req.query.category;
    const visiblePosts = category
        ? posts.filter((post) => post.category === category)
        : posts;

    const result = feedService.getAllPosts();
    return res.json(visiblePosts.map((post) => getPostForUser(post, req.user.username)));
}

async function createPost(req, res) {
  const currentUser = users.get(req.user.username);

  if (!currentUser) {
    return res.status(401).json({ message: "Utilisateur introuvable." });
  }

  const content = String(req.body.content || "").trim();
  const category = req.body.category || "for-you";

  if (!content) {
    return res.status(400).json({ message: "Le contenu du post est obligatoire." });
  }

  const post = {
    id: createId("post"),
    authorName: currentUser.name,
    authorUsername: currentUser.username,
    avatar: currentUser.avatar,
    content,
    timestamp: nowLabel(),
    likes: 0,
    comments: 0,
    shares: 0,
    likedByUser: false,
    starredByUser: false,
    category,
    image: req.body.image || undefined,
  };

  posts.unshift(post);
  return res.status(201).json(getPostForUser(post, req.user.username));
};

async function fetchComments(req, res) { // TODO : Déplacer une partie dans le service et faire appel à la BDD
  const postId = req.query.postId;

  if (postId) {
    return res.json({ [postId]: commentsByPost.get(postId) || [] });
  }

  return res.json(Object.fromEntries(commentsByPost.entries()));
}

async function createPostComment(req, res) {
    try {
        const postId = req.params.postId;
        const { content, parentCommentId } = req.body;

        //const currentUserId = req.user.id;
        const currentUserId = "test";

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

const likePost = (req, res) => { // TODO : Déplacer une partie dans le service et faire appel à la BDD
  const post = posts.find((item) => item.id === req.params.postId);
  if (!post) {
    return res.status(404).json({ message: "Post introuvable." });
  }

  const liked = getSet(likedPostsByUser, req.user.username);
  if (liked.has(post.id)) {
    liked.delete(post.id);
    post.likes = Math.max(0, post.likes - 1);
  } else {
    liked.add(post.id);
    post.likes += 1;
  }

  return res.json(getPostForUser(post, req.user.username));
};

const starPost = (req, res) => { // TODO : Déplacer une partie dans le service et faire appel à la BDD
  const post = posts.find((item) => item.id === req.params.postId);
  if (!post) {
    return res.status(404).json({ message: "Post introuvable." });
  }

  const starred = getSet(starredPostsByUser, req.user.username);
  if (starred.has(post.id)) {
    starred.delete(post.id);
  } else {
    starred.add(post.id);
  }

  return res.json(getPostForUser(post, req.user.username));
};

export {
    fetchPosts,
    createPost,
    fetchComments,
    createPostComment,
    likePost,
    starPost,
};
