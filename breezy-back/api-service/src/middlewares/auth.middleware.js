const jwt = require("jsonwebtoken");
const { users } = require("../data/memory-store").default;

const JWT_SECRET = process.env.JWT_SECRET || "breezy-dev-secret";

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Token JWT manquant." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // Auto-create user in memory store if it was wiped (e.g. server restarted)
    if (decoded.username && !users.has(decoded.username)) {
      const name = decoded.username.charAt(0).toUpperCase() + decoded.username.slice(1);
      users.set(decoded.username, {
        name,
        username: decoded.username,
        bio: "Membre Breezy.",
        followers: 0,
        following: 0,
        friends: 0,
        avatar: "",
        note: "En mode Breezy...",
        role: decoded.role || "user",
        music: {
          title: "",
          artist: "",
          cover: "",
          isPlaying: false,
          progressPercent: 0,
        },
        passwordHash: "",
      });
    }

    return next();
  } catch {
    return res.status(401).json({ message: "Token JWT invalide ou expire." });
  }
}

module.exports = {
  JWT_SECRET,
  requireAuth,
};
