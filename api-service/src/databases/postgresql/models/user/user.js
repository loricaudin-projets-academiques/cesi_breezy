import { DataTypes } from "sequelize";
import { sequelize } from "../../../../config/databases/postgresql.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "password_hash",
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "Membre Breezy.",
    },
    followers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    following: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    friends: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "En mode Breezy...",
    },
    isPrivate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_private",
    },
    language: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "fr",
    },
    theme: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "dark",
    },
    ambientGlow: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "ambient_glow",
    },
    notificationsEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "notifications_enabled",
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "user",
    },
    music: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        title: "",
        artist: "",
        cover: "",
        isPlaying: false,
        progressPercent: 0,
      },
    },
  },
  {
    tableName: "users",
    underscored: true,
  }
);

export default User;
