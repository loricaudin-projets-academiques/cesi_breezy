import { DataTypes } from 'sequelize';
import { sequelize } from '../../../../config/databases/postgresql.js';

const Comment_Like = sequelize.define(
    'Comment_Like',
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
        comment_id: {
            type: DataTypes.STRING,
            // fk of Comment collection
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
                fields: ["user_id", "comment_id"],
            },
        ],
        timestamps: true,
    }
);

export default Comment_Like;
