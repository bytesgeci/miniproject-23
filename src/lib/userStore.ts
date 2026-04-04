import { randomUUID } from "crypto";
import { ObjectId } from "mongodb";
import type { UserRole } from "@/lib/roles";
import { getMongoDb } from "@/lib/mongoDb";
import { userSeedData } from "@/lib/userSeed";
import {
  PRIMARY_ADMIN_USERNAME,
  includesAdminRole,
  isPrimaryAdminEmail,
  isPrimaryAdminUsername,
  normalizeRoleInput,
  sanitizeFacultyAssignableRoles,
  sanitizeNonAdminRoles,
} from "@/lib/adminConfig";

export interface UserRecord {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  roles?: UserRole[];
  department?: string;
  email?: string;
  firebaseUid?: string;
  phone?: string;
  status?: string;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastActiveAt?: string;
  [key: string]: any;
}

interface UserDocument extends Omit<UserRecord, "id"> {
  _id: string;
  id?: string;
}

interface CreateUserInput {
  id?: string;
  username?: string;
  email?: string;
  password?: string;
  name: string;
  role: UserRole;
  roles?: UserRole[];
  department?: string;
  firebaseUid?: string;
  phone?: string;
  status?: string;
  [key: string]: any;
}

let indexesEnsured = false;
let seedEnsured = false;
const USERS_CACHE_TTL_MS = 20000;
let usersCache: { expiresAt: number; users: UserRecord[] } | null = null;

function normalizeIdentity(value: string) {
  return value.trim().toLowerCase();
}

