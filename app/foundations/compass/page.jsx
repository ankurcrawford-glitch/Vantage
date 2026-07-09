'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import FoundationsNav from "@/components/FoundationsNav";
import { C, display, body } from "@/lib/foundations-theme";

// ─── Vantage Foundations — Compass (home) ────────────────────────
// The landing page for every Foundations student. No mock data:
// everything shown is live — conversation status, activities to review,
// roadmap progress. Primary action: continue the Conversation.



const gradeThemes = { 9: "Explore", 10: "Deepen", 11: "Lead" };

export default function FoundationsCompass() {
  const router = useRouter();
  const [grade, setGrade] = useState(null);
  const [convoCount, setConvoCount] = useState(null); // user messages in conversation
  const [toReview, setToReview] = useState(0); // unconfirmed activity suggestions
  const [activityCount, setActivityCount] = useState(0);
  const [roadmapDone, setRoadmapDone] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }
        // All reads are RLS "select own" — safe from the client.
        const [stats, convo, acts, prog] = await Promise.all([
          supabase.from("user_stats").select("grade").eq("user_id", user.id).maybeSingle(),
          supabase.from("conversation_messages").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("role", "user"),
          supabase.from("foundations_activities").select("confirmed").eq("user_id", user.id),
          supabase.from("roadmap_progress").select("item_key").eq("user_id", user.id),
        ]);
        if (typeof stats.data?.grade === "number") setGrade(stats.data.grade);
        setConvoCount(convo.count ?? 0);
        const list = acts.data || [];
        setToReview(list.filter((a) => !a.confirmed).length);
        setActivityCount(list.filter((a) => a.confirmed).length);
        const g = stats.data?.grade;
        setRoadmapDone(
          (prog.data || []).filter((p) => (g ? p.item_key.startsWith(`${g}-`) : true)).length
        );
      } catch {
        setConvoCount(0); // fail open — page still renders with CTAs
      }
    })();
  }, [router]);

  const card = (title, sub, href, badge) => (
    <button
      onClick={() => router.push(href)}
      style={{ background: C.navyCard, border: `1px solid ${C.line}`, borderRadius: 12, textAlign: "left", cursor: "pointer", position: "relative" }}
      className="p-6 hover:border-[#C5A56A] transition-colors"
    >
      {badge && (
        <span
          style={{ position: "absolute", top: 16, right: 16, fontSize: 9.5, letterSpacing: 1.2, background: C.gold, color: C.navy, borderRadius: 4, padding: "3px 8px" }}
          className="uppercase"
        >
          {badge}
        </span>
      )}
      <p style={{ ...display, fontSize: 24, fontWeight: 600, marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: 13, color: C.inkDim, lineHeight: 1.65 }}>{sub}</p>
    </button>
  );

  const started = (convoCount ?? 0) > 0;

  return (
    <div style={{ ...body, background: C.navy, minHeight: "100vh", color: C.ink, width: "100%" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Montserrat:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <FoundationsNav />

      <main style={{ width: "100%", maxWidth: 1024, margin: "0 auto", padding: "40px clamp(16px, 4vw, 48px)", boxSizing: "border-box" }}>
        {/* ── Greeting ── */}
        <div className="mb-10">
          <p style={{ color: C.inkDim, fontSize: 12, letterSpacing: 2 }} className="uppercase mb-2">
            {grade ? `Grade ${grade} · ${gradeThemes[grade] || ""}` : "Welcome"}
          </p>
          <h1 style={{ ...display, fontSize: 44, fontWeight: 500, lineHeight: 1.15, maxWidth: 640 }}>
            {started ? "Welcome back." : "This is where it starts."}
          </h1>
          <p style={{ color: C.inkDim, fontSize: 14, marginTop: 10, maxWidth: 560, lineHeight: 1.7 }}>
            {started
              ? "Pick up your conversation, check your roadmap, or review what we've learned about you so far."
              : "Before plans and lists, we get to know you — who you are, what you love, and where you dream of going. Everything else builds from that."}
          </p>
        </div>

        {/* ── Primary: the Conversation ── */}
        <button
          onClick={() => router.push("/foundations/conversation")}
          style={{ background: C.goldSoft, border: `1px solid ${C.gold}`, borderRadius: 12, textAlign: "left", cursor: "pointer", width: "100%" }}
          className="p-7 mb-8 hover:bg-[rgba(197,165,106,0.18)] transition-colors block"
        >
          <p style={{ fontSize: 11, letterSpacing: 2, color: C.gold }} className="uppercase mb-2">
            {started ? "Continue your conversation" : "Start here"}
          </p>
          <p style={{ ...display, fontSize: 28, fontWeight: 600, marginBottom: 8 }}>
            {started ? "Your counselor is ready to keep talking →" : "Let's get to know you →"}
          </p>
          <p style={{ fontSize: 13.5, color: C.inkDim, lineHeight: 1.65, maxWidth: 560 }}>
            {started
              ? "We pick up exactly where you left off. The more you share, the more everything here is built around you."
              : "A real conversation — your dream school, what you love, what you do after school. No wrong answers, and you can come back anytime."}
          </p>
        </button>

        {/* ── Secondary cards ── */}
        <div className="grid md:grid-cols-3 gap-4">
          {card(
            "Activities",
            activityCount > 0
              ? `${activityCount} tracked. Depth over breadth — keep going.`
              : "What you do outside class. Mention things in your conversation and they appear here.",
            "/foundations/activities",
            toReview > 0 ? `${toReview} to review` : null
          )}
          {card(
            "Roadmap",
            grade
              ? `Your grade ${grade} plan — ${roadmapDone} item${roadmapDone === 1 ? "" : "s"} checked off.`
              : "The four-year plan: courses, testing, summers — nothing sneaks up on you.",
            "/foundations/roadmap"
          )}
          {card(
            "Counselor",
            "Quick questions, straight answers — SAT vs ACT, rec letters, summer plans.",
            "/foundations/counselor"
          )}
        </div>
      </main>
    </div>
  );
}
