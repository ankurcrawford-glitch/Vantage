'use client';

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import FoundationsNav from "@/components/FoundationsNav";

// ─── Vantage Foundations — Roadmap ───────────────────────────────
// Grade-by-grade strategic plan, wired to /api/foundations/roadmap:
// knows the student's real grade ("You are here") and lets them check
// items off — progress persists in roadmap_progress.

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

// ─── Roadmap template (versioned in-app; keys must stay stable) ──
const roadmap = [
  {
    grade: 9,
    theme: "Explore",
    items: [
      { key: "9-courses", cat: "Courses", text: "Take the most challenging classes you can handle well; build solid study habits." },
      { key: "9-activities", cat: "Activities", text: "Try several clubs, sports, or activities — then keep the few you genuinely enjoy." },
      { key: "9-summer", cat: "Summer", text: "Explore interests: volunteering, a job, a personal project, or a summer camp.", due: "Summer" },
    ],
  },
  {
    grade: 10,
    theme: "Deepen",
    items: [
      { key: "10-psat", cat: "Testing", text: "Take the PSAT in October for a no-stakes baseline (it doesn't go to colleges).", due: "October" },
      { key: "10-ap", cat: "Courses", text: "Add your first AP/honors courses in subjects where you're strong." },
      { key: "10-depth", cat: "Activities", text: "Go deeper in 1-2 activities; look for small leadership or initiative." },
      { key: "10-summer", cat: "Summer", text: "Apply to summer programs and internships — many open from winter into spring.", due: "Jan-Apr" },
    ],
  },
  {
    grade: 11,
    theme: "Lead",
    items: [
      { key: "11-summer-apps", cat: "Summer", text: "Apply to selective summer research/internships — deadlines are often Dec-Mar.", due: "Dec-Mar" },
      { key: "11-psat-nmsqt", cat: "Testing", text: "PSAT/NMSQT in October (this one is the National Merit qualifier).", due: "October" },
      { key: "11-sat-act", cat: "Testing", text: "Take the SAT and/or ACT in spring; leave room for a retake.", due: "Spring" },
      { key: "11-ap-exams", cat: "Testing", text: "Sit AP exams for any AP courses.", due: "May" },
      { key: "11-leadership", cat: "Activities", text: "Aim for a leadership role or a self-initiated project." },
      { key: "11-college-list", cat: "Applications", text: "Start building your college list and visiting/researching schools.", due: "Spring-Summer" },
    ],
  },
  {
    grade: 12,
    theme: "Apply",
    items: [
      { key: "12-retakes", cat: "Testing", text: "Final SAT/ACT retakes in the fall, if needed.", due: "Fall" },
      { key: "12-ed-ea", cat: "Applications", text: "Early Decision / Early Action deadlines — usually November 1.", due: "Nov 1" },
      { key: "12-fafsa", cat: "Applications", text: "Submit the FAFSA for financial aid (opens in the fall).", due: "Oct+" },
      { key: "12-rd", cat: "Applications", text: "Regular Decision deadlines — usually January 1.", due: "Jan 1" },
      { key: "12-graduate", cat: "Milestone", text: "Graduate to Vantage Application — your story becomes your essays." },
    ],
  },
];

const catColor = {
  Courses: C.gold,
  Testing: "#9BB8D4",
  Activities: "#A8C5A6",
  Summer: "#D4A89B",
  Applications: "#C9A977",
  Milestone: C.gold,
};

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

