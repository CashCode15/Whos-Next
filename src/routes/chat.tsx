import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Flame, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/whosnext/ChatPanel";
import { ReportDialog } from "@/components/whosnext/ReportDialog";
import { VideoControls } from "@/components/whosnext/VideoControls";
import { VideoStage } from "@/components/whosnext/VideoStage";
import { useLocalMedia } from "@/hooks/use-local-media";
import { useMatchLoop } from "@/hooks/use-match-loop";
import { usePreferences } from "@/lib/whosnext/prefs";
import { readSession } from "@/lib/whosnext/session";
import type { Session } from "@/lib/whosnext/types";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Live conversation — Who's Next?" },
      {
        name: "description",
        content:
          "Peer-to-peer video chat with live text chat, connection quality, report and block controls.",
      },
      { property: "og:title", content: "Live conversation — Who's Next?" },
      {
        property: "og:description",
        content: "Talk, chat, and jump to the next person instantly.",
      },
    ],
  }),
  component: ChatRoom,
});

function ChatRoom() {
  const navigate = useNavigate();
  const { prefs } = usePreferences();
  const media = useLocalMedia();
  const [session, setSession] = useState<Session | null>(null);
  const loop = useMatchLoop(session, prefs.interests, media.stream);
  const [chatOpen, setChatOpen] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const started = useRef(false);

  
  const loopRef = useRef(loop);
  loopRef.current = loop;

  useEffect(() => {
    const current = readSession();
    if (!current) {
      void navigate({ to: "/" });
      return;
    }
    setSession(current);
  }, [navigate]);

  useEffect(() => {
    if (!session || started.current) return;
    started.current = true;
    loopRef.current.start();
  }, [session]);

  // Auto Next: optional timed rotation once connected.
  useEffect(() => {
    if (!prefs.autoNext || loop.state !== "connected") return;
    const t = window.setTimeout(() => {
      toast("Auto Next — finding someone new…");
      loopRef.current.next();
    }, prefs.autoNextSeconds * 1000);
    return () => window.clearTimeout(t);
  }, [prefs.autoNext, prefs.autoNextSeconds, loop.state]);

  const connected = loop.state === "connected";

  return (
    <div className="flex min-h-screen flex-col bg-background lg:h-screen">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/" className="font-display text-lg text-brand">
          WHO&apos;S NEXT?
        </Link>
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {session?.displayName}
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
          <Flame className="size-3.5 text-accent" />
          {loop.conversations} conversation{loop.conversations === 1 ? "" : "s"} today
        </span>
        <Button
          size="icon"
          variant="secondary"
          className="lg:hidden"
          onClick={() => setChatOpen((o) => !o)}
          title="Toggle chat"
        >
          {chatOpen ? <X className="size-4" /> : <MessageSquare className="size-4" />}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            loop.leave();
            media.stop();
            void navigate({ to: "/" });
          }}
        >
          Leave
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="h-[min(58vh,32rem)] min-h-[22rem] shrink-0 lg:min-h-0 lg:flex-1">
            <VideoStage
              state={loop.state}
              peer={loop.peer}
              localStream={media.stream}
              remoteStream={loop.remoteStream}
              cameraOn={media.cameraOn}
              micOn={media.micOn}
              blurUntilConnected={prefs.blurUntilConnected}
              showRegion={prefs.showRegion}
              quality={loop.quality}
              mediaError={media.error}
              live={loop.live}
              online={loop.online}
            />
          </div>
          <VideoControls
            micOn={media.micOn}
            cameraOn={media.cameraOn}
            canModerate={connected}
            onToggleMic={media.toggleMic}
            onToggleCamera={media.toggleCamera}
            onFlipCamera={media.flipCamera}
            onReport={() => setReportOpen(true)}
            onBlock={() => {
              toast("Blocked. You won't be matched again.");
              loop.block();
            }}
            onNext={loop.next}
          />
        </div>

        <aside
          className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card lg:w-[22rem] ${
            chatOpen ? "h-64 lg:h-auto" : "hidden lg:flex"
          }`}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="text-sm font-medium">Chat</p>
            {connected && (
              <span className="text-xs text-muted-foreground">
                {formatTime(loop.elapsed)}
              </span>
            )}
          </div>
          <ChatPanel
            messages={loop.messages}
            peerTyping={loop.peerTyping}
            disabled={!connected}
            onSend={loop.send}
            onTyping={loop.typing}
          />
        </aside>
      </div>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        peerName={loop.peer?.displayName}
        onSubmit={() => {
          toast("Report submitted. Moving you along.");
          loop.next();
        }}
      />
    </div>
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
