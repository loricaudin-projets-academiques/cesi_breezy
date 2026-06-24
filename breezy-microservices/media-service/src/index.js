import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync, writeFileSync, createReadStream } from "fs";
import { Readable } from "stream";
import cors from "cors";
import dotenv from "dotenv";
import express, { json } from "express";

import { bucket, client, ensureBucket } from "./storage/minio.js";
import { contentTypeForKey, keyFromUploadUrl, parseDataUrl, uploadKeyFor } from "./utils/dataUrl.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

const app = express();
const port = 3000;

// Dossier de secours sur disque si MinIO est indisponible
const LOCAL_UPLOADS_DIR = resolve(__dirname, "../../local-uploads");

function ensureLocalDir(key) {
  const parts = key.split("/");
  const dir = join(LOCAL_UPLOADS_DIR, ...parts.slice(0, -1));
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// S'assure que le bucket existe (le crée si besoin) — appelé avant chaque upload
async function ensureBucketReady() {
  try {
    const exists = await client.bucketExists(bucket);
    if (!exists) {
      await client.makeBucket(bucket);
    }
  } catch {
    // MinIO indisponible — le fallback disque prendra le relais
  }
}

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

    let storedInMinio = false;

    try {
      await ensureBucketReady();
      // minio-js v8 : utiliser un Readable stream plutôt qu'un Buffer direct
      const stream = Readable.from(parsed.buffer);
      await client.putObject(bucket, key, stream, parsed.buffer.length, {
        "Content-Type": parsed.contentType,
      });
      storedInMinio = true;
    } catch {
      // MinIO indisponible ou erreur upload → fallback disque local
    }

    if (!storedInMinio) {
      ensureLocalDir(key);
      writeFileSync(join(LOCAL_UPLOADS_DIR, ...key.split("/")), parsed.buffer);
    }

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

    // 1. Essayer MinIO
    try {
      const object = await client.getObject(bucket, key);
      res.setHeader("Content-Type", contentTypeForKey(key));
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      object.pipe(res);
      return;
    } catch {
      // MinIO indisponible → essayer disque local
    }

    // 2. Fallback disque local
    const localPath = join(LOCAL_UPLOADS_DIR, ...key.split("/"));
    if (existsSync(localPath)) {
      res.setHeader("Content-Type", contentTypeForKey(key));
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      createReadStream(localPath).pipe(res);
      return;
    }

    return res.status(404).json({ message: "Media introuvable." });
  } catch (error) {
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

    try {
      await client.removeObject(bucket, key);
    } catch {
      // Ignore les erreurs MinIO sur suppression
    }

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
  // On tente de préparer le bucket au démarrage, mais ce n'est pas bloquant
  try {
    await ensureBucket();
    console.log(`Bucket "${bucket}" pret.`);
  } catch {
    console.warn("MinIO indisponible au demarrage — fallback disque local actif.");
  }

  app.listen(port, () => {
    console.log(`Breezy Media service listening on port ${port}, bucket ${bucket}`);
  });
}

start().catch((error) => {
  console.error("Impossible de demarrer media-service :", error);
  process.exit(1);
});
