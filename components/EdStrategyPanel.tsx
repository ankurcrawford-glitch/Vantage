'use client';

import { type EdRecommendation } from '@/lib/edStrategy';
import { type StudentProfile } from '@/lib/classifier';

interface Props {
  strategy: EdRecommendation;
  profile: StudentProfile;
}

export default function EdStrategyPanel({ strategy, profile }: Props) {
  const { recommended, recommendedShiftedBucket, recommendedRatio, alternatives, donts, hookNotes, noEdSchools, scored } = strategy;
  const hasAnyEdEligible = scored.length > 0;
  const athleteFirst = profile.hooks.recruitedAthlete;

  return (
    <div
      style={{
        position: 'relative',
        background: '#152C45',
        borderLeft: '3px solid #D4AF37',
        borderTop: '1px solid rgba(212,175,55,0.25)',
        borderRight: '1px solid rgba(212,175,55,0.15)',
        borderBottom: '1px solid rgba(212,175,55,0.15)',
        padding: '32px',
        boxShadow: '0 8px 24px -8px rgba(212,175,55,0.18)',
        overflow: 'hidden',
      }}
    >
      {/* radial gold accent */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.05,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at 12% 0%, #D4AF37 0%, transparent 55%)',
        }}
      />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div>
          <div
            className="font-body"
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.22em',
              color: '#D4AF37',
            }}
          >
            Your ED Strategy
          </div>
          <h2
            className="font-heading"
            style={{
              color: 'white',
              fontSize: '32px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              marginTop: '8px',
              lineHeight: 1.2,
              margin: '8px 0 0 0',
            }}
          >
            Where to play your one binding card.
          </h2>
          <div
            style={{
              width: '80px',
              height: '2px',
              background: '#D4AF37',
              marginTop: '14px',
            }}
          />
        </div>

        {/* Athlete-first lead */}
        {athleteFirst && hookNotes[0] && (
          <Block borderColor="#D4AF37" tinted>
            <Eyebrow>Coach's call first</Eyebrow>
            <p className="font-body" style={{ color: 'rgba(255,255,255,0.92)', fontSize: '14px', lineHeight: 1.6, margin: '6px 0 0 0' }}>
              {hookNotes[0]}
            </p>
          </Block>
        )}

        {/* No ED-eligible at all */}
        {!hasAnyEdEligible && (
          <Block>
            <h4 className="font-heading" style={{ color: 'white', fontSize: '18px', fontWeight: 600, margin: 0 }}>
              No ED-eligible schools in your current list.
            </h4>
            <p className="font-body" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', marginTop: '8px', lineHeight: 1.6, margin: '8px 0 0 0' }}>
              ED requires a binding commitment to one specific school. Consider adding an ED-binding school you'd be excited to attend — it's the single biggest lever you have in this process.
            </p>
          </Block>
        )}

        {/* Recommended */}
        {hasAnyEdEligible && recommended && (
          <RecommendedBlock
            classification={recommended}
            ratio={recommendedRatio ?? 1}
            shiftedBucket={recommendedShiftedBucket}
          />
        )}

        {/* No clear pick */}
        {hasAnyEdEligible && !recommended && (
          <Block>
            <h4 className="font-heading" style={{ color: 'white', fontSize: '18px', fontWeight: 600, margin: 0 }}>
              No clear ED play in your current list.
            </h4>
            <p className="font-body" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', marginTop: '8px', lineHeight: 1.6, margin: '8px 0 0 0' }}>
              The ED-eligible schools on your list either remain Hard Reaches even with the ED bump, or are tiers where you don't need binding leverage. Adding a Reach-tier school where you'd commit wholeheartedly is the smartest next move.
            </p>
          </Block>
        )}

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Eyebrow muted>Alternatives</Eyebrow>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alternatives.map((alt) => {
                const ratio = alt.college.ed_admit_rate && alt.college.acceptance_rate
                  ? alt.college.ed_admit_rate / Math.max(0.001, alt.college.acceptance_rate)
                  : 1;
                return (
                  <li
                    key={alt.college.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '16px',
                      background: 'rgba(11, 22, 35, 0.4)',
                      border: '1px solid rgba(212,175,55,0.18)',
                      padding: '12px 16px',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div className="font-heading" style={{ color: 'white', fontSize: '17px', fontWeight: 600, letterSpacing: '-0.01em' }}>
                        {alt.college.name}
                      </div>
                      <p className="font-body" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12.5px', marginTop: '4px', lineHeight: 1.5, margin: '4px 0 0 0' }}>
                        ED here is roughly{' '}
                        <span style={{ color: '#F3E5AB' }}>{ratio.toFixed(1)}× your odds</span>
                        {' '}({((alt.college.ed_admit_rate ?? 0) * 100).toFixed(0)}% ED vs {((alt.college.acceptance_rate ?? 0) * 100).toFixed(0)}% RD).
                      </p>
                    </div>
                    <span
                      className="font-body"
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'rgba(255,255,255,0.55)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {alt.bucket}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Don'ts */}
        {donts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Eyebrow muted>Don't ED to</Eyebrow>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {donts.map((d) => (
                <li
                  key={d.school.college.id}
                  className="font-body"
                  style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.65)',
                    lineHeight: 1.5,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{ marginTop: '7px', width: '4px', height: '4px', borderRadius: '999px', background: 'rgba(255,255,255,0.35)', flexShrink: 0 }}
                  />
                  <span>
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{d.school.college.name}</span>
                    {' — '}{d.reason}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Hook notes */}
        {hookNotes.length > (athleteFirst ? 1 : 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Eyebrow muted>Notes for your profile</Eyebrow>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {hookNotes.slice(athleteFirst ? 1 : 0).map((note, i) => (
                <li
                  key={i}
                  className="font-body"
                  style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.85)',
                    lineHeight: 1.5,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{ marginTop: '6px', width: '6px', height: '6px', borderRadius: '999px', background: '#D4AF37', flexShrink: 0 }}
                  />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No-ED schools */}
        {noEdSchools.length > 0 && (
          <div
            className="font-body"
            style={{ paddingTop: '4px', fontSize: '11.5px', color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}
          >
            <span style={{ fontStyle: 'normal', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginRight: '8px' }}>
              No ED option:
            </span>
            {noEdSchools
              .map((c) => {
                const rounds = (c.college.available_rounds ?? ['RD']).filter((r) => r !== 'RD');
                const tag = rounds.length > 0 ? ` (${rounds.join('/')} only)` : '';
                return `${c.college.name}${tag}`;
              })
              .join(' · ')}
          </div>
        )}
      </div>
    </div>
  );
}

function Block({ children, borderColor, tinted }: { children: React.ReactNode; borderColor?: string; tinted?: boolean }) {
  return (
    <div
      style={{
        background: tinted ? 'rgba(212,175,55,0.05)' : 'rgba(11,22,35,0.4)',
        border: `1px solid ${borderColor ? 'rgba(212,175,55,0.4)' : 'rgba(212,175,55,0.18)'}`,
        padding: '16px 20px',
      }}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <div
      className="font-body"
      style={{
        fontSize: '10.5px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: muted ? '0.18em' : '0.22em',
        color: muted ? 'rgba(255,255,255,0.55)' : '#D4AF37',
      }}
    >
      {children}
    </div>
  );
}

function RecommendedBlock({
  classification,
  ratio,
  shiftedBucket,
}: {
  classification: import('@/lib/classifier').SchoolClassification;
  ratio: number;
  shiftedBucket?: import('@/lib/classifier').Tier;
}) {
  const { college, bucket } = classification;
  const edPct = ((college.ed_admit_rate ?? 0) * 100).toFixed(0);
  const rdPct = ((college.acceptance_rate ?? 0) * 100).toFixed(0);

  const taglineMain = ratio >= 2.5
    ? `ED here roughly ${ratio.toFixed(1)}× your odds`
    : `ED here lifts your odds ~${ratio.toFixed(1)}×`;

  const shiftLine = shiftedBucket && shiftedBucket !== bucket
    ? `Under ED, the bump moves this from ${bucket} into ${shiftedBucket} territory.`
    : `It stays a ${bucket}, but the ED admit rate is materially higher than RD.`;
  const ratioLine = `${edPct}% ED vs ${rdPct}% RD — that gap is the leverage you're cashing in.`;
  const commitLine = "Only ED here if you'd genuinely enroll without seeing other offers — ED is binding.";

  return (
    <div
      style={{
        position: 'relative',
        background: 'rgba(212,175,55,0.04)',
        border: '1px solid rgba(212,175,55,0.3)',
        boxShadow: '0 0 0 1px rgba(212,175,55,0.10) inset',
        padding: '24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <Eyebrow>Recommended ED</Eyebrow>
        <span
          className="font-body"
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#FBBF24',
            background: 'rgba(251, 191, 36, 0.15)',
            padding: '4px 10px',
            borderRadius: '999px',
            whiteSpace: 'nowrap',
          }}
        >
          {bucket}
        </span>
      </div>

      <h3
        className="font-heading"
        style={{
          color: 'white',
          fontSize: '36px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          marginTop: '8px',
          lineHeight: 1.15,
          margin: '8px 0 0 0',
        }}
      >
        {college.name}
      </h3>
      <p className="font-body" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
        {college.location}
      </p>

      <div
        style={{
          marginTop: '16px',
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: '8px',
          background: 'rgba(11,22,35,0.4)',
          border: '1px solid rgba(212,175,55,0.3)',
          padding: '8px 14px',
        }}
      >
        <span
          className="font-heading"
          style={{ color: '#D4AF37', fontSize: '17px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
        >
          {taglineMain}
        </span>
      </div>

      <div className="font-body" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
        <p style={{ margin: 0 }}>{shiftLine}</p>
        <p style={{ margin: 0 }}>{ratioLine}</p>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>{commitLine}</p>
      </div>
    </div>
  );
}
