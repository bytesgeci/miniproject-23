import admin from "firebase-admin";
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load Firebase service account
const serviceAccountPath = path.join(
  __dirname,
  "../backend/config/firebase-service-account.json",
);
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB || "miniproject_v2";

if (!mongoUri) {
  console.error("❌ MONGODB_URI environment variable not set");
  process.exit(1);
}

async function cleanupOrphanedAccounts() {
  const mongoClient = new MongoClient(mongoUri);

  try {
    console.log("🔍 Starting orphaned Firebase accounts cleanup...\n");

    // Connect to MongoDB
    await mongoClient.connect();
    console.log("✓ Connected to MongoDB");

    const db = mongoClient.db(mongoDbName);
    const usersCollection = db.collection("users");

    // Get all Firebase users
    console.log("📋 Fetching Firebase users...");
    const firebaseUsers = [];
    let pageToken;

    do {
      const result = await admin.auth().listUsers(1000, pageToken);
      firebaseUsers.push(...result.users);
      pageToken = result.pageToken;
    } while (pageToken);

    console.log(`✓ Found ${firebaseUsers.length} Firebase users\n`);

    // Get all MongoDB users
    console.log("📋 Fetching MongoDB users...");
    const mongoUsers = await usersCollection.find({}).toArray();
    const mongoUserUids = new Set(
      mongoUsers.map((u) => u.firebaseUid).filter(Boolean),
    );
    const mongoUserEmails = new Set(
      mongoUsers.map((u) => u.email).filter(Boolean),
    );

    console.log(`✓ Found ${mongoUsers.length} MongoDB users\n`);

    // Find orphaned accounts
    console.log("🔍 Identifying orphaned Firebase accounts...\n");
    const orphanedAccounts = [];

    for (const firebaseUser of firebaseUsers) {
      const hasMatchingUid = mongoUserUids.has(firebaseUser.uid);
      const hasMatchingEmail = mongoUserEmails.has(firebaseUser.email);

      if (!hasMatchingUid && !hasMatchingEmail) {
        orphanedAccounts.push(firebaseUser);
      }
    }

    if (orphanedAccounts.length === 0) {
      console.log("✅ No orphaned accounts found!\n");
      return;
    }

    console.log(`⚠️  Found ${orphanedAccounts.length} orphaned account(s):\n`);

    // Display orphaned accounts
    for (const account of orphanedAccounts) {
      const mongoUser = mongoUsers.find(
        (u) =>
          u.firebaseUid === account.uid ||
          u.email?.toLowerCase() === account.email?.toLowerCase(),
      );
      console.log(`  📌 Email: ${account.email}`);
      console.log(`     UID: ${account.uid}`);
      console.log(
        `     Created: ${new Date(account.metadata.creationTime).toLocaleString()}`,
      );
      console.log(
        `     Last Sign In: ${account.metadata.lastSignInTime ? new Date(account.metadata.lastSignInTime).toLocaleString() : "Never"}`,
      );
      console.log("");
    }

    // Ask for confirmation
    console.log("⚠️  This will DELETE these orphaned Firebase accounts.");
    console.log(
      "💡 They exist in Firebase but not in MongoDB (or with mismatched UIDs).\n",
    );

    // For automation, delete them if running in CI or with explicit flag
    const shouldDelete =
      process.env.DELETE_ORPHANED === "true" ||
      process.argv.includes("--delete");

    if (!shouldDelete) {
      console.log(
        "ℹ️  To delete these accounts, run with: DELETE_ORPHANED=true npm run cleanup:firebase",
      );
      console.log(
        "   Or run with: node scripts/cleanup-orphaned-firebase-accounts.mjs --delete\n",
      );
      return;
    }

    console.log("🗑️  Deleting orphaned accounts...\n");

    let deletedCount = 0;
    let failedCount = 0;

    for (const account of orphanedAccounts) {
      try {
        await admin.auth().deleteUser(account.uid);
        console.log(`✓ Deleted: ${account.email}`);
        deletedCount++;
      } catch (error) {
        console.log(`✗ Failed to delete ${account.email}: ${error.message}`);
        failedCount++;
      }
    }

    console.log("\n📊 Cleanup Summary:");
    console.log(`   Orphaned accounts found: ${orphanedAccounts.length}`);
    console.log(`   Successfully deleted: ${deletedCount}`);
    console.log(`   Failed to delete: ${failedCount}`);

    if (deletedCount > 0) {
      console.log("\n✅ Orphaned Firebase accounts cleaned up!");
    }
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  } finally {
    await mongoClient.close();
    process.exit(0);
  }
}

cleanupOrphanedAccounts();
