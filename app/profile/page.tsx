'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import Eyebrow from '@/components/Eyebrow';

interface UserStats {
  gpa_weighted: number | null;
  gpa_unweighted: number | null;
  sat_score: number | null;
  act_score: number | null;
}

// Classifier profile fields — additive, used by /colleges Strategy view.
interface StrategyProfile {
  state: string;
  intended_major: string;
  ap_count: string; // string for the input; coerced on save
  test_optional: boolean;
  hook_recruited_athlete: boolean;
  hook_first_gen: boolean;
  hook_urm: boolean;
  hook_low_income: boolean;
  hook_legacy_active: boolean;
  hook_legacy_college_ids: string[];
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

  // Classifier-specific profile state (separate save button so existing UX is untouched).
  const [strategy, setStrategy] = useState<StrategyProfile>({
    state: '',
    intended_major: 'Undecided',
    ap_count: '0',
    test_optional: false,
    hook_recruited_athlete: false,
    hook_first_gen: false,
    hook_urm: false,
    hook_low_income: false,
    hook_legacy_active: false,
    hook_legacy_college_ids: [],
  });
  const [savingStrategy, setSavingStrategy] = useState(false);
  const [legacyColleges, setLegacyColleges] = useState<{ id: string; name: string }[]>([]);

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
        // Classifier fields (will be null on rows pre-migration).
        setStrategy({
          state: statsData.state ?? '',
          intended_major: statsData.intended_major ?? 'Undecided',
          ap_count: statsData.ap_count != null ? String(statsData.ap_count) : '0',
          test_optional: !!statsData.test_optional,
          hook_recruited_athlete: !!statsData.hook_recruited_athlete,
          hook_first_gen: !!statsData.hook_first_gen,
          hook_urm: !!statsData.hook_urm,
          hook_low_income: !!statsData.hook_low_income,
          hook_legacy_active: !!statsData.hook_legacy_active,
          hook_legacy_college_ids: statsData.hook_legacy_college_ids ?? [],
        });
      }

      // Load colleges the user has marked as legacy candidates from (their portfolio).
      const { data: ucData } = await supabase
        .from('user_colleges')
        .select('college_id, colleges(id, name)')
        .eq('user_id', user.id);
      if (ucData) {
        setLegacyColleges(
          ucData
            .map((row: any) => row.colleges)
            .filter((c: any) => c && c.id && c.name)
            .map((c: any) => ({ id: c.id, name: c.name }))
        );
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

  const handleSaveStrategy = async () => {
    setSavingStrategy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { alert('You must be logged in to save.'); return; }
      const apCount = parseInt(strategy.ap_count) || 0;
      const { error } = await supabase.from('user_stats').upsert({
        user_id: user.id,
        state: strategy.state ? strategy.state.toUpperCase().slice(0, 2) : null,
        intended_major: strategy.intended_major || null,
        ap_count: apCount,
        test_optional: strategy.test_optional,
        hook_recruited_athlete: strategy.hook_recruited_athlete,
        hook_first_gen: strategy.hook_first_gen,
        hook_urm: strategy.hook_urm,
        hook_low_income: strategy.hook_low_income,
        hook_legacy_active: strategy.hook_legacy_active,
        hook_legacy_college_ids: strategy.hook_legacy_college_ids,
      });
      if (error) {
        console.error('Error saving strategy profile:', error);
        alert('Error: ' + error.message);
      } else {
        alert('Strategy profile saved.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Error saving: ' + (e?.message ?? 'Unknown error'));
    } finally {
      setSavingStrategy(false);
    }
  };

  const toggleLegacyCollege = (collegeId: string) => {
    setStrategy((prev) => {
      const ids = prev.hook_legacy_college_ids.includes(collegeId)
        ? prev.hook_legacy_college_ids.filter((i) => i !== collegeId)
        : [...prev.hook_legacy_college_ids, collegeId];
      return { ...prev, hook_legacy_college_ids: ids };
    });
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1320' }}>
        <div style={{ color: '#C9A977' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0B1320' }}>
      <nav style={{ borderBottom: '1px solid rgba(232,221,201,0.1)', padding: '24px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <span className="font-heading text-2xl font-semibold" style={{ color: '#E8DDC9' }}>VANTAGE</span>
            <span className="text-2xl" style={{ color: '#C9A977' }}>.</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link href="/dashboard" style={{ color: pathname === '/dashboard' ? '#E8DDC9' : 'rgba(232,221,201,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname === '/dashboard' ? 600 : 400 }}>Dashboard</Link>
            <Link href="/personal-statement" style={{ color: (pathname.startsWith('/personal-statement') || pathname.startsWith('/essays')) ? '#E8DDC9' : 'rgba(232,221,201,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: (pathname.startsWith('/personal-statement') || pathname.startsWith('/essays')) ? 600 : 400 }}>Essays</Link>
            <Link href="/common-app" style={{ color: pathname.startsWith('/common-app') ? '#E8DDC9' : 'rgba(232,221,201,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname.startsWith('/common-app') ? 600 : 400 }}>Common App</Link>
            <Link href="/colleges" style={{ color: pathname.startsWith('/colleges') ? '#E8DDC9' : 'rgba(232,221,201,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname.startsWith('/colleges') ? 600 : 400 }}>Portfolio</Link>
            <Link href="/profile" style={{ color: pathname === '/profile' ? '#E8DDC9' : 'rgba(232,221,201,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname === '/profile' ? 600 : 400 }}>Profile</Link>
            <Link href="/discovery" style={{ color: pathname === '/discovery' ? '#E8DDC9' : 'rgba(232,221,201,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname === '/discovery' ? 600 : 400 }}>Insight Questions</Link>
            <button onClick={handleLogout} style={{ background: 'transparent', color: 'rgba(232,221,201,0.7)', border: 'none', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer', padding: 0 }} onMouseEnter={(e) => { e.currentTarget.style.color = '#E8DDC9'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(232,221,201,0.7)'; }}>Logout</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 32px' }}>
        <PageHeader
          title="Academic Profile"
          subtitle="Manage your academic statistics, AP classes, extracurriculars, and awards."
        />

        {/* Academic Stats */}
        <Card>
          <Eyebrow>Academic Statistics</Eyebrow>
          <div style={{ marginBottom: '24px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontFamily: 'var(--font-body)', 
                fontSize: '14px', 
                fontWeight: 500, 
                color: 'rgba(232,221,201,0.7)', 
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
                  border: '1px solid rgba(201,169,119,0.2)',
                  color: '#E8DDC9',
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
                color: 'rgba(232,221,201,0.7)', 
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
                  border: '1px solid rgba(201,169,119,0.2)',
                  color: '#E8DDC9',
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
                color: 'rgba(232,221,201,0.7)', 
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
                  border: '1px solid rgba(201,169,119,0.2)',
                  color: '#E8DDC9',
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
                color: 'rgba(232,221,201,0.7)', 
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
                  border: '1px solid rgba(201,169,119,0.2)',
                  color: '#E8DDC9',
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
              background: saving ? 'rgba(201,169,119,0.5)' : '#C9A977',
              color: '#0B1320',
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

        {/* Strategy Profile (drives Safety/Target/Reach classifier) */}
        <div style={{ marginTop: '32px' }}>
          <Card>
            <Eyebrow>Strategy Profile</Eyebrow>
            <div style={{ marginBottom: '8px' }} />
            <p className="font-body" style={{ color: 'rgba(232,221,201,0.7)', fontSize: '13px', marginBottom: '24px', lineHeight: 1.6 }}>
              These power your Strategy view in Portfolio. We use them to classify each school as Safety / Likely / Target / Reach / Hard Reach and to recommend an ED play.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label className="font-body" style={{ display: 'block', color: 'rgba(232,221,201,0.85)', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>State (2-letter)</label>
                <input
                  type="text"
                  value={strategy.state}
                  onChange={(e) => setStrategy({ ...strategy, state: e.target.value.toUpperCase().slice(0, 2) })}
                  placeholder="e.g. CA"
                  maxLength={2}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(201,169,119,0.2)', color: '#E8DDC9', padding: '12px 14px', fontFamily: 'var(--font-body)', fontSize: '15px', outline: 'none' }}
                />
              </div>
              <div>
                <label className="font-body" style={{ display: 'block', color: 'rgba(232,221,201,0.85)', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Intended Major</label>
                <select
                  value={strategy.intended_major}
                  onChange={(e) => setStrategy({ ...strategy, intended_major: e.target.value })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(201,169,119,0.2)', color: '#E8DDC9', padding: '12px 14px', fontFamily: 'var(--font-body)', fontSize: '15px', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Business">Business</option>
                  <option value="Liberal Arts">Liberal Arts</option>
                  <option value="Pre-Med">Pre-Med</option>
                  <option value="Undecided">Undecided</option>
                </select>
              </div>
              <div>
                <label className="font-body" style={{ display: 'block', color: 'rgba(232,221,201,0.85)', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AP Course Count</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={strategy.ap_count}
                  onChange={(e) => setStrategy({ ...strategy, ap_count: e.target.value })}
                  placeholder="0"
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(201,169,119,0.2)', color: '#E8DDC9', padding: '12px 14px', fontFamily: 'var(--font-body)', fontSize: '15px', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div className="font-body" style={{ color: 'rgba(232,221,201,0.85)', fontSize: '13px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Application Strategy</div>
              <ProfileToggle label="Applying test-optional" hint="We'll weight GPA + rigor at 100% if you skip SAT/ACT." checked={strategy.test_optional} onChange={(v) => setStrategy({ ...strategy, test_optional: v })} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div className="font-body" style={{ color: 'rgba(232,221,201,0.85)', fontSize: '13px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hooks</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
                <ProfileToggle label="Recruited athlete" hint="Sets matching schools to Likely once a coach offers." checked={strategy.hook_recruited_athlete} onChange={(v) => setStrategy({ ...strategy, hook_recruited_athlete: v })} />
                <ProfileToggle label="First-generation college student" hint="+5 holistic score at selective schools." checked={strategy.hook_first_gen} onChange={(v) => setStrategy({ ...strategy, hook_first_gen: v })} />
                <ProfileToggle label="Underrepresented background (URM)" hint="+5 holistic score at selective schools." checked={strategy.hook_urm} onChange={(v) => setStrategy({ ...strategy, hook_urm: v })} />
                <ProfileToggle label="Pell-eligible / low-income" hint="Signaled in financial aid review." checked={strategy.hook_low_income} onChange={(v) => setStrategy({ ...strategy, hook_low_income: v })} />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div className="font-body" style={{ color: 'rgba(232,221,201,0.85)', fontSize: '13px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Legacy Status</div>
              <ProfileToggle
                label="I have legacy connections"
                hint="Bumps matching schools (admit rate above 15%) by one tier."
                checked={strategy.hook_legacy_active}
                onChange={(v) => setStrategy({ ...strategy, hook_legacy_active: v })}
              />
              {strategy.hook_legacy_active && (
                <div style={{ marginTop: '14px', padding: '14px', background: 'rgba(11,19,32,0.4)', border: '1px solid rgba(201,169,119,0.18)' }}>
                  <div className="font-body" style={{ color: 'rgba(232,221,201,0.7)', fontSize: '12px', marginBottom: '10px' }}>
                    Select the colleges where you have legacy status (a parent or grandparent attended).
                  </div>
                  {legacyColleges.length === 0 ? (
                    <p className="font-body" style={{ color: 'rgba(232,221,201,0.45)', fontSize: '12px', fontStyle: 'italic', margin: 0 }}>
                      Add schools to your portfolio first — then you can mark legacy connections here.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {legacyColleges.map((c) => {
                        const checked = strategy.hook_legacy_college_ids.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleLegacyCollege(c.id)}
                            className="font-body"
                            style={{
                              background: checked ? 'rgba(201,169,119,0.18)' : 'transparent',
                              border: `1px solid ${checked ? '#C9A977' : 'rgba(232,221,201,0.18)'}`,
                              color: checked ? '#E8DDC9' : 'rgba(232,221,201,0.75)',
                              padding: '6px 12px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              borderRadius: '999px',
                              fontWeight: checked ? 600 : 400,
                            }}
                          >
                            {checked ? '✓ ' : ''}{c.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleSaveStrategy}
              disabled={savingStrategy}
              className="font-body"
              style={{
                background: '#C9A977',
                color: '#0B1320',
                border: 'none',
                padding: '12px 28px',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                cursor: savingStrategy ? 'not-allowed' : 'pointer',
              }}
            >
              {savingStrategy ? 'Saving...' : 'Save Strategy Profile'}
            </button>
          </Card>
        </div>

        {/* AP Classes */}
        <div style={{ marginTop: '32px' }}>
          <Card>
            <Eyebrow>AP Classes</Eyebrow>
            <div style={{ marginBottom: '24px' }} />
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
                  border: '1px solid rgba(201,169,119,0.2)',
                  color: '#E8DDC9',
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
                  border: '1px solid rgba(201,169,119,0.2)',
                  color: '#E8DDC9',
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
                  background: addingAPClass ? 'rgba(201,169,119,0.5)' : '#C9A977',
                  color: '#0B1320',
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
                    <tr style={{ borderBottom: '2px solid rgba(201,169,119,0.3)' }}>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#C9A977' 
                      }}>
                        Class Name
                      </th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#C9A977' 
                      }}>
                        Score
                      </th>
                      <th style={{ 
                        textAlign: 'right', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#C9A977' 
                      }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {apClasses.map((apClass) => (
                      <tr key={apClass.id} style={{ borderBottom: '1px solid rgba(232,221,201,0.1)' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', color: '#E8DDC9', wordBreak: 'break-word' }}>
                          {apClass.class_name}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', color: '#E8DDC9' }}>
                          {apClass.score || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => handleRemoveAPClass(apClass.id)}
                            style={{
                              background: 'transparent',
                              color: '#A35A6A',
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
              <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.5)', padding: '16px 0' }}>
                No AP classes added yet. Add your first AP class above.
              </p>
            )}
          </Card>
        </div>

        {/* Extracurriculars */}
        <div style={{ marginTop: '32px' }}>
          <Card>
            <Eyebrow>Extracurriculars</Eyebrow>
            <div style={{ marginBottom: '24px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <input
                type="text"
                value={newExtracurricular.activity_name}
                onChange={(e) => setNewExtracurricular({ ...newExtracurricular, activity_name: e.target.value })}
                placeholder="Activity name"
                style={{
                  height: '48px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(201,169,119,0.2)',
                  color: '#E8DDC9',
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
                  border: '1px solid rgba(201,169,119,0.2)',
                  color: '#E8DDC9',
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
                  border: '1px solid rgba(201,169,119,0.2)',
                  color: '#E8DDC9',
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
                  background: addingExtracurricular ? 'rgba(201,169,119,0.5)' : '#C9A977',
                  color: '#0B1320',
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
                    <tr style={{ borderBottom: '2px solid rgba(201,169,119,0.3)' }}>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#C9A977' 
                      }}>
                        Activity
                      </th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#C9A977' 
                      }}>
                        Role
                      </th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#C9A977' 
                      }}>
                        Description
                      </th>
                      <th style={{ 
                        textAlign: 'right', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#C9A977' 
                      }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {extracurriculars.map((ec) => (
                      <tr key={ec.id} style={{ borderBottom: '1px solid rgba(232,221,201,0.1)' }}>
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
                                  border: '1px solid rgba(201,169,119,0.5)',
                                  color: '#E8DDC9',
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
                                  border: '1px solid rgba(201,169,119,0.5)',
                                  color: '#E8DDC9',
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
                                  border: '1px solid rgba(201,169,119,0.5)',
                                  color: '#E8DDC9',
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
                                    background: '#C9A977',
                                    color: '#0B1320',
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
                                    color: 'rgba(232,221,201,0.7)',
                                    border: '1px solid rgba(232,221,201,0.3)',
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
                            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', color: '#E8DDC9', fontWeight: 500, wordBreak: 'break-word' }}>
                              {ec.activity_name}
                            </td>
                            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', color: 'rgba(232,221,201,0.7)', wordBreak: 'break-word' }}>
                              {ec.role || '—'}
                            </td>
                            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', color: 'rgba(232,221,201,0.7)', wordBreak: 'break-word', maxWidth: '400px', whiteSpace: 'normal' }}>
                              {ec.description || '—'}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => handleEditExtracurricular(ec)}
                                  style={{
                                    background: 'transparent',
                                    color: '#C9A977',
                                    border: '1px solid rgba(201,169,119,0.5)',
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
                                    color: '#A35A6A',
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
              <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.5)', padding: '16px 0' }}>
                No extracurriculars added yet. Add your first activity above.
              </p>
            )}
          </Card>
        </div>

        {/* Awards */}
        <div style={{ marginTop: '32px' }}>
          <Card>
            <Eyebrow>Awards & Honors</Eyebrow>
            <div style={{ marginBottom: '24px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <input
                type="text"
                value={newAward.award_name}
                onChange={(e) => setNewAward({ ...newAward, award_name: e.target.value })}
                placeholder="Award name"
                style={{
                  height: '48px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(201,169,119,0.2)',
                  color: '#E8DDC9',
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
                    border: '1px solid rgba(201,169,119,0.2)',
                    color: '#E8DDC9',
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
                    border: '1px solid rgba(201,169,119,0.2)',
                    color: '#E8DDC9',
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
                  background: addingAward ? 'rgba(201,169,119,0.5)' : '#C9A977',
                  color: '#0B1320',
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
                    <tr style={{ borderBottom: '2px solid rgba(201,169,119,0.3)' }}>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#C9A977' 
                      }}>
                        Award Name
                      </th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#C9A977' 
                      }}>
                        Organization
                      </th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#C9A977' 
                      }}>
                        Year
                      </th>
                      <th style={{ 
                        textAlign: 'right', 
                        padding: '12px 16px', 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#C9A977' 
                      }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {awards.map((award) => (
                      <tr key={award.id} style={{ borderBottom: '1px solid rgba(232,221,201,0.1)' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', color: '#E8DDC9', fontWeight: 500, wordBreak: 'break-word' }}>
                          {award.award_name}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', color: 'rgba(232,221,201,0.7)', wordBreak: 'break-word' }}>
                          {award.organization || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', color: 'rgba(232,221,201,0.7)' }}>
                          {award.year || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => handleRemoveAward(award.id)}
                            style={{
                              background: 'transparent',
                              color: '#A35A6A',
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
              <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.5)', padding: '16px 0' }}>
                No awards added yet. Add your first award above.
              </p>
            )}
          </Card>

          {/* Account deletion. Required by California's Eraser Button law
              for users under 18 and a general CCPA right. Two-step confirm
              prevents accidental clicks. */}
          <div style={{ marginTop: '32px' }}>
          <Card>
            <h2 className="font-heading text-2xl mb-4" style={{ color: '#A35A6A' }}>Delete Account</h2>

            <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.7)', marginBottom: '16px', lineHeight: '1.6' }}>
              Permanently delete your Vantage account and all associated data: your essays, essay versions, Insight Question responses, college list, activities, awards, AI guidance history, and subscription record. This action cannot be undone.
            </p>
            <DeleteAccountButton />
          </Card>
          </div>
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

  const openModal = () => {
    setStage('confirming');
    setConfirmText('');
    setErrorMsg('');
  };

  const closeModal = () => {
    if (stage === 'deleting') return;
    setStage('idle');
    setConfirmText('');
    setErrorMsg('');
  };

  const handleDelete = async () => {
    if (confirmText !== 'DELETE MY ACCOUNT') {
      setErrorMsg('Please type DELETE MY ACCOUNT exactly to confirm.');
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

  return (
    <>
      <button
        onClick={openModal}
        style={{
          background: 'transparent',
          color: '#A35A6A',
          border: '1px solid #A35A6A',
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

      {stage !== 'idle' && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            style={{
              background: '#0B1320',
              border: '1px solid rgba(248,113,113,0.5)',
              borderRadius: '4px',
              padding: '32px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <h3
              id="delete-account-title"
              className="font-heading text-2xl mb-4"
              style={{ color: '#A35A6A' }}
            >
              Permanently Delete Account
            </h3>
            <p
              className="font-body text-sm"
              style={{ color: 'rgba(232,221,201,0.85)', lineHeight: '1.6', marginBottom: '20px' }}
            >
              This will permanently remove your essays, essay versions, Insight Question
              answers, college list, activities, awards, AI guidance history, and subscription
              record. <strong style={{ color: '#A35A6A' }}>This cannot be undone.</strong>
            </p>

            <p
              className="font-body text-sm"
              style={{ color: 'rgba(232,221,201,0.75)', marginBottom: '10px' }}
            >
              Type <strong style={{ color: '#A35A6A' }}>DELETE MY ACCOUNT</strong> to continue:
            </p>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              autoFocus
              disabled={stage === 'deleting'}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(248,113,113,0.5)',
                color: '#E8DDC9',
                borderRadius: '2px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                marginBottom: '16px',
              }}
            />

            {errorMsg && (
              <p className="font-body text-sm" style={{ color: '#A35A6A', marginBottom: '16px' }}>
                {errorMsg}
              </p>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeModal}
                disabled={stage === 'deleting'}
                style={{
                  background: 'transparent',
                  color: 'rgba(232,221,201,0.8)',
                  border: '1px solid rgba(232,221,201,0.3)',
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
              <button
                onClick={handleDelete}
                disabled={stage === 'deleting' || confirmText !== 'DELETE MY ACCOUNT'}
                style={{
                  background:
                    confirmText === 'DELETE MY ACCOUNT' && stage !== 'deleting'
                      ? '#A35A6A'
                      : 'rgba(248,113,113,0.3)',
                  color: '#0B1320',
                  border: 'none',
                  padding: '10px 20px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderRadius: '2px',
                  cursor:
                    confirmText === 'DELETE MY ACCOUNT' && stage !== 'deleting'
                      ? 'pointer'
                      : 'not-allowed',
                }}
              >
                {stage === 'deleting' ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Strategy Profile helpers ---------- */

function ProfileToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        background: checked ? 'rgba(201,169,119,0.08)' : 'rgba(0,0,0,0.2)',
        border: `1px solid ${checked ? 'rgba(201,169,119,0.45)' : 'rgba(232,221,201,0.08)'}`,
        padding: '12px 14px',
        textAlign: 'left',
        cursor: 'pointer',
        width: '100%',
        fontFamily: 'var(--font-body)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          marginTop: '2px',
          width: '16px',
          height: '16px',
          borderRadius: '3px',
          background: checked ? '#C9A977' : 'transparent',
          border: `1px solid ${checked ? '#C9A977' : 'rgba(232,221,201,0.3)'}`,
          color: '#0B1320',
          fontSize: '12px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {checked ? '✓' : ''}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
        <span style={{ color: '#E8DDC9', fontSize: '13px', fontWeight: 500, lineHeight: 1.3 }}>{label}</span>
        {hint && (
          <span style={{ color: 'rgba(232,221,201,0.55)', fontSize: '11.5px', lineHeight: 1.4 }}>{hint}</span>
        )}
      </span>
    </button>
  );
}