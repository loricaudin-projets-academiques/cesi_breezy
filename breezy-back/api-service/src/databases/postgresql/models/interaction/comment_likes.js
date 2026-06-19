import { DataTypes } from 'sequelize';
import { sequelize } from '../../../../config/databases/postgresql.js';

const Comment_Like = sequelize.define(
    'Comment_Like',
    {
        id: {
            type: DataTypes.UUID,
            allowNull: false,
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
        }
    }
);

export default Comment_Like;
