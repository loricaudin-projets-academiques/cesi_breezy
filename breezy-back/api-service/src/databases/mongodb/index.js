import { mongoose, MONGO_URI } from "../../config/databases/mongodb.js";

async function connectMongoDB() {
    await mongoose.connect(MONGO_URI);
}

export default connectMongoDB;
