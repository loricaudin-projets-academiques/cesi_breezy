const path = require("path");

const envPath = path.resolve(__dirname, "../../.env");
require("dotenv").config({ path: envPath });

const connectPostgreSQL = require("./databases/postgresql/index");
const connectMongoDB = require("./databases/mongodb/index");

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
const port = 3000;

const start = async () => {
  try {
    await connectPostgreSQL();
    console.log("Connexion réussie à la base de données PostgreSQL");
  } catch (err) {
    console.error("Erreur de connexion à la base de données PostgreSQL : ", err);
    //return;
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
    let postgresStatus = "Disconnected";
    let mongoStatus = "Disconnected";
    //postgres
    try {
      const sequelize = require("./config/databases/postgresql");
      await sequelize.authenticate();
      postgresStatus = "Connected";
    } catch (err) {
      postgresStatus = `Error: ${err.message}`;
    }
    //mongodb
    try {
      const { mongoose } = require("./config/databases/mongodb");
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

  const routes = require('./routes');
  app.use('/', routes);
  app.use('/api', routes);

  app.use((req, res) => {
    res.status(404).json({ message: "Route API introuvable." });
  });

  app.use((err, req, res, next) => {
    console.error("Erreur API :", err);
    res.status(500).json({ message: "Erreur serveur." });
  });

  app.listen(port, () => {
    console.log(`Breezy Back listening on port ${port}`);
  });
}

start();
