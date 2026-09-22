"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { containsContactInfo } from "@/lib/redact";

type Message = {
  id: string;
  body: string;
  isSystem: boolean;
  mine: boolean;
  from: string;
  createdAt: string;
};

export function ChatThreadClient({
  threadId,
  who,
  sub,
  initialMessages,
}: {
  threadId: string;
  who: string;
  sub: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function refresh() {
    const res = await fetch(`/api/chat/threads/${threadId}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
    }
  }

  useEffect(() => {
    const interval = setInterval(refresh, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send() {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    setDraft("");
    try {
      await fetch(`/api/chat/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      await refresh();
    } finally {
      setSending(false);
    }
  }

  const hasContact = containsContactInfo(draft);

  return (
    <div className="flex min-h-dvh flex-col bg-bg pt-[54px]">
      <div className="sticky top-[54px] z-10 flex items-center gap-2.75 border-b border-divider bg-bg px-4 py-2.5">
        <Link href="/chat" className="flex-none font-body text-lg text-neutral-700">‹</Link>
        <div className="flex h-8.5 w-8.5 flex-none items-center justify-center rounded-full bg-blue-200 text-sm font-semibold text-blue-800">
          {who.replace(/[^A-Za-z#]/g, "").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-heading text-base font-semibold">{who}</div>
          <div className="mt-0.5 text-[11px] text-neutral-600">{sub}</div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-4 py-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.isSystem ? "justify-center" : m.mine ? "justify-end" : "justify-start"}`}>
            {m.isSystem ? (
              <div className="max-w-88% border-l-3 border-blue-600 bg-blue-100 px-2.5 py-2 text-center font-label text-[9.5px] font-semibold tracking-[0.08em] text-blue-700">
                {m.body}
              </div>
            ) : (
              <div className={`max-w-82% px-3 py-2.5 ${m.mine ? "bg-blue-800 text-white" : "border border-divider bg-surface"}`}>
                <div className="text-[13px] leading-snug">{m.body}</div>
              </div>
            )}
          </div>
        ))}
        {messages.length === 0 && (
          <div className="pt-6 text-center text-[12.5px] text-neutral-600">
            Scrivi il primo messaggio: i tuoi recapiti restano sempre nascosti.
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 border-t border-divider bg-bg px-4 pt-2.75 pb-6.5">
        <div className="flex items-stretch gap-2">
          <div className="min-w-0 flex-1 border border-divider bg-surface">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Scrivi un messaggio"
              className="w-full bg-transparent px-3 py-3 font-body text-sm outline-none"
            />
          </div>
          <button
            disabled={!draft.trim() || sending}
            onClick={send}
            className={`flex-none px-4 font-heading text-[15px] font-semibold tracking-[0.04em] uppercase ${
              draft.trim() ? "bg-accent-600 text-white hover:bg-accent-700" : "bg-neutral-200 text-neutral-500"
            }`}
          >
            Invia
          </button>
        </div>
        <div className={`mt-2.25 font-label text-[9px] font-semibold tracking-[0.08em] ${hasContact ? "text-accent-700" : "text-neutral-600"}`}>
          {hasContact ? "NUMERO NASCOSTO AUTOMATICAMENTE: I CONTATTI NON CIRCOLANO IN CHAT." : "I RECAPITI SCRITTI IN CHAT VENGONO NASCOSTI AUTOMATICAMENTE."}
        </div>
      </div>
    </div>
  );
}
