import { DataTypes } from 'sequelize';
import { sequelize } from "../../../../config/databases/postgresql.js";

const Post_Star = sequelize.define(
    'Post_Star',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        post_id: {
            type: DataTypes.STRING,
            allowNull: false,
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
        timestamps: false,
    }
);

export default Post_Star;
