import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

async function deleteAllStudents() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "miniproject_v2";

  if (!uri) {
    console.error("❌ MONGODB_URI environment variable not set");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✓ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("jsonStore");
    const now = new Date().toISOString();

    // Clear students payload while keeping the document to avoid automatic reseeding.
    await collection.updateOne(
      { _id: "students.json" },
      {
        $set: {
          data: [],
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );

    const check = await collection.findOne({ _id: "students.json" });
    const count = Array.isArray(check?.data) ? check.data.length : 0;
    console.log(`✓ Mongo students count after cleanup: ${count}`);

    // Reset disk seed file so future seed operations remain empty.
    const studentsFilePath = path.join(
      process.cwd(),
      "src",
      "data",
      "students.json",
    );
    fs.writeFileSync(studentsFilePath, "[]\n", "utf8");
    console.log("✓ Reset src/data/students.json to empty array");

    console.log("✅ All students deleted successfully!");
  } catch (error) {
    console.error("❌ Error deleting students:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

deleteAllStudents();
