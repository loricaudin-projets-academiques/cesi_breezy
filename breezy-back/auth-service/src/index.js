import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import { sequelize } from "./config/database.js";

const app = express();
const PORT = process.env.AUTH_PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok", service: "auth-service" }));

await sequelize.authenticate();
await sequelize.sync({ alter: true });
console.log("Connexion PostgreSQL établie.");

app.listen(PORT, () => {
  console.log(`auth-service démarré sur le port ${PORT}`);
});
