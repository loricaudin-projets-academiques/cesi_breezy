const crypto = require("crypto");

const users = new Map();
const posts = [];
const commentsByPost = new Map();
const likedPostsByUser = new Map();
const starredPostsByUser = new Map();

function normalizeUsername(username) {
  const clean = String(username || "").trim().replace(/^@+/, "").toLowerCase();
  return clean ? `@${clean}` : "";
}

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, originalHash] = String(storedHash || "").split(":");
  if (!salt || !originalHash) return false;

  const candidate = hashPassword(password, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(originalHash, "hex"));
}

function toPublicUser(user) {
  return {
    name: user.name,
    username: user.username,
    bio: user.bio,
    followers: user.followers,
    following: user.following,
    friends: user.friends,
    avatar: user.avatar,
    note: user.note,
    music: user.music,
    role: user.role,
  };
}

module.exports = {
  users,
  posts,
  commentsByPost,
  likedPostsByUser,
  starredPostsByUser,
  normalizeUsername,
  createId,
  hashPassword,
  verifyPassword,
  toPublicUser,
};
