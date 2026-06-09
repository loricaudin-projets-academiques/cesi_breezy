const { DataTypes } = require('sequelize');
const sequelize = require("../../../../config/databases/postgresql");

const User_Block = sequelize.define(
    'User_Block',
    {
        blocker_id: {
            type: DataTypes.UUID,
            allowNull: false,
            // fk of Auth_User collection
        },
        blocked_id: {
            type: DataTypes.UUID,
            allowNull: false,
            // fk of Auth_User collection
        },
        reason: {
            type: DataTypes.TEXT,
        },
        created_at: {
            type: DataTypes.DATE,
        }
    }
);

module.exports = User_Block;