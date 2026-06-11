'use client';

import React, { useState } from "react";

// ─── Vantage Foundations — Story ─────────────────────────────────
// The heart of the product: the student's emerging narrative,
// mapped as threads connecting interests, activities, reflections.

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
const threads = [];

const aiInsight =
  "Your narrative threads will appear here as you log activities and reflections. By senior year, the strongest threads become your applications.";

// ===================== END MOCK DATA (TODO) =============================

// ─── Component ───────────────────────────────────────────────────
export default function FoundationsStory() {
  const [openThread, setOpenThread] = useState("bio-health");

  return (
    <div style={{ ...body, background: C.navy, minHeight: "100vh", color: C.ink, width: "100%" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Montserrat:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <main className="px-6 md:px-12 py-10 max-w-5xl mx-auto"
            style={{ width: "100%", maxWidth: 1024, margin: "0 auto", padding: "40px clamp(16px, 4vw, 48px)", boxSizing: "border-box" }}>
        {/* ── Header ── */}
        <div className="mb-10">
          <p style={{ color: C.gold, fontSize: 11, letterSpacing: 3 }} className="uppercase mb-2">
            Foundations · Story
          </p>
          <h1 style={{ ...display, fontSize: 44, fontWeight: 500, lineHeight: 1.1 }}>
            Your story so far
          </h1>
          <p style={{ color: C.inkDim, fontSize: 14, marginTop: 8, maxWidth: 560, lineHeight: 1.7 }}>
            These are the narrative threads emerging from your activities, courses, and
            reflections. By senior year, the strongest threads become your applications.
          </p>
        </div>

        {/* ── AI insight ── */}
        <div
          style={{ background: C.goldSoft, border: `1px solid ${C.gold}`, borderRadius: 12 }}
          className="p-7 mb-10"
        >
          <p style={{ fontSize: 11, letterSpacing: 2, color: C.gold }} className="uppercase mb-3">
            What your counselor sees
          </p>
          <p
            style={{
              ...display,
              fontSize: 21,
              fontStyle: "italic",
              fontWeight: 500,
              lineHeight: 1.55,
            }}
          >
            {aiInsight}
          </p>
        </div>

        {/* ── Threads ── */}
        <div className="space-y-5">
          {threads.length === 0 && (
            <p style={{ color: C.inkDim, fontSize: 14, lineHeight: 1.7 }}>No narrative threads yet. They will appear as you log activities and reflections.</p>
          )}
          {threads.map((t) => {
            const open = openThread === t.id;
            return (
              <div
                key={t.id}
                style={{
                  background: C.navyCard,
                  border: `1px solid ${open ? C.gold : C.line}`,
                  borderRadius: 12,
                  transition: "border-color 0.2s",
                }}
              >
                {/* Thread header */}
                <button
                  onClick={() => setOpenThread(open ? null : t.id)}
                  className="w-full p-6 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: t.strength === "Strong" ? C.gold : "transparent",
                        border: `1.5px solid ${C.gold}`,
                      }}
                    />
                    <div>
                      <p style={{ ...display, fontSize: 24, fontWeight: 600 }}>{t.name}</p>
                      <p
                        style={{ fontSize: 10.5, letterSpacing: 1.5, color: C.gold }}
                        className="uppercase"
                      >
                        {t.strength} thread · {t.evidence.length} pieces of evidence
                      </p>
                    </div>
                  </div>
                  <span style={{ color: C.inkDim, fontSize: 18 }}>{open ? "−" : "+"}</span>
                </button>

                {/* Thread body */}
                {open && (
                  <div className="px-6 pb-6">
                    <p style={{ fontSize: 13.5, color: C.inkDim, lineHeight: 1.7, marginBottom: 20 }}>
                      {t.summary}
                    </p>

                    {/* Evidence timeline */}
                    <p
                      style={{ fontSize: 11, letterSpacing: 2, color: C.inkDim }}
                      className="uppercase mb-3"
                    >
                      Evidence
                    </p>
                    <div className="space-y-2 mb-6">
                      {t.evidence.map((e) => (
                        <div
                          key={e.label}
                          style={{
                            background: C.navyRaised,
                            border: `1px solid ${C.line}`,
                            borderRadius: 8,
                          }}
                          className="px-4 py-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              style={{
                                fontSize: 9.5,
                                letterSpacing: 1.5,
                                color: C.gold,
                                border: `1px solid ${C.line}`,
                                borderRadius: 4,
                                padding: "3px 8px",
                              }}
                              className="uppercase"
                            >
                              {e.type}
                            </span>
                            <span style={{ fontSize: 13 }}>{e.label}</span>
                          </div>
                          <span style={{ fontSize: 11, color: C.inkDim }}>Grade {e.grade}</span>
                        </div>
                      ))}
                    </div>

                    {/* Next move */}
                    <div
                      style={{
                        borderLeft: `2px solid ${C.gold}`,
                        paddingLeft: 16,
                      }}
                    >
                      <p
                        style={{ fontSize: 10.5, letterSpacing: 2, color: C.gold }}
                        className="uppercase mb-1"
                      >
                        Next move
                      </p>
                      <p style={{ fontSize: 13.5, lineHeight: 1.7 }}>{t.nextMove}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Empty-state hint for new threads ── */}
        <div
          style={{
            border: `1px dashed ${C.line}`,
            borderRadius: 12,
            color: C.inkDim,
          }}
          className="mt-5 p-6 text-center"
        >
          <p style={{ fontSize: 13 }}>
            New threads appear here as you add activities and reflections. Your story isn't
            finished — it's barely started.
          </p>
        </div>
      </main>
    </div>
  );
}
