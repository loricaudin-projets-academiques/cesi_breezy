const MEDIA_SERVICE_URL = process.env.MEDIA_SERVICE_URL || "http://media:3000";

async function storeProfilePhoto(userId, value) {
  if (!value || !value.startsWith("data:image/")) {
    return value || "";
  }

  try {
    const response = await fetch(`${MEDIA_SERVICE_URL}/upload/data-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, category: "profile", value }),
    });

    if (response.ok) {
      const uploaded = await response.json();
      return uploaded.url;
    }
  } catch {
    // Media service unavailable — store data URL directly
  }

  return value;
}

export { storeProfilePhoto };
