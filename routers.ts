import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, InsertDemoSubmission, demoSubmissions, InsertContactInquiry, contactInquiries } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Save a demo submission to the database
 */
export async function saveDemoSubmission(submission: InsertDemoSubmission) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save demo submission: database not available");
    return null;
  }

  try {
    const result = await db.insert(demoSubmissions).values(submission);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save demo submission:", error);
    throw error;
  }
}

/**
 * Save a contact inquiry to the database
 */
export async function saveContactInquiry(inquiry: InsertContactInquiry) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save contact inquiry: database not available");
    return null;
  }

  try {
    const result = await db.insert(contactInquiries).values(inquiry);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save contact inquiry:", error);
    throw error;
  }
}

/**
 * Get all contact inquiries (for admin)
 */
export async function getContactInquiries() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get contact inquiries: database not available");
    return [];
  }

  try {
    const result = await db.select().from(contactInquiries);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get contact inquiries:", error);
    throw error;
  }
}
