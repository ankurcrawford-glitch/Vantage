'use client';

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import FoundationsNav from "@/components/FoundationsNav";
import { C, display, body } from "@/lib/foundations-theme";

// ─── Vantage Foundations — Activities ────────────────────────────
// Live tracker wired to /api/foundations/activities. The Conversation
// auto-suggests activities it hears about (shown as "From your
// conversation" until the student confirms, edits, or removes them).
// Students can also add and edit activities directly.



const depthLabels = ["", "Tried it", "Committed", "Deep", "Leading", "Defining"];
const EMPTY_FORM = { name: "", role: "", since: "", hours: "", depth: 1, thread: "", trajectory: "" };

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

export default function FoundationsActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null); // null | {id?, ...fields}
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/foundations/activities", { headers: await authHeaders() });
        const data = await res.json();
        if (Array.isArray(data.activities)) setActivities(data.activities);
      } catch {
        setError("Couldn't load your activities. Refresh to try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const confirm = async (id) => {
    setActivities((as) => as.map((a) => (a.id === id ? { ...a, confirmed: true } : a)));
    try {
      await fetch("/api/foundations/activities", {
        method: "PATCH",
        headers: await authHeaders(),
        body: JSON.stringify({ id, confirmOnly: true }),
      });
    } catch { /* optimistic; reload will reconcile */ }
  };

  const remove = async (id) => {
    setActivities((as) => as.filter((a) => a.id !== id));
    try {
      await fetch("/api/foundations/activities", {
        method: "DELETE",
        headers: await authHeaders(),
        body: JSON.stringify({ id }),
      });
    } catch { /* optimistic */ }
  };

  const saveForm = async () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/foundations/activities", {
        method: form.id ? "PATCH" : "POST",
        headers: await authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setActivities((as) =>
        form.id ? as.map((a) => (a.id === form.id ? data.activity : a)) : [...as, data.activity]
      );
      setForm(null);
    } catch {
      setError("Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const suggested = activities.filter((a) => !a.confirmed);
  const confirmed = activities.filter((a) => a.confirmed);

  const field = (label, key, placeholder, props = {}) => (
    <div style={{ flex: 1, minWidth: 140 }}>
      <p style={{ fontSize: 10, letterSpacing: 1.5, color: C.inkDim }} className="uppercase mb-1">{label}</p>
      <input
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{
          width: "100%", background: C.navyRaised, border: `1px solid ${C.line}`,
          borderRadius: 8, color: C.ink, fontSize: 13, padding: "10px 12px",
          outline: "none", boxSizing: "border-box",
        }}
        {...props}
      />
    </div>
  );

  return (
    <div style={{ ...body, background: C.navy, minHeight: "100vh", color: C.ink, width: "100%" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Montserrat:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <FoundationsNav />

      <main style={{ width: "100%", maxWidth: 1024, margin: "0 auto", padding: "40px clamp(16px, 4vw, 48px)", boxSizing: "border-box" }}>
        {/* ── Header ── */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p style={{ color: C.gold, fontSize: 11, letterSpacing: 3 }} className="uppercase mb-2">
              Foundations · Activities
            </p>
            <h1 style={{ ...display, fontSize: 44, fontWeight: 500, lineHeight: 1.1 }}>
              Depth over breadth
            </h1>
          </div>
          <button
            onClick={() => { setForm({ ...EMPTY_FORM }); setSelected(null); }}
            style={{ border: `1px solid ${C.gold}`, color: C.gold, fontSize: 12, letterSpacing: 1.5, borderRadius: 8 }}
            className="uppercase px-6 py-3 hover:bg-white/5 transition-colors self-start"
          >
            + Add activity
          </button>
        </div>

        {error && (
          <p style={{ color: "#C97777", fontSize: 13 }} className="mb-6">{error}</p>
        )}

        {/* ── Add / Edit form ── */}
        {form && (
          <div style={{ background: C.navyCard, border: `1px solid ${C.gold}`, borderRadius: 12 }} className="p-6 mb-8">
            <p style={{ fontSize: 11, letterSpacing: 2, color: C.gold }} className="uppercase mb-4">
              {form.id ? "Edit activity" : "New activity"}
            </p>
            <div className="flex flex-wrap gap-3 mb-3">
              {field("Name", "name", "e.g. Varsity Soccer")}
              {field("Your role", "role", "e.g. Goalie, First chair")}
              {field("Since", "since", "e.g. 8th grade")}
              {field("Hours / week", "hours", "e.g. 6")}
            </div>
            <div className="flex flex-wrap gap-3 mb-3 items-end">
              <div style={{ minWidth: 220 }}>
                <p style={{ fontSize: 10, letterSpacing: 1.5, color: C.inkDim }} className="uppercase mb-1">Depth</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setForm((f) => ({ ...f, depth: n }))}
                      style={{
                        padding: "6px 10px", borderRadius: 6, fontSize: 11,
                        background: form.depth === n ? C.gold : "transparent",
                        color: form.depth === n ? C.navy : C.inkDim,
                        border: `1px solid ${form.depth === n ? C.gold : C.line}`,
                      }}
                    >
                      {depthLabels[n]}
                    </button>
                  ))}
                </div>
              </div>
              {field("Thread", "thread", "e.g. Building things")}
            </div>
            <p style={{ fontSize: 10, letterSpacing: 1.5, color: C.inkDim }} className="uppercase mb-1">Where could this go next?</p>
            <textarea
              value={form.trajectory}
              onChange={(e) => setForm((f) => ({ ...f, trajectory: e.target.value }))}
              placeholder="Optional — e.g. Try out for captain next season"
              rows={2}
              style={{
                width: "100%", background: C.navyRaised, border: `1px solid ${C.line}`,
                borderRadius: 8, color: C.ink, fontSize: 13, padding: "10px 12px",
                outline: "none", boxSizing: "border-box", resize: "vertical",
              }}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={saveForm}
                disabled={!form.name.trim() || saving}
                style={{
                  background: form.name.trim() && !saving ? C.gold : "transparent",
                  color: form.name.trim() && !saving ? C.navy : C.inkDim,
                  border: `1px solid ${form.name.trim() && !saving ? C.gold : C.line}`,
                  fontSize: 12, letterSpacing: 1.5, borderRadius: 8,
                }}
                className="uppercase px-6 py-2.5"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => setForm(null)}
                style={{ background: "transparent", color: C.inkDim, border: `1px solid ${C.line}`, fontSize: 12, letterSpacing: 1.5, borderRadius: 8 }}
                className="uppercase px-6 py-2.5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Suggestions from the Conversation ── */}
        {suggested.length > 0 && (
          <div className="mb-10">
            <p style={{ fontSize: 11, letterSpacing: 2, color: C.gold }} className="uppercase mb-2">
              From your conversation
            </p>
            <p style={{ fontSize: 13, color: C.inkDim, marginBottom: 16 }}>
              You mentioned these while we talked. Confirm what's right, fix what's off, remove what isn't you.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {suggested.map((a) => (
                <div
                  key={a.id}
                  style={{ background: C.goldSoft, border: `1px dashed ${C.gold}`, borderRadius: 12 }}
                  className="p-6"
                >
                  <p style={{ ...display, fontSize: 22, fontWeight: 600 }}>{a.name}</p>
                  <p style={{ fontSize: 12, color: C.inkDim, marginBottom: 12 }}>
                    {[a.role, a.since && `since ${a.since}`, a.hours && `${a.hours} hrs/wk`].filter(Boolean).join(" · ")}
                  </p>
                  {a.thread && (
                    <span style={{ fontSize: 9.5, letterSpacing: 1.2, color: C.inkDim, border: `1px solid ${C.line}`, borderRadius: 4, padding: "3px 8px" }} className="uppercase">
                      → {a.thread}
                    </span>
                  )}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => confirm(a.id)}
                      style={{ background: C.gold, color: C.navy, border: "none", fontSize: 11, letterSpacing: 1.2, borderRadius: 7 }}
                      className="uppercase px-4 py-2"
                    >
                      ✓ Looks right
                    </button>
                    <button
                      onClick={() => { setForm({ id: a.id, name: a.name, role: a.role, since: a.since, hours: a.hours, depth: a.depth, thread: a.thread, trajectory: a.trajectory }); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      style={{ background: "transparent", color: C.ink, border: `1px solid ${C.line}`, fontSize: 11, letterSpacing: 1.2, borderRadius: 7 }}
                      className="uppercase px-4 py-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(a.id)}
                      style={{ background: "transparent", color: C.inkDim, border: `1px solid ${C.line}`, fontSize: 11, letterSpacing: 1.2, borderRadius: 7 }}
                      className="uppercase px-4 py-2"
                    >
                      Not me
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Confirmed activity cards ── */}
        <div className="grid md:grid-cols-2 gap-4">
          {loading && (
            <p style={{ color: C.inkDim, fontSize: 14 }} className="md:col-span-2">Loading your activities…</p>
          )}
          {!loading && confirmed.length === 0 && suggested.length === 0 && (
            <p style={{ color: C.inkDim, fontSize: 14, lineHeight: 1.7 }} className="md:col-span-2">
              No activities yet. Add one here — or just talk about what you do in your Conversation, and they'll show up.
            </p>
          )}
          {confirmed.map((a) => {
            const open = selected === a.id;
            return (
              <div
                key={a.id}
                onClick={() => setSelected(open ? null : a.id)}
                style={{ background: C.navyCard, border: `1px solid ${open ? C.gold : C.line}`, borderRadius: 12, textAlign: "left", cursor: "pointer" }}
                className="p-6 transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <p style={{ ...display, fontSize: 22, fontWeight: 600 }}>{a.name}</p>
                  {a.hours && (
                    <span style={{ fontSize: 11, color: C.inkDim, whiteSpace: "nowrap" }}>{a.hours} hrs</span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: C.inkDim, marginBottom: 14 }}>
                  {[a.role, a.since && `since ${a.since}`].filter(Boolean).join(" · ")}
                </p>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} style={{ width: 18, height: 4, borderRadius: 2, background: n <= a.depth ? C.gold : "rgba(255,255,255,0.08)" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 10, letterSpacing: 1.5, color: C.gold }} className="uppercase">
                    {depthLabels[a.depth]}
                  </span>
                </div>

                {a.thread && (
                  <span style={{ fontSize: 9.5, letterSpacing: 1.2, color: C.inkDim, border: `1px solid ${C.line}`, borderRadius: 4, padding: "3px 8px" }} className="uppercase">
                    → {a.thread}
                  </span>
                )}

                {open && (
                  <div style={{ borderLeft: `2px solid ${C.gold}`, paddingLeft: 14, marginTop: 16 }}>
                    {a.trajectory && (
                      <>
                        <p style={{ fontSize: 10.5, letterSpacing: 2, color: C.gold }} className="uppercase mb-1">Trajectory</p>
                        <p style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 12 }}>{a.trajectory}</p>
                      </>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setForm({ id: a.id, name: a.name, role: a.role, since: a.since, hours: a.hours, depth: a.depth, thread: a.thread, trajectory: a.trajectory }); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        style={{ background: "transparent", color: C.ink, border: `1px solid ${C.line}`, fontSize: 11, letterSpacing: 1.2, borderRadius: 7 }}
                        className="uppercase px-4 py-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); remove(a.id); }}
                        style={{ background: "transparent", color: C.inkDim, border: `1px solid ${C.line}`, fontSize: 11, letterSpacing: 1.2, borderRadius: 7 }}
                        className="uppercase px-4 py-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* The self-initiated slot — opens the form with a nudge prefilled */}
          <button
            onClick={() => {
              setForm({ ...EMPTY_FORM, role: "Founder", depth: 1, thread: "Self-started" });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            style={{ border: `1px dashed ${C.gold}`, borderRadius: 12, background: "transparent", textAlign: "left", cursor: "pointer" }}
            className="p-6 flex flex-col justify-center hover:bg-[rgba(197,165,106,0.08)] transition-colors"
          >
            <p style={{ ...display, fontSize: 22, fontWeight: 600, color: C.gold, marginBottom: 6 }}>
              + The one you start yourself
            </p>
            <p style={{ fontSize: 12.5, color: C.inkDim, lineHeight: 1.65 }}>
              Tap to add it. Every great application has one thing the student built, not joined —
              a club, a project, a fundraiser, a small business. Start it here.
            </p>
          </button>
        </div>
      </main>
    </div>
  );
}
