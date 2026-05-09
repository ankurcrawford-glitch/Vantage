'use client';

import { type EdRecommendation } from '@/lib/edStrategy';
import { type StudentProfile } from '@/lib/classifier';

interface Props {
  strategy: EdRecommendation;
  profile: StudentProfile;
}

export default function EdStrategyPanel({ strategy, profile }: Props) {
  const {
    recommended,
    recommendedShiftedBucket,
    recommendedRatio,
    alternatives,
    donts,
    hookNotes,
    noEdSchools,
    scored,
  } = strategy;
  const hasAnyEdEligible = scored.length > 0;
  const athleteFirst = profile.hooks.recruitedAthlete;

  return (
    <div
      style={{
        background: 'rgba(11,19,32, 0.55)',
        border: '1px solid rgba(232,221,201, 0.18)',
        borderRadius: '6px',
        padding: '32px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div>
          <div
            className="font-body"
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.22em',
              color: '#C9A977',
            }}
          >
            Your ED Strategy
          </div>
          <h2
            className="font-heading"
            style={{
              color: '#E8DDC9',
              fontSize: '34px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              margin: '10px 0 0 0',
            }}
          >
            Where to play your one binding card.
          </h2>
          <div
            style={{
              width: '90px',
              height: '1px',
              background: 'rgba(232,221,201, 0.35)',
              marginTop: '14px',
            }}
          />
        </div>

        {/* Athlete-first lead */}
        {athleteFirst && hookNotes[0] && (
          <Block tinted>
            <Eyebrow>Coach's call first</Eyebrow>
            <p
              className="font-body"
              style={{
                color: 'rgba(232,221,201, 0.88)',
                fontSize: '14px',
                lineHeight: 1.6,
                margin: '6px 0 0 0',
              }}
            >
              {hookNotes[0]}
            </p>
          </Block>
        )}

        {/* No ED-eligible at all */}
        {!hasAnyEdEligible && (
          <Block>
            <h4
              className="font-heading"
              style={{ color: '#E8DDC9', fontSize: '20px', fontWeight: 600, margin: 0 }}
            >
              No ED-eligible schools in your current list.
            </h4>
            <p
              className="font-body"
              style={{
                color: 'rgba(232,221,201, 0.6)',
                fontSize: '14px',
                lineHeight: 1.6,
                margin: '8px 0 0 0',
              }}
            >
              ED requires a binding commitment to one specific school. Consider adding an ED-binding
              school you'd be excited to attend — it's the single biggest lever you have in this process.
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
            <h4
              className="font-heading"
              style={{ color: '#E8DDC9', fontSize: '20px', fontWeight: 600, margin: 0 }}
            >
              No clear ED play in your current list.
            </h4>
            <p
              className="font-body"
              style={{
                color: 'rgba(232,221,201, 0.6)',
                fontSize: '14px',
                lineHeight: 1.6,
                margin: '8px 0 0 0',
              }}
            >
              The ED-eligible schools on your list either remain Hard Reaches even with the ED bump,
              or are tiers where you don't need binding leverage. Adding a Reach-tier school where
              you'd commit wholeheartedly is the smartest next move.
            </p>
          </Block>
        )}

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Eyebrow muted>Alternatives</Eyebrow>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {alternatives.map((alt) => {
                const ratio =
                  alt.college.ed_admit_rate && alt.college.acceptance_rate
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
                      background: 'rgba(11,19,32, 0.5)',
                      border: '1px solid rgba(232,221,201, 0.14)',
                      borderRadius: '4px',
                      padding: '14px 18px',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        className="font-heading"
                        style={{
                          color: '#E8DDC9',
                          fontSize: '20px',
                          fontWeight: 600,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {alt.college.name}
                      </div>
                      <p
                        className="font-body"
                        style={{
                          color: 'rgba(232,221,201, 0.6)',
                          fontSize: '13px',
                          lineHeight: 1.55,
                          margin: '4px 0 0 0',
                        }}
                      >
                        ED here is roughly{' '}
                        <span style={{ color: '#C9A977' }}>{ratio.toFixed(1)}× your odds</span>{' '}(
                        {((alt.college.ed_admit_rate ?? 0) * 100).toFixed(0)}% ED vs{' '}
                        {((alt.college.acceptance_rate ?? 0) * 100).toFixed(0)}% RD).
                      </p>
                    </div>
                    <span
                      className="font-body"
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        color: 'rgba(232,221,201, 0.55)',
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
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {donts.map((d) => (
                <li
                  key={d.school.college.id}
                  className="font-body"
                  style={{
                    fontSize: '13px',
                    color: 'rgba(232,221,201, 0.65)',
                    lineHeight: 1.55,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      marginTop: '7px',
                      width: '4px',
                      height: '4px',
                      borderRadius: '999px',
                      background: 'rgba(232,221,201, 0.4)',
                      flexShrink: 0,
                    }}
                  />
                  <span>
                    <span style={{ color: '#E8DDC9', fontWeight: 600 }}>{d.school.college.name}</span>
                    {' — '}
                    {d.reason}
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
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {hookNotes.slice(athleteFirst ? 1 : 0).map((note, i) => (
                <li
                  key={i}
                  className="font-body"
                  style={{
                    fontSize: '13px',
                    color: 'rgba(232,221,201, 0.85)',
                    lineHeight: 1.55,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      marginTop: '6px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '999px',
                      background: '#C9A977',
                      flexShrink: 0,
                    }}
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
            style={{
              paddingTop: '4px',
              fontSize: '12px',
              color: 'rgba(232,221,201, 0.5)',
              fontStyle: 'italic',
              lineHeight: 1.55,
            }}
          >
            <span
              style={{
                fontStyle: 'normal',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                fontSize: '10px',
                color: 'rgba(232,221,201, 0.45)',
                marginRight: '8px',
              }}
            >
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

function Block({ children, tinted }: { children: React.ReactNode; tinted?: boolean }) {
  return (
    <div
      style={{
        background: tinted ? 'rgba(201,169,119, 0.05)' : 'rgba(11,19,32, 0.5)',
        border: '1px solid rgba(232,221,201, 0.16)',
        borderRadius: '4px',
        padding: '18px 22px',
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
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: muted ? '0.18em' : '0.22em',
        color: muted ? 'rgba(232,221,201, 0.55)' : '#C9A977',
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

  const taglineMain =
    ratio >= 2.5
      ? `ED here roughly ${ratio.toFixed(1)}× your odds`
      : `ED here lifts your odds ~${ratio.toFixed(1)}×`;

  const shiftLine =
    shiftedBucket && shiftedBucket !== bucket
      ? `Under ED, the bump moves this from ${bucket} into ${shiftedBucket} territory.`
      : `It stays a ${bucket}, but the ED admit rate is materially higher than RD.`;
  const ratioLine = `${edPct}% ED vs ${rdPct}% RD — that gap is the leverage you're cashing in.`;
  const commitLine =
    "Only ED here if you'd genuinely enroll without seeing other offers — ED is binding.";

  return (
    <div
      style={{
        background: 'rgba(11,19,32, 0.45)',
        border: '1px solid rgba(232,221,201, 0.18)',
        borderRadius: '4px',
        padding: '28px 30px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <Eyebrow>Recommended ED</Eyebrow>
        <span
          className="font-body"
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#C98E99',
            background: 'rgba(163, 90, 106, 0.14)',
            border: '1px solid rgba(163, 90, 106, 0.45)',
            padding: '4px 12px',
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
          color: '#E8DDC9',
          fontSize: '40px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          margin: '12px 0 0 0',
        }}
      >
        {college.name}
      </h3>
      <p
        className="font-body"
        style={{
          color: 'rgba(232,221,201, 0.55)',
          fontSize: '13px',
          margin: '6px 0 0 0',
        }}
      >
        {college.location}
      </p>

      <div
        style={{
          marginTop: '20px',
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: '8px',
          background: 'transparent',
          border: '1px solid rgba(201,169,119, 0.45)',
          borderRadius: '4px',
          padding: '10px 18px',
        }}
      >
        <span
          className="font-heading"
          style={{
            color: '#C9A977',
            fontSize: '17px',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {taglineMain}
        </span>
      </div>

      <div
        className="font-body"
        style={{
          marginTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '14px',
          color: 'rgba(232,221,201, 0.82)',
          lineHeight: 1.65,
        }}
      >
        <p style={{ margin: 0 }}>{shiftLine}</p>
        <p style={{ margin: 0 }}>{ratioLine}</p>
        <p style={{ margin: 0, color: 'rgba(232,221,201, 0.55)', fontStyle: 'italic' }}>
          {commitLine}
        </p>
      </div>
    </div>
  );
}
