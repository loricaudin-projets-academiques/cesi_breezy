const express = require("express");
const { requireAuth } = require("../../middlewares/auth.middleware");
const { uploadVideo } = require("../../middlewares/upload.middleware");
const { removeVideoByUrl } = require("../../utils/video");
const { PUBLIC_BASE_URL } = require("../../config/upload");

const router = express.Router();

router.post("/upload", requireAuth, (req, res) => {
  uploadVideo(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "La vidéo dépasse la limite de 100 Mo." });
      }
      if (err.code === "INVALID_FILE_TYPE") {
        return res.status(415).json({ message: "Seules les vidéos sont autorisées." });
      }
      return res.status(400).json({ message: "Échec de l'upload de la vidéo." });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier vidéo reçu." });
    }
    return res.status(201).json({
      url: `${PUBLIC_BASE_URL}/uploads/videos/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  });
});

// Supprime une vidéo orpheline (non encore publiée ou retirée par l'utilisateur).
router.delete("/videos/:filename", requireAuth, (req, res) => {
  const ok = removeVideoByUrl(req.params.filename);
  return res.status(ok ? 204 : 404).end();
});

module.exports = router;
