const sequelize = require("../../config/databases/postgresql");

require("./models/follow/follows");
require("./models/follow/user_blocks");
require("./models/interaction/comment_likes");
require("./models/interaction/post_likes");

async function connectPostgreSQL() {
    await sequelize.authenticate();
    await sequelize.sync();
}

module.exports = connectPostgreSQL;