// ─── Component ───────────────────────────────────────────────────
export default function FoundationsRoadmap() {
  const [grade, setGrade] = useState(null);
  const [doneKeys, setDoneKeys] = useState(new Set());
  const [openGrade, setOpenGrade] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/foundations/roadmap", { headers: await authHeaders() });
        const data = await res.json();
        if (typeof data.grade === "number") {
          setGrade(data.grade);
          setOpenGrade(data.grade);
        } else {
          setOpenGrade(9);
        }
        if (Array.isArray(data.done)) setDoneKeys(new Set(data.done));
      } catch {
        setOpenGrade(9); // render the template even if loading fails
      }
    })();
  }, []);

  const toggle = async (key) => {
    const next = new Set(doneKeys);
    const nowDone = !next.has(key);
    nowDone ? next.add(key) : next.delete(key);
    setDoneKeys(next); // optimistic
    try {
      await fetch("/api/foundations/roadmap", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ key, done: nowDone }),
      });
    } catch { /* optimistic; reload reconciles */ }
  };

  const statusOf = (g) =>
    grade === null ? "upcoming" : g < grade ? "complete" : g === grade ? "current" : "upcoming";

  return (
    <div style={{ ...body, background: C.navy, minHeight: "100vh", color: C.ink, width: "100%" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Montserrat:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <FoundationsNav />

      <main style={{ width: "100%", maxWidth: 896, margin: "0 auto", padding: "40px clamp(16px, 4vw, 48px)", boxSizing: "border-box" }}>
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
            Check things off as you go. Dates are general guidelines — always confirm exact
            deadlines with official sources.
          </p>
        </div>

        {/* ── Timeline ── */}
        <div className="relative">
          <div style={{ position: "absolute", left: 19, top: 8, bottom: 8, width: 1, background: C.line }} />

          <div className="space-y-4">
            {roadmap.map((g) => {
              const open = openGrade === g.grade;
              const status = statusOf(g.grade);
              const isCurrent = status === "current";
              const isDone = status === "complete";
              const gradeDoneCount = g.items.filter((i) => doneKeys.has(i.key)).length;

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

                  <div style={{ background: C.navyCard, border: `1px solid ${open ? C.gold : C.line}`, borderRadius: 12 }}>
                    {/* Grade header */}
                    <button
                      onClick={() => setOpenGrade(open ? null : g.grade)}
                      className="w-full p-5 flex items-center justify-between text-left"
                    >
                      <div className="flex items-baseline gap-4 flex-wrap">
                        <span style={{ ...display, fontSize: 26, fontWeight: 600 }}>
                          Grade {g.grade}
                        </span>
                        <span style={{ ...display, fontSize: 18, fontStyle: "italic", color: C.gold }}>
                          {g.theme}
                        </span>
                        {isCurrent && (
                          <span
                            style={{ fontSize: 9.5, letterSpacing: 1.5, color: C.navy, background: C.gold, borderRadius: 4, padding: "3px 8px" }}
                            className="uppercase"
                          >
                            You are here
                          </span>
                        )}
                        {gradeDoneCount > 0 && (
                          <span style={{ fontSize: 11, color: C.inkDim }}>
                            {gradeDoneCount}/{g.items.length} done
                          </span>
                        )}
                      </div>
                      <span style={{ color: C.inkDim, fontSize: 18 }}>{open ? "−" : "+"}</span>
                    </button>

                    {/* Items */}
                    {open && (
                      <div className="px-5 pb-5 space-y-2">
                        {g.items.map((item) => {
                          const checked = doneKeys.has(item.key);
                          return (
                            <div
                              key={item.key}
                              style={{
                                background: C.navyRaised,
                                border: `1px solid ${C.line}`,
                                borderRadius: 8,
                                opacity: checked ? 0.55 : 1,
                              }}
                              className="px-4 py-3 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {/* check circle */}
                                <button
                                  onClick={() => toggle(item.key)}
                                  aria-label={checked ? "Mark not done" : "Mark done"}
                                  style={{
                                    width: 20,
                                    height: 20,
                                    minWidth: 20,
                                    borderRadius: "50%",
                                    border: `1.5px solid ${checked ? C.gold : C.inkDim}`,
                                    background: checked ? C.gold : "transparent",
                                    color: C.navy,
                                    fontSize: 12,
                                    lineHeight: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                  }}
                                >
                                  {checked ? "✓" : ""}
                                </button>
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
                                <span style={{ fontSize: 13, textDecoration: checked ? "line-through" : "none" }}>
                                  {item.text}
                                </span>
                              </div>
                              {item.due && (
                                <span style={{ fontSize: 10.5, letterSpacing: 1, color: C.gold, whiteSpace: "nowrap" }} className="uppercase">
                                  {item.due}
                                </span>
                              )}
                            </div>
                          );
                        })}
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
