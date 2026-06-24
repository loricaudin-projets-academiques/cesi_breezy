import { resolve } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import express, { json } from "express";

import connectPostgreSQL from "./databases/postgresql/index.js";
import { sequelize } from "./config/databases/postgresql.js";
import userRouter from "./routes/user.routes.js";

const envPath = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../.env");

dotenv.config({ path: envPath });

const app = express();
const port = 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(json({ limit: "25mb" }));
app.use("/uploads", express.static(resolve(process.cwd(), "uploads")));

async function start() {
  try {
    await connectPostgreSQL();
    console.log("Connexion reussie a la base PostgreSQL depuis user-service");
  } catch (err) {
    console.error("Erreur de connexion PostgreSQL user-service :", err);
    return;
  }

  app.get("/", (req, res) => {
    res.json({ status: "ok", service: "user-service" });
  });

  app.get("/status", async (req, res) => {
    try {
      await sequelize.authenticate();
      return res.json({ postgres: "Connected" });
    } catch (err) {
      return res.status(500).json({ postgres: `Error: ${err.message}` });
    }
  });

  app.use("/", userRouter);

  app.use((req, res) => {
    res.status(404).json({ message: "Route user-service introuvable." });
  });

  app.use((err, req, res, _next) => {
    console.error("Erreur user-service :", err);
    const status = Number(err.status) || 500;
    res.status(status).json({ message: err.message || "Erreur serveur." });
  });

  app.listen(port, () => {
    console.log(`Breezy User service listening on port ${port}`);
  });
}

start();
