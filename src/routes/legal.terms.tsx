import { createFileRoute } from "@tanstack/react-router";
import { InfoSection, PublicPage } from "@/components/whosnext/PublicPage";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Who's Next?" },
      {
        name: "description",
        content: "Community rules and terms for using Who's Next? random video chat.",
      },
      { property: "og:title", content: "Terms of Service — Who's Next?" },
      {
        property: "og:description",
        content: "Community rules, age requirement, and acceptable use.",
      },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <PublicPage
      eyebrow="Before you connect"
      title="Terms of Service"
      intro="By using Who's Next?, you agree to use it lawfully, respectfully, and only if you are 18 or older."
    >
      <div className="space-y-2">
        <InfoSection title="Age and acceptable use">
          <p>You must be 18 or older to use Who&apos;s Next?. Nudity, sexual content, harassment, hate speech, threats, spam, advertising, impersonation, and illegal activity are not allowed. Sessions may be ended and access may be restricted for violations.</p>
        </InfoSection>
        <InfoSection title="Consent and reporting">
          <p>Do not record or redistribute another person&apos;s video, audio, or messages without their consent. Reports are reviewed by moderation. Repeat offenders may receive temporary or permanent bans.</p>
        </InfoSection>
        <InfoSection title="Service availability">
          <p>The service is provided as-is while in active development. Connections can fail, and we may change or pause features as the product evolves.</p>
        </InfoSection>
      </div>
    </PublicPage>
  );
}
