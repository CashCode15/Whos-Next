import {
  Cat,
  Cherry,
  Flame,
  Heart,
  Laugh,
  Martini,
  MessageCircle,
  Music2,
  Sparkles,
  Flower2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const BLOBS = [
  { left: "-6%", top: "6%", size: 340, cls: "bg-primary/20", delay: "0s" },
  { left: "68%", top: "-4%", size: 400, cls: "bg-electric/20", delay: "1.4s" },
  { left: "44%", top: "68%", size: 320, cls: "bg-acid/15", delay: "2.6s" },
  { left: "6%", top: "62%", size: 260, cls: "bg-accent/15", delay: "0.8s" },
];

const FACES: {
  left: string;
  top: string;
  Icon: LucideIcon;
  tone: string;
  delay: string;
  motion: string;
}[] = [
  { left: "8%", top: "8%", Icon: Heart, tone: "text-primary", delay: "0s", motion: "animate-heart-thump" },
  { left: "16%", top: "26%", Icon: Sparkles, tone: "text-acid", delay: "0.4s", motion: "animate-drift" },
  { left: "5%", top: "46%", Icon: Cat, tone: "text-hot", delay: "0.8s", motion: "animate-flirt-bob" },
  { left: "10%", top: "64%", Icon: Music2, tone: "text-electric", delay: "1.2s", motion: "animate-tilt-swing" },
  { left: "6%", top: "82%", Icon: Martini, tone: "text-accent", delay: "1.6s", motion: "animate-flirt-bob" },

  { left: "86%", top: "10%", Icon: Laugh, tone: "text-accent", delay: "0.2s", motion: "animate-tilt-swing" },
  { left: "80%", top: "28%", Icon: Flame, tone: "text-primary", delay: "0.6s", motion: "animate-heart-thump" },
  { left: "90%", top: "48%", Icon: Cherry, tone: "text-hot", delay: "1s", motion: "animate-flirt-bob" },
  { left: "75%", top: "66%", Icon: Flower2, tone: "text-acid", delay: "1.4s", motion: "animate-drift" },
  { left: "85%", top: "84%", Icon: MessageCircle, tone: "text-electric", delay: "1.8s", motion: "animate-tilt-swing" },
];

export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="grain-overlay pointer-events-none absolute inset-0 overflow-hidden bg-hero"
    >
      {BLOBS.map((b, i) => (
        <div
          key={i}
          className={`absolute animate-float-orb rounded-full blur-3xl ${b.cls}`}
          style={{
            left: b.left,
            top: b.top,
            width: b.size,
            height: b.size,
            animationDelay: b.delay,
          }}
        />
      ))}

      {FACES.map(({ Icon, ...f }, i) => (
        <div
          key={i}
          className={`absolute grid size-12 place-items-center rounded-2xl border-2 border-primary/35 bg-card/70 shadow-glow backdrop-blur-md ${f.motion}`}
          style={{ left: f.left, top: f.top, animationDelay: f.delay }}
        >
          <Icon className={`size-5 ${f.tone}`} />
        </div>
      ))}
    </div>
  );
}
