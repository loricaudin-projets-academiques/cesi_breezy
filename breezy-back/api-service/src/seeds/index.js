import { sequelize } from "../config/databases/postgresql.js";
import runPostSeed from "./post/post.seed.js";

async function runSeed() {
    try {
        await sequelize.authenticate();
        console.log("Database connection successful");

        await sequelize.sync(); // Sync models (create/update tables if needed)
        console.log("Models synchronized");


        await runPostSeed();


        console.log("Seed completed");
        process.exit(0);
    } catch (err) {
        console.error("Seed error:", err);
        process.exit(1);
    }
}

runSeed();