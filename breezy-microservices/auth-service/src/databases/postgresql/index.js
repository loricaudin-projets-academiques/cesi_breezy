import { sequelize } from "../../config/databases/postgresql.js";

import "./models/user.js";

async function connectPostgreSQL() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
}

export default connectPostgreSQL;
