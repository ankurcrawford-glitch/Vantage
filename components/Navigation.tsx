'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Button from './Button';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
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

  // Determine which page is active
  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    if (path === '/applications') {
      return (
        pathname.startsWith('/personal-statement') ||
        pathname.startsWith('/essays') ||
        pathname.startsWith('/common-app')
      );
    }
    if (path === '/profile') return pathname === '/profile';
    if (path === '/discovery') return pathname === '/discovery';
    if (path === '/colleges') return pathname.startsWith('/colleges');
    return false;
  };

  const getLinkStyle = (path: string) => {
    const active = isActive(path);
    return {
      color: active ? '#E8DDC9' : 'rgba(232,221,201,0.7)',
      textDecoration: 'none',
      fontSize: '14px',
      fontFamily: 'var(--font-body)',
      fontWeight: active ? 600 : 400,
    };
  };

  return (
    <nav style={{ borderBottom: '1px solid rgba(232,221,201,0.1)', padding: '24px 32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={user ? "/dashboard" : "/"} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <span className="font-heading text-2xl font-semibold" style={{ color: '#E8DDC9' }}>VANTAGE</span>
          <span className="text-2xl" style={{ color: '#C9A977' }}>.</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {loading ? (
            <span style={{ color: 'rgba(232,221,201,0.5)', fontSize: '14px' }}>Loading...</span>
          ) : user ? (
            <>
              <Link href="/discovery" style={getLinkStyle('/discovery')}>Story Builder</Link>
              <Link href="/personal-statement" style={getLinkStyle('/applications')}>Applications</Link>
              <Link href="/colleges" style={getLinkStyle('/colleges')}>My Schools</Link>
              <Link href="/profile" style={getLinkStyle('/profile')}>Profile</Link>
              <Link href="/dashboard" style={getLinkStyle('/dashboard')}>Dashboard</Link>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  color: 'rgba(232,221,201,0.7)',
                  border: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#E8DDC9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(232,221,201,0.7)';
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