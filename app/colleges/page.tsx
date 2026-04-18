'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Button from '@/components/Button';
import Card from '@/components/Card';

interface College {
  id: string;
  name: string;
  location: string;
  acceptance_rate?: number | null;
  sat_range_low?: number | null;
  sat_range_high?: number | null;
  deadline_rd?: string | null;
}

export default function CollegesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [colleges, setColleges] = useState<College[]>([]);
  const [userColleges, setUserColleges] = useState<string[]>([]);
  const [collegesWithPrompts, setCollegesWithPrompts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkAuth();
    loadColleges();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  };

  const loadColleges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all colleges
      const { data: collegesData, error } = await supabase
        .from('colleges')
        .select('*')
        .order('name');

      if (error) {
        console.error('Supabase error:', error);
        return;
      }

      if (collegesData) {
        // Exclude Common App — it's only for essay FK, not a real portfolio college
        setColleges(collegesData.filter((c: College) => c.id !== 'a0000000-0000-0000-0000-000000000000'));
      }

      // Load user's colleges
      const { data: userCollegesData } = await supabase
        .from('user_colleges')
        .select('college_id')
        .eq('user_id', user.id);

      if (userCollegesData) {
        setUserColleges(userCollegesData.map(uc => uc.college_id));
      }

      // Load which colleges have prompts
      const { data: promptColleges } = await supabase
        .from('college_prompts')
        .select('college_id');

      if (promptColleges) {
        setCollegesWithPrompts(new Set(promptColleges.map(p => p.college_id)));
      }
    } catch (error) {
      console.error('Error loading colleges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollege = async (collegeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_colleges')
        .insert({
          user_id: user.id,
          college_id: collegeId,
        });

      if (error) {
        console.error('Error adding college:', error);
        return;
      }

      setUserColleges([...userColleges, collegeId]);
    } catch (error) {
      console.error('Error adding college:', error);
    }
  };

  const handleRemoveCollege = async (collegeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_colleges')
        .delete()
        .eq('user_id', user.id)
        .eq('college_id', collegeId);

      if (error) {
        console.error('Error removing college:', error);
        return;
      }

      setUserColleges(userColleges.filter(id => id !== collegeId));
    } catch (error) {
      console.error('Error removing college:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const filteredColleges = colleges.filter((college) =>
    college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    college.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const userCollegesList = colleges.filter((c) => userColleges.includes(c.id));
  const availableColleges = filteredColleges.filter((c) => !userColleges.includes(c.id));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1623' }}>
        <div style={{ color: '#D4AF37', fontFamily: 'var(--font-body)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0B1623' }}>
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '24px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <span className="font-heading text-2xl font-semibold" style={{ color: 'white' }}>VANTAGE</span>
            <span className="text-2xl" style={{ color: '#D4AF37' }}>.</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link href="/dashboard" style={{ color: pathname === '/dashboard' ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: pathname === '/dashboard' ? 600 : 400 }}>Dashboard</Link>
            <Link href="/personal-statement" style={{ color: (pathname.startsWith('/personal-statement') || pathname.startsWith('/essays')) ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: (pathname.startsWith('/personal-statement') || pathname.startsWith('/essays')) ? 600 : 400 }}>Essays</Link>
            <Link href="/common-app" style={{ color: pathname.startsWith('/common-app') ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: pathname.startsWith('/common-app') ? 600 : 400 }}>Common App</Link>
            <Link href="/colleges" style={{ color: pathname.startsWith('/colleges') ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: pathname.startsWith('/colleges') ? 600 : 400 }}>Portfolio</Link>
            <Link href="/profile" style={{ color: pathname === '/profile' ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: pathname === '/profile' ? 600 : 400 }}>Profile</Link>
            <Link href="/discovery" style={{ color: pathname === '/discovery' ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: pathname === '/discovery' ? 600 : 400 }}>Insight Questions</Link>
            <button onClick={handleLogout} style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer', padding: 0 }} onMouseEnter={(e) => { e.currentTarget.style.color = '#F3E5AB'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}>Logout</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ marginBottom: '48px' }}>
          <h1 className="font-heading text-5xl mb-4" style={{ color: 'white' }}>College Portfolio</h1>
          <p className="font-body text-lg" style={{ color: '#F3E5AB' }}>Build your list of target schools</p>
        </div>

        {/* 2025 Questions Disclaimer Banner */}
        <div style={{
          background: 'rgba(212, 175, 55, 0.1)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderLeft: '4px solid #D4AF37',
          padding: '16px 24px',
          marginBottom: '32px',
          borderRadius: '4px',
        }}>
          <p className="font-body text-sm" style={{ color: '#F3E5AB', lineHeight: '1.6', margin: 0 }}>
            <strong style={{ color: '#D4AF37' }}>Important:</strong> Essay prompts are from the <strong>2025 application cycle</strong>. These are <strong>not</strong> the current questions and may change for the upcoming year. Use them for practice and preparation. <strong>When new prompts are released, essays written for outdated questions may be removed.</strong>
          </p>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search colleges by name or location..."
            style={{
              width: '100%',
              maxWidth: '500px',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(212,175,55,0.2)',
              color: 'white',
              padding: '16px 20px',
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              outline: 'none',
            }}
          />
        </div>

        {userCollegesList.length > 0 && (
          <div style={{ marginBottom: '64px' }}>
            <h2 className="font-heading text-3xl mb-6" style={{ color: 'white' }}>My Colleges ({userCollegesList.length})</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
              {userCollegesList.map((college) => (
                <Card key={college.id}>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                      <Link href={`/colleges/${college.id}`}>
                        <h3 className="font-heading text-2xl mb-2" style={{ color: '#D4AF37', cursor: 'pointer' }}>{college.name}</h3>
                      </Link>
                      <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{college.location}</p>
                      {collegesWithPrompts.has(college.id) ? (
                        <span className="font-body" style={{ fontSize: '11px', color: '#D4AF37', background: 'rgba(212,175,55,0.15)', padding: '2px 8px', borderRadius: '3px', marginTop: '6px', display: 'inline-block' }}>2025 Prompts Available</span>
                      ) : (
                        <span className="font-body" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '6px', display: 'inline-block' }}>2026 Prompts Come in August</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveCollege(college.id)}
                      style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                    >
                      Remove
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {college.acceptance_rate != null && Number(college.acceptance_rate) === college.acceptance_rate && (
                      <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        Acceptance Rate: {(Number(college.acceptance_rate) * 100).toFixed(1)}%
                      </p>
                    )}
                    {college.sat_range_low != null && college.sat_range_high != null && (
                      <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        SAT Range: {college.sat_range_low} – {college.sat_range_high}
                      </p>
                    )}
                  </div>
                  <Link href={`/colleges/${college.id}`} style={{ display: 'inline-block', marginTop: '16px' }}>
                    <Button variant="secondary">View Details</Button>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="font-heading text-3xl mb-6" style={{ color: 'white' }}>
            {searchTerm ? 'Search Results' : 'Browse Colleges'}
          </h2>
          {availableColleges.length === 0 ? (
            <Card>
              <p className="font-body text-center" style={{ color: 'rgba(255,255,255,0.7)', padding: '32px' }}>
                {searchTerm ? 'No colleges found matching your search.' : 'No colleges available.'}
              </p>
            </Card>
          ) : null}
          {availableColleges.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
              {availableColleges.map((college) => (
                <Card key={college.id}>
                  <div style={{ marginBottom: '16px' }}>
                    <h3 className="font-heading text-2xl mb-2" style={{ color: '#D4AF37' }}>{college.name}</h3>
                    <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{college.location}</p>
                    {collegesWithPrompts.has(college.id) ? (
                      <span className="font-body" style={{ fontSize: '11px', color: '#D4AF37', background: 'rgba(212,175,55,0.15)', padding: '2px 8px', borderRadius: '3px', marginTop: '6px', display: 'inline-block' }}>2025 Prompts Available</span>
                    ) : (
                      <span className="font-body" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '6px', display: 'inline-block' }}>Prompts Coming Soon</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {college.acceptance_rate != null && Number(college.acceptance_rate) === college.acceptance_rate && (
                      <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        Acceptance Rate: {(Number(college.acceptance_rate) * 100).toFixed(1)}%
                      </p>
                    )}
                    {college.sat_range_low != null && college.sat_range_high != null && (
                      <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        SAT Range: {college.sat_range_low} – {college.sat_range_high}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handleAddCollege(college.id)}
                    style={{ width: '100%' }}
                  >
                    Add to Portfolio
                  </Button>
                </Card>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}