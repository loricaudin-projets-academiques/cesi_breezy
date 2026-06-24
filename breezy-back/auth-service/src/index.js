import { resolve } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import express, { json } from "express";

import connectPostgreSQL from "./databases/postgresql/index.js";
import authRouter from "./routes/auth.routes.js";

const envPath = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../.env"
);

dotenv.config({ path: envPath });

const app = express();
const port = process.env.AUTH_SERVICE_PORT || 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(json({ limit: "1mb" }));

app.use("/", authRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Route auth introuvable." });
});

app.use((err, req, res, next) => {
  console.error("Erreur auth-service :", err);
  res.status(500).json({ message: "Erreur serveur auth." });
});

const start = async () => {
  try {
    await connectPostgreSQL();
    console.log("Auth-service connecte a PostgreSQL");
  } catch (err) {
    console.error("Erreur de connexion PostgreSQL auth-service :", err);
    return;
  }

  app.listen(port, () => {
    console.log(`Breezy Auth listening on port ${port}`);
  });
};

start();
