import fs from "fs/promises";
import path from "path";
import { MongoClient } from "mongodb";

const projectRoot = process.cwd();
const dataRoot = path.join(projectRoot, "src", "data");

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "miniproject_v2";

if (!MONGODB_URI) {
  console.error("MONGODB_URI is required");
  process.exit(1);
}

async function readJsonSafe(relativePath) {
  const fullPath = path.join(dataRoot, relativePath);
  try {
    const raw = await fs.readFile(fullPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function upsertById(collection, docs) {
  if (!docs.length) return 0;

  const operations = docs
    .filter((doc) => doc && typeof doc === "object")
    .map((doc) => {
      const id = String(doc.id || "").trim();
      if (!id) {
        return null;
      }

      return {
        updateOne: {
          filter: { id },
          update: { $set: { ...doc, id } },
          upsert: true,
        },
      };
    })
    .filter(Boolean);

  if (!operations.length) return 0;

  const result = await collection.bulkWrite(operations, { ordered: false });
  return result.upsertedCount + result.modifiedCount;
}

async function migrate() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);

  try {
    const mapping = [
      { json: "courses.json", collection: "courses" },
      { json: "students.json", collection: "students" },
      { json: "eventReports.json", collection: "event_reports" },
      { json: "audits.json", collection: "audits" },
      { json: "remarks.json", collection: "remarks" },
      { json: "engagements.json", collection: "engagements" },
    ];

    for (const item of mapping) {
      const docs = await readJsonSafe(item.json);
      const changed = await upsertById(db.collection(item.collection), docs);
      console.log(
        `${item.collection}: source=${docs.length}, upsertedOrUpdated=${changed}`,
      );
    }

    console.log("Migration complete.");
  } finally {
    await client.close();
  }
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
