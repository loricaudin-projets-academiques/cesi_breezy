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

export { health, loginHandler as login, registerHandler as register };
