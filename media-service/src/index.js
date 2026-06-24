import { resolve } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import express, { json } from "express";

import { bucket, client, ensureBucket } from "./storage/minio.js";
import { contentTypeForKey, keyFromUploadUrl, parseDataUrl, uploadKeyFor } from "./utils/dataUrl.js";

const envPath = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../.env");

dotenv.config({ path: envPath });

const app = express();
const port = 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(json({ limit: "30mb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "media-service", bucket });
});

app.post("/upload/data-url", async (req, res, next) => {
  try {
    const parsed = parseDataUrl(req.body.value);
    if (!parsed) {
      return res.status(400).json({ message: "Image data-url invalide." });
    }

    const key = uploadKeyFor({
      userId: req.body.userId,
      category: req.body.category,
      extension: parsed.extension,
    });

    await client.putObject(bucket, key, parsed.buffer, parsed.buffer.length, {
      "Content-Type": parsed.contentType,
    });

    return res.status(201).json({
      url: `/uploads/${key}`,
      key,
      contentType: parsed.contentType,
      size: parsed.buffer.length,
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/uploads/*path", async (req, res, next) => {
  try {
    const key = Array.isArray(req.params.path) ? req.params.path.join("/") : req.params.path;
    const object = await client.getObject(bucket, key);
    res.setHeader("Content-Type", contentTypeForKey(key));
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    object.pipe(res);
  } catch (error) {
    if (error.code === "NoSuchKey" || error.code === "NotFound") {
      return res.status(404).json({ message: "Media introuvable." });
    }
    return next(error);
  }
});

app.delete("/uploads/*path", async (req, res, next) => {
  try {
    const url = `/uploads/${Array.isArray(req.params.path) ? req.params.path.join("/") : req.params.path}`;
    const key = keyFromUploadUrl(url);
    if (!key) {
      return res.status(400).json({ message: "Media URL invalide." });
    }

    await client.removeObject(bucket, key);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ message: "Route media-service introuvable." });
});

app.use((err, req, res, _next) => {
  console.error("Erreur media-service :", err);
  res.status(500).json({ message: err.message || "Erreur media-service." });
});

async function start() {
  await ensureBucket();
  app.listen(port, () => {
    console.log(`Breezy Media service listening on port ${port}, bucket ${bucket}`);
  });
}

start().catch((error) => {
  console.error("Impossible de demarrer media-service :", error);
  process.exit(1);
});
