import { realtimePath } from "./api";
import type { Session } from "./types";

const KEY = "whosnext.session";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function guestDisplayName(): string {
  return `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
}

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function persist(session: Session) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  }
}

export async function createSession(nickname?: string): Promise<Session> {
  const existing = readSession();
  const clean = (nickname ?? "").trim().slice(0, 20);
  const session: Session = {
    userId: existing?.userId ?? uuid(),
    displayName: clean.length > 0 ? clean : guestDisplayName(),
    isGuest: clean.length === 0,
    createdAt: existing?.createdAt ?? Date.now(),
  };

  try {
    const res = await fetch(realtimePath("/api/session"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: session.userId,
        displayName: session.displayName,
        isGuest: session.isGuest,
      }),
    });
    if (res.ok) {
      const saved = (await res.json()) as Partial<Session>;
      if (saved.userId) session.userId = saved.userId;
      if (saved.displayName) session.displayName = saved.displayName;
      if (typeof saved.isGuest === "boolean") session.isGuest = saved.isGuest;
      if (typeof saved.createdAt === "number") session.createdAt = saved.createdAt;
    }
  } catch {
    // Local session still works; Mongo save retries on socket hello.
  }

  persist(session);
  return session;
}

export function clearSession() {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
}

export async function fetchOnlineCount(): Promise<number> {
  try {
    const res = await fetch(realtimePath("/api/online"));
    if (!res.ok) return 0;
    const data = (await res.json()) as { online?: number };
    return typeof data.online === "number" ? data.online : 0;
  } catch {
    return 0;
  }
}
