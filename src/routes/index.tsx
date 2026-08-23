import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Shuffle, Sparkles, Zap } from "lucide-react";
import { AmbientBackground } from "@/components/whosnext/AmbientBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSession } from "@/lib/whosnext/session";
import { applyTheme, readPreferences } from "@/lib/whosnext/prefs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Who's Next? — Meet someone unexpected" },
      {
        name: "description",
        content:
          "Random video chat with strangers. Enter a nickname or continue as a guest, and meet someone new in seconds.",
      },
      { property: "og:title", content: "Who's Next? — Meet someone unexpected" },
      {
        property: "og:description",
        content:
          "Random video chat with strangers. Peer-to-peer video, live chat, instant next.",
      },
    ],
  }),
  component: Landing,
});

const TAGLINES = [
  "Meet someone unexpected.",
  "One tap. New face. New story.",
  "Skip the small talk, or don't.",
  "Your next favorite person is one click away.",
];

const VIBES = [
  "late-night talks",
  "music nerds",
  "language swap",
  "gaming",
  "hot takes",
  "study buddies",
  "travel stories",
  "meme lords",
];

const FUN_NAMES = [
  "NeonFox",
  "DiscoPanda",
  "TurboMango",
  "VelvetGhost",
  "SpicyComet",
  "GlitterYeti",
];

const CROWD_KEY = "whosnext.displayOnline";
const CROWD_MIN = 48;
const CROWD_MAX = 199;

function seedCrowd(): number {
  if (typeof window === "undefined") return 126;
  try {
    const stored = Number(window.sessionStorage.getItem(CROWD_KEY));
    if (Number.isInteger(stored) && stored >= CROWD_MIN && stored <= CROWD_MAX) {
      return stored;
    }
  } catch {
    // ignore
  }
  return CROWD_MIN + Math.floor(Math.random() * (CROWD_MAX - CROWD_MIN + 1));
}

