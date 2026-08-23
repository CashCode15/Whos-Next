import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Who's Next?" },
      {
        name: "description",
        content:
          "How Who's Next? handles sessions, peer-to-peer video, chat retention and reports.",
      },
      { property: "og:title", content: "Privacy Policy — Who's Next?" },
      {
        property: "og:description",
        content: "Peer-to-peer video, ephemeral chat, and minimal data retention.",
      },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link to="/">
          <ArrowLeft className="mr-1 size-4" /> Back
        </Link>
      </Button>
      <h1 className="font-display text-3xl">Privacy Policy</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Video and audio travel directly between you and the other person over WebRTC,
          with a relay only as a fallback. We do not record calls.
        </p>
        <p>
          Your identity is an internal random identifier. Nicknames are display-only and
          are not verified or unique.
        </p>
        <p>
          Chat messages exist only for the duration of a conversation and are deleted when
          it ends, unless retained for a specific report or moderation review.
        </p>
        <p>
          We never show your IP address to other users. Coarse region may be shown if you
          enable it in preferences.
        </p>
        <p>Theme and match preferences are stored on your device.</p>
      </div>
    </main>
  );
}
