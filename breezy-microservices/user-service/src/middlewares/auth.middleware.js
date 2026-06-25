import jwt from "jsonwebtoken";
import User from "../databases/postgresql/models/user.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET n'est pas défini dans les variables d'environnement.");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Token JWT manquant." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if the user is suspended
    const user = await User.findOne({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ message: "Utilisateur introuvable." });
    }
    if (user.isSuspended) {
      return res.status(403).json({ message: "Votre compte a été suspendu par la modération." });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token JWT invalide ou expire." });
    }
    return next(error);
  }
}

export { JWT_SECRET, requireAuth };
