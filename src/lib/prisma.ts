import { MongoClient } from "mongodb";

const uri = process.env.DATABASE_URL || "";
const client = new MongoClient(uri);

export async function connectDB() {
  try {
    await client.connect();
    return client.db("miniproject_v2");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export async function closeDB() {
  await client.close();
}
