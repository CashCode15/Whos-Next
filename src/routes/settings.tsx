import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePreferences } from "@/lib/whosnext/prefs";
import { INTERESTS } from "@/lib/whosnext/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Preferences — Who's Next?" },
      {
        name: "description",
        content:
          "Choose your theme, Auto Next timing, privacy blur, language and interests for better matches.",
      },
      { property: "og:title", content: "Preferences — Who's Next?" },
      {
        property: "og:description",
        content: "Theme, Auto Next, privacy and interest preferences.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { prefs, update } = usePreferences();

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link to="/">
          <ArrowLeft className="mr-1 size-4" /> Back
        </Link>
      </Button>

      <h1 className="font-display text-3xl">Preferences</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Saved on this device. They apply to your next match.
      </p>

      <section className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-6">
        <div>
          <Label className="text-base">Theme</Label>
          <RadioGroup
            className="mt-3 flex gap-6"
            value={prefs.theme}
            onValueChange={(v) => update({ theme: v as typeof prefs.theme })}
          >
            {(["dark", "light", "system"] as const).map((t) => (
              <div key={t} className="flex items-center gap-2">
                <RadioGroupItem value={t} id={`theme-${t}`} />
                <Label htmlFor={`theme-${t}`} className="font-normal capitalize">
                  {t}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Toggle
          label="Auto Next"
          hint="Automatically move on after a set time."
          checked={prefs.autoNext}
          onChange={(v) => update({ autoNext: v })}
        />

        {prefs.autoNext && (
          <div className="flex items-center justify-between">
            <Label className="font-normal text-muted-foreground">Switch after</Label>
            <Select
              value={String(prefs.autoNextSeconds)}
              onValueChange={(v) => update({ autoNextSeconds: Number(v) })}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[30, 60, 120, 300].map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s < 60 ? `${s} seconds` : `${s / 60} minute${s > 60 ? "s" : ""}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Toggle
          label="Sound"
          hint="Play a chime when someone connects."
          checked={prefs.sound}
          onChange={(v) => update({ sound: v })}
        />
        <Toggle
          label="Blur strangers initially"
          hint="Keep video blurred until the connection is established."
          checked={prefs.blurUntilConnected}
          onChange={(v) => update({ blurUntilConnected: v })}
        />
        <Toggle
          label="Show my region"
          hint="Share a coarse region — never your IP address."
          checked={prefs.showRegion}
          onChange={(v) => update({ showRegion: v })}
        />

        <div className="flex items-center justify-between">
          <Label className="text-base">Language</Label>
          <Select value={prefs.language} onValueChange={(v) => update({ language: v })}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["English", "Hindi", "Spanish", "Portuguese", "French", "German"].map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-base">Interests</Label>
          <p className="mt-1 text-sm text-muted-foreground">
            Used to prioritise matches — matching stays random.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {INTERESTS.map((interest) => {
              const active = prefs.interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() =>
                    update({
                      interests: active
                        ? prefs.interests.filter((i) => i !== interest)
                        : [...prefs.interests, interest],
                    })
                  }
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary text-secondary-foreground hover:border-primary/60",
                  )}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label className="text-base">{label}</Label>
        <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
