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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCollege, setShowAddCollege] = useState(false);
  const [addCollegeName, setAddCollegeName] = useState('');
  const [addCollegeLocation, setAddCollegeLocation] = useState('');
  const [addCollegeAcceptanceRate, setAddCollegeAcceptanceRate] = useState('');
  const [addCollegeSatLow, setAddCollegeSatLow] = useState('');
  const [addCollegeSatHigh, setAddCollegeSatHigh] = useState('');
  const [addingCollege, setAddingCollege] = useState(false);
  const [addCollegeError, setAddCollegeError] = useState<string | null>(null);

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

  const slugify = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'college';

  const handleAddCustomCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddCollegeError(null);
    const name = addCollegeName.trim();
    const location = addCollegeLocation.trim();
    if (!name) {
      setAddCollegeError('Please enter a college name.');
      return;
    }
    if (!location) {
      setAddCollegeError('Please enter a location (e.g. city, state or country).');
      return;
    }
    setAddingCollege(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAddCollegeError('You must be signed in to add a college.');
        setAddingCollege(false);
        return;
      }
      const id = `${slugify(name)}-${Math.random().toString(36).slice(2, 8)}`;
      const acceptanceRate = addCollegeAcceptanceRate.trim() ? parseFloat(addCollegeAcceptanceRate) / 100 : null;
      const satLow = addCollegeSatLow.trim() ? parseInt(addCollegeSatLow, 10) : null;
      const satHigh = addCollegeSatHigh.trim() ? parseInt(addCollegeSatHigh, 10) : null;
      if (Number.isNaN(acceptanceRate) || (acceptanceRate != null && (acceptanceRate < 0 || acceptanceRate > 1))) {
        setAddCollegeError('Acceptance rate must be a number between 0 and 100.');
        setAddingCollege(false);
        return;
      }
      if ((satLow != null && Number.isNaN(satLow)) || (satHigh != null && Number.isNaN(satHigh))) {
        setAddCollegeError('SAT range must be numbers (e.g. 1200–1600).');
        setAddingCollege(false);
        return;
      }

      const { error: insertError } = await supabase.from('colleges').insert({
        id,
        name,
        location,
        acceptance_rate: acceptanceRate ?? undefined,
        sat_range_low: satLow ?? undefined,
        sat_range_high: satHigh ?? undefined,
      });

      if (insertError) {
        setAddCollegeError(insertError.message || 'Could not add college. It may already exist—try a slightly different name.');
        setAddingCollege(false);
        return;
      }

      const { error: linkError } = await supabase.from('user_colleges').insert({
        user_id: user.id,
        college_id: id,
      });

      if (linkError) {
        setAddCollegeError(linkError.message || 'College was created but could not be added to your portfolio.');
        setAddingCollege(false);
        return;
      }

      setColleges((prev) => {
        const next = [...prev, { id, name, location, acceptance_rate: acceptanceRate ?? 0, sat_range_low: satLow, sat_range_high: satHigh, deadline_rd: null }];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });
      setUserColleges((prev) => [...prev, id].sort());
      setAddCollegeName('');
      setAddCollegeLocation('');
      setAddCollegeAcceptanceRate('');
      setAddCollegeSatLow('');
      setAddCollegeSatHigh('');
      setShowAddCollege(false);
    } catch (err: unknown) {
      setAddCollegeError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setAddingCollege(false);
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
            <Link href="/personal-statement" style={{ color: (pathname.startsWith('/personal-statement') || pathname.startsWith('/essays') || pathname.startsWith('/common-app')) ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: (pathname.startsWith('/personal-statement') || pathname.startsWith('/essays') || pathname.startsWith('/common-app')) ? 600 : 400 }}>Essays</Link>
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

        <div style={{ marginBottom: '32px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search colleges..."
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
          {availableColleges.length === 0 && !showAddCollege ? (
            <Card>
              <p className="font-body text-center" style={{ color: 'rgba(255,255,255,0.7)', padding: '32px' }}>
                {searchTerm ? 'No colleges found matching your search.' : 'No colleges available.'}
              </p>
            </Card>
          ) : null}
          {availableColleges.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
              {availableColleges.map((college) => (
                <Card key={college.id}>
                  <div style={{ marginBottom: '16px' }}>
                    <h3 className="font-heading text-2xl mb-2" style={{ color: '#D4AF37' }}>{college.name}</h3>
                    <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{college.location}</p>
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

          <Card>
            {!showAddCollege ? (
              <button
                type="button"
                onClick={() => setShowAddCollege(true)}
                style={{
                  width: '100%',
                  padding: '24px',
                  background: 'transparent',
                  border: 'none',
                  color: '#D4AF37',
                  fontFamily: 'var(--font-body)',
                  fontSize: '16px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Don’t see your college? Add a college
              </button>
            ) : (
              <form onSubmit={handleAddCustomCollege} style={{ padding: '8px 0' }}>
                <h3 className="font-heading text-lg mb-4" style={{ color: '#D4AF37' }}>Add a college</h3>
                {addCollegeError && (
                  <p className="font-body text-sm mb-4" style={{ color: '#e57373' }}>{addCollegeError}</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '6px' }}>College name *</label>
                    <input
                      type="text"
                      value={addCollegeName}
                      onChange={(e) => setAddCollegeName(e.target.value)}
                      placeholder="e.g. State University"
                      required
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        color: 'white',
                        padding: '10px 14px',
                        fontFamily: 'var(--font-body)',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                  <div>
                    <label className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '6px' }}>Location *</label>
                    <input
                      type="text"
                      value={addCollegeLocation}
                      onChange={(e) => setAddCollegeLocation(e.target.value)}
                      placeholder="e.g. Boston, MA"
                      required
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        color: 'white',
                        padding: '10px 14px',
                        fontFamily: 'var(--font-body)',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '6px' }}>Acceptance rate %</label>
                      <input
                        type="text"
                        value={addCollegeAcceptanceRate}
                        onChange={(e) => setAddCollegeAcceptanceRate(e.target.value)}
                        placeholder="e.g. 25"
                        inputMode="decimal"
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.2)',
                          border: '1px solid rgba(212,175,55,0.3)',
                          color: 'white',
                          padding: '10px 14px',
                          fontFamily: 'var(--font-body)',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                    <div>
                      <label className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '6px' }}>SAT low</label>
                      <input
                        type="text"
                        value={addCollegeSatLow}
                        onChange={(e) => setAddCollegeSatLow(e.target.value)}
                        placeholder="e.g. 1200"
                        inputMode="numeric"
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.2)',
                          border: '1px solid rgba(212,175,55,0.3)',
                          color: 'white',
                          padding: '10px 14px',
                          fontFamily: 'var(--font-body)',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                    <div>
                      <label className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '6px' }}>SAT high</label>
                      <input
                        type="text"
                        value={addCollegeSatHigh}
                        onChange={(e) => setAddCollegeSatHigh(e.target.value)}
                        placeholder="e.g. 1450"
                        inputMode="numeric"
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.2)',
                          border: '1px solid rgba(212,175,55,0.3)',
                          color: 'white',
                          padding: '10px 14px',
                          fontFamily: 'var(--font-body)',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Button type="submit" disabled={addingCollege}>
                    {addingCollege ? 'Adding…' : 'Add and add to portfolio'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCollege(false);
                      setAddCollegeError(null);
                      setAddCollegeName('');
                      setAddCollegeLocation('');
                      setAddCollegeAcceptanceRate('');
                      setAddCollegeSatLow('');
                      setAddCollegeSatHigh('');
                    }}
                    style={{
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      padding: '12px 20px',
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}