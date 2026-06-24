import connectPostgreSQL from "../databases/postgresql/index.js";
import runUserSeed from "./user/user.seed.js";

async function runSeed() {
    try {
        try {
            await connectPostgreSQL();
            console.log("Connexion réussie à la base de données PostgreSQL");
        } catch (err) {
            console.error("Erreur de connexion à la base de données PostgreSQL : ", err);
            return;
        }

        await runUserSeed();


        console.log("Seed completed for auth-service");
        process.exit(0);
    } catch (err) {
        console.error("Seed error:", err);
        process.exit(1);
    }
}

runSeed();