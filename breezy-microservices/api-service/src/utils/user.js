function normalizeUsername(username) {
  const clean = String(username || "").trim().replace(/^@+/, "").toLowerCase();
  return clean ? `@${clean}` : "";
}

function toPublicUser(user) {
  const plainUser = typeof user.get === "function" ? user.get({ plain: true }) : user;

  return {
    id: plainUser.id,
    name: plainUser.name,
    username: plainUser.username,
    bio: plainUser.bio,
    followers: plainUser.followers,
    following: plainUser.following,
    friends: plainUser.friends,
    avatar: plainUser.avatar,
    note: plainUser.note,
    language: plainUser.language,
    theme: plainUser.theme || "dark",
    ambientGlow: plainUser.ambientGlow !== false,
    notificationsEnabled: plainUser.notificationsEnabled,
    role: plainUser.role,
  };
}

export {
  normalizeUsername,
  toPublicUser
};
