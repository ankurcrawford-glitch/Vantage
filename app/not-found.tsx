import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-8 py-24"
      style={{ background: '#0B1320' }}
    >
      <div style={{ width: '100%', maxWidth: '520px', textAlign: 'center' }}>
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="font-heading text-3xl font-semibold" style={{ color: '#E8DDC9' }}>
            VANTAGE
          </span>
          <span className="text-3xl" style={{ color: '#C9A977' }}>
            .
          </span>
        </div>
        <p
          className="font-body text-sm mb-3"
          style={{ color: '#C9A977', letterSpacing: '0.15em', textTransform: 'uppercase' }}
        >
          404
        </p>
        <h1 className="font-heading text-4xl font-semibold mb-4" style={{ color: '#E8DDC9' }}>
          This page could not be found
        </h1>
        <p
          className="font-body mb-10"
          style={{ color: 'rgba(232,221,201,0.7)', lineHeight: 1.7 }}
        >
          The path you followed is not part of Vantage. Return home to continue.
        </p>
        <Link
          href="/"
          className="font-body"
          style={{
            display: 'inline-block',
            background: '#C9A977',
            color: '#0B1320',
            padding: '14px 32px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
