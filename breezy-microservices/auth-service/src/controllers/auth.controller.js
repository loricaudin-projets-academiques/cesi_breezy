import { normalizeUsername } from "../utils/user.js";
import { register, login } from "../services/auth.service.js";

async function health(req, res) {
  return res.json({ status: "ok", service: "auth-service" });
}

async function registerHandler(req, res) {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || "");

    const session = await register({ name, email, username, password });
    return res.status(201).json(session);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
}

async function loginHandler(req, res) {
  try {
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || "");

    const session = await login({ username, password });
    return res.json(session);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
}

async function adminCreateUser(req, res) {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Seul un administrateur peut créer des comptes." });
    }

    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || "");
    const role = String(req.body.role || "user").trim();

    if (!["user", "moderator", "admin"].includes(role)) {
      return res.status(400).json({ message: "Rôle invalide." });
    }

    const session = await register({ name, email, username, password, role });
    return res.status(201).json({ message: "Compte créé avec succès.", user: session.user });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export { health, loginHandler as login, registerHandler as register, adminCreateUser };
