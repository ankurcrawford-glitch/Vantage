'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';

// ─── Vantage — admin: support inbox ──────────────────────────────
// Tiny triage view at /admin/support so nothing slips. Server route
// enforces admin (SUPPORT_ADMIN_EMAILS); non-admins get bounced.

interface Req {
  id: string;
  email: string;
  message: string;
  page: string | null;
  status: string;
  created_at: string;
}

export default function AdminSupportPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session ? { Authorization: `Bearer ${session.access_token}` } : {};
  };

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace('/login'); return; }
        const res = await fetch('/api/admin/support-requests', { headers: await authHeaders() });
        if (res.status === 403) { setDenied(true); return; }
        const data = await res.json();
        setRequests(Array.isArray(data.requests) ? data.requests : []);
      } catch { /* leave empty */ }
      finally { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setStatus = async (id: string, status: 'open' | 'closed') => {
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await fetch('/api/admin/support-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ id, status }),
      });
    } catch { /* optimistic; refresh will correct */ }
  };

  const openCount = requests.filter((r) => r.status === 'open').length;

  if (denied) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1320' }}>
        <p className="font-body" style={{ color: 'rgba(232,221,201,0.68)' }}>This page is for the Vantage team.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0B1320' }}>
      <Navigation />
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <h1 className="font-heading text-4xl mb-2" style={{ color: '#E8DDC9' }}>Support inbox</h1>
        <p className="font-body text-sm mb-8" style={{ color: 'rgba(232,221,201,0.45)' }}>
          {loading ? 'Loading…' : `${openCount} open · ${requests.length - openCount} closed`}
        </p>

        {!loading && requests.length === 0 && (
          <p className="font-body" style={{ color: 'rgba(232,221,201,0.68)' }}>
            Nothing yet — requests from the "Need help?" widget will collect here.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requests.map((r) => (
            <div
              key={r.id}
              style={{
                background: '#101a2b',
                border: `1px solid ${r.status === 'open' ? 'rgba(212,162,78,0.4)' : 'rgba(232,221,201,0.12)'}`,
                borderRadius: '10px',
                padding: '16px 20px',
                opacity: r.status === 'closed' ? 0.6 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span className="font-body text-sm" style={{ color: '#C9A977', fontWeight: 600 }}>
                  {r.email}
                </span>
                <span className="font-body text-xs" style={{ color: 'rgba(232,221,201,0.45)' }}>
                  {new Date(r.created_at).toLocaleString()} {r.page ? `· ${r.page}` : ''}
                </span>
              </div>
              <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.68)', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: '0 0 12px' }}>
                {r.message}
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={`mailto:${r.email}?subject=${encodeURIComponent('Re: your Vantage support request')}`}
                  className="font-body"
                  style={{ fontSize: '12px', color: '#C9A977', textDecoration: 'underline' }}
                >
                  Reply
                </a>
                <button
                  onClick={() => setStatus(r.id, r.status === 'open' ? 'closed' : 'open')}
                  className="font-body"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(232,221,201,0.12)',
                    borderRadius: '999px',
                    color: r.status === 'open' ? '#8FB89A' : 'rgba(232,221,201,0.45)',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '3px 12px',
                    cursor: 'pointer',
                  }}
                >
                  {r.status === 'open' ? 'Mark closed' : 'Reopen'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
