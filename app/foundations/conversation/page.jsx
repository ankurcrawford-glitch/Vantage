'use client';

import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import FoundationsNav from "@/components/FoundationsNav";

// ─── Vantage Foundations — Conversation ──────────────────────────
// Ongoing get-to-know-you discovery conversation. Pairs with
// /api/foundations/conversation (Haiku, running notes, daily cap).
// Full history reloads on every visit — leave and come back anytime.

const C = {
  navy: "#0B1426",
  navyCard: "#101B33",
  navyRaised: "#16243F",
  line: "rgba(197,165,106,0.18)",
  gold: "#C5A56A",
  goldSoft: "rgba(197,165,106,0.12)",
  ink: "#E8E6E1",
  inkDim: "#8B93A7",
};

const display = { fontFamily: "'Cormorant Garamond', Georgia, serif" };
const body = { fontFamily: "'Montserrat', sans-serif" };

// Shown only when there is no history yet. Not persisted — the API stores
// the conversation from the first student message onward.
const OPENER = {
  role: "assistant",
  content:
    "This is our space to talk — about you, not about applications. No wrong answers, no grades here, and we can pick this back up any time you leave.\n\nLet's start with the fun one: if you could go to any college in the country, which one would it be? Dream as big as you want.",
};

export default function Conversation() {
  const [messages, setMessages] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [returning, setReturning] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [used, setUsed] = useState(0);
  const [cap, setCap] = useState(150);
  const endRef = useRef(null);

  // Resume: load full history on mount.
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("/api/foundations/conversation", {
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
        if (typeof data.cap === "number") setCap(data.cap);
      } catch {
        setMessages([OPENER]);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: hydrated ? "smooth" : "auto" });
  }, [messages, loading, hydrated]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading || used >= cap) return;

    const nextMessages = [...messages, { role: "user", content: q }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/foundations/conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          // Send recent history only — the API truncates again server-side.
          messages: nextMessages.slice(-12),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      if (typeof data.used === "number") setUsed(data.used);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Something went wrong on my end. Give it a moment and send that again — it wasn't lost on purpose, I promise.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const capped = used >= cap;

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
            Foundations · Conversation
          </p>
          <h1 style={{ ...display, fontSize: 32, fontWeight: 500 }}>
            {returning ? "Welcome back — let's keep talking" : "Let's get to know you"}
          </h1>
        </div>
        <p style={{ fontSize: 11, color: C.inkDim, letterSpacing: 1 }}>
          Picks up right where you left off
        </p>
      </div>

      {/* ── Messages ── */}
      <div
        className="flex-1 overflow-y-auto px-6 md:px-12 py-8"
        style={{ width: "100%", maxWidth: 768, margin: "0 auto" }}
      >
        {!hydrated ? (
          <p style={{ ...display, fontSize: 15, fontStyle: "italic", color: C.inkDim }}>
            Picking up your conversation…
          </p>
        ) : (
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
                    Listening…
                  </p>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* ── Composer ── */}
      <div style={{ borderTop: `1px solid ${C.line}` }} className="px-6 md:px-12 py-5">
        <div style={{ width: "100%", maxWidth: 768, margin: "0 auto" }}>
          {capped ? (
            <div
              style={{ background: C.navyCard, border: `1px solid ${C.line}`, borderRadius: 12 }}
              className="p-5 text-center"
            >
              <p style={{ fontSize: 13, color: C.inkDim }}>
                That was a lot of great conversation for one day. Everything you shared is
                saved — come back tomorrow and we'll pick up right here.
              </p>
            </div>
          ) : (
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Just talk — there's no wrong answer…"
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
                disabled={!input.trim() || loading || !hydrated}
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
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
