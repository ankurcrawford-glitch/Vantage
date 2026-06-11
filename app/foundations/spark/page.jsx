'use client';

import React, { useState } from "react";

// ─── Vantage Foundations — Spark ─────────────────────────────────
// Monthly reflection ritual. Each entry banks raw material that
// becomes essay gold in senior year.

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

// ─── Mock data (replace with Supabase) ───────────────────────────
// ========================================================================
// TODO(Supabase): MOCK DATA / DEMO CONFIG — replace before launch.
// Everything down to "END MOCK DATA" is placeholder so the page renders.
// Wire these values to the student's real data (user_stats, activities,
// counselor_messages, etc.). See counselor-schema.sql for table shapes.
// ========================================================================
const currentSpark = {
  month: "June 2026",
  prompt: "Describe a moment this year when you felt most like yourself.",
  hint: "Don't write what sounds good. Write what's true. Five minutes, no editing.",
};

const archive = [];

const bankCount = 0;

// ===================== END MOCK DATA (TODO) =============================

// ─── Component ───────────────────────────────────────────────────
export default function FoundationsSpark() {
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (!draft.trim()) return;
    // TODO: persist to Supabase, trigger thread analysis
    setSaved(true);
  };

  return (
    <div style={{ ...body, background: C.navy, minHeight: "100vh", color: C.ink, width: "100%" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Montserrat:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <main className="px-6 md:px-12 py-10 max-w-3xl mx-auto"
            style={{ width: "100%", maxWidth: 768, margin: "0 auto", padding: "40px clamp(16px, 4vw, 48px)", boxSizing: "border-box" }}>
        {/* ── Header ── */}
        <div className="mb-10">
          <p style={{ color: C.gold, fontSize: 11, letterSpacing: 3 }} className="uppercase mb-2">
            Foundations · Spark
          </p>
          <h1 style={{ ...display, fontSize: 44, fontWeight: 500, lineHeight: 1.1 }}>
            This month's spark
          </h1>
          <p style={{ color: C.inkDim, fontSize: 14, marginTop: 8, lineHeight: 1.7 }}>
            One honest reflection a month. By senior year you'll have a vault of real
            material no prompt can scare — {bankCount} entries banked so far.
          </p>
        </div>

        {/* ── Current prompt ── */}
        <div
          style={{ background: C.goldSoft, border: `1px solid ${C.gold}`, borderRadius: 12 }}
          className="p-8 mb-6"
        >
          <p style={{ fontSize: 11, letterSpacing: 2, color: C.gold }} className="uppercase mb-4">
            {currentSpark.month}
          </p>
          <p
            style={{
              ...display,
              fontSize: 28,
              fontStyle: "italic",
              fontWeight: 500,
              lineHeight: 1.4,
              marginBottom: 10,
            }}
          >
            {currentSpark.prompt}
          </p>
          <p style={{ fontSize: 12.5, color: C.inkDim }}>{currentSpark.hint}</p>
        </div>

        {/* ── Writing area ── */}
        {!saved ? (
          <>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Start anywhere. The middle is fine."
              rows={9}
              style={{
                width: "100%",
                background: C.navyCard,
                border: `1px solid ${C.line}`,
                borderRadius: 12,
                color: C.ink,
                fontSize: 15,
                lineHeight: 1.8,
                padding: 24,
                resize: "vertical",
                outline: "none",
                ...display,
              }}
              className="focus:border-[#C5A56A] mb-4"
            />
            <div className="flex items-center justify-between mb-12">
              <span style={{ fontSize: 11, color: C.inkDim }}>
                {draft.trim() ? `${draft.trim().split(/\s+/).length} words` : "Just for you — never graded."}
              </span>
              <button
                onClick={save}
                disabled={!draft.trim()}
                style={{
                  background: draft.trim() ? C.gold : "transparent",
                  color: draft.trim() ? C.navy : C.inkDim,
                  border: `1px solid ${draft.trim() ? C.gold : C.line}`,
                  fontSize: 12,
                  letterSpacing: 1.5,
                  borderRadius: 8,
                  cursor: draft.trim() ? "pointer" : "default",
                }}
                className="uppercase px-8 py-3 transition-colors"
              >
                Bank this reflection
              </button>
            </div>
          </>
        ) : (
          <div
            style={{ background: C.navyCard, border: `1px solid ${C.gold}`, borderRadius: 12 }}
            className="p-8 mb-12 text-center"
          >
            <p style={{ ...display, fontSize: 24, fontWeight: 600, color: C.gold, marginBottom: 6 }}>
              Banked.
            </p>
            <p style={{ fontSize: 13, color: C.inkDim }}>
              Entry {bankCount + 1} in your vault. Your counselor will read it for new threads.
            </p>
          </div>
        )}

        {/* ── Archive ── */}
        <p style={{ fontSize: 11, letterSpacing: 2, color: C.inkDim }} className="uppercase mb-4">
          Your vault
        </p>
        <div className="space-y-3">
          {archive.length === 0 && (
            <p style={{ color: C.inkDim, fontSize: 14, lineHeight: 1.7 }}>No past reflections yet. Your saved reflections will collect here.</p>
          )}
          {archive.map((a) => (
            <div
              key={a.month}
              style={{
                background: C.navyCard,
                border: `1px solid ${C.line}`,
                borderRadius: 12,
              }}
              className="p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <p style={{ fontSize: 11, letterSpacing: 2, color: C.gold }} className="uppercase">
                  {a.month}
                </p>
                <div className="flex gap-2">
                  {a.threads.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 9,
                        letterSpacing: 1,
                        color: C.inkDim,
                        border: `1px solid ${C.line}`,
                        borderRadius: 4,
                        padding: "2px 7px",
                      }}
                      className="uppercase"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <p style={{ ...display, fontSize: 17, fontStyle: "italic", marginBottom: 8 }}>
                {a.prompt}
              </p>
              <p style={{ fontSize: 13, color: C.inkDim, lineHeight: 1.7 }}>{a.excerpt}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
