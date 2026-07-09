'use client';

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import FoundationsNav from "@/components/FoundationsNav";
import { C, display, body } from "@/lib/foundations-theme";

// ─── Vantage Foundations — Spark ─────────────────────────────────
// Monthly reflection ritual, wired to /api/foundations/spark. Each
// entry banks raw material that becomes essay gold in senior year.

export default function FoundationsSpark() {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [spark, setSpark] = useState({ month: "", prompt: "", hint: "" });
  const [archive, setArchive] = useState([]);
  const [bankCount, setBankCount] = useState(0);
  const [error, setError] = useState("");

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session ? { Authorization: `Bearer ${session.access_token}` } : {};
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/foundations/spark", { headers: await authHeaders() });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setSpark({ month: data.month, prompt: data.prompt, hint: data.hint });
        setArchive(Array.isArray(data.archive) ? data.archive : []);
        setBankCount(data.bankCount || 0);
        setSaved(Boolean(data.banked));
      } catch {
        setError("Couldn't load this month's spark. Refresh to try again.");
      } finally {
        setHydrated(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    const content = draft.trim();
    if (!content || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/foundations/spark", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSaved(true);
      setBankCount((n) => n + 1);
      setArchive((a) => [
        {
          month: spark.month,
          prompt: spark.prompt,
          excerpt: content.length > 180 ? content.slice(0, 180).trimEnd() + "…" : content,
          threads: [],
        },
        ...a,
      ]);
    } catch {
      setError("Couldn't save just now — your writing is still here. Try again in a moment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ ...body, background: C.navy, minHeight: "100vh", color: C.ink, width: "100%" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Montserrat:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <FoundationsNav />

      <main
        className="px-6 md:px-12 py-10 max-w-3xl mx-auto"
        style={{ width: "100%", maxWidth: 768, margin: "0 auto", padding: "40px clamp(16px, 4vw, 48px)", boxSizing: "border-box" }}
      >
        {/* ── Header ── */}
        <div className="mb-10">
          <p style={{ color: C.gold, fontSize: 11, letterSpacing: 3 }} className="uppercase mb-2">
            Foundations · Spark
          </p>
          <h1 style={{ ...display, fontSize: 44, fontWeight: 500, lineHeight: 1.1 }}>
            This month's spark
          </h1>
          <p style={{ color: C.inkDim, fontSize: 14, marginTop: 8, lineHeight: 1.7 }}>
            One honest reflection a month. By senior year you'll have a vault of real
            material no prompt can scare — {bankCount} {bankCount === 1 ? "entry" : "entries"} banked so far.
          </p>
        </div>

        {/* ── Current prompt ── */}
        <div style={{ background: C.goldSoft, border: `1px solid ${C.gold}`, borderRadius: 12 }} className="p-8 mb-6">
          <p style={{ fontSize: 11, letterSpacing: 2, color: C.gold }} className="uppercase mb-4">
            {hydrated ? spark.month : "…"}
          </p>
          <p style={{ ...display, fontSize: 28, fontStyle: "italic", fontWeight: 500, lineHeight: 1.4, marginBottom: 10 }}>
            {hydrated ? spark.prompt : "Loading this month's prompt…"}
          </p>
          <p style={{ fontSize: 12.5, color: C.inkDim }}>{spark.hint}</p>
        </div>

        {error && (
          <p style={{ color: "#F87171", fontSize: 13, marginBottom: 16 }}>{error}</p>
        )}

        {/* ── Writing area ── */}
        {!saved ? (
          <>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Start anywhere. The middle is fine."
              rows={9}
              style={{
                width: "100%",
                background: C.navyCard,
                border: `1px solid ${C.line}`,
                borderRadius: 12,
                color: C.ink,
                fontSize: 15,
                lineHeight: 1.8,
                padding: 24,
                resize: "vertical",
                outline: "none",
                ...display,
              }}
              className="focus:border-[#C9A977] mb-4"
            />
            <div className="flex items-center justify-between mb-12">
              <span style={{ fontSize: 11, color: C.inkDim }}>
                {draft.trim() ? `${draft.trim().split(/\s+/).length} words` : "Just for you — never graded."}
              </span>
              <button
                onClick={save}
                disabled={!draft.trim() || saving}
                style={{
                  background: draft.trim() ? C.gold : "transparent",
                  color: draft.trim() ? C.navy : C.inkDim,
                  border: `1px solid ${draft.trim() ? C.gold : C.line}`,
                  fontSize: 12,
                  letterSpacing: 1.5,
                  borderRadius: 8,
                  cursor: draft.trim() && !saving ? "pointer" : "default",
                }}
                className="uppercase px-8 py-3 transition-colors"
              >
                {saving ? "Banking…" : "Bank this reflection"}
              </button>
            </div>
          </>
        ) : (
          <div style={{ background: C.navyCard, border: `1px solid ${C.gold}`, borderRadius: 12 }} className="p-8 mb-12 text-center">
            <p style={{ ...display, fontSize: 24, fontWeight: 600, color: C.gold, marginBottom: 6 }}>
              Banked.
            </p>
            <p style={{ fontSize: 13, color: C.inkDim }}>
              This month's reflection is in your vault. A new spark lands on the 1st.
            </p>
          </div>
        )}

        {/* ── Archive ── */}
        <p style={{ fontSize: 11, letterSpacing: 2, color: C.inkDim }} className="uppercase mb-4">
          Your vault
        </p>
        <div className="space-y-3">
          {hydrated && archive.length === 0 && (
            <p style={{ color: C.inkDim, fontSize: 14, lineHeight: 1.7 }}>
              No past reflections yet. Your saved reflections will collect here.
            </p>
          )}
          {archive.map((a, i) => (
            <div key={`${a.month}-${i}`} style={{ background: C.navyCard, border: `1px solid ${C.line}`, borderRadius: 12 }} className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p style={{ fontSize: 11, letterSpacing: 2, color: C.gold }} className="uppercase">
                  {a.month}
                </p>
                <div className="flex gap-2">
                  {(a.threads || []).map((t) => (
                    <span
                      key={t}
                      style={{ fontSize: 9, letterSpacing: 1, color: C.inkDim, border: `1px solid ${C.line}`, borderRadius: 4, padding: "2px 7px" }}
                      className="uppercase"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <p style={{ ...display, fontSize: 17, fontStyle: "italic", marginBottom: 8 }}>{a.prompt}</p>
              <p style={{ fontSize: 13, color: C.inkDim, lineHeight: 1.7 }}>{a.excerpt}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
