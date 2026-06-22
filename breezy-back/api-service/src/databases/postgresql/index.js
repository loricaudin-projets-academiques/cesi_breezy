import { sequelize } from "../../config/databases/postgresql.js";

import "./models/user/user.js";
import "./models/follow/follows.js";
import "./models/follow/user_blocks.js";
import "./models/interaction/comment_likes.js";
import "./models/interaction/post_likes.js";
import "./models/interaction/post_stars.js";

async function connectPostgreSQL() {
    await sequelize.authenticate();
    await sequelize.sync();
}

export default connectPostgreSQL;
