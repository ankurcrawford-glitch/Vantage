'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Button from '@/components/Button';
import Card from '@/components/Card';

interface UserStats {
  gpa_weighted: number | null;
  gpa_unweighted: number | null;
  sat_score: number | null;
  act_score: number | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [collegeCount, setCollegeCount] = useState(0);
  const [essayCount, setEssayCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadDashboardData();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    } else {
      setUser(user);
    }
  };

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load stats
      const { data: statsData } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (statsData) {
        setStats(statsData);
      }

      // Load college count
      const { count: collegeCountData } = await supabase
        .from('user_colleges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setCollegeCount(collegeCountData || 0);

      // Load essay count
      const { count: essayCountData } = await supabase
        .from('essays')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setEssayCount(essayCountData || 0);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="text-gold-leaf font-body">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight">
      {/* Navigation */}
      <nav className="border-b border-white/10 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-heading text-2xl font-semibold text-white">VANTAGE</span>
            <span className="text-gold-leaf text-2xl">.</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/colleges" className="font-body text-sm text-white/70 hover:text-gold-leaf transition-colors">
              Portfolio
            </Link>
            <Link href="/personal-statement" className="font-body text-sm text-white/70 hover:text-gold-leaf transition-colors">
              Essays
            </Link>
            <Link href="/profile" className="font-body text-sm text-white/70 hover:text-gold-leaf transition-colors">
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="font-body text-sm text-white/70 hover:text-gold-leaf transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="font-heading text-5xl text-white mb-4">
            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}
          </h1>
          <p className="font-body text-gold-light text-lg">
            Your admissions command center
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl text-gold-leaf">Colleges</h3>
              <span className="text-3xl">◆</span>
            </div>
            <p className="font-heading text-4xl text-white mb-2">{collegeCount}</p>
            <p className="font-body text-sm text-white/70">In your portfolio</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl text-gold-leaf">Essays</h3>
              <span className="text-3xl">▲</span>
            </div>
            <p className="font-heading text-4xl text-white mb-2">{essayCount}</p>
            <p className="font-body text-sm text-white/70">In progress</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl text-gold-leaf">Progress</h3>
              <span className="text-3xl">■</span>
            </div>
            <p className="font-heading text-4xl text-white mb-2">
              {collegeCount > 0 ? Math.round((essayCount / (collegeCount * 2)) * 100) : 0}%
            </p>
            <p className="font-body text-sm text-white/70">Complete</p>
          </Card>
        </div>

        {/* Academic Stats */}
        {stats && (
          <div className="mb-12">
            <h2 className="font-heading text-3xl text-white mb-6">Academic Profile</h2>
            <Card>
              <div className="grid md:grid-cols-4 gap-6">
                {stats.gpa_weighted && (
                  <div>
                    <p className="font-body text-sm text-white/70 mb-1">Weighted GPA</p>
                    <p className="font-heading text-2xl text-gold-leaf">{stats.gpa_weighted}</p>
                  </div>
                )}
                {stats.gpa_unweighted && (
                  <div>
                    <p className="font-body text-sm text-white/70 mb-1">Unweighted GPA</p>
                    <p className="font-heading text-2xl text-gold-leaf">{stats.gpa_unweighted}</p>
                  </div>
                )}
                {stats.sat_score && (
                  <div>
                    <p className="font-body text-sm text-white/70 mb-1">SAT Score</p>
                    <p className="font-heading text-2xl text-gold-leaf">{stats.sat_score}</p>
                  </div>
                )}
                {stats.act_score && (
                  <div>
                    <p className="font-body text-sm text-white/70 mb-1">ACT Score</p>
                    <p className="font-heading text-2xl text-gold-leaf">{stats.act_score}</p>
                  </div>
                )}
              </div>
              <Link href="/profile" className="inline-block mt-6">
                <Button variant="secondary">Edit Profile</Button>
              </Link>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="font-heading text-3xl text-white mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/colleges">
              <Card className="cursor-pointer hover:bg-royal-blue/80 transition-colors">
                <h3 className="font-heading text-xl text-gold-leaf mb-3">Add Colleges</h3>
                <p className="font-body text-white/70 text-sm">
                  Build your portfolio of target schools
                </p>
              </Card>
            </Link>

            <Link href="/common-app">
              <Card className="cursor-pointer hover:bg-royal-blue/80 transition-colors">
                <h3 className="font-heading text-xl text-gold-leaf mb-3">Start Common App Essay</h3>
                <p className="font-body text-white/70 text-sm">
                  Choose a prompt and begin writing 
                </p>
              </Card>
            </Link>

            <Link href="/profile">
              <Card className="cursor-pointer hover:bg-royal-blue/80 transition-colors">
                <h3 className="font-heading text-xl text-gold-leaf mb-3">Update Profile</h3>
                <p className="font-body text-white/70 text-sm">
                  Edit your stats and activities
                </p>
              </Card>
            </Link>
          </div>
        </div>

        {/* Upcoming Deadlines (placeholder) */}
        <div className="mt-12">
          <h2 className="font-heading text-3xl text-white mb-6">Upcoming Deadlines</h2>
          <Card>
            <p className="font-body text-white/70 text-center py-8">
              No upcoming deadlines. Add colleges to see deadlines.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}