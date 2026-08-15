"use client";

/**
 * Persistent floating FAQ chat widget shown on every public page. Clearly
 * labeled as AI — CIRCLE's brand promise is "real people, not a bot," so
 * this must never read as a human Support Partner. Answers general
 * product questions only; posts to /api/chat (Claude Haiku 4.5).
 */
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ChatWidget() {
  const t = useTranslations("chat");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.reply ?? t("genericError") },
      ]);
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: t("genericError") }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-secondary-foreground text-primary-foreground fixed end-6 bottom-6 z-50 flex items-center gap-2.5 rounded-full px-5 py-3.5 text-sm font-semibold shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle className="size-4" aria-hidden />
        {t("launcherLabel")}
      </button>
    );
  }

  return (
    <div className="border-border bg-card fixed end-6 bottom-6 z-50 flex h-[min(32rem,80vh)] w-[min(22rem,90vw)] flex-col rounded-2xl border shadow-2xl">
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full">
            <Sparkles className="size-4" aria-hidden />
          </div>
          <div>
            <div className="text-sm font-semibold">{t("panelTitle")}</div>
            <div className="text-muted-foreground text-xs">{t("panelSubtitle")}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t("close")}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <div className="bg-muted text-muted-foreground rounded-xl rounded-bl-sm px-3 py-2 text-sm">
          {t("disclaimer")}
        </div>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              message.role === "user"
                ? "bg-primary text-primary-foreground ms-auto rounded-br-sm"
                : "bg-muted text-foreground rounded-bl-sm"
            }`}
          >
            {message.content}
          </div>
        ))}
        {loading && (
          <div className="bg-muted text-muted-foreground flex w-fit items-center gap-2 rounded-xl rounded-bl-sm px-3 py-2 text-sm">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            {t("thinking")}
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="border-border flex gap-2 border-t p-3">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t("inputPlaceholder")}
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex-1 rounded-lg border px-3 py-2 text-sm focus-visible:ring-3 focus-visible:outline-none"
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim()}>
          <Send className="size-4" aria-hidden />
        </Button>
      </form>
    </div>
  );
}
