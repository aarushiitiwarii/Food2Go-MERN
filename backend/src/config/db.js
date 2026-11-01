const mongoose = require("mongoose");
const { mongoUri } = require("./env");

let memoryServer = null;

// Connects to MongoDB Atlas. If MONGO_URI is not set (local dev without internet),
// falls back to an in-memory MongoDB so the app still runs.
async function connectDB() {
  let uri = mongoUri;

  if (!uri) {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri("food2go");
    console.warn("MONGO_URI not set - using in-memory MongoDB (data is lost on restart)");
  }

  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connectDB, disconnectDB };
