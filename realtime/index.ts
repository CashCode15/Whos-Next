import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { Server, type Socket } from "socket.io";
import { connectDb, touchUser, upsertUser } from "./db.ts";
import { getIceServers } from "./ice.ts";
import type { HelloPayload, PeerInfo, SignalPayload } from "./types.ts";

const realtimeDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(realtimeDir, "../.env") });

const PORT = Number(process.env["PORT"] ?? process.env["REALTIME_PORT"] ?? 8787);
const CORS_ORIGIN = process.env["FRONTEND_ORIGIN"] || true;

type SocketMeta = {
  userId: string;
  displayName: string;
  isGuest: boolean;
  interests: string[];
  blockedIds: Set<string>;
  recentIds: string[];
  roomId: string | null;
};

type Room = { a: string; b: string };

/** socketId → when they joined the queue (FIFO + stale cleanup). */
const waiting = new Map<string, number>();
const rooms = new Map<string, Room>();
const meta = new WeakMap<Socket, SocketMeta>();
const RECENT_HOLD_MS = 12_000;

function json(res: ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": typeof CORS_ORIGIN === "string" ? CORS_ORIGIN : "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "cache-control": "no-store",
  });
  res.end(payload);
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

function onlineCount(io: Server) {
  return io.engine.clientsCount;
}

function otherId(room: Room, socketId: string) {
  return room.a === socketId ? room.b : room.a;
}

function roomOf(socket: Socket) {
  const m = meta.get(socket);
  if (!m?.roomId) return null;
  return rooms.get(m.roomId) ?? null;
}

function leaveRoom(io: Server, socket: Socket, notifyPeer: boolean) {
  const m = meta.get(socket);
  if (!m?.roomId) return;
  const room = rooms.get(m.roomId);
  waiting.delete(socket.id);
  if (room) {
    const peerId = otherId(room, socket.id);
    rooms.delete(m.roomId);
    const peer = io.sockets.sockets.get(peerId);
    const peerMeta = peer ? meta.get(peer) : undefined;
    if (peerMeta) peerMeta.roomId = null;
    if (notifyPeer && peer) {
      peer.leave(m.roomId);
      peer.emit("peer_left");
    }
  }
  void socket.leave(m.roomId);
  m.roomId = null;
}

function interestScore(a: SocketMeta, b: SocketMeta) {
  if (a.interests.length === 0 || b.interests.length === 0) return 0;
  const other = new Set(b.interests);
  return a.interests.reduce((n, i) => n + (other.has(i) ? 1 : 0), 0);
}

function canPair(self: SocketMeta, other: SocketMeta, waitedMs: number) {
  if (other.userId === self.userId) return false;
  if (self.blockedIds.has(other.userId) || other.blockedIds.has(self.userId)) return false;
  const recent =
    self.recentIds.includes(other.userId) || other.recentIds.includes(self.userId);
  if (recent && waitedMs < RECENT_HOLD_MS) return false;
  return true;
}

function pairSockets(io: Server, socket: Socket, other: Socket) {
  const self = meta.get(socket);
  const om = meta.get(other);
  if (!self || !om) return;

  waiting.delete(socket.id);
  waiting.delete(other.id);
  const roomId = `r_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 8)}`;
  rooms.set(roomId, { a: socket.id, b: other.id });
  self.roomId = roomId;
  om.roomId = roomId;
  self.recentIds = [om.userId, ...self.recentIds].slice(0, 8);
  om.recentIds = [self.userId, ...om.recentIds].slice(0, 8);

  void socket.join(roomId);
  void other.join(roomId);

  socket.emit("matched", {
    roomId,
    peer: {
      userId: om.userId,
      displayName: om.displayName,
      region: "Live",
      interests: om.interests.slice(0, 3),
    } satisfies PeerInfo,
    initiator: true,
  });
  other.emit("matched", {
    roomId,
    peer: {
      userId: self.userId,
      displayName: self.displayName,
      region: "Live",
      interests: self.interests.slice(0, 3),
    } satisfies PeerInfo,
    initiator: false,
  });
}

function tryMatch(io: Server, socket: Socket, announce: boolean) {
  const self = meta.get(socket);
  if (!self || self.roomId) return;
  const queuedAt = waiting.get(socket.id) ?? Date.now();
  waiting.delete(socket.id);

  const now = Date.now();
  const candidates: { id: string; score: number; queuedAt: number }[] = [];
  for (const [otherIdWaiting, otherQueuedAt] of waiting) {
    const other = io.sockets.sockets.get(otherIdWaiting);
    const om = other ? meta.get(other) : undefined;
    if (!other || !om || om.roomId) {
      waiting.delete(otherIdWaiting);
      continue;
    }
    if (!canPair(self, om, now - otherQueuedAt)) continue;
    candidates.push({
      id: other.id,
      score: interestScore(self, om),
      queuedAt: otherQueuedAt,
    });
  }

  candidates.sort((a, b) => b.score - a.score || a.queuedAt - b.queuedAt);
  const pick = candidates[0];
  if (pick) {
    const other = io.sockets.sockets.get(pick.id);
    if (other) {
      pairSockets(io, socket, other);
      return;
    }
  }

  waiting.set(socket.id, queuedAt);
  if (announce) socket.emit("searching");
}

