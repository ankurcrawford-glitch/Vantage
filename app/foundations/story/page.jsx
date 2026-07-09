'use client';

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import FoundationsNav from "@/components/FoundationsNav";
import { C, display, body } from "@/lib/foundations-theme";

// ─── Vantage Foundations — Story ─────────────────────────────────
// The payoff layer. Live, no mock data: shows what the Conversation and
// Activities add up to — the counselor's read on the student (their
// narrative_summary) and the narrative threads formed by grouping
// confirmed activities by theme. By senior year, the strongest threads
// become applications.



async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export default function FoundationsStory() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState("");
  const [threads, setThreads] = useState([]);
  const [openThread, setOpenThread] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // What the counselor sees (built from the Conversation).
        const { data: stats } = await supabase
          .from("user_stats")
          .select("narrative_summary")
          .eq("user_id", user.id)
          .maybeSingle();
        setSummary(stats?.narrative_summary || "");

        // Confirmed activities → group by thread to form narrative threads.
        const res = await fetch("/api/foundations/activities", { headers: await authHeaders() });
        const data = await res.json();
        const acts = (data.activities || []).filter((a) => a.confirmed);

        const byThread = {};
        for (const a of acts) {
          const key = (a.thread || "Other").trim() || "Other";
          (byThread[key] = byThread[key] || []).push(a);
        }
        const built = Object.entries(byThread).map(([name, items]) => {
          const maxDepth = Math.max(...items.map((i) => i.depth || 1));
          return {
            id: name,
            name,
            strength: items.length >= 2 || maxDepth >= 4 ? "Strong" : "Emerging",
            items,
            nextMove:
              items.map((i) => i.trajectory).filter(Boolean)[0] ||
              "Go deeper here — a leadership role or self-started project turns an interest into a thread.",
          };
        });
        // Strong threads first, then by number of activities.
        built.sort((a, b) =>
          (b.strength === "Strong") - (a.strength === "Strong") || b.items.length - a.items.length
        );
        setThreads(built);
        if (built[0]) setOpenThread(built[0].id);
      } catch {
        /* leave empty state */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const insight =
    summary ||
    "Your story will take shape here as you talk in your Conversation and your activities fill in. The threads that emerge are what colleges will one day remember you for.";

  return (
    <div style={{ ...body, background: C.navy, minHeight: "100vh", color: C.ink, width: "100%" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Montserrat:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <FoundationsNav />

      <main style={{ width: "100%", maxWidth: 1024, margin: "0 auto", padding: "40px clamp(16px, 4vw, 48px)", boxSizing: "border-box" }}>
        {/* ── Header ── */}
        <div className="mb-10">
          <p style={{ color: C.gold, fontSize: 11, letterSpacing: 3 }} className="uppercase mb-2">
            Foundations · Story
          </p>
          <h1 style={{ ...display, fontSize: 44, fontWeight: 500, lineHeight: 1.1 }}>
            Your story so far
          </h1>
          <p style={{ color: C.inkDim, fontSize: 14, marginTop: 8, maxWidth: 560, lineHeight: 1.7 }}>
            This is the picture forming from your Conversation and Activities — the threads that,
            by senior year, become your applications. It grows every time you talk or add something.
          </p>
        </div>

        {/* ── What your counselor sees ── */}
        <div style={{ background: C.goldSoft, border: `1px solid ${C.gold}`, borderRadius: 12 }} className="p-7 mb-10">
          <p style={{ fontSize: 11, letterSpacing: 2, color: C.gold }} className="uppercase mb-3">
            What your counselor sees
          </p>
          <p style={{ ...display, fontSize: 21, fontStyle: "italic", fontWeight: 500, lineHeight: 1.55 }}>
            {insight}
          </p>
        </div>

        {/* ── Threads ── */}
        <div className="space-y-5">
          {loading && (
            <p style={{ color: C.inkDim, fontSize: 14 }}>Reading your story…</p>
          )}

          {!loading && threads.length === 0 && (
            <div style={{ border: `1px dashed ${C.line}`, borderRadius: 12, color: C.inkDim }} className="p-6">
              <p style={{ fontSize: 14, lineHeight: 1.7 }}>
                No threads yet. Talk about what you do in your{" "}
                <span style={{ color: C.gold }}>Conversation</span>, confirm the activities it
                surfaces, and they'll group into threads right here.
              </p>
            </div>
          )}

          {threads.map((t) => {
            const open = openThread === t.id;
            return (
              <div key={t.id} style={{ background: C.navyCard, border: `1px solid ${open ? C.gold : C.line}`, borderRadius: 12, transition: "border-color 0.2s" }}>
                <button onClick={() => setOpenThread(open ? null : t.id)} className="w-full p-6 flex items-center justify-between text-left">
                  <div className="flex items-center gap-4">
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: t.strength === "Strong" ? C.gold : "transparent", border: `1.5px solid ${C.gold}` }} />
                    <div>
                      <p style={{ ...display, fontSize: 24, fontWeight: 600 }}>{t.name}</p>
                      <p style={{ fontSize: 10.5, letterSpacing: 1.5, color: C.gold }} className="uppercase">
                        {t.strength} thread · {t.items.length} {t.items.length === 1 ? "activity" : "activities"}
                      </p>
                    </div>
                  </div>
                  <span style={{ color: C.inkDim, fontSize: 18 }}>{open ? "−" : "+"}</span>
                </button>

                {open && (
                  <div className="px-6 pb-6">
                    <p style={{ fontSize: 11, letterSpacing: 2, color: C.inkDim }} className="uppercase mb-3">
                      What's in this thread
                    </p>
                    <div className="space-y-2 mb-6">
                      {t.items.map((a) => (
                        <div key={a.id} style={{ background: C.navyRaised, border: `1px solid ${C.line}`, borderRadius: 8 }} className="px-4 py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</span>
                            {a.role && <span style={{ fontSize: 11, color: C.inkDim }}>{a.role}</span>}
                          </div>
                          {a.since && <span style={{ fontSize: 11, color: C.inkDim, whiteSpace: "nowrap" }}>since {a.since}</span>}
                        </div>
                      ))}
                    </div>

                    <div style={{ borderLeft: `2px solid ${C.gold}`, paddingLeft: 16 }}>
                      <p style={{ fontSize: 10.5, letterSpacing: 2, color: C.gold }} className="uppercase mb-1">
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
      </main>
    </div>
  );
}
