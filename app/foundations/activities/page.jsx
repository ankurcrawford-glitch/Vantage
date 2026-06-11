'use client';

import React, { useState } from "react";

// ─── Vantage Foundations — Activities ────────────────────────────
// Tracker with strategic guidance: depth over breadth, leadership
// trajectory, the self-initiated push. Feeds the Story page.

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
const activities = [
  {
    id: 1,
    name: "Hospital Volunteering",
    role: "Volunteer",
    since: "Grade 9",
    hours: 120,
    depth: 3,
    thread: "Biology × Community Health",
    trajectory: "Ask about the patient-liaison program — it's the leadership rung here.",
  },
  {
    id: 2,
    name: "HOSA",
    role: "Member",
    since: "Grade 10",
    hours: 40,
    depth: 2,
    thread: "Biology × Community Health",
    trajectory: "Officer elections are in spring of 11th. Start being visibly useful now.",
  },
  {
    id: 3,
    name: "Yearbook",
    role: "Staff Photographer",
    since: "Grade 9",
    hours: 60,
    depth: 2,
    thread: "Visual Storytelling",
    trajectory: "Photo editor by 11th grade is realistic. Or let this stay a craft, not a title.",
  },
  {
    id: 4,
    name: "Photography",
    role: "Personal practice",
    since: "Grade 9",
    hours: null,
    depth: 2,
    thread: "Visual Storytelling",
    trajectory: "Unstructured is fine — but a public output (zine, exhibit, account) makes it real.",
  },
];

const counselorTake = {
  headline: "Four activities. Two threads. One gap.",
  text: "Your list is healthy — focused, not scattered. What's missing is anything you started yourself. Colleges read joined activities as participation; they read self-initiated ones as character. The summer project fills this gap. Resist adding a fifth club.",
};

const depthLabels = ["", "Tried it", "Committed", "Deep", "Leading", "Defining"];

// ===================== END MOCK DATA (TODO) =============================

// ─── Component ───────────────────────────────────────────────────
export default function FoundationsActivities() {
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ ...body, background: C.navy, minHeight: "100vh", color: C.ink, width: "100%" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Montserrat:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <main className="px-6 md:px-12 py-10 max-w-5xl mx-auto"
            style={{ width: "100%", maxWidth: 1024, margin: "0 auto", padding: "40px clamp(16px, 4vw, 48px)", boxSizing: "border-box" }}>
        {/* ── Header ── */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p style={{ color: C.gold, fontSize: 11, letterSpacing: 3 }} className="uppercase mb-2">
              Foundations · Activities
            </p>
            <h1 style={{ ...display, fontSize: 44, fontWeight: 500, lineHeight: 1.1 }}>
              Depth over breadth
            </h1>
          </div>
          <button
            style={{
              border: `1px solid ${C.gold}`,
              color: C.gold,
              fontSize: 12,
              letterSpacing: 1.5,
              borderRadius: 8,
            }}
            className="uppercase px-6 py-3 hover:bg-white/5 transition-colors self-start"
          >
            + Add activity
          </button>
        </div>

        {/* ── Counselor take ── */}
        <div
          style={{ background: C.goldSoft, border: `1px solid ${C.gold}`, borderRadius: 12 }}
          className="p-7 mb-10"
        >
          <p style={{ fontSize: 11, letterSpacing: 2, color: C.gold }} className="uppercase mb-3">
            {counselorTake.headline}
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
            {counselorTake.text}
          </p>
        </div>

        {/* ── Activity cards ── */}
        <div className="grid md:grid-cols-2 gap-4">
          {activities.map((a) => {
            const open = selected === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setSelected(open ? null : a.id)}
                style={{
                  background: C.navyCard,
                  border: `1px solid ${open ? C.gold : C.line}`,
                  borderRadius: 12,
                  textAlign: "left",
                }}
                className="p-6 transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <p style={{ ...display, fontSize: 22, fontWeight: 600 }}>{a.name}</p>
                  {a.hours && (
                    <span style={{ fontSize: 11, color: C.inkDim, whiteSpace: "nowrap" }}>
                      {a.hours} hrs
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: C.inkDim, marginBottom: 14 }}>
                  {a.role} · since {a.since}
                </p>

                {/* Depth meter */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        style={{
                          width: 18,
                          height: 4,
                          borderRadius: 2,
                          background: n <= a.depth ? C.gold : "rgba(255,255,255,0.08)",
                        }}
                      />
                    ))}
                  </div>
                  <span
                    style={{ fontSize: 10, letterSpacing: 1.5, color: C.gold }}
                    className="uppercase"
                  >
                    {depthLabels[a.depth]}
                  </span>
                </div>

                {/* Thread tag */}
                <span
                  style={{
                    fontSize: 9.5,
                    letterSpacing: 1.2,
                    color: C.inkDim,
                    border: `1px solid ${C.line}`,
                    borderRadius: 4,
                    padding: "3px 8px",
                  }}
                  className="uppercase"
                >
                  → {a.thread}
                </span>

                {/* Trajectory (expanded) */}
                {open && (
                  <div style={{ borderLeft: `2px solid ${C.gold}`, paddingLeft: 14, marginTop: 16 }}>
                    <p
                      style={{ fontSize: 10.5, letterSpacing: 2, color: C.gold }}
                      className="uppercase mb-1"
                    >
                      Trajectory
                    </p>
                    <p style={{ fontSize: 13, lineHeight: 1.65 }}>{a.trajectory}</p>
                  </div>
                )}
              </button>
            );
          })}

          {/* The self-initiated slot — deliberately empty */}
          <div
            style={{
              border: `1px dashed ${C.gold}`,
              borderRadius: 12,
              background: "transparent",
            }}
            className="p-6 flex flex-col justify-center"
          >
            <p style={{ ...display, fontSize: 22, fontWeight: 600, color: C.gold, marginBottom: 6 }}>
              The one you start yourself
            </p>
            <p style={{ fontSize: 12.5, color: C.inkDim, lineHeight: 1.65 }}>
              This slot stays open until you fill it. Every great application has one thing
              the student built, not joined.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
