'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Sub-navigation rendered inside the "Applications" parent tab — switches
 * between Essays and Common App.
 */
export default function ApplicationsSubNav() {
  const pathname = usePathname();
  const isEssays = pathname.startsWith('/personal-statement') || pathname.startsWith('/essays');
  const isCommonApp = pathname.startsWith('/common-app');

  const tabStyle = (active: boolean): React.CSSProperties => ({
    color: active ? '#C9A977' : 'rgba(232,221,201, 0.6)',
    textDecoration: 'none',
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '12px 0',
    borderBottom: active ? '2px solid #C9A977' : '2px solid transparent',
    marginBottom: '-1px',
  });

  return (
    <div
      style={{
        borderBottom: '1px solid rgba(232,221,201, 0.1)',
        padding: '0 32px',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
        }}
      >
        <Link href="/personal-statement" style={tabStyle(isEssays)}>
          Essays
        </Link>
        <Link href="/common-app" style={tabStyle(isCommonApp)}>
          Common App
        </Link>
      </div>
    </div>
  );
}
