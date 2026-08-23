export type MatchState =
  | "idle"
  | "searching"
  | "match_found"
  | "connecting"
  | "connected"
  | "ended"
  | "disconnected";

export type ConnectionQuality = "excellent" | "good" | "poor" | "unknown";

export interface Session {
  /** Stable identity. Never the nickname. */
  userId: string;
  displayName: string;
  isGuest: boolean;
  createdAt: number;
}

export interface Peer {
  userId: string;
  displayName: string;
  region: string;
  interests: string[];
}

export interface ChatMessage {
  id: string;
  from: "me" | "peer" | "system";
  body: string;
  at: number;
}

export type ReportReason =
  | "nudity"
  | "harassment"
  | "hate"
  | "spam"
  | "violence"
  | "underage"
  | "other";

export interface Preferences {
  theme: "dark" | "light" | "system";
  autoNext: boolean;
  autoNextSeconds: number;
  sound: boolean;
  blurUntilConnected: boolean;
  showRegion: boolean;
  language: string;
  interests: string[];
}

export const INTERESTS = [
  "Gaming",
  "Music",
  "Movies",
  "Technology",
  "Travel",
  "Sports",
  "Just Chatting",
] as const;

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "nudity", label: "Nudity / sexual content" },
  { value: "harassment", label: "Harassment" },
  { value: "hate", label: "Hate / abuse" },
  { value: "spam", label: "Spam / advertising" },
  { value: "violence", label: "Violence / threats" },
  { value: "underage", label: "Underage user" },
  { value: "other", label: "Other" },
];
