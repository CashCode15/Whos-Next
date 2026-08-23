import { io, type Socket } from "socket.io-client";
import { realtimeBase } from "./api";
import type { Peer } from "./types";

export type SignalPayload = {
  type: "offer" | "answer" | "ice";
  data: unknown;
};

export type MatchedPayload = {
  roomId: string;
  peer: Peer;
  initiator: boolean;
};

export function connectRealtime(): Socket {
  const url = realtimeBase();
  return io(url.length > 0 ? url : undefined, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    autoConnect: true,
  });
}
