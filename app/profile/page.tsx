'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';

interface UserStats {
  gpa_weighted: number | null;
  gpa_unweighted: number | null;
  sat_score: number | null;
  act_score: number | null;
}

interface APClass {
  id: string;
  class_name: string;
  score: number | null;
}

interface Extracurricular {
  id: string;
  activity_name: string;
  role: string | null;
  description: string | null;
}

interface Award {
  id: string;
  award_name: string;
  organization: string | null;
  year: number | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState<UserStats>({
    gpa_weighted: null,
    gpa_unweighted: null,
    sat_score: null,
    act_score: null,
  });
  const [apClasses, setApClasses] = useState<APClass[]>([]);
  const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingAPClass, setAddingAPClass] = useState(false);
  const [addingExtracurricular, setAddingExtracurricular] = useState(false);
  const [addingAward, setAddingAward] = useState(false);
  const [editingExtracurricular, setEditingExtracurricular] = useState<string | null>(null);
  const [editExtracurricular, setEditExtracurricular] = useState({ activity_name: '', role: '', description: '' });

  // Form states
  const [newApClass, setNewApClass] = useState({ class_name: '', score: '' });
  const [newExtracurricular, setNewExtracurricular] = useState({ activity_name: '', role: '', description: '' });
  const [newAward, setNewAward] = useState({ award_name: '', organization: '', year: '' });

  useEffect(() => {
    checkAuth();
    loadProfile();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Load stats
      const { data: statsData } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (statsData) {
        setStats({
          gpa_weighted: statsData.gpa_weighted,
          gpa_unweighted: statsData.gpa_unweighted,
          sat_score: statsData.sat_score,
          act_score: statsData.act_score,
        });
      }

      // Load AP classes
      const { data: apData, error: apError } = await supabase
        .from('user_ap_classes')
        .select('*')
        .eq('user_id', user.id)
        .order('class_name');

      if (apError) {
        console.error('Error loading AP classes:', apError);
      } else if (apData) {
        setApClasses(apData);
      }

      // Load extracurriculars
      const { data: ecData, error: ecError } = await supabase
        .from('user_extracurriculars')
        .select('*')
        .eq('user_id', user.id)
        .order('activity_name');

      if (ecError) {
        console.error('Error loading extracurriculars:', ecError);
      } else if (ecData) {
        setExtracurriculars(ecData);
      }

      // Load awards
      const { data: awardsData, error: awardsError } = await supabase
        .from('user_awards')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: false });

      if (awardsError) {
        console.error('Error loading awards:', awardsError);
      } else if (awardsData) {
        setAwards(awardsData);
      }

    } catch (error) {
      console.error('Error loading profile:', error);
      alert('Error loading profile data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStats = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to save stats.');
        return;
      }

      const { error } = await supabase.from('user_stats').upsert({
        user_id: user.id,
        gpa_weighted: stats.gpa_weighted ? parseFloat(stats.gpa_weighted.toString()) : null,
        gpa_unweighted: stats.gpa_unweighted ? parseFloat(stats.gpa_unweighted.toString()) : null,
        sat_score: stats.sat_score ? parseInt(stats.sat_score.toString()) : null,
        act_score: stats.act_score ? parseInt(stats.act_score.toString()) : null,
      });

      if (error) {
        console.error('Error saving stats:', error);
        alert('Error saving stats: ' + error.message);
      } else {
        alert('Stats saved successfully!');
      }
    } catch (error: any) {
      console.error('Error saving stats:', error);
      alert('Error saving stats: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddAPClass = async () => {
    if (!newApClass.class_name.trim()) {
      alert('Please enter a class name.');
      return;
    }

    if (addingAPClass) return;

    setAddingAPClass(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to add AP classes.');
        return;
      }

      const { data, error } = await supabase.from('user_ap_classes').insert({
        user_id: user.id,
        class_name: newApClass.class_name.trim(),
        score: newApClass.score ? parseFloat(newApClass.score) : null,
      }).select();

      if (error) {
        console.error('Error adding AP class:', error);
        alert('Error adding AP class: ' + error.message);
        return;
      }

      await loadProfile();
      setNewApClass({ class_name: '', score: '' });
      alert('AP class added successfully!');
    } catch (error: any) {
      console.error('Error adding AP class:', error);
      alert('Error adding AP class: ' + (error.message || 'Unknown error'));
    } finally {
      setAddingAPClass(false);
    }
  };

  const handleRemoveAPClass = async (id: string) => {
    if (!confirm('Are you sure you want to remove this AP class?')) return;

    try {
      const { error } = await supabase.from('user_ap_classes').delete().eq('id', id);
      if (error) {
        console.error('Error removing AP class:', error);
        alert('Error removing AP class: ' + error.message);
        return;
      }
      await loadProfile();
      alert('AP class removed successfully!');
    } catch (error: any) {
      console.error('Error removing AP class:', error);
      alert('Error removing AP class: ' + (error.message || 'Unknown error'));
    }
  };

  const handleAddExtracurricular = async () => {
    if (!newExtracurricular.activity_name.trim()) {
      alert('Please enter an activity name.');
      return;
    }

    if (addingExtracurricular) return;

    setAddingExtracurricular(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to add extracurriculars.');
        return;
      }

      const { data, error } = await supabase.from('user_extracurriculars').insert({
        user_id: user.id,
        activity_name: newExtracurricular.activity_name.trim(),
        role: newExtracurricular.role?.trim() || null,
        description: newExtracurricular.description?.trim() || null,
      }).select();

      if (error) {
        console.error('Error adding extracurricular:', error);
        alert('Error adding extracurricular: ' + error.message);
        return;
      }

      await loadProfile();
      setNewExtracurricular({ activity_name: '', role: '', description: '' });
      alert('Extracurricular added successfully!');
    } catch (error: any) {
      console.error('Error adding extracurricular:', error);
      alert('Error adding extracurricular: ' + (error.message || 'Unknown error'));
    } finally {
      setAddingExtracurricular(false);
    }
  };

  const handleRemoveExtracurricular = async (id: string) => {
    if (!confirm('Are you sure you want to remove this extracurricular?')) return;

    try {
      const { error } = await supabase.from('user_extracurriculars').delete().eq('id', id);
      if (error) {
        console.error('Error removing extracurricular:', error);
        alert('Error removing extracurricular: ' + error.message);
        return;
      }
      await loadProfile();
      alert('Extracurricular removed successfully!');
    } catch (error: any) {
      console.error('Error removing extracurricular:', error);
      alert('Error removing extracurricular: ' + (error.message || 'Unknown error'));
    }
  };

  const handleEditExtracurricular = (ec: Extracurricular) => {
    setEditingExtracurricular(ec.id);
    setEditExtracurricular({
      activity_name: ec.activity_name,
      role: ec.role || '',
      description: ec.description || '',
    });
  };

  const handleCancelEditExtracurricular = () => {
    setEditingExtracurricular(null);
    setEditExtracurricular({ activity_name: '', role: '', description: '' });
  };

  const handleSaveExtracurricular = async (id: string) => {
    if (!editExtracurricular.activity_name.trim()) {
      alert('Please enter an activity name.');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_extracurriculars')
        .update({
          activity_name: editExtracurricular.activity_name.trim(),
          role: editExtracurricular.role?.trim() || null,
          description: editExtracurricular.description?.trim() || null,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating extracurricular:', error);
        alert('Error updating extracurricular: ' + error.message);
        return;
      }

      await loadProfile();
      setEditingExtracurricular(null);
      setEditExtracurricular({ activity_name: '', role: '', description: '' });
      alert('Extracurricular updated successfully!');
    } catch (error: any) {
      console.error('Error updating extracurricular:', error);
      alert('Error updating extracurricular: ' + (error.message || 'Unknown error'));
    }
  };

  const handleAddAward = async () => {
    if (!newAward.award_name.trim()) {
      alert('Please enter an award name.');
      return;
    }

    if (addingAward) return;

    setAddingAward(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to add awards.');
        return;
      }

      const { data, error } = await supabase.from('user_awards').insert({
        user_id: user.id,
        award_name: newAward.award_name.trim(),
        organization: newAward.organization?.trim() || null,
        year: newAward.year ? parseInt(newAward.year) : null,
      }).select();

      if (error) {
        console.error('Error adding award:', error);
        alert('Error adding award: ' + error.message);
        return;
      }

      await loadProfile();
      setNewAward({ award_name: '', organization: '', year: '' });
      alert('Award added successfully!');
    } catch (error: any) {
      console.error('Error adding award:', error);
      alert('Error adding award: ' + (error.message || 'Unknown error'));
    } finally {
      setAddingAward(false);
    }
  };

  const handleRemoveAward = async (id: string) => {
    if (!confirm('Are you sure you want to remove this award?')) return;

    try {
      const { error } = await supabase.from('user_awards').delete().eq('id', id);
      if (error) {
        console.error('Error removing award:', error);
        alert('Error removing award: ' + error.message);
        return;
      }
      await loadProfile();
      alert('Award removed successfully!');
    } catch (error: any) {
      console.error('Error removing award:', error);
      alert('Error removing award: ' + (error.message || 'Unknown error'));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1623' }}>
        <div style={{ color: '#D4AF37' }}>Loading...</div>
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
            <Link href="/dashboard" style={{ color: pathname === '/dashboard' ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname === '/dashboard' ? 600 : 400 }}>Dashboard</Link>
            <Link href="/personal-statement" style={{ color: (pathname.startsWith('/personal-statement') || pathname.startsWith('/essays') || pathname.startsWith('/common-app')) ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: (pathname.startsWith('/personal-statement') || pathname.startsWith('/essays') || pathname.startsWith('/common-app')) ? 600 : 400 }}>Essays</Link>
            <Link href="/colleges" style={{ color: pathname.startsWith('/colleges') ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname.startsWith('/colleges') ? 600 : 400 }}>Portfolio</Link>
            <Link href="/profile" style={{ color: pathname === '/profile' ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname === '/profile' ? 600 : 400 }}>Profile</Link>
            <Link href="/discovery" style={{ color: pathname === '/discovery' ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname === '/discovery' ? 600 : 400 }}>Insight Questions</Link>
            <button onClick={handleLogout} style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer', padding: 0 }} onMouseEnter={(e) => { e.currentTarget.style.color = '#F3E5AB'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}>Logout</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ marginBottom: '48px' }}>
          <h1 className="font-heading text-5xl mb-4" style={{ color: 'white' }}>Academic Profile</h1>
          <p className="font-body text-lg" style={{ color: '#F3E5AB' }}>
            Manage your academic statistics, AP classes, extracurriculars, and awards
          </p>
        </div>

        {/* Academic Stats */}
        <Card>
          <h2 className="font-heading text-2xl mb-6" style={{ color: '#D4AF37' }}>Academic Statistics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontFamily: 'var(--font-body)', 
                fontSize: '14px', 
                fontWeight: 500, 
                color: 'rgba(255,255,255,0.7)', 
                marginBottom: '8px' 
              }}>
                Weighted GPA
              </label>
              <input
                type="number"
                value={stats.gpa_weighted || ''}
                onChange={(e) => setStats({ ...stats, gpa_weighted: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="4.0"
                step="0.01"
                min="0"
                max="5"
                style={{
                  width: '100%',
                  height: '48px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  color: 'white',
                  padding: '0 16px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '16px',
                  outline: 'none',
                  borderRadius: '2px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                fontFamily: 'var(--font-body)', 
                fontSize: '14px', 
                fontWeight: 500, 
                color: 'rgba(255,255,255,0.7)', 
                marginBottom: '8px' 
              }}>
                Unweighted GPA
              </label>
              <input
                type="number"
                value={stats.gpa_unweighted || ''}
                onChange={(e) => setStats({ ...stats, gpa_unweighted: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="3.8"
                step="0.01"
                min="0"
                max="4"
                style={{
                  width: '100%',
                  height: '48px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  color: 'white',
                  padding: '0 16px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '16px',
                  outline: 'none',
                  borderRadius: '2px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                fontFamily: 'var(--font-body)', 
                fontSize: '14px', 
                fontWeight: 500, 
                color: 'rgba(255,255,255,0.7)', 
                marginBottom: '8px' 
              }}>
                SAT Score
              </label>
              <input
                type="number"
                value={stats.sat_score || ''}
                onChange={(e) => setStats({ ...stats, sat_score: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="1500"
                min="400"
                max="1600"
                style={{
                  width: '100%',
                  height: '48px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  color: 'white',
                  padding: '0 16px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '16px',
                  outline: 'none',
                  borderRadius: '2px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                fontFamily: 'var(--font-body)', 
                fontSize: '14px', 
                fontWeight: 500, 
                color: 'rgba(255,255,255,0.7)', 
                marginBottom: '8px' 
              }}>
                ACT Score
              </label>
              <input
                type="number"
                value={stats.act_score || ''}
                onChange={(e) => setStats({ ...stats, act_score: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="34"
                min="1"
                max="36"
                style={{
                  width: '100%',
                  height: '48px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  color: 'white',
                  padding: '0 16px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '16px',
                  outline: 'none',
                  borderRadius: '2px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
          <button
            onClick={handleSaveStats}
            disabled={saving}
            style={{
              background: saving ? 'rgba(212,175,55,0.5)' : '#D4AF37',
              color: '#0B1623',
              padding: '12px 24px',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: 'none',
              borderRadius: '2px',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save Stats'}
          </button>
        </Card>

        {/* AP Classes */}
        <div style={{ marginTop: '32px' }}>
          <Card>
            <h2 className="font-heading text-2xl mb-6" style={{ color: '#D4AF37' }}>AP Classes</h2>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <input
                type="text"
                value={newApClass.class_name}
                onChange={(e) => setNewApClass({ ...newApClass, class_name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !addingAPClass) {
                    handleAddAPClass();
                  }
                }}
                placeholder="Class name (e.g., AP Calculus BC)"
                style={{
                  flex: 1,
                  height: '48px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  color: 'white',
                  padding: '0 16px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '16px',
                  outline: 'none',
                  borderRadius: '2px',
                }}
              />
              <input
                type="number"
                value={newApClass.score}
                onChange={(e) => setNewApClass({ ...newApClass, score: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !addingAPClass) {
                    handleAddAPClass();
                  }
                }}
                placeholder="Score (1-5)"
                min="1"
                max="5"
                style={{
                  width: '120px',
                  height: '48px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  color: 'white',
                  padding: '0 16px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '16px',
                  outline: 'none',
                  borderRadius: '2px',
                }}
              />
              <button
                onClick={handleAddAPClass}
                disabled={addingAPClass}
                style={{
                  background: addingAPClass ? 'rgba(212,175,55,0.5)' : '#D4AF37',
                  color: '#0B1623',
                  padding: '0 24px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '2px',
                  cursor: addingAPClass ? 'not-allowed' : 'pointer',
                }}
              >
                {addingAPClass ? 'Adding...' : 'Add'}
              </button>
            </div>
            {apClasses.length > 0 ? (
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(212,175,55,0.3)' }}>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#D4AF37' 
                      }}>
                        Class Name
                      </th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#D4AF37' 
                      }}>
                        Score
                      </th>
                      <th style={{ 
                        textAlign: 'right', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#D4AF37' 
                      }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {apClasses.map((apClass) => (
                      <tr key={apClass.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', color: 'white', wordBreak: 'break-word' }}>
                          {apClass.class_name}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', color: 'white' }}>
                          {apClass.score || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => handleRemoveAPClass(apClass.id)}
                            style={{
                              background: 'transparent',
                              color: '#F87171',
                              border: 'none',
                              cursor: 'pointer',
                              fontFamily: 'var(--font-body)',
                              fontSize: '14px',
                              padding: '4px 8px',
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)', padding: '16px 0' }}>
                No AP classes added yet. Add your first AP class above.
              </p>
            )}
          </Card>
        </div>

        {/* Extracurriculars */}
        <div style={{ marginTop: '32px' }}>
          <Card>
            <h2 className="font-heading text-2xl mb-6" style={{ color: '#D4AF37' }}>Extracurriculars</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <input
                type="text"
                value={newExtracurricular.activity_name}
                onChange={(e) => setNewExtracurricular({ ...newExtracurricular, activity_name: e.target.value })}
                placeholder="Activity name"
                style={{
                  height: '48px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  color: 'white',
                  padding: '0 16px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '16px',
                  outline: 'none',
                  borderRadius: '2px',
                }}
              />
              <input
                type="text"
                value={newExtracurricular.role}
                onChange={(e) => setNewExtracurricular({ ...newExtracurricular, role: e.target.value })}
                placeholder="Your role (optional)"
                style={{
                  height: '48px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  color: 'white',
                  padding: '0 16px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '16px',
                  outline: 'none',
                  borderRadius: '2px',
                }}
              />
              <textarea
                value={newExtracurricular.description}
                onChange={(e) => setNewExtracurricular({ ...newExtracurricular, description: e.target.value })}
                placeholder="Description (optional)"
                style={{
                  minHeight: '80px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  color: 'white',
                  padding: '12px 16px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '16px',
                  outline: 'none',
                  borderRadius: '2px',
                  resize: 'vertical',
                }}
              />
              <button
                onClick={handleAddExtracurricular}
                disabled={addingExtracurricular}
                style={{
                  background: addingExtracurricular ? 'rgba(212,175,55,0.5)' : '#D4AF37',
                  color: '#0B1623',
                  padding: '12px 24px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '2px',
                  cursor: addingExtracurricular ? 'not-allowed' : 'pointer',
                }}
              >
                {addingExtracurricular ? 'Adding...' : 'Add Extracurricular'}
              </button>
            </div>
            {extracurriculars.length > 0 ? (
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(212,175,55,0.3)' }}>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#D4AF37' 
                      }}>
                        Activity
                      </th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#D4AF37' 
                      }}>
                        Role
                      </th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#D4AF37' 
                      }}>
                        Description
                      </th>
                      <th style={{ 
                        textAlign: 'right', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#D4AF37' 
                      }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {extracurriculars.map((ec) => (
                      <tr key={ec.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        {editingExtracurricular === ec.id ? (
                          <>
                            <td style={{ padding: '12px 16px' }}>
                              <input
                                type="text"
                                value={editExtracurricular.activity_name}
                                onChange={(e) => setEditExtracurricular({ ...editExtracurricular, activity_name: e.target.value })}
                                style={{
                                  width: '100%',
                                  height: '36px',
                                  background: 'rgba(0,0,0,0.3)',
                                  border: '1px solid rgba(212,175,55,0.5)',
                                  color: 'white',
                                  padding: '0 12px',
                                  fontFamily: 'var(--font-body)',
                                  fontSize: '14px',
                                  outline: 'none',
                                  borderRadius: '2px',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <input
                                type="text"
                                value={editExtracurricular.role}
                                onChange={(e) => setEditExtracurricular({ ...editExtracurricular, role: e.target.value })}
                                style={{
                                  width: '100%',
                                  height: '36px',
                                  background: 'rgba(0,0,0,0.3)',
                                  border: '1px solid rgba(212,175,55,0.5)',
                                  color: 'white',
                                  padding: '0 12px',
                                  fontFamily: 'var(--font-body)',
                                  fontSize: '14px',
                                  outline: 'none',
                                  borderRadius: '2px',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <textarea
                                value={editExtracurricular.description}
                                onChange={(e) => setEditExtracurricular({ ...editExtracurricular, description: e.target.value })}
                                style={{
                                  width: '100%',
                                  minHeight: '60px',
                                  background: 'rgba(0,0,0,0.3)',
                                  border: '1px solid rgba(212,175,55,0.5)',
                                  color: 'white',
                                  padding: '8px 12px',
                                  fontFamily: 'var(--font-body)',
                                  fontSize: '14px',
                                  outline: 'none',
                                  borderRadius: '2px',
                                  resize: 'vertical',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => handleSaveExtracurricular(ec.id)}
                                  style={{
                                    background: '#D4AF37',
                                    color: '#0B1623',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    padding: '6px 12px',
                                    borderRadius: '2px',
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEditExtracurricular}
                                  style={{
                                    background: 'transparent',
                                    color: 'rgba(255,255,255,0.7)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    padding: '6px 12px',
                                    borderRadius: '2px',
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', color: 'white', fontWeight: 500, wordBreak: 'break-word' }}>
                              {ec.activity_name}
                            </td>
                            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.7)', wordBreak: 'break-word' }}>
                              {ec.role || '—'}
                            </td>
                            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.7)', wordBreak: 'break-word', maxWidth: '400px', whiteSpace: 'normal' }}>
                              {ec.description || '—'}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => handleEditExtracurricular(ec)}
                                  style={{
                                    background: 'transparent',
                                    color: '#D4AF37',
                                    border: '1px solid rgba(212,175,55,0.5)',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    padding: '6px 12px',
                                    borderRadius: '2px',
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleRemoveExtracurricular(ec.id)}
                                  style={{
                                    background: 'transparent',
                                    color: '#F87171',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    padding: '6px 12px',
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)', padding: '16px 0' }}>
                No extracurriculars added yet. Add your first activity above.
              </p>
            )}
          </Card>
        </div>

        {/* Awards */}
        <div style={{ marginTop: '32px' }}>
          <Card>
            <h2 className="font-heading text-2xl mb-6" style={{ color: '#D4AF37' }}>Awards & Honors</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <input
                type="text"
                value={newAward.award_name}
                onChange={(e) => setNewAward({ ...newAward, award_name: e.target.value })}
                placeholder="Award name"
                style={{
                  height: '48px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  color: 'white',
                  padding: '0 16px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '16px',
                  outline: 'none',
                  borderRadius: '2px',
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input
                  type="text"
                  value={newAward.organization}
                  onChange={(e) => setNewAward({ ...newAward, organization: e.target.value })}
                  placeholder="Organization (optional)"
                  style={{
                    height: '48px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    color: 'white',
                    padding: '0 16px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '16px',
                    outline: 'none',
                    borderRadius: '2px',
                  }}
                />
                <input
                  type="number"
                  value={newAward.year}
                  onChange={(e) => setNewAward({ ...newAward, year: e.target.value })}
                  placeholder="Year (optional)"
                  min="2000"
                  max="2030"
                  style={{
                    height: '48px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    color: 'white',
                    padding: '0 16px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '16px',
                    outline: 'none',
                    borderRadius: '2px',
                  }}
                />
              </div>
              <button
                onClick={handleAddAward}
                disabled={addingAward}
                style={{
                  background: addingAward ? 'rgba(212,175,55,0.5)' : '#D4AF37',
                  color: '#0B1623',
                  padding: '12px 24px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '2px',
                  cursor: addingAward ? 'not-allowed' : 'pointer',
                }}
              >
                {addingAward ? 'Adding...' : 'Add Award'}
              </button>
            </div>
            {awards.length > 0 ? (
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(212,175,55,0.3)' }}>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#D4AF37' 
                      }}>
                        Award Name
                      </th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#D4AF37' 
                      }}>
                        Organization
                      </th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#D4AF37' 
                      }}>
                        Year
                      </th>
                      <th style={{ 
                        textAlign: 'right', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#D4AF37' 
                      }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {awards.map((award) => (
                      <tr key={award.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', color: 'white', fontWeight: 500, wordBreak: 'break-word' }}>
                          {award.award_name}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.7)', wordBreak: 'break-word' }}>
                          {award.organization || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.7)' }}>
                          {award.year || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => handleRemoveAward(award.id)}
                            style={{
                              background: 'transparent',
                              color: '#F87171',
                              border: 'none',
                              cursor: 'pointer',
                              fontFamily: 'var(--font-body)',
                              fontSize: '14px',
                              padding: '4px 8px',
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)', padding: '16px 0' }}>
                No awards added yet. Add your first award above.
              </p>
            )}
          </Card>

          {/* Account deletion. Required by California's Eraser Button law
              for users under 18 and a general CCPA right. Two-step confirm
              prevents accidental clicks. */}
          <Card>
            <h2 className="font-heading text-2xl mb-4" style={{ color: '#F87171' }}>Delete Account</h2>
            <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '16px', lineHeight: '1.6' }}>
              Permanently delete your Vantage account and all associated data: your essays, essay versions, Insight Question responses, college list, activities, awards, AI guidance history, and subscription record. This action cannot be undone.
            </p>
            <DeleteAccountButton />
          </Card>
        </div>
      </div>
    </div>
  );
}

function DeleteAccountButton() {
  const [stage, setStage] = useState<'idle' | 'confirming' | 'deleting' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [confirmText, setConfirmText] = useState<string>('');
  const router = useRouter();

  const handleDelete = async () => {
    if (confirmText !== 'DELETE MY ACCOUNT') {
      setErrorMsg('Please type DELETE MY ACCOUNT to confirm.');
      return;
    }
    setStage('deleting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE MY ACCOUNT' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Deletion failed');
      }
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Deletion failed. Please contact support.');
      setStage('error');
    }
  };

  if (stage === 'idle') {
    return (
      <button
        onClick={() => setStage('confirming')}
        style={{
          background: 'transparent',
          color: '#F87171',
          border: '1px solid #F87171',
          padding: '10px 20px',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          borderRadius: '2px',
          cursor: 'pointer',
        }}
      >
        Delete My Account
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p className="font-body text-sm" style={{ color: '#F87171', fontWeight: 600 }}>
        Type <strong>DELETE MY ACCOUNT</strong> below to confirm. This cannot be undone.
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="DELETE MY ACCOUNT"
        disabled={stage === 'deleting'}
        style={{
          padding: '10px 14px',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(248,113,113,0.5)',
          color: 'white',
          borderRadius: '2px',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
        }}
      />
      {errorMsg && (
        <p className="font-body text-sm" style={{ color: '#F87171' }}>
          {errorMsg}
        </p>
      )}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleDelete}
          disabled={stage === 'deleting' || confirmText !== 'DELETE MY ACCOUNT'}
          style={{
            background: confirmText === 'DELETE MY ACCOUNT' && stage !== 'deleting' ? '#F87171' : 'rgba(248,113,113,0.3)',
            color: '#0B1623',
            border: 'none',
            padding: '10px 20px',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderRadius: '2px',
            cursor: confirmText === 'DELETE MY ACCOUNT' && stage !== 'deleting' ? 'pointer' : 'not-allowed',
          }}
        >
          {stage === 'deleting' ? 'Deleting...' : 'Permanently Delete'}
        </button>
        <button
          onClick={() => {
            setStage('idle');
            setConfirmText('');
            setErrorMsg('');
          }}
          disabled={stage === 'deleting'}
          style={{
            background: 'transparent',
            color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.3)',
            padding: '10px 20px',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderRadius: '2px',
            cursor: stage === 'deleting' ? 'not-allowed' : 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}