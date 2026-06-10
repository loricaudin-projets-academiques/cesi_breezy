const { DataTypes } = require('sequelize');
const sequelize = require("../../../../config/databases/postgresql");

const Follow = sequelize.define(
    'Follow',
    {
        follower_id: {
            type: DataTypes.UUID,
            allowNull: false,
            // fk of Auth_User collection
        },
        followed_id: {
            type: DataTypes.UUID,
            allowNull: false,
            // fk of Auth_User collection
        },
        created_at: {
            type: DataTypes.DATE,
        }
    }
);

module.exports = Follow;