import { useMemo, useState } from "react";
import { Cat, Flame, Heart, Music2, Shuffle, Sparkles, Zap } from "lucide-react";
import { randomIcebreaker } from "@/lib/whosnext/icebreakers";
import type { MatchState } from "@/lib/whosnext/types";
import { cn } from "@/lib/utils";

interface Props {
  state: MatchState;
  peerName: string;
  live: boolean;
  online: number;
}

const ORBITS = [
  { Icon: Heart, tone: "text-primary", angle: 18 },
  { Icon: Sparkles, tone: "text-acid", angle: 92 },
  { Icon: Music2, tone: "text-electric", angle: 168 },
  { Icon: Flame, tone: "text-hot", angle: 236 },
  { Icon: Cat, tone: "text-accent", angle: 304 },
] as const;

export function MatchLoader({ state, peerName, live, online }: Props) {
  const [prompt, setPrompt] = useState(() => randomIcebreaker());
  const looking = online > 0 ? Math.max(online - 1, 0) : 0;

  const copy = useMemo(() => {
    switch (state) {
      case "connecting":
      case "match_found":
        return {
          title: peerName.length > 0 ? `${peerName} is next.` : "Someone's next.",
          sub: "Locking a direct peer-to-peer line",
        };
      case "ended":
        return { title: "Nice one.", sub: "Spinning the room for someone new" };
      case "disconnected":
        return { title: "They left.", sub: "Finding the next person in the room" };
      case "searching":
        return { title: "Finding someone…", sub: "Who's next in the room?" };
      default:
        return { title: "Ready when you are.", sub: "Tap Who's Next? to jump in" };
    }
  }, [peerName, state]);

  const locking = state === "connecting" || state === "match_found";

  return (
    <div className="relative z-10 flex w-full max-w-md flex-col items-center px-4 text-center sm:px-6">
      <span
        className={cn(
          "mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide",
          live
            ? "border-success/40 bg-success/10 text-success"
            : "border-warning/40 bg-warning/10 text-warning",
        )}
      >
        <span className={cn("size-1.5 rounded-full", live ? "bg-success animate-match-breathe" : "bg-warning")} />
        {live ? (looking > 0 ? `Live · ${looking} looking` : "Live · you're in the room") : "Reconnecting to the room…"}
      </span>

      <div className="relative mb-7 grid size-56 place-items-center sm:size-64">
        <span className="absolute size-[92%] rounded-full border border-primary/15" />
        <span className="absolute size-[68%] rounded-full border border-electric/20" />
        <span className="absolute size-[44%] animate-pulse-ring rounded-full border border-primary/35" />
        <span className="absolute size-[44%] animate-pulse-ring rounded-full border border-electric/30 [animation-delay:0.9s]" />

        <div
          className="animate-radar-sweep absolute inset-[8%] rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, color-mix(in oklch, var(--color-primary) 42%, transparent) 70deg, transparent 110deg)",
          }}
        />

        <div className="animate-orbit absolute inset-0">
          {ORBITS.map(({ Icon, tone, angle }) => (
            <span
              key={angle}
              className="absolute left-1/2 top-1/2"
              style={{ transform: `rotate(${angle}deg) translateY(-6.4rem)` }}
            >
              <span
                className="grid size-9 place-items-center rounded-2xl border border-primary/35 bg-card/80 shadow-glow backdrop-blur-md"
                style={{ transform: `rotate(-${angle}deg)` }}
              >
                <Icon className={`size-4 ${tone}`} />
              </span>
            </span>
          ))}
        </div>

        <div className="animate-orbit-slow absolute inset-[16%]">
          <span className="absolute left-1/2 top-0 size-2.5 -translate-x-1/2 rounded-full bg-acid shadow-glow" />
          <span className="absolute bottom-2 right-4 size-2 rounded-full bg-hot" />
          <span className="absolute bottom-6 left-3 size-1.5 rounded-full bg-electric" />
        </div>

        <div
          className={cn(
            "relative z-10 grid size-20 place-items-center rounded-full border border-primary/50 bg-card/90 shadow-glow",
            locking && "animate-glow-breathe",
          )}
        >
          {locking ? (
            <Zap className="size-7 animate-[zap-pop_1.4s_ease-in-out_infinite] text-primary" />
          ) : (
            <Sparkles className="size-7 animate-[sparkle-twirl_2.8s_ease-in-out_infinite] text-primary" />
          )}
        </div>
      </div>

      <p className="max-w-full wrap-break-word font-display text-2xl leading-tight tracking-tight sm:text-4xl">
        {copy.title}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{copy.sub}</p>

      <button
        type="button"
        onClick={() => setPrompt((current) => randomIcebreaker(current))}
        className="group mt-6 max-w-sm rounded-2xl border border-border bg-card/70 px-4 py-3 text-left shadow-panel backdrop-blur-md transition hover:border-primary/45 hover:shadow-glow"
      >
        <span className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Icebreaker
          <Shuffle className="size-3.5 transition group-hover:rotate-180 group-hover:text-primary" />
        </span>
        <span className="mt-1.5 block text-sm leading-relaxed">{prompt}</span>
      </button>
    </div>
  );
}
