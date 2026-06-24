import jwt from "jsonwebtoken";

import User from "../databases/postgresql/models/user.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { normalizeUsername, toPublicUser } from "../utils/user.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET n'est pas défini dans les variables d'environnement.");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

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
    language: "fr",
    theme: "dark",
    ambientGlow: true,
    notificationsEnabled: true,
    role: "user",
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

async function register({ name, email, username, password }) {
  if (!name || !email || !username || !password) {
    const error = new Error("Nom, courriel, nom d'utilisateur et mot de passe sont obligatoires.");
    error.status = 400;
    throw error;
  }

  if (!EMAIL_REGEX.test(email)) {
    const error = new Error("L'adresse courriel est invalide (format attendu : utilisateur@domaine.ext).");
    error.status = 400;
    throw error;
  }

  if (!PASSWORD_REGEX.test(password)) {
    const error = new Error("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.");
    error.status = 400;
    throw error;
  }

  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) {
    const error = new Error("Cette adresse courriel est déjà utilisée.");
    error.status = 409;
    throw error;
  }

  const existingUsername = await User.findOne({ where: { username } });
  if (existingUsername) {
    const error = new Error("Ce nom d'utilisateur est déjà pris.");
    error.status = 409;
    throw error;
  }

  const user = await User.create({
    ...createDefaultProfile({ name, username }),
    email,
    passwordHash: await hashPassword(password),
  });

  return createSession(user);
}

async function login({ username, password }) {
  if (!username || !password) {
    const error = new Error("Nom d'utilisateur et mot de passe sont obligatoires.");
    error.status = 400;
    throw error;
  }

  const user = await User.findOne({ where: { username } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    const error = new Error("Identifiants invalides.");
    error.status = 401;
    throw error;
  }

  return createSession(user);
}

export { login, register };
