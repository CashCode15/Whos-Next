import { createFileRoute } from "@tanstack/react-router";
import { Mail, ShieldAlert } from "lucide-react";
import { InfoSection, PublicPage } from "@/components/whosnext/PublicPage";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Who's Next?" },
      { name: "description", content: "Contact Who's Next? support and learn how to report a safety issue." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <PublicPage
      eyebrow="Get in touch"
      title="Questions, feedback, or a safety concern?"
      intro="Use the route that gets your message to the right place. For anything happening in a live conversation, the in-chat report control is the fastest and most useful option."
    >
      <div className="space-y-5">
        <a href="mailto:hello@whosnext.app" className="flex items-center gap-4 rounded-2xl border border-border bg-card/70 p-5 transition-colors hover:border-primary/60">
          <Mail className="size-6 text-primary" />
          <span><strong className="block text-foreground">General support</strong><span className="text-sm text-muted-foreground">hello@whosnext.app for product questions, feedback, and accessibility needs.</span></span>
        </a>
        <div className="flex items-start gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <ShieldAlert className="mt-0.5 size-6 shrink-0 text-destructive" />
          <div><strong className="block text-foreground">Report someone in a conversation</strong><p className="mt-1 text-sm leading-6 text-muted-foreground">Open the Report control in the video controls, choose the reason, and submit. You will leave that conversation immediately. You can also Block the person to prevent another match.</p></div>
        </div>
        <InfoSection title="When sending a safety report by email">
          <p>Include the approximate time, the reason for the report, and any relevant session details. Do not send passwords, payment information, or private images. If you are in immediate danger, contact local emergency services first.</p>
        </InfoSection>
      </div>
    </PublicPage>
  );
}