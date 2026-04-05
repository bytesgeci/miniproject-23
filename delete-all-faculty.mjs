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

  console.log(`\n✅ Deleted ${result.deletedCount} faculty/users`);
  console.log("✅ Kept: admin@collage.com\n");

  // Show remaining users
  const remaining = await db.collection("users").find({}).toArray();
  console.log("Remaining users in database:");
  remaining.forEach((u) => {
    console.log(`  - ${u.email} (${u.role})`);
  });
} catch (error) {
  console.error("Error:", error.message);
} finally {
  await client.close();
}
