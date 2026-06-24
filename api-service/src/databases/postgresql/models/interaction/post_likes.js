import { DataTypes } from 'sequelize';
import { sequelize } from "../../../../config/databases/postgresql.js";

const Post_Like = sequelize.define(
    'Post_Like',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            // fk of Auth_User collection
        },
        post_id: {
            type: DataTypes.STRING,
            // fk of Post collection
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        }
    },
    {
        indexes: [
            {
                unique: true,
                fields: ["user_id", "post_id"],
            },
        ],
        timestamps: true,
    }
);

export default Post_Like;
