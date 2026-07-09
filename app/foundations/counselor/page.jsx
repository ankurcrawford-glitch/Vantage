'use client';

import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import FoundationsNav from "@/components/FoundationsNav";
import { C, display, body } from "@/lib/foundations-theme";

// ─── Vantage Foundations — Counselor Chat ────────────────────────
// Ask-anything counselor. Pairs with /api/counselor route (Haiku,
// FAQ layer, truncated history, monthly cap).



const MONTHLY_CAP = 40;

// The user is derived server-side from the session token (secure).
// `used`/`cap` come from the API on load and after each send.
const starters = [
  "Should I take the SAT or ACT?",
  "How do I ask a teacher for a rec letter?",
  "Is my activity list too thin?",
  "What should I do this summer?",
];

// Shown only to first-time / empty-history students. Marked synthetic so it's
// never sent to the model (the API never persisted it anyway).
const OPENER = {
  role: "assistant",
  synthetic: true,
  content:
    "I'm your counselor — I know your profile, your threads, and your roadmap. Ask me anything about your path. Course choices, testing, activities, the stuff that's keeping you up at night.",
};

export default function CounselorChat() {
  const [messages, setMessages] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [returning, setReturning] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [used, setUsed] = useState(0);
  const endRef = useRef(null);
  const scrollRef = useRef(null);
  const didInitialScroll = useRef(false);

  const jumpToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  // Resume: load full history on mount so we pick up where we left off.
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("/api/counselor", {
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        const data = await res.json();
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages.map((m) => ({ role: m.role, content: m.content })));
          setReturning(true);
        } else {
          setMessages([OPENER]);
        }
        if (typeof data.used === "number") setUsed(data.used);
      } catch {
        setMessages([OPENER]);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    // First paint after history loads: jump hard to the bottom (the web fonts
    // reflow the list, so set scrollTop directly and retry to catch it).
    if (!didInitialScroll.current) {
      didInitialScroll.current = true;
      jumpToBottom();
      requestAnimationFrame(jumpToBottom);
      const t1 = setTimeout(jumpToBottom, 120);
      const t2 = setTimeout(jumpToBottom, 400);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, hydrated]);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || loading || used >= MONTHLY_CAP) return;

    const nextMessages = [...messages, { role: "user", content: q }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      // Attach the session token; the API derives the user from it.
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/counselor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          // Send only recent history — the API truncates again server-side.
          // Drop the synthetic opener; it was never persisted.
          messages: nextMessages.filter((m) => !m.synthetic).slice(-10),
        }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      if (!data.cached) setUsed(data.used ?? used + 1); // FAQ hits don't count
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Something went wrong on my end. Give it a moment and ask again — your question wasn't counted.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const capped = used >= MONTHLY_CAP;

  return (
    <div
      style={{ ...body, background: C.navy, minHeight: "100vh", color: C.ink, width: "100%" }}
      className="flex flex-col"
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Montserrat:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <FoundationsNav />

      {/* ── Header ── */}
      <div
        style={{ borderBottom: `1px solid ${C.line}` }}
        className="px-6 md:px-12 py-6 flex items-end justify-between"
      >
        <div>
          <p style={{ color: C.gold, fontSize: 11, letterSpacing: 3 }} className="uppercase mb-1">
            Foundations · Counselor
          </p>
          <h1 style={{ ...display, fontSize: 32, fontWeight: 500 }}>Ask your counselor</h1>
        </div>
        <p style={{ fontSize: 11, color: C.inkDim, letterSpacing: 1 }}>
          {MONTHLY_CAP - used} considered answers left this month
        </p>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-12 py-8 max-w-3xl w-full mx-auto" style={{ width: "100%", maxWidth: 768, margin: "0 auto" }}>
        <div className="space-y-5">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                style={
                  m.role === "user"
                    ? {
                        background: C.navyRaised,
                        border: `1px solid ${C.line}`,
                        borderRadius: "14px 14px 4px 14px",
                        maxWidth: "78%",
                      }
                    : {
                        background: C.goldSoft,
                        border: `1px solid ${C.line}`,
                        borderRadius: "14px 14px 14px 4px",
                        maxWidth: "85%",
                      }
                }
                className="px-5 py-4"
              >
                {m.role === "assistant" && (
                  <p
                    style={{ fontSize: 9.5, letterSpacing: 2, color: C.gold }}
                    className="uppercase mb-2"
                  >
                    Counselor
                  </p>
                )}
                <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{m.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div
                style={{
                  background: C.goldSoft,
                  border: `1px solid ${C.line}`,
                  borderRadius: "14px 14px 14px 4px",
                }}
                className="px-5 py-4"
              >
                <p style={{ ...display, fontSize: 15, fontStyle: "italic", color: C.inkDim }}>
                  Thinking it over…
                </p>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Starters — only for first-time students, before any history */}
        {hydrated && !returning && messages.length <= 1 && (
          <div className="mt-8">
            <p style={{ fontSize: 10.5, letterSpacing: 2, color: C.inkDim }} className="uppercase mb-3">
              Common questions
            </p>
            <div className="flex flex-wrap gap-2">
              {starters.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    border: `1px solid ${C.line}`,
                    borderRadius: 8,
                    fontSize: 12.5,
                    color: C.ink,
                  }}
                  className="px-4 py-2.5 hover:border-[#C5A56A] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Composer ── */}
      <div style={{ borderTop: `1px solid ${C.line}` }} className="px-6 md:px-12 py-5">
        <div className="max-w-3xl mx-auto" style={{ width: "100%", maxWidth: 768, margin: "0 auto" }}>
          {capped ? (
            <div
              style={{ background: C.navyCard, border: `1px solid ${C.line}`, borderRadius: 12 }}
              className="p-5 text-center"
            >
              <p style={{ fontSize: 13, color: C.inkDim }}>
                You've used this month's counselor sessions. They reset on the 1st — until
                then, your Compass and Roadmap have your priorities covered.
              </p>
            </div>
          ) : (
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about courses, testing, activities, anything…"
                style={{
                  flex: 1,
                  background: C.navyCard,
                  border: `1px solid ${C.line}`,
                  borderRadius: 10,
                  color: C.ink,
                  fontSize: 14,
                  padding: "14px 18px",
                  outline: "none",
                }}
                className="focus:border-[#C5A56A]"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                style={{
                  background: input.trim() && !loading ? C.gold : "transparent",
                  color: input.trim() && !loading ? C.navy : C.inkDim,
                  border: `1px solid ${input.trim() && !loading ? C.gold : C.line}`,
                  fontSize: 12,
                  letterSpacing: 1.5,
                  borderRadius: 10,
                }}
                className="uppercase px-7 transition-colors"
              >
                Ask
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
