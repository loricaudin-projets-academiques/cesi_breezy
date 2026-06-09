const { DataTypes } = require('sequelize');
const sequelize = require('../../../../config/databases/postgresql');

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

module.exports = Comment_Like;
