'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// First-conversation onboarding. Pairs with /api/foundations/onboarding.

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
const bodyFont = { fontFamily: "'Montserrat', sans-serif" };

const GREETING =
  "Hey - welcome to Vantage Foundations. I'm your counselor, and before we get into anything, I just want to get to know you a bit. To start: what's your name?";

export default function FoundationsWelcome() {
  const router = useRouter();
  const [messages, setMessages] = useState([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading || done) return;
    const next = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const res = await fetch("/api/foundations/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: next.slice(-16) }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "failed");
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      if (data.done) setDone(true);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Hmm, something glitched on my end. Give it another try in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ ...bodyFont, background: C.navy, minHeight: "100vh", width: "100%", color: C.ink, display: "flex", flexDirection: "column" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Montserrat:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.line}`, padding: "24px clamp(16px, 4vw, 48px)" }}>
        <p style={{ color: C.gold, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>
          Vantage · Foundations
        </p>
        <h1 style={{ ...display, fontSize: 28, fontWeight: 500 }}>Let's get to know you</h1>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px clamp(16px, 4vw, 48px)" }}>
        <div style={{ width: "100%", maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  background: m.role === "user" ? C.navyRaised : C.goldSoft,
                  border: `1px solid ${C.line}`,
                  borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  maxWidth: "85%",
                  padding: "14px 18px",
                }}
              >
                {m.role === "assistant" && (
                  <p style={{ fontSize: 9.5, letterSpacing: 2, color: C.gold, textTransform: "uppercase", marginBottom: 6 }}>
                    Counselor
                  </p>
                )}
                <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{m.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ background: C.goldSoft, border: `1px solid ${C.line}`, borderRadius: "14px 14px 14px 4px", padding: "14px 18px" }}>
                <p style={{ ...display, fontSize: 15, fontStyle: "italic", color: C.inkDim }}>Thinking…</p>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Composer or completion */}
      <div style={{ borderTop: `1px solid ${C.line}`, padding: "20px clamp(16px, 4vw, 48px)" }}>
        <div style={{ width: "100%", maxWidth: 720, margin: "0 auto" }}>
          {done ? (
            <button
              onClick={() => router.push("/foundations/conversation")}
              style={{
                width: "100%",
                background: C.gold,
                color: C.navy,
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                padding: "16px",
                cursor: "pointer",
              }}
            >
              Continue to Foundations →
            </button>
          ) : (
            <div style={{ display: "flex", gap: 12 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type your answer…"
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
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                style={{
                  background: input.trim() && !loading ? C.gold : "transparent",
                  color: input.trim() && !loading ? C.navy : C.inkDim,
                  border: `1px solid ${input.trim() && !loading ? C.gold : C.line}`,
                  fontSize: 12,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  borderRadius: 10,
                  padding: "0 28px",
                  cursor: "pointer",
                }}
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
