const users = new Map();
const posts = [];
const commentsByPost = new Map();
const likedPostsByUser = new Map();
const starredPostsByUser = new Map();

export default {
  users,
  posts,
  commentsByPost,
  likedPostsByUser,
  starredPostsByUser
};
