'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { C, display, body } from "@/lib/foundations-theme";

// ─── Vantage Foundations — Grade capture / onboarding ────────────
// Asks the student what grade they're in, saves it to user_stats.grade,
// then routes: 9-11 -> Foundations, 12 -> existing college-app dashboard.

const bodyFont = { fontFamily: "'Montserrat', sans-serif" };

const GRADES = [
  { g: 9, label: "9th grade", note: "Just getting started" },
  { g: 10, label: "10th grade", note: "Building momentum" },
  { g: 11, label: "11th grade", note: "Foundations + college prep" },
  { g: 12, label: "12th grade", note: "Applying this year" },
];

export default function FoundationsStart() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAuthed(!!user);
      setChecking(false);
    })();
  }, []);

  const pick = async (g) => {
    setError("");
    setSaving(g);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const res = await fetch("/api/foundations/grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ grade: g }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Save failed");
      // 9-11 land in Foundations; 12 goes to the existing college-app dashboard.
      router.push(g <= 11 ? "/foundations/welcome" : "/dashboard");
    } catch (e) {
      setError("Couldn't save your grade. Please try again.");
      setSaving(null);
    }
  };

  return (
    <div
      style={{
        ...bodyFont,
        background: C.navy,
        minHeight: "100vh",
        width: "100%",
        color: C.ink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        boxSizing: "border-box",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Montserrat:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <div style={{ width: "100%", maxWidth: 560 }}>
        <p style={{ color: C.gold, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>
          Vantage · Foundations
        </p>
        <h1 style={{ ...display, fontSize: 40, fontWeight: 500, lineHeight: 1.15, marginBottom: 10 }}>
          What grade are you in?
        </h1>
        <p style={{ color: C.inkDim, fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          This sets up the right experience for you. 9th-11th graders start in Foundations;
          seniors go straight to college applications.
        </p>

        {checking ? (
          <p style={{ color: C.inkDim, fontSize: 14 }}>Loading…</p>
        ) : !authed ? (
          <div style={{ background: C.navyCard, border: `1px solid ${C.line}`, borderRadius: 12, padding: 24 }}>
            <p style={{ fontSize: 14, color: C.inkDim, marginBottom: 14 }}>
              Please log in first, then come back to this page.
            </p>
            <a href="/login" style={{ color: C.gold, fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>
              Go to login →
            </a>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {GRADES.map(({ g, label, note }) => (
              <button
                key={g}
                onClick={() => pick(g)}
                disabled={saving !== null}
                style={{
                  background: saving === g ? C.goldSoft : C.navyCard,
                  border: `1px solid ${saving === g ? C.gold : C.line}`,
                  borderRadius: 12,
                  padding: "18px 22px",
                  textAlign: "left",
                  color: C.ink,
                  cursor: saving === null ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <span style={{ ...display, fontSize: 22, fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 12, color: C.inkDim }}>
                  {saving === g ? "Saving…" : note}
                </span>
              </button>
            ))}
          </div>
        )}

        {error && (
          <p style={{ color: "#D4A89B", fontSize: 13, marginTop: 16 }}>{error}</p>
        )}
      </div>
    </div>
  );
}
