import fs from "fs/promises";
import path from "path";
import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongoDb";

interface JsonStoreDocument {
  _id: string;
  data: unknown;
  createdAt: string;
  updatedAt: string;
}

const dataRoot = path.join(process.cwd(), "src", "data");
const JSON_READ_CACHE_TTL_MS = 4000;

// Simple lock mechanism to prevent concurrent writes
const locks = new Map<string, Promise<void>>();
const readCache = new Map<string, { expiresAt: number; data: unknown }>();

const mongoBackedFiles = new Set<string>([
  "courseFiles.json",
  "eventReports.json",
  "audits.json",
  "remarks.json",
  "auditorMessages.json",
  "adminNotifications.json",
  "students.json",
  "courses.json",
  "engagements.json",
  "assignments.json",
  "responsibilities.json",
  "careerActivities.json",
]);

const mongoCollectionByFile = new Map<string, string>([
  ["courseFiles.json", "coursefiles"],
  ["eventReports.json", "eventreports"],
  ["audits.json", "audits"],
  ["remarks.json", "remarks"],
  ["auditorMessages.json", "auditormessages"],
  ["adminNotifications.json", "adminnotifications"],
  ["students.json", "students"],
  ["courses.json", "courses"],
  ["engagements.json", "engagements"],
  ["assignments.json", "assignments"],
  ["responsibilities.json", "responsibilities"],
  ["careerActivities.json", "careeractivities"],
]);

const seededFiles = new Set<string>();

function normalizeFileName(fileName: string) {
  return fileName.replace(/\\/g, "/").replace(/^\.\//, "");
}

function isMongoBackedFile(fileName: string) {
  return mongoBackedFiles.has(normalizeFileName(fileName));
}

function getMongoCollectionName(fileName: string) {
  const normalized = normalizeFileName(fileName);
  return mongoCollectionByFile.get(normalized) ?? null;
}

function getCachedData<T>(fileName: string): T | null {
  const cacheEntry = readCache.get(fileName);
  if (!cacheEntry) {
    return null;
  }

  if (cacheEntry.expiresAt <= Date.now()) {
    readCache.delete(fileName);
    return null;
  }

  return cacheEntry.data as T;
}

function setCachedData(fileName: string, data: unknown) {
  readCache.set(fileName, {
    data,
    expiresAt: Date.now() + JSON_READ_CACHE_TTL_MS,
  });
}

function invalidateCachedData(fileName: string) {
  readCache.delete(fileName);
}

async function getJsonStoreCollection() {
  const db = await getMongoDb();
  return db.collection<JsonStoreDocument>("jsonStore");
}

async function getMongoBackedCollection(fileName: string) {
  const collectionName = getMongoCollectionName(fileName);
  if (!collectionName) {
    throw new Error(`No Mongo collection mapping for ${fileName}`);
  }

  const db = await getMongoDb();
  return db.collection(collectionName);
}

async function readFileFromDisk<T>(fileName: string): Promise<T> {
  try {
    const filePath = getDataFilePath(fileName);
    const fileContents = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileContents) as T;
  } catch (error) {
    // If file doesn't exist or can't be read, return empty array as default
    if (
      error instanceof Error &&
      (error.message.includes("ENOENT") ||
        error.message.includes("no such file"))
    ) {
      return [] as T;
    }
    // Re-throw other errors
    throw error;
  }
}

async function seedMongoFileFromDisk(fileName: string) {
  const normalizedFileName = normalizeFileName(fileName);

  if (seededFiles.has(normalizedFileName)) {
    return;
  }

  seededFiles.add(normalizedFileName);

  const collection = await getMongoBackedCollection(normalizedFileName);
  const existingCount = await collection.countDocuments({});
  if (existingCount > 0) {
    return;
  }

  const existing = await collection.findOne({ legacyId: normalizedFileName });
  if (existing) {
    return;
  }

  try {
    const data = await readFileFromDisk<unknown>(normalizedFileName);

    // If data is empty array or falsy, skip seeding
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return;
    }

    const timestamp = new Date().toISOString();

    const docs = Array.isArray(data)
      ? data.map((item) => prepareMongoDocument(item))
      : [prepareMongoDocument(data)];

    if (docs.length > 0) {
      await collection.insertMany(docs);
    }
  } catch (error) {
    // Silently skip if seed file is missing or can't be read
    // The readJsonFile function will handle returning empty data
  }
}

