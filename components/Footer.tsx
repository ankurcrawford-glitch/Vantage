import Link from 'next/link';

/**
 * Global footer with legal links. Rendered on every page via app/layout.tsx.
 * Deliberately minimal — we don't want a large footer competing with the
 * primary UI; the goal is just to make Terms and Privacy discoverable.
 */
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '24px 32px',
        background: '#0B1623',
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          © {year} Vantage. All rights reserved.
        </span>
        <nav style={{ display: 'flex', gap: '24px' }}>
          <Link
            href="/terms"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.6)',
              textDecoration: 'none',
            }}
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.6)',
              textDecoration: 'none',
            }}
          >
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
