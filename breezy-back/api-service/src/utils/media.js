import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import { join } from "path";

const UPLOAD_ROOT = "uploads";

function extensionFromMime(mime) {
  if (mime === "image/jpeg") {
    return ".jpg";
  }
  if (mime === "image/png") {
    return ".png";
  }
  if (mime === "image/gif") {
    return ".gif";
  }
  if (mime === "image/webp") {
    return ".webp";
  }
  return ".bin";
}

async function storeDataUrlForUser(userId, category, value) {
  if (!value || !value.startsWith("data:image/")) {
    return value || "";
  }

  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return "";
  }

  const [, mime, base64] = match;
  const folder = join(UPLOAD_ROOT, "users", userId, category);
  await mkdir(folder, { recursive: true });

  const filename = `${Date.now()}-${randomUUID()}${extensionFromMime(mime)}`;
  await writeFile(join(folder, filename), Buffer.from(base64, "base64"));

  return `/uploads/users/${userId}/${category}/${filename}`;
}

async function storeProfilePhoto(userId, value) {
  return storeDataUrlForUser(userId, "profile", value);
}

async function storeGalleryImages(userId, values) {
  const stored = [];
  for (const value of values) {
    const next = await storeDataUrlForUser(userId, "gallery", value);
    if (next) {
      stored.push(next);
    }
  }
  return stored;
}

function isLocalUpload(value) {
  return typeof value === "string" && value.startsWith("/uploads/");
}

async function deleteLocalUploads(values = []) {
  for (const value of values) {
    if (!isLocalUpload(value)) {
      continue;
    }

    const relativePath = value.replace(/^\/uploads\//, "");
    try {
      await unlink(join(UPLOAD_ROOT, relativePath));
    } catch {
      // Ignore missing files: the database state is the source of truth.
    }
  }
}

export {
  deleteLocalUploads,
  isLocalUpload,
  storeGalleryImages,
  storeProfilePhoto,
};
