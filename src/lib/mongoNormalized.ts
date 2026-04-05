import type { Db } from "mongodb";

export const COLLECTIONS = {
  courses: "courses",
  students: "students",
  eventReports: "event_reports",
  audits: "audits",
  remarks: "remarks",
  engagements: "engagements",
  uploadedFiles: "uploadedfiles",
  responsibilities: "responsibilities",
  users: "users",
} as const;

const globalForIndexes = globalThis as unknown as {
  normalizedIndexesReady?: boolean;
};

export async function ensureNormalizedIndexes(db: Db) {
  if (globalForIndexes.normalizedIndexesReady) {
    return;
  }

  await Promise.all([
    db.collection(COLLECTIONS.courses).createIndex({ id: 1 }, { unique: true }),
    db
      .collection(COLLECTIONS.courses)
      .createIndex({ code: 1 }, { unique: true }),
    db
      .collection(COLLECTIONS.students)
      .createIndex({ id: 1 }, { unique: true }),
    db
      .collection(COLLECTIONS.students)
      .createIndex({ advisorId: 1, batchYear: 1, rollNumber: 1 }),
    db
      .collection(COLLECTIONS.eventReports)
      .createIndex({ id: 1 }, { unique: true }),
    db
      .collection(COLLECTIONS.eventReports)
      .createIndex({ facultyId: 1, eventDate: -1 }),
    db
      .collection(COLLECTIONS.eventReports)
      .createIndex({ facultyId: 1, createdAt: -1 }),
    db.collection(COLLECTIONS.eventReports).createIndex({ status: 1 }),
    db.collection(COLLECTIONS.audits).createIndex({ id: 1 }, { unique: true }),
    db
      .collection(COLLECTIONS.audits)
      .createIndex({ entityType: 1, entityId: 1 }),
    db.collection(COLLECTIONS.remarks).createIndex({ id: 1 }, { unique: true }),
    db
      .collection(COLLECTIONS.remarks)
      .createIndex({ entityType: 1, entityId: 1 }),
    db
      .collection(COLLECTIONS.engagements)
      .createIndex({ facultyId: 1 }, { unique: true }),
  ]);

  globalForIndexes.normalizedIndexesReady = true;
}
