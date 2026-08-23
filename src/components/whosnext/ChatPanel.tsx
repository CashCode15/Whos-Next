import { useEffect, useRef, useState } from "react";
import { Send, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { randomIcebreaker } from "@/lib/whosnext/icebreakers";
import type { ChatMessage } from "@/lib/whosnext/types";
import { cn } from "@/lib/utils";

interface Props {
  messages: ChatMessage[];
  peerTyping: boolean;
  disabled: boolean;
  onSend: (body: string) => void;
  onTyping?: (on: boolean) => void;
}

export function ChatPanel({ messages, peerTyping, disabled, onSend, onTyping }: Props) {
  const [value, setValue] = useState("");
  const [opener, setOpener] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, peerTyping]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Chat messages live only for this conversation.
          </p>
        )}
        {messages.map((m) =>
          m.from === "system" ? (
            <p key={m.id} className="text-center text-xs text-muted-foreground">
              {m.body}
            </p>
          ) : (
            <div
              key={m.id}
              className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}
            >
              <span
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                  m.from === "me"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-secondary text-secondary-foreground",
                )}
              >
                {m.body}
              </span>
            </div>
          ),
        )}
        {peerTyping && (
          <p className="text-xs text-muted-foreground">typing…</p>
        )}
        <div ref={endRef} />
      </div>

      {opener && (
        <div className="mx-4 mb-2 rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Icebreaker
          </p>
          <p className="mt-1">{opener}</p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-2"
            disabled={disabled}
            onClick={() => {
              onSend(opener);
              setOpener(null);
            }}
          >
            Send it
          </Button>
        </div>
      )}

      <form
        className="flex items-center gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSend(value);
          setValue("");
          onTyping?.(false);
        }}
      >
        <Button
          type="button"
          size="icon"
          variant="outline"
          title="Need an opener?"
          onClick={() => setOpener(randomIcebreaker(opener ?? undefined))}
        >
          <Dices className="size-4" />
        </Button>
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onTyping?.(e.target.value.trim().length > 0);
          }}
          maxLength={500}
          placeholder={disabled ? "Waiting for someone…" : "Say something…"}
          disabled={disabled}
        />
        <Button type="submit" size="icon" disabled={disabled || !value.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
