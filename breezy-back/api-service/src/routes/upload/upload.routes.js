const express = require("express");
const { upload } = require("../../config/upload");
const { requireAuth } = require("../../middlewares/auth.middleware");

const router = express.Router();
const PUBLIC_BASE = process.env.PUBLIC_UPLOAD_BASE_URL || "http://localhost/api";

router.post("/", requireAuth, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      const msg =
        err.code === "LIMIT_FILE_SIZE"
          ? "Image trop volumineuse (5 Mo max)."
          : "Format d'image non autorisé (jpg, jpeg, png, gif, webp).";
      return res.status(400).json({ message: msg });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Aucune image reçue." });
    }
    return res.status(201).json({ url: `${PUBLIC_BASE}/uploads/${req.file.filename}` });
  });
});

module.exports = router;
