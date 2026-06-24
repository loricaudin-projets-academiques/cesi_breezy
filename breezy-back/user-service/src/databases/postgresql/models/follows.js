import { DataTypes } from "sequelize";
import { sequelize } from "../../../config/databases/postgresql.js";

const Follow = sequelize.define(
  "Follow",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    follower_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    followed_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["follower_id", "followed_id"],
      },
    ],
  }
);

export default Follow;
