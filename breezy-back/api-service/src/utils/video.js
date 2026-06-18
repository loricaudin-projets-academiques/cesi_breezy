const fs = require("fs");
const path = require("path");
const { VIDEOS_DIR } = require("../config/upload");

// path.basename neutralise les "../" — protège contre le path traversal.
function resolveVideoPath(urlOrName) {
  if (!urlOrName) return null;
  const name = path.basename(String(urlOrName));
  if (!name || name === "." || name === "..") return null;
  const full = path.join(VIDEOS_DIR, name);
  // Vérification redondante : le chemin résolu doit rester dans VIDEOS_DIR.
  if (!full.startsWith(VIDEOS_DIR + path.sep) && full !== VIDEOS_DIR) return null;
  return full;
}

// Supprime le fichier. Best-effort : ne jette jamais.
function removeVideoByUrl(urlOrName) {
  const full = resolveVideoPath(urlOrName);
  if (!full) return false;
  try {
    fs.unlinkSync(full);
    return true;
  } catch {
    return false;
  }
}

module.exports = { resolveVideoPath, removeVideoByUrl };
