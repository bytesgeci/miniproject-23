import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

// Initialize Firebase Admin SDK (server-side only)
const apps = getApps();

function resolveStorageBucketName() {
  const raw =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "";

  return String(raw)
    .trim()
    .replace(/^gs:\/\//i, "")
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
}

let adminApp;
if (!apps.length) {
  // Try to initialize with service account
  try {
    console.log("Initializing Firebase Admin with service account...");

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      console.warn("Missing Firebase credentials:", {
        projectId: !!projectId,
        clientEmail: !!clientEmail,
        privateKey: !!privateKey,
      });
    }

    const storageBucket = resolveStorageBucketName();

    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      ...(storageBucket ? { storageBucket } : {}),
    });

    console.log(
      "Firebase Admin initialized successfully with project:",
      projectId,
    );
  } catch (error: any) {
    console.warn(
      "Firebase Admin initialization with service account failed:",
      error.message,
    );
    console.warn("Attempting fallback to default credentials...");
    // Fallback to default credentials (works in Firebase hosting)
    try {
      adminApp = initializeApp();
      console.log("Firebase Admin initialized with default credentials");
    } catch (fallbackError) {
      console.error(
        "Both Firebase initialization methods failed:",
        fallbackError,
      );
      throw fallbackError;
    }
  }
} else {
  adminApp = apps[0];
  console.log("Firebase Admin already initialized");
}

// Initialize services
export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
export const adminStorage = getStorage(adminApp);

export default adminApp;
