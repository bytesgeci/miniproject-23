const { MongoClient } = require("mongodb");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || "miniproject_v2");
    const studentsCollection = db.collection("students");

    // List current indexes
    console.log("\n=== Current Indexes ===");
    const indexes = await studentsCollection.listIndexes().toArray();
    indexes.forEach((idx, i) => {
      console.log(`[${i}]`, JSON.stringify(idx, null, 2));
    });

    // Find and drop any unique index on rollNumber alone
    for (const idx of indexes) {
      const keyStr = JSON.stringify(idx.key);
      console.log(`\nChecking index: ${keyStr}`);

      // Drop if it's a unique index on rollNumber and has no advisorId or batchYear
      if (
        idx.unique === true &&
        idx.key.rollNumber &&
        !idx.key.advisorId &&
        !idx.key.batchYear
      ) {
        console.log(`Found bad unique index on rollNumber alone: ${idx.name}`);
        console.log(`Dropping index: ${idx.name}`);
        await studentsCollection.dropIndex(idx.name);
        console.log(`✓ Dropped index ${idx.name}`);
      }
    }

    // Ensure the correct compound index exists
    console.log(
      "\nEnsuring compound index on (advisorId, batchYear, rollNumber)...",
    );
    const compoundIndexName = await studentsCollection.createIndex({
      advisorId: 1,
      batchYear: 1,
      rollNumber: 1,
    });
    console.log(`✓ Compound index created/verified: ${compoundIndexName}`);

    // Also ensure unique index on (id)
    console.log("\nEnsuring unique index on (id)...");
    const idIndexName = await studentsCollection.createIndex(
      { id: 1 },
      { unique: true },
    );
    console.log(`✓ ID unique index created/verified: ${idIndexName}`);

    // List final indexes
    console.log("\n=== Final Indexes ===");
    const finalIndexes = await studentsCollection.listIndexes().toArray();
    finalIndexes.forEach((idx, i) => {
      console.log(`[${i}]`, JSON.stringify(idx, null, 2));
    });

    console.log("\n✓ Index cleanup complete!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
