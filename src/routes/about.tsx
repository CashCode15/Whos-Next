import { createFileRoute } from "@tanstack/react-router";
import { InfoList, InfoSection, PublicPage } from "@/components/whosnext/PublicPage";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Who's Next?" },
      { name: "description", content: "Learn what Who's Next? is and what to expect from a conversation." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PublicPage
      eyebrow="The short version"
      title="A quick hello, then a real conversation."
      intro="Who's Next? is an 18+ random video chat service for meeting one new person at a time. There are no profiles to optimize and no endless feed to scroll."
    >
      <div className="space-y-8">
        <InfoSection title="What the service does">
          <p>We pair you with another available person for a live, one-to-one video and text conversation. You can use a nickname or join as a mystery guest, then leave or move to someone new whenever you like.</p>
          <InfoList items={["One-to-one video and text chat", "Guest-first sessions with no public profile", "Instant Next and block controls", "Preferences for language, interests, sound, and privacy blur"]} />
        </InfoSection>
        <InfoSection title="What it is not">
          <p>It is not a dating service, a place to broadcast, or a replacement for professional advice. Nicknames are not verified identities, and a match may be from anywhere in the world.</p>
        </InfoSection>
        <InfoSection title="Our baseline">
          <p>Every conversation should be voluntary, respectful, and easy to leave. Read the <a className="font-semibold text-primary hover:text-foreground" href="/community-guidelines">Community Guidelines</a> before you start, and use Report or Block the moment something feels wrong.</p>
        </InfoSection>
      </div>
    </PublicPage>
  );
}