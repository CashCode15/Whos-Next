import { createFileRoute } from "@tanstack/react-router";
import { InfoList, InfoSection, PublicPage } from "@/components/whosnext/PublicPage";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — Who's Next?" },
      { name: "description", content: "See how matching, video chat, controls, and privacy work on Who's Next?." },
    ],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <PublicPage
      eyebrow="From hello to goodbye"
      title="Simple by design. You stay in control."
      intro="Start a session, get matched, and decide whether the conversation continues. The service handles the connection; you choose what happens next."
    >
      <div className="space-y-8">
        <InfoSection title="1. Start without a profile">
          <p>Choose a nickname or continue as a mystery guest. Your display name is just that: a name shown in the conversation, not a verified identity.</p>
        </InfoSection>
        <InfoSection title="2. Meet one person">
          <p>We use matchmaking to connect you with another available person. Video and audio use WebRTC, with a relay fallback when a direct connection is not possible. Calls are not recorded.</p>
        </InfoSection>
        <InfoSection title="3. Talk, skip, or step away">
          <InfoList items={["Use live text chat alongside video", "Turn your camera or microphone off", "Choose Next to leave and find someone else", "Block a person so you are not matched again", "Report harassment, sexual content, threats, or other violations"]} />
        </InfoSection>
        <InfoSection title="Your privacy in plain English">
          <p>We do not show your IP address to other users. Chat is designed to be temporary, while information connected to a report may be retained for moderation. See the <a className="font-semibold text-primary hover:text-foreground" href="/legal/privacy">Privacy Policy</a> for the details.</p>
        </InfoSection>
      </div>
    </PublicPage>
  );
}