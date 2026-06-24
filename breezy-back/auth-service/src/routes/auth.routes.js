import { Router } from "express";
import jwt from "jsonwebtoken";

import User from "../databases/postgresql/models/user.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { normalizeUsername, toPublicUser } from "../utils/user.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "breezy-dev-secret";

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
    isPrivate: false,
    language: "fr",
    theme: "dark",
    ambientGlow: true,
    notificationsEnabled: true,
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
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    user: toPublicUser(user),
    token,
  };
}

router.get("/health", async (req, res) => {
  return res.json({ status: "ok", service: "auth-service" });
});

router.post("/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const username = normalizeUsername(req.body.username);
  const password = String(req.body.password || "");

  if (!name || !username || !password) {
    return res.status(400).json({
      message: "Nom, nom d'utilisateur et mot de passe sont obligatoires.",
    });
  }

  const existingUser = await User.findOne({ where: { username } });
  if (existingUser) {
    return res.status(409).json({ message: "Ce nom d'utilisateur existe deja." });
  }

  const user = await User.create({
    ...createDefaultProfile({ name, username }),
    passwordHash: hashPassword(password),
  });

  return res.status(201).json(createSession(user));
});

router.post("/login", async (req, res) => {
  const username = normalizeUsername(req.body.username);
  const password = String(req.body.password || "");
  const user = await User.findOne({ where: { username } });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ message: "Identifiants invalides." });
  }

  return res.json(createSession(user));
});

export default router;
