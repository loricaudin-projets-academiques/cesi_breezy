import connectMongoDB from "../databases/mongodb/index.js";
import connectPostgreSQL from "../databases/postgresql/index.js";
import runPostSeed from "./post/post.seed.js";

async function runSeed() {
    try {
        try {
            await connectPostgreSQL();
            console.log("Connexion réussie à la base de données PostgreSQL");
        } catch (err) {
            console.error("Erreur de connexion à la base de données PostgreSQL : ", err);
            return;
        }

        try {
            await connectMongoDB();
            console.log("Connexion réussie à la base de données MongoDB");
        } catch (err) {
            console.error("Erreur de connexion à la base de données MongoDB : ", err);
            return;
        }


        await runPostSeed();


        console.log("Seed completed");
        process.exit(0);
    } catch (err) {
        console.error("Seed error:", err);
        process.exit(1);
    }
}

runSeed();