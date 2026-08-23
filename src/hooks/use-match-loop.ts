import { useCallback, useEffect, useRef, useState } from "react";
import { qualityFromStats } from "@/lib/whosnext/matchmaking";
import { connectRealtime, type MatchedPayload, type SignalPayload } from "@/lib/whosnext/realtime";
import type { Session } from "@/lib/whosnext/types";
import {
  acceptAnswer,
  acceptOffer,
  addIce,
  createOffer,
  createPeerConnection,
  loadIceServers,
  syncLocalTracks,
} from "@/lib/whosnext/webrtc";
import type {
  ChatMessage,
  ConnectionQuality,
  MatchState,
  Peer,
} from "@/lib/whosnext/types";
import type { Socket } from "socket.io-client";

const RECENT_LIMIT = 8;

function id() {
  return Math.random().toString(16).slice(2);
}

export interface MatchLoop {
  state: MatchState;
  peer: Peer | null;
  messages: ChatMessage[];
  quality: ConnectionQuality;
  elapsed: number;
  conversations: number;
  peerTyping: boolean;
  remoteStream: MediaStream | null;
  live: boolean;
  online: number;
  start: () => void;
  next: () => void;
  leave: () => void;
  send: (body: string) => void;
  typing: (on: boolean) => void;
  block: () => void;
}

