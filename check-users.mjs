import { MongoClient } from "mongodb";
import { config } from "dotenv";

config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI not found in environment");
  process.exit(1);
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "miniproject_v2");
  const users = await db
    .collection("users")
    .find(
      {},
      { projection: { email: 1, username: 1, name: 1, firebaseUid: 1 } },
    )
    .toArray();

  console.log("\n=== Current Users in MongoDB ===\n");
  if (users.length === 0) {
    console.log("No users found in database");
  } else {
    users.forEach((u, i) => {
      console.log(`${i + 1}. Email: ${u.email || "N/A"}`);
      console.log(`   Username: ${u.username || "N/A"}`);
      console.log(`   Name: ${u.name || "N/A"}`);
      console.log(`   Firebase UID: ${u.firebaseUid || "N/A"}`);
      console.log("");
    });
  }
} catch (error) {
  console.error("Error:", error.message);
} finally {
  await client.close();
}
