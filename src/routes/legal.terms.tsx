import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link to="/">
          <ArrowLeft className="mr-1 size-4" /> Back
        </Link>
      </Button>
      <h1 className="font-display text-3xl">Terms of Service</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>You must be 18 or older to use Who&apos;s Next?.</p>
        <p>
          Nudity, sexual content, harassment, hate speech, threats, spam and advertising
          are not allowed. Sessions may be ended and accounts banned for violations.
        </p>
        <p>
          Do not record or redistribute another person&apos;s video or audio without their
          consent.
        </p>
        <p>
          Reports are reviewed by moderation. Repeat offenders receive temporary or
          permanent bans.
        </p>
        <p>The service is provided as-is while in active development.</p>
      </div>
    </main>
  );
}
