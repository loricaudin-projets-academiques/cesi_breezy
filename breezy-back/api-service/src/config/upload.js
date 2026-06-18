const path = require("path");

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 Mo
const UPLOADS_DIR = path.join(__dirname, "../../uploads");
const VIDEOS_DIR = path.join(UPLOADS_DIR, "videos");
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "http://localhost/api";

module.exports = { MAX_VIDEO_SIZE, UPLOADS_DIR, VIDEOS_DIR, PUBLIC_BASE_URL };
