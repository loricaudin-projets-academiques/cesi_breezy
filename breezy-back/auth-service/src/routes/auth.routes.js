import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { isValidEmail, isValidPassword } from "../utils/validators.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "breezy-dev-secret";

function normalizeUsername(raw) {
  const s = String(raw || "").trim().toLowerCase();
  return s.startsWith("@") ? s : `@${s}`;
}

function toPublicUser(user) {
  const { passwordHash, ...pub } = user.toJSON();
  return pub;
}

function createSession(user) {
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  return { user: toPublicUser(user), token };
}

router.post("/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const username = normalizeUsername(req.body.username);
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!name || !username || !email || !password) {
    return res.status(400).json({ message: "Tous les champs sont obligatoires." });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Adresse email invalide." });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({
      message:
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.",
    });
  }

  const [existingByUsername, existingByEmail] = await Promise.all([
    User.findOne({ where: { username } }),
    User.findOne({ where: { email } }),
  ]);

  if (existingByUsername) {
    return res.status(409).json({ message: "Ce nom d'utilisateur est déjà pris." });
  }
  if (existingByEmail) {
    return res.status(409).json({ message: "Cette adresse email est déjà utilisée." });
  }

  const user = await User.create({
    name,
    username,
    email,
    passwordHash: await hashPassword(password),
    bio: "Membre Breezy.",
    followers: 0,
    following: 0,
    friends: 0,
    avatar: "",
    note: "En mode Breezy...",
    role: "user",
    music: { title: "", artist: "", cover: "", isPlaying: false, progressPercent: 0 },
  });

  return res.status(201).json(createSession(user));
});

router.post("/login", async (req, res) => {
  const identifier = String(req.body.username || req.body.email || "").trim();
  const password = String(req.body.password || "");

  if (!identifier || !password) {
    return res.status(400).json({ message: "Identifiant et mot de passe obligatoires." });
  }

  const normalizedUsername = normalizeUsername(identifier);
  let user = await User.findOne({ where: { username: normalizedUsername } });

  if (!user && isValidEmail(identifier.toLowerCase())) {
    user = await User.findOne({ where: { email: identifier.toLowerCase() } });
  }

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ message: "Identifiants invalides." });
  }

  return res.json(createSession(user));
});

export default router;
