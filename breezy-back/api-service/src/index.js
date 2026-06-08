
const path = require("path");

const envPath = path.resolve(__dirname, "../../.env");

require("dotenv").config({ path: envPath });

const express = require('express');
const sequelize = require("./config/databases/postgresql");

const app = express();
app.use(express.json());
const port = 3000;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connexion réussie à la base de données PostgreSQL");
  } catch (err) {
    console.error("Erreur de connexion à la base de données PostgreSQL : ", null);
    return;
  }

  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
}

start();
