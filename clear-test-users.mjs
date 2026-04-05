import { MongoClient } from "mongodb";
import { config } from "dotenv";

config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "miniproject_v2");

  // Delete all users except admin
  const result = await db.collection("users").deleteMany({
    email: { $ne: "admin@collage.com" },
  });

  console.log(`\nDeleted ${result.deletedCount} test users`);
  console.log("Database cleared for fresh testing\n");
} catch (error) {
  console.error("Error:", error.message);
} finally {
  await client.close();
}
