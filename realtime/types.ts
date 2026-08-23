export type HelloPayload = {
  userId: string;
  displayName: string;
  isGuest: boolean;
  interests: string[];
  blockedIds: string[];
};

export type PeerInfo = {
  userId: string;
  displayName: string;
  region: string;
  interests: string[];
};

export type SignalPayload = {
  type: "offer" | "answer" | "ice";
  data: unknown;
};
