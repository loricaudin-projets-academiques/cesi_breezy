const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { MAX_VIDEO_SIZE, VIDEOS_DIR } = require("../config/upload");

fs.mkdirSync(VIDEOS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, VIDEOS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".mp4";
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

function fileFilter(req, file, cb) {
  if (file.mimetype && file.mimetype.startsWith("video/")) return cb(null, true);
  const err = new Error("Seules les vidéos sont autorisées.");
  err.code = "INVALID_FILE_TYPE";
  cb(err, false);
}

const uploadVideo = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_VIDEO_SIZE },
}).single("video");

module.exports = { uploadVideo };
