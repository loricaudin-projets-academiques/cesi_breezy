function normalizeUsername(username) {
  const clean = String(username || "").trim().replace(/^@+/, "").toLowerCase();
  return clean ? `@${clean}` : "";
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
  normalizeUsername,
  toPublicUser
};