function prepareMongoDocument(item: unknown) {
  if (!item || typeof item !== "object") {
    return {
      _id: new ObjectId(),
      data: item,
    };
  }

  const source = item as Record<string, unknown>;
  const legacyId =
    typeof source.id === "string" && source.id.trim()
      ? source.id.trim()
      : typeof source._id === "string" && source._id.trim()
        ? source._id.trim()
        : undefined;

  const { id, _id, ...rest } = source;

  return {
    _id: new ObjectId(),
    ...(legacyId ? { legacyId } : {}),
    ...rest,
  };
}

function restoreMongoDocument(doc: Record<string, unknown>) {
  const { _id, legacyId, ...rest } = doc;
  return {
    id: typeof legacyId === "string" && legacyId ? legacyId : String(_id),
    ...rest,
  };
}

function validateSerializableJson(data: unknown) {
  const jsonString = JSON.stringify(data, null, 2);
  JSON.parse(jsonString);
}

async function writeMongoBackedData(fileName: string, data: unknown) {
  const normalizedFileName = normalizeFileName(fileName);
  invalidateCachedData(normalizedFileName);

  while (locks.has(normalizedFileName)) {
    await locks.get(normalizedFileName);
  }

  const writeLock = (async () => {
    try {
      validateSerializableJson(data);
      const collection = await getMongoBackedCollection(normalizedFileName);
      const docs = Array.isArray(data)
        ? data.map((item) => prepareMongoDocument(item))
        : [prepareMongoDocument(data)];

      await collection.deleteMany({});
      if (docs.length > 0) {
        await collection.insertMany(docs);
      }
    } finally {
      locks.delete(normalizedFileName);
    }
  })();

  locks.set(normalizedFileName, writeLock);
  await writeLock;
}

export function getDataFilePath(fileName: string) {
  return path.join(dataRoot, normalizeFileName(fileName));
}

export async function readJsonFile<T>(fileName: string): Promise<T> {
  const normalizedFileName = normalizeFileName(fileName);

  const cached = getCachedData<T>(normalizedFileName);
  if (cached !== null) {
    return cached;
  }

  if (!isMongoBackedFile(normalizedFileName)) {
    const data = await readFileFromDisk<T>(normalizedFileName);
    setCachedData(normalizedFileName, data);
    return data;
  }

  await seedMongoFileFromDisk(normalizedFileName);
  const collection = await getMongoBackedCollection(normalizedFileName);
  const documents = await collection.find({}).sort({ _id: 1 }).toArray();

  if (!documents.length) {
    // If MongoDB is empty, try fallback to file
    try {
      const fallbackData = await readFileFromDisk<T>(normalizedFileName);
      if (fallbackData) {
        setCachedData(normalizedFileName, fallbackData);
        return fallbackData;
      }
    } catch (error) {
      // Fallback failed, will return empty array below
    }
    // Return empty array if both MongoDB and file are empty/missing
    const emptyData = [] as T;
    setCachedData(normalizedFileName, emptyData);
    return emptyData;
  }

  const data = documents.map((document) => restoreMongoDocument(document)) as T;
  setCachedData(normalizedFileName, data);
  return data;
}

export async function writeJsonFile<T>(fileName: string, data: T) {
  const normalizedFileName = normalizeFileName(fileName);
  invalidateCachedData(normalizedFileName);

  if (isMongoBackedFile(normalizedFileName)) {
    await writeMongoBackedData(normalizedFileName, data);
    return;
  }

  const filePath = getDataFilePath(normalizedFileName);

  // Wait for any existing write operation to complete
  while (locks.has(normalizedFileName)) {
    await locks.get(normalizedFileName);
  }

  // Create a new lock for this write operation
  const writeLock = (async () => {
    try {
      const jsonString = JSON.stringify(data, null, 2);

      // Validate JSON before writing
      try {
        JSON.parse(jsonString);
      } catch (error) {
        console.error("Invalid JSON data, aborting write:", error);
        throw new Error("Failed to write JSON: Invalid data structure");
      }

      // Write to temporary file first, then rename (atomic operation)
      const tempFilePath = `${filePath}.tmp`;
      await fs.writeFile(tempFilePath, jsonString, "utf-8");
      await fs.rename(tempFilePath, filePath);
    } finally {
      locks.delete(normalizedFileName);
    }
  })();

  locks.set(normalizedFileName, writeLock);
  await writeLock;
}
