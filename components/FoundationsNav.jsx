'use client';

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Shared top navigation for every Foundations page. Also acts as the
// interface guard: seniors (grade 12) are sent to the Vantage dashboard,
// users with no grade yet are sent to the grade picker. Fails open on
// any error so Foundations never breaks for its own students.

const C = {
  line: "rgba(197,165,106,0.18)",
  gold: "#C5A56A",
  ink: "#E8E6E1",
  inkDim: "#8B93A7",
};
const display = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

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
        if (g === 12) router.replace("/dashboard");
        else if (typeof g !== "number") router.replace("/foundations/start");
      } catch {
        /* fail open */
      }
    })();
  }, [router]);

  return (
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
      </nav>
    </header>
  );
}
