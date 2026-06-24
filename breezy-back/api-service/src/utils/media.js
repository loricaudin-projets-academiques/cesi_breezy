const MEDIA_SERVICE_URL = process.env.MEDIA_SERVICE_URL || "http://media:3000";

async function storeDataUrlForUser(userId, category, value) {
  if (!value || !value.startsWith("data:image/")) {
    return value || "";
  }

  const response = await fetch(`${MEDIA_SERVICE_URL}/upload/data-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, category, value }),
  });

  if (!response.ok) {
    throw new Error("Impossible de stocker le media.");
  }

  const uploaded = await response.json();
  return uploaded.url;
}

async function storeProfilePhoto(userId, value) {
  return storeDataUrlForUser(userId, "profile", value);
}

async function storeGalleryImages(userId, values) {
  const stored = [];
  for (const value of values) {
    const next = await storeDataUrlForUser(userId, "gallery", value);
    if (next) {stored.push(next);}
  }
  return stored;
}

function isLocalUpload(value) {
  return typeof value === "string" && value.startsWith("/uploads/");
}

async function deleteLocalUploads(values = []) {
  for (const value of values) {
    if (!isLocalUpload(value)) {continue;}

    try {
      await fetch(`${MEDIA_SERVICE_URL}${value}`, { method: "DELETE" });
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
