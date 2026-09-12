import { createFileRoute } from "@tanstack/react-router";
import { InfoSection, PublicPage } from "@/components/whosnext/PublicPage";

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
    <PublicPage
      eyebrow="Your data, plainly stated"
      title="Privacy Policy"
      intro="Who's Next? is built around short-lived, guest-first conversations. Here's what is shared, stored, and visible."
    >
      <div className="space-y-2">
        <InfoSection title="Video, audio, and identity">
          <p>Video and audio travel directly between you and the other person over WebRTC, with a relay only as a fallback. We do not record calls. Your identity is an internal random identifier; nicknames are display-only and are not verified or unique.</p>
        </InfoSection>
        <InfoSection title="Chat and reports">
          <p>Chat messages exist for the duration of a conversation and are deleted when it ends, unless information is retained for a specific report or moderation review.</p>
        </InfoSection>
        <InfoSection title="Network and preferences">
          <p>We never show your IP address to other users. Coarse region may be shown only if you enable it in preferences. Theme and match preferences are stored on your device.</p>
        </InfoSection>
      </div>
    </PublicPage>
  );
}
