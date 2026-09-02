"use client";

import Link from "next/link";
import FoundationsNav from "@/components/FoundationsNav";
import { C, display, body } from "@/lib/foundations-theme";

// ─── Vantage Foundations — the peek ahead ────────────────────────
// Read-only preview of the application side for 9th–11th graders:
// what's waiting, and how the work they're doing NOW feeds each part.
// The tools themselves stay locked until January of junior year.

const STAGES = [
  {
    name: "Strategy",
    what: "A college list with honest odds — Safety to Hard Reach — and the early-round decision (ED, EA, REA) made deliberately, with the rules explained.",
    feeds: "Your grades, courses, and activity threads become the profile the odds are computed from. Depth you build now moves real numbers later.",
  },
  {
    name: "Story Builder",
    what: "Twelve questions that teach the essay AI who you are, so its guidance is about you — not generic advice.",
    feeds: "Your story has been writing itself since your first conversation here. By the time you get these questions, most of the answers already exist.",
  },
  {
    name: "Essays + Strategic Intelligence",
    what: "Every essay for every school on your list, each with an AI coach that reads your draft against the prompt and pushes you to make it truer and sharper.",
    feeds: "Your Spark reflections are the secret weapon. The month you changed your mind, the thing you fixed — the coach will hand these back to you as essay material when you need them most.",
  },
  {
    name: "The Round Table",
    what: "Before you submit, a full committee-style read of your entire application, school by school — the way an admissions office will actually see it.",
    feeds: "It reads everything: essays, activities, your whole arc. Four years of honest material makes this read rich instead of thin.",
  },
];

export default function PeekAhead() {
  return (
    <div style={{ ...body, background: C.navy, minHeight: "100vh", color: C.ink, width: "100%" }}>
      <FoundationsNav />
      <main style={{ width: "100%", maxWidth: 820, margin: "0 auto", padding: "48px clamp(16px, 4vw, 48px) 96px", boxSizing: "border-box" }}>
        <p style={{ fontSize: 11, letterSpacing: 2.5, color: C.gold, fontWeight: 600 }} className="uppercase mb-3">
          The peek ahead
        </p>
        <h1 style={{ ...display, fontSize: "clamp(34px, 6vw, 44px)", fontWeight: 600, lineHeight: 1.12, marginBottom: 14, maxWidth: 620 }}>
          Where all of this is going
        </h1>
        <p style={{ color: C.inkDim, fontSize: 15, lineHeight: 1.7, maxWidth: 600, marginBottom: 40 }}>
          Senior year, Vantage becomes your application headquarters. You don&apos;t need any of
          it yet — that&apos;s the point of Foundations — but here&apos;s what&apos;s waiting, and
          how the things you&apos;re doing right now quietly build it.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {STAGES.map((s, i) => (
            <div key={s.name} style={{ background: C.navyCard, border: `1px solid ${C.line}`, borderRadius: 12, padding: "22px 26px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
                <span style={{ ...display, color: C.gold, fontSize: 18, fontWeight: 600 }}>{i + 1}</span>
                <h2 style={{ ...display, fontSize: 24, fontWeight: 600, margin: 0 }}>{s.name}</h2>
              </div>
              <p style={{ color: C.inkDim, fontSize: 14, lineHeight: 1.7, margin: "0 0 10px" }}>{s.what}</p>
              <p style={{ color: C.gold, fontSize: 13, lineHeight: 1.65, margin: 0 }}>
                <span style={{ fontWeight: 700, letterSpacing: 1, fontSize: 10, textTransform: "uppercase", marginRight: 8 }}>How today feeds it</span>
                {s.feeds}
              </p>
            </div>
          ))}
        </div>

        <div style={{ border: `1px dashed ${C.gold}`, borderRadius: 12, padding: "20px 26px", marginTop: 28, background: "rgba(197,165,106,0.05)" }}>
          <p style={{ color: C.ink, fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            <span style={{ color: C.gold, fontWeight: 600 }}>When it unlocks:</span> January of
            junior year. Until then, the single best thing you can do for future-you is exactly
            what Foundations already asks: keep talking, keep your threads alive, and never skip
            a Spark. Future-you starts their essays from a life already written down.
          </p>
        </div>

        <div style={{ marginTop: 32 }}>
          <Link
            href="/foundations/compass"
            style={{ fontSize: 12, letterSpacing: 1.5, color: C.gold, textDecoration: "none" }}
            className="uppercase"
          >
            ← Back to your compass
          </Link>
        </div>
      </main>
    </div>
  );
}
