import { randomUUID } from "crypto";
import { extname, posix } from "path";
import mime from "mime-types";

function parseDataUrl(value) {
  const match = String(value || "").match(/^data:([a-zA-Z0-9.+/-]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  const [, contentType, base64] = match;
  const extension = mime.extension(contentType);
  return {
    buffer: Buffer.from(base64, "base64"),
    contentType,
    extension: extension ? `.${extension}` : ".bin",
  };
}

function uploadKeyFor({ userId, category, extension }) {
  const safeCategory = String(category || "misc").replace(/[^a-z0-9_-]/gi, "");
  return posix.join(
    "users",
    String(userId || "anonymous"),
    safeCategory || "misc",
    `${Date.now()}-${randomUUID()}${extension}`
  );
}

function keyFromUploadUrl(url) {
  const clean = String(url || "").replace(/^\/+/, "");
  if (!clean.startsWith("uploads/")) {
    return null;
  }
  return clean.replace(/^uploads\//, "");
}

function contentTypeForKey(key) {
  return mime.lookup(extname(key)) || "application/octet-stream";
}

export { contentTypeForKey, keyFromUploadUrl, parseDataUrl, uploadKeyFor };
