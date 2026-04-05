import { MongoClient } from "mongodb";

const globalForMongo = globalThis as unknown as {
  mongoClientPromise?: Promise<MongoClient>;
};

function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }
  return uri;
}

export async function getMongoClient() {
  if (!globalForMongo.mongoClientPromise) {
    const uri = getMongoUri();
    // mongodb+srv handles TLS automatically
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });
    globalForMongo.mongoClientPromise = client.connect().catch((error) => {
      console.error("MongoDB connection error:", error);
      // Clear the failed promise so retry is possible
      globalForMongo.mongoClientPromise = undefined;
      throw error;
    });
  }

  return globalForMongo.mongoClientPromise;
}

export async function getMongoDb() {
  const client = await getMongoClient();
  const dbName = process.env.MONGODB_DB || "miniproject_v2";
  return client.db(dbName);
}
