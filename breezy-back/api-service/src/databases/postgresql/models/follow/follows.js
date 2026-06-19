import { DataTypes } from 'sequelize';
import { sequelize } from "../../../../config/databases/postgresql.js";

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

export default Follow;