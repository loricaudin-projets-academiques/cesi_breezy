import { createReadStream } from "fs";
import { readdir, stat } from "fs/promises";
import { join, relative, sep } from "path";
import mime from "mime-types";

import { bucket, client, ensureBucket } from "../storage/minio.js";

const uploadsRoot = process.env.UPLOADS_ROOT || "uploads";

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(path));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
}

async function migrate() {
  await ensureBucket();

  let files;
  try {
    files = await listFiles(uploadsRoot);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(`Aucun dossier ${uploadsRoot} a migrer.`);
      return;
    }
    throw error;
  }

  let migrated = 0;
  for (const file of files) {
    const key = relative(uploadsRoot, file).split(sep).join("/");
    const fileStat = await stat(file);
    const contentType = mime.lookup(file) || "application/octet-stream";

    await client.putObject(bucket, key, createReadStream(file), fileStat.size, {
      "Content-Type": contentType,
    });
    migrated += 1;
    console.log(`OK /uploads/${key}`);
  }

  console.log(`Migration terminee: ${migrated} fichier(s) vers bucket ${bucket}.`);
}

migrate().catch((error) => {
  console.error("Migration uploads -> MinIO echouee :", error);
  process.exit(1);
});
