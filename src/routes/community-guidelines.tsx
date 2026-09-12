import { createFileRoute } from "@tanstack/react-router";
import { InfoList, InfoSection, PublicPage } from "@/components/whosnext/PublicPage";

export const Route = createFileRoute("/community-guidelines")({
  head: () => ({
    meta: [
      { title: "Community Guidelines — Who's Next?" },
      { name: "description", content: "The safety rules and reporting guidance for Who's Next? conversations." },
    ],
  }),
  component: CommunityGuidelinesPage,
});

function CommunityGuidelinesPage() {
  return (
    <PublicPage
      eyebrow="Keep it human"
      title="A good conversation is voluntary for everyone."
      intro="Who's Next? is for 18+ adults. Treat the person on the other side of the connection as a person, not content."
    >
      <div className="space-y-8">
        <InfoSection title="Always okay">
          <InfoList items={["Say hello and respect a no", "Leave a conversation without explaining yourself", "Use a nickname and protect personal details", "Block or report when a boundary is crossed"]} />
        </InfoSection>
        <InfoSection title="Never okay">
          <InfoList items={["Nudity or sexually explicit content", "Sexual harassment or unwanted advances", "Hate speech, threats, intimidation, or targeted abuse", "Sharing private information or recording without consent", "Spam, scams, impersonation, or advertising", "Any exploitation or sexualization of minors"]} />
        </InfoSection>
        <InfoSection title="How to report">
          <p>Use Report in the video controls, select the closest reason, and submit. You will be moved to a new conversation. Use Block when you do not want to be matched with that person again. Reports are reviewed by moderation and may lead to temporary or permanent access restrictions.</p>
          <p>If you cannot access the conversation controls, contact <a className="font-semibold text-primary hover:text-foreground" href="mailto:hello@whosnext.app">hello@whosnext.app</a> with the approximate time and what happened.</p>
        </InfoSection>
        <InfoSection title="Moderation and limits">
          <p>We review reports in good faith, but no automated or human system catches everything. We may end sessions, remove access, or preserve limited information connected to a report. Do not use the service if you are under 18.</p>
        </InfoSection>
      </div>
    </PublicPage>
  );
}