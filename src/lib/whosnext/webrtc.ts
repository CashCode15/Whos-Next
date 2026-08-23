const FALLBACK: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];

let cached: RTCIceServer[] | null = null;
let cachedAt = 0;
let inflight: Promise<RTCIceServer[]> | null = null;

function asConfig(iceServers: RTCIceServer[]): RTCConfiguration {
  return {
    iceServers,
    iceCandidatePoolSize: 8,
    iceTransportPolicy: "all",
  };
}

export async function loadIceServers(): Promise<RTCIceServer[]> {
  if (cached && Date.now() - cachedAt < 5 * 60 * 1000) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const { realtimePath } = await import("./api");
      const res = await fetch(realtimePath("/api/ice"));
      if (!res.ok) throw new Error(`ice ${res.status}`);
      const data = (await res.json()) as { iceServers?: RTCIceServer[] };
      if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
        cached = data.iceServers;
        cachedAt = Date.now();
        return cached;
      }
    } catch (err) {
      console.error("ICE fetch failed, using STUN only", err);
    } finally {
      inflight = null;
    }
    return cached ?? FALLBACK;
  })();

  return inflight;
}

export function createPeerConnection(
  onIce: (candidate: RTCIceCandidateInit) => void,
  onTrack: (stream: MediaStream) => void,
  onState: (state: RTCPeerConnectionState) => void,
  iceServers: RTCIceServer[] = FALLBACK,
): RTCPeerConnection {
  const pc = new RTCPeerConnection(asConfig(iceServers));

  pc.onicecandidate = (event) => {
    if (event.candidate) onIce(event.candidate.toJSON());
  };

  pc.ontrack = (event) => {
    const stream = event.streams[0] ?? new MediaStream([event.track]);
    onTrack(stream);
  };

  pc.onconnectionstatechange = () => onState(pc.connectionState);

  return pc;
}

export function syncLocalTracks(pc: RTCPeerConnection, stream: MediaStream) {
  for (const track of stream.getTracks()) {
    const sender = pc.getSenders().find((s) => s.track?.kind === track.kind);
    if (sender) {
      void sender.replaceTrack(track);
    } else {
      pc.addTrack(track, stream);
    }
  }
}

export async function createOffer(pc: RTCPeerConnection) {
  const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
  await pc.setLocalDescription(offer);
  return pc.localDescription;
}

export async function acceptOffer(pc: RTCPeerConnection, offer: RTCSessionDescriptionInit) {
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return pc.localDescription;
}

export async function acceptAnswer(pc: RTCPeerConnection, answer: RTCSessionDescriptionInit) {
  await pc.setRemoteDescription(answer);
}

export async function addIce(pc: RTCPeerConnection, candidate: RTCIceCandidateInit) {
  try {
    await pc.addIceCandidate(candidate);
  } catch {
    // Candidate can arrive before remote description; caller may retry.
  }
}
