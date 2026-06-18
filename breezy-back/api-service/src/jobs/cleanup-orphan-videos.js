const fs = require("fs");
const path = require("path");
const { VIDEOS_DIR } = require("../config/upload");

// 2 h de grâce : ne jamais toucher un fichier récent (upload en cours ou brouillon).
const GRACE_MS = 2 * 60 * 60 * 1000;

// ⚠️ Ne référence que les vidéos de posts et commentaires (store en mémoire).
// Les vidéos de messages privés ne sont PAS visibles ici — ne pas réduire GRACE_MS
// sous 24 h si le sweep est activé en présence de messages vidéo.
function collectReferencedFilenames(store) {
  const names = new Set();
  const add = (url) => { if (url) names.add(path.basename(String(url))); };
  store.posts.forEach((p) => add(p.video));
  store.commentsByPost.forEach((list) => list.forEach((c) => add(c.video)));
  return names;
}

function cleanupOrphanVideos() {
  // Import tardif pour éviter les dépendances circulaires au démarrage.
  const store = require("../data/memory-store").default;
  let files;
  try { files = fs.readdirSync(VIDEOS_DIR); } catch { return; }
  const referenced = collectReferencedFilenames(store);
  const now = Date.now();
  for (const file of files) {
    if (referenced.has(file)) continue;
    const full = path.join(VIDEOS_DIR, file);
    try {
      if (now - fs.statSync(full).mtimeMs < GRACE_MS) continue;
      fs.unlinkSync(full);
    } catch { /* best-effort */ }
  }
}

module.exports = { cleanupOrphanVideos };
