import { resolve } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import connectPostgreSQL from "./databases/postgresql/index.js";
import connectMongoDB from "./databases/mongodb/index.js";
import express, { json } from 'express';
import cors from 'cors';
import { sequelize } from "./config/databases/postgresql.js";
import { mongoose } from "./config/databases/mongodb.js";
import routes from './routes/index.js';

const envPath = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../.env"
);

dotenv.config({ path: envPath });

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(json({ limit: "25mb" }));
app.use("/uploads", express.static(resolve(process.cwd(), "uploads")));
const port = 3000;

const start = async () => {
  try {
    await connectPostgreSQL();
    console.log("Connexion réussie à la base de données PostgreSQL");
  } catch (err) {
    console.error("Erreur de connexion à la base de données PostgreSQL : ", err);
    return;
  }

  try {
    await connectMongoDB();
    console.log("Connexion réussie à la base de données MongoDB");
  } catch (err) {
    console.error("Erreur de connexion à la base de données MongoDB : ", err);
    return;
  }

  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  // permet de vérifier le statut de connexion des bdds
  app.get('/status', async (req, res) => {
    let postgresStatus;
    let mongoStatus;
    //postgres
    try {
      await sequelize.authenticate();
      postgresStatus = "Connected";
    } catch (err) {
      postgresStatus = `Error: ${err.message}`;
    }
    //mongodb
    try {
      if (mongoose.connection.readyState === 1) {
        mongoStatus = "Connected";
      } else {
        mongoStatus = `Disconnected (State: ${mongoose.connection.readyState})`;
      }
    } catch (err) {
      mongoStatus = `Error: ${err.message}`;
    }

    res.json({
      postgres: postgresStatus,
      mongodb: mongoStatus
    });
  });

  app.use('/', routes);

  app.use((req, res) => {
    res.status(404).json({ message: "Route API introuvable." });
  });

  app.use((err, req, res) => {
    console.error("Erreur API :", err);
    res.status(500).json({ message: "Erreur serveur." });
  });

  app.listen(port, () => {
    console.log(`Breezy Back listening on port ${port}`);
  });
}

start();
