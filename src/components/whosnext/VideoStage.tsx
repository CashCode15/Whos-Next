import { useEffect, useRef } from "react";
import { CameraOff, MicOff } from "lucide-react";
import { MatchLoader } from "@/components/whosnext/MatchLoader";
import { cn } from "@/lib/utils";
import type { ConnectionQuality, MatchState, Peer } from "@/lib/whosnext/types";

interface Props {
  state: MatchState;
  peer: Peer | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  cameraOn: boolean;
  micOn: boolean;
  blurUntilConnected: boolean;
  showRegion: boolean;
  quality: ConnectionQuality;
  mediaError: string | null;
  live: boolean;
  online: number;
}

const QUALITY_LABEL: Record<ConnectionQuality, string> = {
  excellent: "Excellent connection",
  good: "Good connection",
  poor: "Weak connection",
  unknown: "Measuring…",
};

export function VideoStage({
  state,
  peer,
  localStream,
  remoteStream,
  cameraOn,
  micOn,
  blurUntilConnected,
  showRegion,
  quality,
  mediaError,
  live,
  online,
}: Props) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localRef.current && localStream) localRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current) remoteRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const connected = state === "connected";
  const waitingForVideo = connected && !remoteStream;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
      <div className="absolute inset-0 bg-hero">
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-[filter] duration-500",
            !remoteStream && "hidden",
            remoteStream && !connected && blurUntilConnected && "blur-2xl scale-110",
          )}
        />
      </div>

      {!connected && (
        <div className="absolute inset-0 grid place-items-center">
          <MatchLoader
            state={state}
            peerName={peer?.displayName ?? ""}
            live={live}
            online={online}
          />
        </div>
      )}

      {waitingForVideo && (
        <div className="absolute inset-0 grid place-items-center">
          <MatchLoader
            state="connecting"
            peerName={peer?.displayName ?? ""}
            live={live}
            online={online}
          />
        </div>
      )}

      {connected && remoteStream && (
        <div className="absolute bottom-4 left-4 rounded-full border border-border bg-background/70 px-3 py-1.5 text-sm backdrop-blur">
          <span className="font-medium">{peer?.displayName}</span>
          {showRegion && peer ? (
            <span className="text-muted-foreground"> · {peer.region}</span>
          ) : null}
        </div>
      )}

      {connected && (
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs backdrop-blur">
          <span
            className={cn(
              "size-2 rounded-full",
              quality === "excellent" && "bg-success",
              quality === "good" && "bg-warning",
              quality === "poor" && "bg-destructive",
              quality === "unknown" && "bg-muted-foreground",
            )}
          />
          {QUALITY_LABEL[quality]}
        </div>
      )}

      <div className="absolute bottom-4 right-4 h-32 w-24 overflow-hidden rounded-xl border border-border bg-secondary shadow-glow sm:h-40 sm:w-28">
        <video
          ref={localRef}
          autoPlay
          muted
          playsInline
          className={cn("h-full w-full scale-x-[-1] object-cover", !cameraOn && "opacity-0")}
        />
        {!cameraOn && (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground">
            <CameraOff className="size-5" />
          </div>
        )}
        {!micOn && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-destructive p-1 text-destructive-foreground">
            <MicOff className="size-3" />
          </span>
        )}
      </div>

      {mediaError && (
        <div className="absolute inset-x-4 top-4 z-20 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {mediaError}
        </div>
      )}
    </div>
  );
}
