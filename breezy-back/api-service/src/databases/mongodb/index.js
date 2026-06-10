const { mongoose, MONGO_URI } = require("../../config/databases/mongodb");

async function connectMongoDB() {
    await mongoose.connect(MONGO_URI);
}

module.exports = connectMongoDB;
