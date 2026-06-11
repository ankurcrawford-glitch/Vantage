'use client';

import React, { useState } from "react";

// ─── Vantage Foundations — Roadmap ───────────────────────────────
// Grade-by-grade strategic plan: courses, testing, summers, milestones.

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
const currentGrade = null;

const roadmap = [
  { grade: 9, theme: "Explore", status: "upcoming", items: [] },
  { grade: 10, theme: "Deepen", status: "upcoming", items: [] },
  { grade: 11, theme: "Lead", status: "upcoming", items: [] },
  { grade: 12, theme: "Apply", status: "upcoming", items: [] },
];

const catColor = {
  Courses: C.gold,
  Testing: "#9BB8D4",
  Activities: "#A8C5A6",
  Summer: "#D4A89B",
  Milestone: C.gold,
};

// ===================== END MOCK DATA (TODO) =============================

// ─── Component ───────────────────────────────────────────────────
export default function FoundationsRoadmap() {
  const [openGrade, setOpenGrade] = useState(currentGrade);

  return (
    <div style={{ ...body, background: C.navy, minHeight: "100vh", color: C.ink, width: "100%" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Montserrat:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <main className="px-6 md:px-12 py-10 max-w-4xl mx-auto"
            style={{ width: "100%", maxWidth: 896, margin: "0 auto", padding: "40px clamp(16px, 4vw, 48px)", boxSizing: "border-box" }}>
        {/* ── Header ── */}
        <div className="mb-10">
          <p style={{ color: C.gold, fontSize: 11, letterSpacing: 3 }} className="uppercase mb-2">
            Foundations · Roadmap
          </p>
          <h1 style={{ ...display, fontSize: 44, fontWeight: 500, lineHeight: 1.1 }}>
            The four-year plan
          </h1>
          <p style={{ color: C.inkDim, fontSize: 14, marginTop: 8, maxWidth: 540, lineHeight: 1.7 }}>
            Courses, testing, summers, and milestones — sequenced so nothing sneaks up on you.
            Deadlines here trigger reminders to your inbox.
          </p>
        </div>

        {/* ── Timeline ── */}
        <div className="relative">
          {/* vertical spine */}
          <div
            style={{
              position: "absolute",
              left: 19,
              top: 8,
              bottom: 8,
              width: 1,
              background: C.line,
            }}
          />

          <div className="space-y-4">
            {roadmap.map((g) => {
              const open = openGrade === g.grade;
              const isCurrent = g.status === "current";
              const isDone = g.status === "complete";

              return (
                <div key={g.grade} className="relative pl-14">
                  {/* node */}
                  <div
                    style={{
                      position: "absolute",
                      left: 12,
                      top: 22,
                      width: isCurrent ? 16 : 14,
                      height: isCurrent ? 16 : 14,
                      borderRadius: "50%",
                      background: isDone || isCurrent ? C.gold : C.navy,
                      border: `1.5px solid ${isDone || isCurrent ? C.gold : C.inkDim}`,
                      boxShadow: isCurrent ? `0 0 14px ${C.gold}` : "none",
                    }}
                  />

                  <div
                    style={{
                      background: C.navyCard,
                      border: `1px solid ${open ? C.gold : C.line}`,
                      borderRadius: 12,
                    }}
                  >
                    {/* Grade header */}
                    <button
                      onClick={() => setOpenGrade(open ? null : g.grade)}
                      className="w-full p-5 flex items-center justify-between text-left"
                    >
                      <div className="flex items-baseline gap-4">
                        <span style={{ ...display, fontSize: 26, fontWeight: 600 }}>
                          Grade {g.grade}
                        </span>
                        <span
                          style={{ ...display, fontSize: 18, fontStyle: "italic", color: C.gold }}
                        >
                          {g.theme}
                        </span>
                        {isCurrent && (
                          <span
                            style={{
                              fontSize: 9.5,
                              letterSpacing: 1.5,
                              color: C.navy,
                              background: C.gold,
                              borderRadius: 4,
                              padding: "3px 8px",
                            }}
                            className="uppercase"
                          >
                            You are here
                          </span>
                        )}
                      </div>
                      <span style={{ color: C.inkDim, fontSize: 18 }}>{open ? "−" : "+"}</span>
                    </button>

                    {/* Items */}
                    {open && (
                      <div className="px-5 pb-5 space-y-2">
                        {g.items.length === 0 && (
                          <p style={{ color: C.inkDim, fontSize: 13 }}>Plan items for this grade will appear here.</p>
                        )}
                        {g.items.map((item) => (
                          <div
                            key={item.text}
                            style={{
                              background: C.navyRaised,
                              border: `1px solid ${C.line}`,
                              borderRadius: 8,
                              opacity: item.done ? 0.55 : 1,
                            }}
                            className="px-4 py-3 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                style={{
                                  fontSize: 9.5,
                                  letterSpacing: 1.5,
                                  color: catColor[item.cat] || C.gold,
                                  border: `1px solid ${C.line}`,
                                  borderRadius: 4,
                                  padding: "3px 8px",
                                  whiteSpace: "nowrap",
                                }}
                                className="uppercase"
                              >
                                {item.cat}
                              </span>
                              <span
                                style={{
                                  fontSize: 13,
                                  textDecoration: item.done ? "line-through" : "none",
                                }}
                              >
                                {item.text}
                              </span>
                            </div>
                            {item.due && (
                              <span
                                style={{
                                  fontSize: 10.5,
                                  letterSpacing: 1,
                                  color: C.gold,
                                  whiteSpace: "nowrap",
                                }}
                                className="uppercase"
                              >
                                {item.due}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
