'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Button from '@/components/Button';
import Card from '@/components/Card';

interface College {
  id: string;
  name: string;
  location: string;
  acceptance_rate: number;
  sat_range_low: number | null;
  sat_range_high: number | null;
  deadline_rd: string | null;
}

export default function CollegesPage() {
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [userColleges, setUserColleges] = useState<string[]>([]);
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
        setColleges(collegesData);
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
            <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontFamily: 'var(--font-body)' }}>Dashboard</Link>
            <Link href="/personal-statement" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontFamily: 'var(--font-body)' }}>Essays</Link>
            <Link href="/profile" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontFamily: 'var(--font-body)' }}>Profile</Link>
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
                    {college.acceptance_rate && (
                      <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        Acceptance Rate: {(college.acceptance_rate * 100).toFixed(1)}%
                      </p>
                    )}
                    {college.sat_range_low && college.sat_range_high && (
                      <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        SAT Range: {college.sat_range_low} - {college.sat_range_high}
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
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
              {availableColleges.map((college) => (
                <Card key={college.id}>
                  <div style={{ marginBottom: '16px' }}>
                    <h3 className="font-heading text-2xl mb-2" style={{ color: '#D4AF37' }}>{college.name}</h3>
                    <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{college.location}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {college.acceptance_rate && (
                      <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        Acceptance Rate: {(college.acceptance_rate * 100).toFixed(1)}%
                      </p>
                    )}
                    {college.sat_range_low && college.sat_range_high && (
                      <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        SAT Range: {college.sat_range_low} - {college.sat_range_high}
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
          )}
        </div>
      </div>
    </div>
  );
}