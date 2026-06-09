const { DataTypes } = require('sequelize');
const sequelize = require("../../../../config/databases/postgresql");

const Post_Like = sequelize.define(
    'Post_Like',
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
        post_id: {
            type: DataTypes.STRING,
            // fk of Post collection
        },
        created_at: {
            type: DataTypes.DATE,
        }
    }
);

module.exports = Post_Like;