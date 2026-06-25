import { Client } from "minio";

const bucket = process.env.MINIO_BUCKET || "breezy-media";

const client = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "minio",
  port: Number(process.env.MINIO_PORT || 9000),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ROOT_USER || "breezy",
  secretKey: process.env.MINIO_ROOT_PASSWORD || "breezy_password",
});

async function ensureBucket() {
  const exists = await client.bucketExists(bucket);
  if (!exists) {
    await client.makeBucket(bucket);
  }
}

export { bucket, client, ensureBucket };
