'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Button from './Button';

export default function Navigation() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 bg-midnight/98 backdrop-blur-sm" style={{ background: 'rgba(11, 22, 35, 0.98)', backdropFilter: 'blur(8px)' }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <span className="font-heading text-2xl font-semibold" style={{ color: 'white' }}>VANTAGE</span>
          <span className="text-2xl" style={{ color: '#D4AF37' }}>.</span>
        </Link>
        <div className="flex items-center gap-4">
          {loading ? (
            <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading...</span>
          ) : user ? (
            <>
              <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>Dashboard</Link>
              <Link href="/colleges" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>Portfolio</Link>
              <Link href="/personal-statement" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>Essays</Link>
              <Link href="/profile" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>Profile</Link>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  color: '#D4AF37',
                  border: '1px solid rgba(212,175,55,0.5)',
                  padding: '8px 16px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(212,175,55,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="secondary">Client Access</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}