function matchesUserIdentifier(user: UserRecord, identifier: string) {
  const rawIdentifier = String(identifier || "").trim();
  if (!rawIdentifier) {
    return false;
  }

  const normalizedIdentifier = normalizeIdentity(rawIdentifier);
  const directCandidates = [
    String(user.id || ""),
    String((user as any)._id || ""),
    String(user.firebaseUid || ""),
  ];

  if (directCandidates.some((candidate) => candidate === rawIdentifier)) {
    return true;
  }

  const normalizedCandidates = [
    String(user.username || ""),
    String(user.email || ""),
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .map(normalizeIdentity);

  return normalizedCandidates.some(
    (candidate) => candidate === normalizedIdentifier,
  );
}

function mapUserDocument(document: UserDocument): UserRecord {
  const { _id, id, ...rest } = document;
  return {
    ...rest,
    id: id || _id,
  } as UserRecord;
}

function cloneUserRecord(user: UserRecord): UserRecord {
  return {
    ...user,
    roles: Array.isArray(user.roles) ? [...user.roles] : user.roles,
  };
}

function invalidateUsersCache() {
  usersCache = null;
}

function getCachedUsers(): UserRecord[] | null {
  if (!usersCache) {
    return null;
  }

  if (usersCache.expiresAt <= Date.now()) {
    usersCache = null;
    return null;
  }

  return usersCache.users.map(cloneUserRecord);
}

function setCachedUsers(users: UserRecord[]) {
  usersCache = {
    users: users.map(cloneUserRecord),
    expiresAt: Date.now() + USERS_CACHE_TTL_MS,
  };
}

async function enforceSingleAdminPolicy(collection: any) {
  const usersWithAdmin = await collection
    .find({ $or: [{ role: "admin" }, { roles: "admin" }] })
    .toArray();

  if (usersWithAdmin.length === 0) {
    return;
  }

  const timestamp = new Date().toISOString();
  for (const user of usersWithAdmin) {
    const isPrimary =
      isPrimaryAdminEmail(user.email) ||
      isPrimaryAdminUsername(user.username) ||
      isPrimaryAdminUsername(user.name);

    if (isPrimary) {
      await collection.updateOne(
        { _id: user._id },
        {
          $set: {
            username: normalizeIdentity(PRIMARY_ADMIN_USERNAME),
            role: "admin",
            roles: ["admin"],
            updatedAt: timestamp,
          },
        },
      );
      continue;
    }

    const fallbackRole = normalizeRoleInput(user.role) || "faculty";
    const nextRoles = sanitizeNonAdminRoles(user.roles || [fallbackRole]);

    await collection.updateOne(
      { _id: user._id },
      {
        $set: {
          role: nextRoles[0],
          roles: nextRoles,
          updatedAt: timestamp,
        },
      },
    );
  }
}

async function getUsersCollection() {
  const db = await getMongoDb();
  const collection = db.collection<UserDocument>("users");

  if (!indexesEnsured) {
    indexesEnsured = true;
    try {
      await collection.createIndex({ username: 1 }, { unique: true });
    } catch {
      // ignore index creation conflicts
    }
    try {
      await collection.createIndex(
        { email: 1 },
        { unique: true, sparse: true },
      );
    } catch {
      // ignore index creation conflicts
    }
    try {
      await collection.createIndex(
        { firebaseUid: 1 },
        { unique: true, sparse: true },
      );
    } catch {
      // ignore index creation conflicts
    }
  }

  if (!seedEnsured) {
    seedEnsured = true;
    const existingCount = await collection.countDocuments();
    if (existingCount === 0 && userSeedData.length > 0) {
      const seedDocuments = userSeedData.map((user) => {
        const normalizedIdentity = normalizeIdentity(
          user.username || user.email || "",
        );
        return {
          ...user,
          _id: user.id,
          id: user.id,
          username: normalizedIdentity,
          email: normalizeIdentity(user.email || normalizedIdentity),
          role: user.role,
          roles: user.roles || [user.role],
        } as UserDocument;
      });

      if (seedDocuments.length > 0) {
        await collection.insertMany(seedDocuments, { ordered: false });
      }
    }

    await enforceSingleAdminPolicy(collection);
  }

  return collection;
}

async function getUsersCollectionDirect() {
  const db = await getMongoDb();
  return db.collection<UserDocument>("users");
}

export async function getAllUsers() {
  const cachedUsers = getCachedUsers();
  if (cachedUsers) {
    return cachedUsers;
  }

  const collection = await getUsersCollection();
  const users = await collection.find({}).toArray();
  const mappedUsers = users.map(mapUserDocument);
  setCachedUsers(mappedUsers);
  return mappedUsers.map(cloneUserRecord);
}

export async function findUserByUsername(username: string) {
  const normalizedUsername = normalizeIdentity(username);
  const users = await getAllUsers();

  const directMatch = users.find((user) => {
    const userUsername = normalizeIdentity(user.username || "");
    const userEmail = normalizeIdentity(user.email || "");
    return (
      userUsername === normalizedUsername || userEmail === normalizedUsername
    );
  });

  if (directMatch) {
    return cloneUserRecord(directMatch);
  }

  const escaped = normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nameRegex = new RegExp(`^${escaped}$`, "i");
  const nameMatch = users.find((user) =>
    nameRegex.test(String(user.name || "")),
  );
  return nameMatch ? cloneUserRecord(nameMatch) : null;
}

export async function findUserByEmail(email: string) {
  const normalizedEmail = normalizeIdentity(email);
  const users = await getAllUsers();

  const emailMatch = users.find((user) => {
    const userEmail = normalizeIdentity(user.email || "");
    return userEmail === normalizedEmail;
  });

  return emailMatch ? cloneUserRecord(emailMatch) : null;
}

export async function isUsernameTaken(username: string) {
  const normalizedUsername = normalizeIdentity(username);
  const users = await getAllUsers();

  return users.some((user) => {
    const userUsername = normalizeIdentity(user.username || "");
    return userUsername === normalizedUsername;
  });
}

export async function findUserById(id: string) {
  const users = await getAllUsers();
  const directMatch = users.find((user) => matchesUserIdentifier(user, id));
  if (directMatch) {
    return cloneUserRecord(directMatch);
  }

  if (ObjectId.isValid(id)) {
    const objectId = new ObjectId(id).toString();
    const objectIdMatch = users.find(
      (user) => String(user.id || "") === objectId,
    );
    return objectIdMatch ? cloneUserRecord(objectIdMatch) : null;
  }

  return null;
}

export async function createUser(input: CreateUserInput) {
  const collection = await getUsersCollection();
  const usernameSource = input.username || input.name || input.email;

  if (!usernameSource) {
    throw new Error("Username is required");
  }

  const normalizedUsername = normalizeIdentity(usernameSource);
  const existingUser = await findUserByUsername(normalizedUsername);

  if (existingUser) {
    throw new Error("DUPLICATE_USER");
  }

  const normalizedEmail = input.email
    ? normalizeIdentity(input.email)
    : normalizedUsername.includes("@")
      ? normalizedUsername
      : "";

  if (normalizedEmail) {
    const existingByEmail = await findUserByUsername(normalizedEmail);
    if (existingByEmail) {
      throw new Error("DUPLICATE_USER");
    }
  }

  const timestamp = new Date().toISOString();
  const id = input.id || randomUUID();
  const requestedRole = normalizeRoleInput(input.role);
  const requestedRoles = Array.isArray(input.roles) ? input.roles : [];
  const requestedRoleSet =
    requestedRoles.length > 0
      ? requestedRoles
      : [requestedRole || input.role || "faculty"];

  const isPrimaryAdminByEmail = isPrimaryAdminEmail(normalizedEmail);
  const isPrimaryAdminByUsername = isPrimaryAdminUsername(normalizedUsername);

  if (isPrimaryAdminByUsername && !isPrimaryAdminByEmail) {
    throw new Error("PRIMARY_ADMIN_IDENTITY_RESERVED");
  }

  const isPrimaryAdmin = isPrimaryAdminByEmail || isPrimaryAdminByUsername;

  const wantsAdminRole =
    requestedRole === "admin" || includesAdminRole(requestedRoleSet);

  if (wantsAdminRole && !isPrimaryAdmin) {
    throw new Error("ADMIN_ROLE_ASSIGNMENT_DISABLED");
  }

  const role: UserRole = isPrimaryAdmin
    ? "admin"
    : requestedRole === "auditor" || requestedRole === "staff-advisor"
      ? requestedRole
      : "faculty";
  const roles: UserRole[] = isPrimaryAdmin
    ? ["admin"]
    : sanitizeNonAdminRoles(requestedRoleSet);

  const user: UserDocument = {
    ...(input as Omit<UserDocument, "_id">),
    _id: id,
    id,
    username: normalizedUsername,
    email: normalizedEmail || undefined,
    role,
    roles,
    createdAt: input.createdAt || timestamp,
    updatedAt: input.updatedAt || timestamp,
  };

  if (!input.password) {
    delete user.password;
  }

  await collection.insertOne(user);
  invalidateUsersCache();

  return mapUserDocument(user);
}

export async function updateUserById(id: string, updates: Partial<UserRecord>) {
  const collection = await getUsersCollection();
  const existingUserRecord = await findUserById(id);

  if (!existingUserRecord) {
    return null;
  }

  const resolvedId = String(existingUserRecord.id || id);
  const existingUser = await collection.findOne({ _id: resolvedId });

  if (!existingUser) {
    return null;
  }

  const payload: Partial<UserDocument> = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const hasRoleUpdate = Object.prototype.hasOwnProperty.call(updates, "role");
  const hasRolesUpdate = Object.prototype.hasOwnProperty.call(updates, "roles");
  const requestedRole = hasRoleUpdate
    ? normalizeRoleInput(String(updates.role || ""))
    : null;

  if (hasRoleUpdate && updates.role && !requestedRole) {
    throw new Error("INVALID_ROLE");
  }

  const requestedRoles = hasRolesUpdate
    ? Array.isArray(updates.roles)
      ? updates.roles
      : []
    : [];

  if (hasRolesUpdate && requestedRoles.length === 0) {
    throw new Error("INVALID_ROLES");
  }

  const isPrimaryAdmin =
    isPrimaryAdminEmail(existingUser.email) ||
    isPrimaryAdminUsername(existingUser.username || existingUser.name);
  const existingIsAdmin =
    normalizeRoleInput(existingUser.role) === "admin" ||
    includesAdminRole(existingUser.roles || []);

  if (payload.username && isPrimaryAdminUsername(payload.username)) {
    if (!isPrimaryAdmin) {
      throw new Error("PRIMARY_ADMIN_IDENTITY_RESERVED");
    }
    payload.username = normalizeIdentity(PRIMARY_ADMIN_USERNAME);
  }

  if (payload.email && isPrimaryAdminEmail(payload.email)) {
    if (!isPrimaryAdmin) {
      throw new Error("PRIMARY_ADMIN_IDENTITY_RESERVED");
    }
  }

  if (isPrimaryAdmin) {
    if (payload.email && !isPrimaryAdminEmail(payload.email)) {
      throw new Error("PRIMARY_ADMIN_LOCKED");
    }

    if (payload.username && !isPrimaryAdminUsername(payload.username)) {
      throw new Error("PRIMARY_ADMIN_LOCKED");
    }

    if (
      (hasRoleUpdate && requestedRole !== "admin") ||
      (hasRolesUpdate && !includesAdminRole(requestedRoles))
    ) {
      throw new Error("PRIMARY_ADMIN_LOCKED");
    }

    if (hasRoleUpdate || hasRolesUpdate) {
      payload.username = normalizeIdentity(PRIMARY_ADMIN_USERNAME);
      payload.role = "admin";
      payload.roles = ["admin"];
    }
  } else {
    if (
      ((hasRoleUpdate && requestedRole === "admin") ||
        (hasRolesUpdate && includesAdminRole(requestedRoles))) &&
      !existingIsAdmin
    ) {
      throw new Error("ADMIN_ROLE_ASSIGNMENT_DISABLED");
    }

    if (existingIsAdmin && (hasRoleUpdate || hasRolesUpdate)) {
      payload.role = "admin";
      payload.roles = ["admin"];
    } else if (hasRoleUpdate || hasRolesUpdate) {
      const nextRoles = sanitizeFacultyAssignableRoles(
        hasRolesUpdate
          ? requestedRoles
          : [requestedRole || existingUser.role || "faculty"],
      );

      payload.role = nextRoles[0];
      payload.roles = nextRoles;
    }
  }

  if (payload.username) {
    payload.username = normalizeIdentity(payload.username);
  }

  if (payload.email) {
    payload.email = normalizeIdentity(payload.email);
  }

  delete payload._id;
  delete payload.id;

  await collection.updateOne({ _id: resolvedId }, { $set: payload });
  invalidateUsersCache();
  return findUserById(resolvedId);
}

export async function updateUserLastActive(id: string) {
  const collection = await getUsersCollection();
  const existingUser = await findUserById(id);
  if (!existingUser) {
    return;
  }

  const resolvedId = String(existingUser.id || id);
  const timestamp = new Date().toISOString();

  await collection.updateOne(
    { _id: resolvedId },
    {
      $set: {
        lastActiveAt: timestamp,
        updatedAt: timestamp,
      },
    },
  );
  invalidateUsersCache();
}

export async function updateUserVerification(
  firebaseUid: string,
  isVerified: boolean,
) {
  const collection = await getUsersCollection();
  const timestamp = new Date().toISOString();

  const result = await collection.updateOne(
    { firebaseUid },
    {
      $set: {
        emailVerified: isVerified,
        updatedAt: timestamp,
      },
    },
  );

  invalidateUsersCache();
  return result.modifiedCount > 0;
}

export async function deleteUserById(id: string) {
  const collection = await getUsersCollection();
  const existingUser = await findUserById(id);
  if (!existingUser) {
    return;
  }

  const resolvedId = String(existingUser.id || id).trim();
  const normalizedUsername = normalizeIdentity(existingUser.username || "");
  const normalizedEmail = normalizeIdentity(existingUser.email || "");

  const idCandidates = [resolvedId, String(id || "").trim()].filter(Boolean);
  const idFilter = idCandidates.flatMap((value) => {
    const filters: Record<string, any>[] = [
      { _id: value },
      { id: value },
      { firebaseUid: value },
    ];

    if (ObjectId.isValid(value)) {
      filters.push({ _id: new ObjectId(value) });
    }

    return filters;
  });

  const identityFilter: Record<string, any>[] = [];
  if (normalizedUsername) {
    identityFilter.push({ username: normalizedUsername });
  }
  if (normalizedEmail) {
    identityFilter.push({ email: normalizedEmail });
  }

  await collection.deleteMany({
    $or: [...idFilter, ...identityFilter],
  });
  invalidateUsersCache();
}
