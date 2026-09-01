'use client';

import Navigation from '@/components/Navigation';
import ProfileEditor from '@/components/ProfileEditor';

// Thin wrapper: the full editor now also lives inline on the dashboard;
// this route stays for deep links and muscle memory.
export default function ProfilePage() {
  return (
    <div className="min-h-screen" style={{ background: '#0B1320' }}>
      <Navigation />
      <div style={{ padding: '64px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', marginBottom: '48px' }}>
          <h1 className="font-heading text-5xl mb-4" style={{ color: '#E8DDC9' }}>Academic Profile</h1>
          <p className="font-body text-lg" style={{ color: '#E8DDC9' }}>
            Manage your academic statistics, AP classes, extracurriculars, and awards
          </p>
        </div>
        <ProfileEditor />
      </div>
    </div>
  );
}
