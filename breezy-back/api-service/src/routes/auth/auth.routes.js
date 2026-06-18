const express = require("express");
const jwt = require("jsonwebtoken");

const { users } = require("../../data/memory-store").default;
const { hashPassword, verifyPassword } = require("../../utils/password");
const { toPublicUser } = require("../../utils/user");
const { normalizeUsername } = require("../../utils/user");
const { JWT_SECRET } = require("../../middlewares/auth.middleware");

const router = express.Router();

function createDefaultProfile({ name, username }) {
  return {
    name,
    username,
    bio: "Membre Breezy.",
    followers: 0,
    following: 0,
    friends: 0,
    avatar: "",
    note: "En mode Breezy...",
    role: "user",
    music: {
      title: "",
      artist: "",
      cover: "",
      isPlaying: false,
      progressPercent: 0,
    },
  };
}

function createSession(user) {
  const token = jwt.sign(
    { username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    user: toPublicUser(user),
    token,
  };
}

router.post("/register", (req, res) => {
  const name = String(req.body.name || "").trim();
  const username = normalizeUsername(req.body.username);
  const password = String(req.body.password || "");

  if (!name || !username || !password) {
    return res.status(400).json({ message: "Nom, nom d'utilisateur et mot de passe sont obligatoires." });
  }

  if (users.has(username)) {
    return res.status(409).json({ message: "Ce nom d'utilisateur existe deja." });
  }

  const user = {
    ...createDefaultProfile({ name, username }),
    passwordHash: hashPassword(password),
  };

  users.set(username, user);
  return res.status(201).json(createSession(user));
});

router.post("/login", (req, res) => {
  const username = normalizeUsername(req.body.username);
  const password = String(req.body.password || "");
  const user = users.get(username);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ message: "Identifiants invalides." });
  }

  return res.json(createSession(user));
});

module.exports = router;
