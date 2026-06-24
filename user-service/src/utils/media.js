const MEDIA_SERVICE_URL = process.env.MEDIA_SERVICE_URL || "http://media:3000";

async function storeProfilePhoto(userId, value) {
  if (!value || !value.startsWith("data:image/")) {
    return value || "";
  }

  const response = await fetch(`${MEDIA_SERVICE_URL}/upload/data-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, category: "profile", value }),
  });

  if (!response.ok) {
    throw new Error("Impossible de stocker l'avatar.");
  }

  const uploaded = await response.json();
  return uploaded.url;
}

export { storeProfilePhoto };
