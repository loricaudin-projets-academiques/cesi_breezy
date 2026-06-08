const sequelize = require("../../config/databases/postgresql");

async function connectPostgreSQL() {
    await sequelize.authenticate();
}

module.exports = connectPostgreSQL;