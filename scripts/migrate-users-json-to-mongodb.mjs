import fs from "fs";
import path from "path";
import crypto from "crypto";
import { MongoClient } from "mongodb";

function normalizeIdentity(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function loadUsersFromJson() {
  const candidates = [
    path.join(process.cwd(), "src", "data", "users.json"),
    path.join(process.cwd(), "data", "users.json"),
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content);

    if (Array.isArray(parsed)) {
      return parsed;
    }
  }

  return [];
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required to run this migration.");
  }

  const dbName = process.env.MONGODB_DB || "miniproject_v2";
  const jsonUsers = loadUsersFromJson();

  if (!jsonUsers.length) {
    console.log("No users.json data found. Nothing to migrate.");
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection("users");

    const operations = jsonUsers.map((user) => {
      const id = user.id || crypto.randomUUID();
      const username = normalizeIdentity(user.username || user.email);
      const email = normalizeIdentity(user.email || username);
      const role = user.role || "faculty";
      const roles =
        Array.isArray(user.roles) && user.roles.length ? user.roles : [role];

      const payload = {
        ...user,
        _id: id,
        id,
        username,
        email,
        role,
        roles,
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: user.updatedAt || new Date().toISOString(),
      };

      return {
        updateOne: {
          filter: { _id: id },
          update: { $set: payload },
          upsert: true,
        },
      };
    });

    if (operations.length > 0) {
      const result = await usersCollection.bulkWrite(operations, {
        ordered: false,
      });
      console.log("Migration completed:", {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount,
      });
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("User migration failed:", error);
  process.exit(1);
});
