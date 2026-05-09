'use client';

import PageHeader from './PageHeader';
import StatusPill from './StatusPill';

interface Props {
  totalSchools: number;
  pillLabel: string;
  pillVariant: 'balanced' | 'imbalanced';
}

export default function StrategyHeader({ totalSchools, pillLabel, pillVariant }: Props) {
  const subtitle =
    totalSchools === 0
      ? 'No schools yet — add a few to see your tier breakdown.'
      : `${totalSchools} ${totalSchools === 1 ? 'school' : 'schools'}, classified across five tiers.`;

  return (
    <PageHeader
      title="Your School List"
      subtitle={subtitle}
      right={
        <StatusPill
          variant={pillVariant === 'balanced' ? 'balanced' : 'warn'}
          label={pillLabel}
        />
      }
    />
  );
}
