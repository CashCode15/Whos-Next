import { getServers, setDefaultResultOrder, setServers } from "node:dns";
import { MongoClient, type Collection } from "mongodb";

export type UserDoc = {
  userId: string;
  displayName: string;
  isGuest: boolean;
  createdAt: Date;
  lastSeenAt: Date;
};

let client: MongoClient | null = null;
let users: Collection<UserDoc> | null = null;
let dnsHardened = false;

/**
 * Node on this Windows box uses 127.0.0.1:53. Nothing is listening there,
 * so mongodb+srv SRV lookups fail with querySrv ECONNREFUSED. Windows DNS
 * itself still works. Point Node at public resolvers only when it has no
 * real upstream DNS.
 */
function hardenNodeDns() {
  if (dnsHardened) return;
  dnsHardened = true;
  setDefaultResultOrder("ipv4first");

  const servers = getServers();
  const unusable = (s: string) =>
    s === "127.0.0.1" ||
    s === "::1" ||
    s.startsWith("127.") ||
    s.toLowerCase().startsWith("fe80:");

  if (servers.length === 0 || servers.every(unusable)) {
    setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
    console.log("Node DNS had no upstream resolver; using 8.8.8.8 / 1.1.1.1 for MongoDB SRV");
  }
}

export async function connectDb(): Promise<Collection<UserDoc>> {
  if (users) return users;

  hardenNodeDns();

  const uri = process.env["MONGODB_URI"] ?? "mongodb://127.0.0.1:27017/whosnext";
  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 12000,
    maxPoolSize: 50,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
  });
  await client.connect();
  console.log("Connected to MongoDB");

  const dbName = process.env["MONGODB_DB"] ?? "whosnext";
  const col = client.db(dbName).collection<UserDoc>("users");
  await col.createIndex({ userId: 1 }, { unique: true });
  users = col;
  return col;
}

export async function upsertUser(input: {
  userId: string;
  displayName: string;
  isGuest: boolean;
}): Promise<UserDoc> {
  const col = await connectDb();
  const now = new Date();
  const displayName = input.displayName.trim().slice(0, 20) || "Guest";
  const isGuest = input.isGuest || displayName.startsWith("Guest_");

  await col.updateOne(
    { userId: input.userId },
    {
      $set: { displayName, isGuest, lastSeenAt: now },
      $setOnInsert: { userId: input.userId, createdAt: now },
    },
    { upsert: true },
  );

  const doc = await col.findOne({ userId: input.userId });
  if (!doc) {
    throw new Error("Failed to upsert user");
  }
  return doc;
}

export async function touchUser(userId: string) {
  try {
    const col = await connectDb();
    await col.updateOne({ userId }, { $set: { lastSeenAt: new Date() } });
  } catch {
    // identity is still valid in-memory if mongo blips
  }
}