export function useMatchLoop(
  session: Session | null,
  interests: string[],
  localStream: MediaStream | null,
): MatchLoop {
  const [state, setState] = useState<MatchState>("idle");
  const [peer, setPeer] = useState<Peer | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [quality, setQuality] = useState<ConnectionQuality>("unknown");
  const [elapsed, setElapsed] = useState(0);
  const [conversations, setConversations] = useState(0);
  const [peerTyping, setPeerTyping] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [live, setLive] = useState(false);
  const [online, setOnline] = useState(0);

  const blocked = useRef<string[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const pendingOffer = useRef<RTCSessionDescriptionInit | null>(null);
  const initiatorRef = useRef(false);
  const wantFind = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(localStream);
  localStreamRef.current = localStream;

  const closePeer = useCallback(() => {
    pendingIce.current = [];
    pendingOffer.current = null;
    initiatorRef.current = false;
    pcRef.current?.close();
    pcRef.current = null;
    setRemoteStream(null);
  }, []);

  const push = useCallback((message: ChatMessage) => {
    setMessages((list) => [...list, message]);
  }, []);

  const setupPeer = useCallback((initiator: boolean) => {
    closePeer();
    initiatorRef.current = initiator;
    const socket = socketRef.current;
    if (!socket) return;
    const generation = socket.id;

    void loadIceServers().then((iceServers) => {
      if (socketRef.current?.id !== generation) return;
      const pc = createPeerConnection(
        (candidate) => socket.emit("signal", { type: "ice", data: candidate }),
        (stream) => setRemoteStream(stream),
        (conn) => {
          if (conn === "connected") setState("connected");
          else if (conn === "failed" || conn === "disconnected") setState("disconnected");
        },
        iceServers,
      );
      pcRef.current = pc;
      if (localStreamRef.current) syncLocalTracks(pc, localStreamRef.current);

      if (initiator && localStreamRef.current) {
        void createOffer(pc).then((desc) => {
          if (desc) socket.emit("signal", { type: "offer", data: desc });
        });
      } else if (pendingOffer.current) {
        const offer = pendingOffer.current;
        pendingOffer.current = null;
        void acceptOffer(pc, offer).then((desc) => {
          if (desc) socket.emit("signal", { type: "answer", data: desc });
        });
      }
    });
  }, [closePeer]);

  useEffect(() => {
    if (!session) return;
    const socket = connectRealtime();
    socketRef.current = socket;

    socket.on("connect", () => {
      setLive(true);
      void loadIceServers();
      socket.emit("hello", {
        userId: session.userId,
        displayName: session.displayName,
        isGuest: session.isGuest,
        interests,
        blockedIds: blocked.current,
      });
    });

    socket.on("disconnect", () => setLive(false));
    socket.on("online", (count: number) => {
      if (typeof count === "number") setOnline(count);
    });

    socket.on("hello_ok", () => {
      if (wantFind.current) socket.emit("find");
    });

    socket.on("searching", () => {
      setState("searching");
      setPeer(null);
      setMessages([]);
      setPeerTyping(false);
      setQuality("unknown");
      setElapsed(0);
    });

    socket.on("matched", (payload: MatchedPayload) => {
      setPeer(payload.peer);
      setState("connecting");
      setConversations((n) => n + 1);
      setMessages([
        {
          id: id(),
          from: "system",
          body: `You're connected with ${payload.peer.displayName}. Say hi!`,
          at: Date.now(),
        },
      ]);
      setupPeer(payload.initiator);
    });

    socket.on("signal", async (payload: SignalPayload) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        if (payload.type === "offer") {
          if (!localStreamRef.current) {
            pendingOffer.current = payload.data as RTCSessionDescriptionInit;
            return;
          }
          const desc = await acceptOffer(pc, payload.data as RTCSessionDescriptionInit);
          if (desc) socket.emit("signal", { type: "answer", data: desc });
          for (const c of pendingIce.current) await addIce(pc, c);
          pendingIce.current = [];
        } else if (payload.type === "answer") {
          await acceptAnswer(pc, payload.data as RTCSessionDescriptionInit);
          for (const c of pendingIce.current) await addIce(pc, c);
          pendingIce.current = [];
        } else if (payload.type === "ice") {
          const candidate = payload.data as RTCIceCandidateInit;
          if (!pc.remoteDescription) pendingIce.current.push(candidate);
          else await addIce(pc, candidate);
        }
      } catch (err) {
        console.error("signal error", err);
      }
    });

    socket.on("chat", (msg: { body: string; at: number }) => {
      push({ id: id(), from: "peer", body: msg.body, at: msg.at });
    });

    socket.on("typing", (on: boolean) => setPeerTyping(on));

    socket.on("peer_left", () => {
      closePeer();
      setPeer(null);
      setPeerTyping(false);
      setState("disconnected");
      push({
        id: id(),
        from: "system",
        body: "They left. Finding someone new…",
        at: Date.now(),
      });
      window.setTimeout(() => socket.emit("find"), 600);
    });

    return () => {
      socket.emit("leave");
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      closePeer();
    };
  }, [session, interests, closePeer, push, setupPeer]);

  useEffect(() => {
    const pc = pcRef.current;
    const socket = socketRef.current;
    if (!pc || !localStream) return;
    syncLocalTracks(pc, localStream);
    if (initiatorRef.current && !pc.localDescription) {
      void createOffer(pc).then((desc) => {
        if (desc) socket?.emit("signal", { type: "offer", data: desc });
      });
    } else if (pendingOffer.current) {
      const offer = pendingOffer.current;
      pendingOffer.current = null;
      void acceptOffer(pc, offer).then((desc) => {
        if (desc) socket?.emit("signal", { type: "answer", data: desc });
      });
    }
  }, [localStream]);

  const start = useCallback(() => {
    wantFind.current = true;
    setState("searching");
    socketRef.current?.emit("find");
  }, []);

  const next = useCallback(() => {
    closePeer();
    setState("ended");
    setPeer(null);
    setPeerTyping(false);
    setQuality("unknown");
    socketRef.current?.emit("next");
  }, [closePeer]);

  const leave = useCallback(() => {
    closePeer();
    socketRef.current?.emit("leave");
    setState("idle");
    setPeer(null);
    setMessages([]);
    setPeerTyping(false);
  }, [closePeer]);

  const block = useCallback(() => {
    if (peer) {
      blocked.current = [...blocked.current, peer.userId].slice(-RECENT_LIMIT * 4);
      socketRef.current?.emit("block", peer.userId);
    } else {
      socketRef.current?.emit("next");
    }
    closePeer();
    setState("ended");
    setPeer(null);
  }, [closePeer, peer]);

  const send = useCallback(
    (body: string) => {
      const text = body.trim().slice(0, 500);
      if (!text || state !== "connected") return;
      socketRef.current?.emit("chat", text);
      socketRef.current?.emit("typing", false);
      push({ id: id(), from: "me", body: text, at: Date.now() });
    },
    [push, state],
  );

  const typing = useCallback((on: boolean) => {
    socketRef.current?.emit("typing", on);
  }, []);

  useEffect(() => {
    if (state !== "connected") return;
    const tick = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    const sample = window.setInterval(() => {
      const pc = pcRef.current;
      if (!pc) return;
      void pc.getStats().then((stats) => {
        let rtt = 80;
        let loss = 0;
        stats.forEach((report) => {
          if (report.type === "candidate-pair" && "state" in report && report.state === "succeeded") {
            const rttSec = report.currentRoundTripTime;
            if (typeof rttSec === "number") rtt = rttSec * 1000;
          }
          if (report.type === "inbound-rtp" && report.kind === "video") {
            const packets = Number(report.packetsReceived ?? 0);
            const lost = Number(report.packetsLost ?? 0);
            if (packets + lost > 0) loss = lost / (packets + lost);
          }
        });
        setQuality(qualityFromStats(rtt, loss));
      });
    }, 4000);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(sample);
    };
  }, [state]);

  return {
    state,
    peer,
    messages,
    quality,
    elapsed,
    conversations,
    peerTyping,
    remoteStream,
    live,
    online,
    start,
    next,
    leave,
    send,
    typing,
    block,
  };
}