function drainQueue(io: Server) {
  for (const socketId of [...waiting.keys()]) {
    const socket = io.sockets.sockets.get(socketId);
    const m = socket ? meta.get(socket) : undefined;
    if (!socket || !m || m.roomId) {
      waiting.delete(socketId);
      continue;
    }
    tryMatch(io, socket, false);
  }
}

function attachSockets(io: Server) {
  io.on("connection", (socket) => {
    socket.emit("online", onlineCount(io));

    socket.on("hello", async (payload: HelloPayload) => {
      const userId = String(payload?.userId ?? "").slice(0, 80);
      const displayName = String(payload?.displayName ?? "Guest").slice(0, 20);
      if (!userId) return;
      try {
        await upsertUser({
          userId,
          displayName,
          isGuest: Boolean(payload.isGuest),
        });
      } catch (err) {
        console.error("hello upsert failed", err);
      }
      meta.set(socket, {
        userId,
        displayName,
        isGuest: Boolean(payload.isGuest),
        interests: Array.isArray(payload.interests)
          ? payload.interests.map(String).slice(0, 8)
          : [],
        blockedIds: new Set(
          Array.isArray(payload.blockedIds) ? payload.blockedIds.map(String) : [],
        ),
        recentIds: [],
        roomId: null,
      });
      socket.emit("hello_ok", { userId, displayName });
      io.emit("online", onlineCount(io));
    });

    socket.on("find", () => {
      if (!meta.get(socket)) return;
      leaveRoom(io, socket, true);
      tryMatch(io, socket, true);
    });

    socket.on("next", () => {
      const m = meta.get(socket);
      if (!m) return;
      leaveRoom(io, socket, true);
      tryMatch(io, socket, true);
    });

    socket.on("leave", () => {
      waiting.delete(socket.id);
      leaveRoom(io, socket, true);
    });

    socket.on("block", (userId: string) => {
      const m = meta.get(socket);
      if (!m || !userId) return;
      m.blockedIds.add(String(userId));
      leaveRoom(io, socket, true);
      tryMatch(io, socket, true);
    });

    socket.on("chat", (body: string) => {
      const m = meta.get(socket);
      const room = roomOf(socket);
      if (!m?.roomId || !room) return;
      const text = String(body ?? "").trim().slice(0, 500);
      if (!text) return;
      const peer = io.sockets.sockets.get(otherId(room, socket.id));
      peer?.emit("chat", { body: text, at: Date.now() });
    });

    socket.on("typing", (on: boolean) => {
      const room = roomOf(socket);
      if (!room) return;
      const peer = io.sockets.sockets.get(otherId(room, socket.id));
      peer?.emit("typing", Boolean(on));
    });

    socket.on("signal", (payload: SignalPayload) => {
      const room = roomOf(socket);
      if (!room || !payload?.type) return;
      const peer = io.sockets.sockets.get(otherId(room, socket.id));
      peer?.emit("signal", payload);
    });

    socket.on("disconnect", () => {
      const m = meta.get(socket);
      waiting.delete(socket.id);
      leaveRoom(io, socket, true);
      if (m) void touchUser(m.userId);
      io.emit("online", onlineCount(io));
    });
  });
}

async function handleHttp(req: IncomingMessage, res: ServerResponse, io: Server) {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    json(res, 200, {
      ok: true,
      sockets: onlineCount(io),
      waiting: waiting.size,
      rooms: rooms.size,
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/ice") {
    try {
      const ice = await getIceServers();
      json(res, 200, ice);
    } catch (err) {
      console.error(err);
      json(res, 200, {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun.cloudflare.com:3478" },
        ],
        turn: false,
      });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/online") {
    json(res, 200, { online: onlineCount(io) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/session") {
    try {
      const body = await readJson(req);
      const userId = String(body["userId"] ?? "").slice(0, 80);
      const displayName = String(body["displayName"] ?? "").slice(0, 20);
      if (!userId || !displayName) {
        json(res, 400, { error: "userId and displayName required" });
        return;
      }
      const user = await upsertUser({
        userId,
        displayName,
        isGuest: Boolean(body["isGuest"]),
      });
      json(res, 200, {
        userId: user.userId,
        displayName: user.displayName,
        isGuest: user.isGuest,
        createdAt: user.createdAt.getTime(),
      });
    } catch (err) {
      console.error(err);
      json(res, 503, { error: "Could not save session" });
    }
    return;
  }

  json(res, 404, { error: "not found" });
}

async function main() {
  try {
    await connectDb();
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB unavailable — sessions will fail until it is up", err);
  }

  const httpServer = createServer((req, res) => {
    void handleHttp(req, res, io);
  });

  const io: Server = new Server(httpServer, {
    cors: { origin: CORS_ORIGIN, methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6,
    perMessageDeflate: false,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
  });

  attachSockets(io);
  setInterval(() => drainQueue(io), 2000);

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Realtime listening on port ${PORT}`);
  });
}

void main();
