'use client';

import React from "react";
import { useRouter } from "next/navigation";

// ─── Vantage Foundations — Compass ───────────────────────────────
// Design system: Cormorant Garamond (display) + Montserrat (body)
// Palette: dark navy base, gold #C5A56A accents
// Foundations uses gold slightly more warmly than Application.

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
const student = {
  firstName: "",
  grade: null,
  semester: "",
  thread: "",
};

const arc = [
  { grade: 9, label: "Explore", done: false },
  { grade: 10, label: "Deepen", done: false },
  { grade: 11, label: "Lead", done: false },
  { grade: 12, label: "Apply", done: false },
];

const counselorNote = {
  date: "",
  text: "Your counselor's monthly note will appear here. As you add activities and reflections, this becomes personal guidance written just for you.",
};

const priorities = [];

const storyPulse = [
  { label: "Narrative threads", value: "0" },
  { label: "Activities tracked", value: "0" },
  { label: "Reflections banked", value: "0" },
];

const nav = ["Compass", "Story", "Roadmap", "Activities", "Spark"];

// ===================== END MOCK DATA (TODO) =============================

// ─── Component ───────────────────────────────────────────────────
export default function FoundationsCompass() {
  const router = useRouter();
  const active = "Compass";
  // Tabs / CTAs navigate to the real Foundations routes.
  const setActive = (name) => router.push(`/foundations/${name.toLowerCase()}`);

  return (
    <div style={{ ...body, background: C.navy, minHeight: "100vh", color: C.ink, width: "100%" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Montserrat:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* ── Top bar ── */}
      <header
        style={{ borderBottom: `1px solid ${C.line}` }}
        className="px-6 md:px-12 py-5 flex items-center justify-between"
      >
        <div className="flex items-baseline gap-3">
          <span style={{ ...display, fontSize: 26, fontWeight: 600, letterSpacing: 0.5 }}>
            Vantage
          </span>
          <span
            style={{ color: C.gold, fontSize: 11, letterSpacing: 3, fontWeight: 500 }}
            className="uppercase"
          >
            Foundations
          </span>
        </div>
        <nav className="hidden md:flex gap-8">
          {nav.map((n) => (
            <button
              key={n}
              onClick={() => setActive(n)}
              style={{
                fontSize: 12,
                letterSpacing: 1.5,
                color: active === n ? C.gold : C.inkDim,
                borderBottom: active === n ? `1px solid ${C.gold}` : "1px solid transparent",
                paddingBottom: 4,
              }}
              className="uppercase transition-colors hover:text-white"
            >
              {n}
            </button>
          ))}
        </nav>
      </header>

      <main className="px-6 md:px-12 py-10 max-w-5xl mx-auto"
            style={{ width: "100%", maxWidth: 1024, margin: "0 auto", padding: "40px clamp(16px, 4vw, 48px)", boxSizing: "border-box" }}>
        {/* ── Greeting + position ── */}
        <div className="mb-10">
          <p style={{ color: C.inkDim, fontSize: 12, letterSpacing: 2 }} className="uppercase mb-2">
            Welcome
          </p>
          <h1 style={{ ...display, fontSize: 44, fontWeight: 500, lineHeight: 1.1 }}>
            Good morning.
          </h1>
          {student.thread && (
            <p style={{ color: C.inkDim, fontSize: 14, marginTop: 8 }}>
              Your thread: <span style={{ color: C.gold }}>{student.thread}</span>
            </p>
          )}
        </div>

        {/* ── Four-year arc ── */}
        <div
          style={{ background: C.navyCard, border: `1px solid ${C.line}`, borderRadius: 12 }}
          className="p-6 mb-8"
        >
          <p style={{ fontSize: 11, letterSpacing: 2, color: C.inkDim }} className="uppercase mb-5">
            Your four-year arc
          </p>
          <div className="flex items-center">
            {arc.map((s, i) => (
              <React.Fragment key={s.grade}>
                <div className="flex flex-col items-center" style={{ minWidth: 64 }}>
                  <div
                    style={{
                      width: s.current ? 14 : 10,
                      height: s.current ? 14 : 10,
                      borderRadius: "50%",
                      background: s.done || s.current ? C.gold : "transparent",
                      border: `1.5px solid ${s.done || s.current ? C.gold : C.inkDim}`,
                      boxShadow: s.current ? `0 0 12px ${C.gold}` : "none",
                    }}
                  />
                  <span
                    style={{
                      ...display,
                      fontSize: 18,
                      marginTop: 10,
                      color: s.current ? C.ink : C.inkDim,
                      fontStyle: "italic",
                    }}
                  >
                    {s.label}
                  </span>
                  <span style={{ fontSize: 10, letterSpacing: 1.5, color: C.inkDim }}>
                    GR {s.grade}
                  </span>
                </div>
                {i < arc.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: s.done ? C.gold : C.line,
                      marginBottom: 38,
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Counselor note (signature element) ── */}
        <div
          style={{
            background: C.goldSoft,
            border: `1px solid ${C.gold}`,
            borderRadius: 12,
          }}
          className="p-7 mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: 11, letterSpacing: 2, color: C.gold }} className="uppercase">
              From your counselor
            </p>
            <p style={{ fontSize: 11, color: C.inkDim }}>{counselorNote.date}</p>
          </div>
          <p
            style={{
              ...display,
              fontSize: 21,
              fontStyle: "italic",
              fontWeight: 500,
              lineHeight: 1.55,
              color: C.ink,
            }}
          >
            {counselorNote.text}
          </p>
        </div>

        {/* ── This month's priorities ── */}
        <p style={{ fontSize: 11, letterSpacing: 2, color: C.inkDim }} className="uppercase mb-4">
          This month
        </p>
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {priorities.length === 0 && (
            <p style={{ color: C.inkDim, fontSize: 14, lineHeight: 1.7 }} className="md:col-span-3">Your monthly priorities will appear here as your roadmap and profile fill in.</p>
          )}
          {priorities.map((p) => (
            <button
              key={p.title}
              onClick={() => setActive(p.page)}
              style={{
                background: C.navyCard,
                border: `1px solid ${C.line}`,
                borderRadius: 12,
                textAlign: "left",
              }}
              className="p-5 transition-transform hover:-translate-y-0.5"
            >
              <p style={{ ...display, fontSize: 19, fontWeight: 600, marginBottom: 8 }}>
                {p.title}
              </p>
              <p style={{ fontSize: 12.5, color: C.inkDim, lineHeight: 1.6, marginBottom: 14 }}>
                {p.detail}
              </p>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 10.5, letterSpacing: 1, color: C.gold }} className="uppercase">
                  {p.due}
                </span>
                <span style={{ fontSize: 11, color: C.inkDim }}>→ {p.page}</span>
              </div>
            </button>
          ))}
        </div>

        {/* ── Story pulse ── */}
        <div
          style={{ background: C.navyRaised, border: `1px solid ${C.line}`, borderRadius: 12 }}
          className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="flex gap-10">
            {storyPulse.map((s) => (
              <div key={s.label}>
                <p style={{ ...display, fontSize: 24, fontWeight: 600, color: C.gold }}>
                  {s.value}
                </p>
                <p style={{ fontSize: 10.5, letterSpacing: 1.5, color: C.inkDim }} className="uppercase">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setActive("Story")}
            style={{
              border: `1px solid ${C.gold}`,
              color: C.gold,
              fontSize: 12,
              letterSpacing: 1.5,
              borderRadius: 8,
            }}
            className="uppercase px-6 py-3 hover:bg-white/5 transition-colors self-start md:self-auto"
          >
            View your story
          </button>
        </div>
      </main>
    </div>
  );
}
