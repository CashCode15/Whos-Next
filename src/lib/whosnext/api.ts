/** Base URL of the Socket.IO / REST realtime server. Empty = same origin (Vite proxy). */
export function realtimeBase(): string {
  const raw = import.meta.env.VITE_SOCKET_URL;
  if (typeof raw !== "string") return "";
  return raw.replace(/\/$/, "");
}

export function realtimePath(path: string): string {
  return `${realtimeBase()}${path}`;
}
