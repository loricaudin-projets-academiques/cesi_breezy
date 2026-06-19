import { sequelize } from "../../config/databases/postgresql.js";

import "./models/follow/follows.js";
import "./models/follow/user_blocks.js";
import "./models/interaction/comment_likes.js";
import "./models/interaction/post_likes.js";

async function connectPostgreSQL() {
    await sequelize.authenticate();
    await sequelize.sync();
}

export default connectPostgreSQL;
