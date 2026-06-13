'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

// Shared top navigation for every Foundations page.

const C = {
  line: "rgba(197,165,106,0.18)",
  gold: "#C5A56A",
  ink: "#E8E6E1",
  inkDim: "#8B93A7",
};
const display = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

const ITEMS = [
  { label: "Compass", href: "/foundations/compass" },
  { label: "Story", href: "/foundations/story" },
  { label: "Roadmap", href: "/foundations/roadmap" },
  { label: "Activities", href: "/foundations/activities" },
  { label: "Spark", href: "/foundations/spark" },
  { label: "Counselor", href: "/foundations/counselor" },
];

export default function FoundationsNav() {
  const pathname = usePathname();
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
