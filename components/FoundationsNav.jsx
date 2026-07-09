'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { canAccessCollegePrep, collegePrepLockedMessage } from "@/lib/college-prep-access";
import { C, display } from "@/lib/foundations-theme";

// Shared top navigation for every Foundations page. Also acts as the
// interface guard: seniors (grade 12) are sent to the Vantage dashboard,
// users with no grade yet are sent to the grade picker. Fails open on
// any error so Foundations never breaks for its own students.


const ITEMS = [
  { label: "Compass", href: "/foundations/compass" },
  { label: "Conversation", href: "/foundations/conversation" },
  { label: "Story", href: "/foundations/story" },
  { label: "Roadmap", href: "/foundations/roadmap" },
  { label: "Activities", href: "/foundations/activities" },
  { label: "Spark", href: "/foundations/spark" },
  { label: "Counselor", href: "/foundations/counselor" },
];

export default function FoundationsNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [grade, setGrade] = useState(null);
  const [collegePrepNote, setCollegePrepNote] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // each page handles its own login redirect
        const { data } = await supabase
          .from("user_stats")
          .select("grade")
          .eq("user_id", user.id)
          .maybeSingle();
        const g = data?.grade;
        if (typeof g === "number") setGrade(g);
        if (g === 12) router.replace("/dashboard");
        else if (typeof g !== "number") router.replace("/foundations/start");
      } catch {
        /* fail open */
      }
    })();
  }, [router]);

  const collegePrepStyle = {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textDecoration: "none",
    color: C.inkDim,
    borderLeft: `1px solid ${C.line}`,
    paddingLeft: "clamp(14px, 2.5vw, 24px)",
    background: "none",
    borderTop: "none",
    borderRight: "none",
    borderBottom: "none",
    cursor: "pointer",
    paddingBottom: 4,
    fontFamily: "inherit",
  };

  return (
    <div>
    <header
      style={{
        borderBottom: `1px solid ${C.line}`,
        padding: "18px clamp(16px, 4vw, 48px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <Link
        href="/foundations/compass"
        style={{ display: "flex", alignItems: "baseline", gap: 12, textDecoration: "none" }}
      >
        <span style={{ ...display, fontSize: 24, fontWeight: 600, color: C.ink, letterSpacing: 0.5 }}>
          Vantage
        </span>
        <span style={{ color: C.gold, fontSize: 11, letterSpacing: 3, fontWeight: 500, textTransform: "uppercase" }}>
          Foundations
        </span>
      </Link>
      <nav style={{ display: "flex", gap: "clamp(14px, 2.5vw, 30px)", flexWrap: "wrap" }}>
        {ITEMS.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              style={{
                fontSize: 12,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                textDecoration: "none",
                color: active ? C.gold : C.inkDim,
                borderBottom: active ? `1px solid ${C.gold}` : "1px solid transparent",
                paddingBottom: 4,
              }}
            >
              {it.label}
            </Link>
          );
        })}
        {/* Juniors see this from 11th grade; click-through opens in January.
            Freshmen/sophomores don't see it yet. */}
        {grade === 11 && canAccessCollegePrep(grade) && (
          <Link href="/dashboard" style={collegePrepStyle}>
            College Prep →
          </Link>
        )}
        {grade === 11 && !canAccessCollegePrep(grade) && (
          <button
            type="button"
            onClick={() => setCollegePrepNote(true)}
            style={collegePrepStyle}
          >
            College Prep →
          </button>
        )}
      </nav>
    </header>
    {collegePrepNote && (
      <div
        style={{
          borderBottom: `1px solid ${C.line}`,
          background: "rgba(197,165,106,0.08)",
          padding: "12px clamp(16px, 4vw, 48px)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.6, margin: 0, maxWidth: 640 }}>
          {collegePrepLockedMessage(grade ?? 11)}
        </p>
        <button
          type="button"
          onClick={() => setCollegePrepNote(false)}
          aria-label="Dismiss"
          style={{
            background: "none",
            border: "none",
            color: C.inkDim,
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
            padding: 0,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
    )}
    </div>
  );
}
