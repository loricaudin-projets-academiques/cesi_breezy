import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET n'est pas défini dans les variables d'environnement.");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Token JWT manquant." });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: "Token JWT invalide ou expire." });
  }
}

export { JWT_SECRET, requireAuth };