function Landing() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [online, setOnline] = useState(seedCrowd);
  const [shuffleTick, setShuffleTick] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    applyTheme(readPreferences().theme);
  }, []);

  useEffect(() => {
    const t = window.setInterval(
      () => setTaglineIndex((i) => (i + 1) % TAGLINES.length),
      2800,
    );
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setOnline((n) => {
        const step = Math.random() < 0.75 ? 1 : 2;
        const next = n + (Math.random() < 0.5 ? -step : step);
        const clamped = Math.min(CROWD_MAX, Math.max(CROWD_MIN, next));
        try {
          window.sessionStorage.setItem(CROWD_KEY, String(clamped));
        } catch {
          // ignore
        }
        return clamped;
      });
    }, 11000);
    return () => window.clearInterval(tick);
  }, []);

  const marquee = useMemo(() => [...VIBES, ...VIBES], []);

  function renderWord(word: string, delay: number) {
    return word.split("").map((char, i) => (
      <span
        key={`${word}-${i}`}
        className="hero-letter title-aurora"
        style={{ animationDelay: `${delay + i * 48}ms` }}
      >
        {char === " " ? "\u00a0" : char}
      </span>
    ));
  }

  async function begin(withNickname: boolean) {
    if (busy) return;
    setBusy(true);
    await createSession(withNickname ? nickname : undefined);
    void navigate({ to: "/chat" });
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-14">
      <AmbientBackground />

      <div className="relative w-full max-w-lg text-center">
        <p className="animate-wobble-in mb-5 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card/70 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-foreground shadow-glow backdrop-blur">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-2 animate-pulse-ring rounded-full bg-success" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          <span key={online} className="animate-count-pop inline-block">
            {online.toLocaleString()}
          </span>{" "}
          people online right now
        </p>

        <h1 className="relative font-display text-6xl font-extrabold uppercase leading-[0.92] sm:text-7xl">
          <span
            aria-hidden
            className="title-aurora title-bloom pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[120%] -translate-x-1/2 -translate-y-1/2 select-none blur-2xl"
          >
            Who&apos;s
            <br />
            Next?
          </span>
          <span className="relative">
            {renderWord("Who's", 80)}
            <br />
            {renderWord("Next?", 280)}
          </span>
        </h1>

        <p
          key={taglineIndex}
          className="animate-tagline-swap mt-4 min-h-7 text-lg font-medium text-muted-foreground"
        >
          {TAGLINES[taglineIndex]}
        </p>

        <form
          className="animate-wobble-in mt-7 space-y-3 rounded-3xl border border-border bg-card/70 p-4 shadow-panel backdrop-blur-xl"
          style={{ animationDelay: "160ms" }}
          onSubmit={(e) => {
            e.preventDefault();
            void begin(nickname.trim().length > 0);
          }}
        >
          <div className="relative">
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              placeholder="Pick a nickname..."
              aria-label="Nickname"
              className="h-13 rounded-2xl border-2 pr-12 text-center text-base font-semibold transition-shadow duration-300 focus-visible:shadow-glow"
            />
            <button
              type="button"
              title="Surprise me"
              aria-label="Generate a random nickname"
              onClick={() => {
                setShuffleTick((n) => n + 1);
                setNickname(
                  `${FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)]}${
                    Math.floor(Math.random() * 90) + 10
                  }`,
                );
              }}
              className="shuffle-btn absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Shuffle
                key={shuffleTick}
                className={`size-4 ${shuffleTick > 0 ? "animate-shuffle-spin" : ""}`}
              />
            </button>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={busy}
            className="btn-cta h-13 w-full rounded-2xl font-display text-base font-bold uppercase tracking-wide shadow-glow"
          >
            <Zap className="btn-cta-zap mr-1 size-4" />
            <span>Start chatting</span>
            <ArrowRight className="btn-cta-arrow ml-1 size-4" />
          </Button>

          <Button
            variant="ghost"
            size="lg"
            disabled={busy}
            className="btn-guest h-11 w-full rounded-2xl text-sm font-semibold text-muted-foreground hover:text-foreground"
            onClick={() => void begin(false)}
          >
            <Sparkles className="btn-guest-sparkle mr-1 size-4" /> Jump in as a
            mystery guest
          </Button>
        </form>

        <div
          className="animate-fade-up mt-7 overflow-hidden rounded-full border border-border bg-card/50 py-2 backdrop-blur"
          style={{ animationDelay: "240ms" }}
        >
          <div className="flex w-max animate-marquee gap-3 pr-3">
            {marquee.map((v, i) => (
              <span
                key={`${v}-${i}`}
                className="whitespace-nowrap rounded-full bg-secondary/70 px-3 py-1 text-xs font-semibold text-secondary-foreground"
              >
                #{v}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 text-xs">
          {[
            { k: "0.4s", v: "avg. match" },
            { k: "190+", v: "countries" },
            { k: "1 tap", v: "to skip" },
          ].map((s, i) => (
            <div
              key={s.k}
              className="stat-card animate-fade-up rounded-2xl border border-border bg-card/60 px-2 py-3 backdrop-blur"
              style={{ animationDelay: `${280 + i * 80}ms` }}
            >
              <p className="font-display text-base font-bold text-primary">{s.k}</p>
              <p className="text-muted-foreground">{s.v}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          18+ only. Be kind — report &amp; block are one tap away.
        </p>

        <nav className="mt-4 flex justify-center gap-5 text-xs text-muted-foreground">
          <Link
            to="/settings"
            className="transition-colors duration-200 hover:text-foreground"
          >
            Preferences
          </Link>
          <Link
            to="/legal/terms"
            className="transition-colors duration-200 hover:text-foreground"
          >
            Terms
          </Link>
          <Link
            to="/legal/privacy"
            className="transition-colors duration-200 hover:text-foreground"
          >
            Privacy
          </Link>
        </nav>
      </div>
    </main>
  );
}
