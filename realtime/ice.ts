export type IceServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

const STUN_SERVERS: IceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "stun:stun.relay.metered.ca:80" },
];

let meteredCache: { at: number; servers: IceServer[] } | null = null;
const METERED_TTL_MS = 4 * 60 * 60 * 1000;

function envTurnServers(): IceServer[] {
  const rawUrls = process.env["TURN_URLS"] ?? "";
  const username = process.env["TURN_USERNAME"] ?? "";
  const credential = process.env["TURN_CREDENTIAL"] ?? "";
  const urls = rawUrls
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (urls.length === 0 || !username || !credential) return [];
  return urls.map((url) => ({ urls: url, username, credential }));
}

/** Public Open Relay so mobile/symmetric-NAT users can connect before custom TURN is set. */
function fallbackTurnServers(): IceServer[] {
  const username = "openrelayproject";
  const credential = "openrelayproject";
  return [
    { urls: "turn:openrelay.metered.ca:80", username, credential },
    { urls: "turn:openrelay.metered.ca:443", username, credential },
    { urls: "turn:openrelay.metered.ca:80?transport=tcp", username, credential },
    { urls: "turns:openrelay.metered.ca:443?transport=tcp", username, credential },
  ];
}

async function meteredTurnServers(): Promise<IceServer[]> {
  const domain = (process.env["METERED_DOMAIN"] ?? "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const apiKey = process.env["METERED_API_KEY"] ?? "";
  if (!domain || !apiKey) return [];

  if (meteredCache && Date.now() - meteredCache.at < METERED_TTL_MS) {
    return meteredCache.servers;
  }

  const url = `https://${domain}/api/v1/turn/credentials?apiKey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Metered TURN HTTP ${res.status}`);
  }
  const body = (await res.json()) as IceServer[];
  if (!Array.isArray(body) || body.length === 0) return [];
  meteredCache = { at: Date.now(), servers: body };
  return body;
}

export async function getIceServers(): Promise<{ iceServers: IceServer[]; turn: boolean }> {
  const fromEnv = envTurnServers();
  let fromMetered: IceServer[] = [];
  try {
    fromMetered = await meteredTurnServers();
  } catch (err) {
    console.error("Metered TURN fetch failed", err);
  }

  const turn = fromMetered.length > 0 ? fromMetered : fromEnv.length > 0 ? fromEnv : fallbackTurnServers();
  const iceServers = [...STUN_SERVERS, ...turn];
  return { iceServers, turn: turn.length > 0 };
}
