// Vantage — Foundations → application-side intelligence bridge
// ----------------------------------------------------------------------
// Years of Foundations work (counselor narrative, tracked activities,
// monthly Spark reflections) become context for the senior-year essay
// AI: Strategic Intelligence (thinking-partner) and the Round Table.
// The kid who journaled honestly in 9th grade gets essay coaching that
// actually knows them.
//
// Best-effort by design: returns '' on any error or when the student
// has no Foundations history — callers append it without guarding.

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function buildFoundationsBridge(supabase: any, userId: string): Promise<string> {
  try {
    const [statsRes, actsRes, sparksRes] = await Promise.all([
      supabase
        .from('user_stats')
        .select('narrative_summary')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('foundations_activities')
        .select('name, role, depth, thread, trajectory, since')
        .eq('user_id', userId)
        .eq('confirmed', true)
        .order('depth', { ascending: false })
        .limit(10),
      supabase
        .from('foundations_spark_entries')
        .select('month_key, prompt, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(8),
    ]);

    const parts: string[] = [];

    const summary = statsRes?.data?.narrative_summary;
    if (summary) {
      parts.push(`COUNSELOR'S NARRATIVE (distilled from years of conversations):\n${String(summary).slice(0, 1200)}`);
    }

    const acts = actsRes?.data || [];
    if (acts.length) {
      const lines = acts.map((a: any) => {
        const bits = [
          String(a.name || '').slice(0, 60),
          a.role ? String(a.role).slice(0, 40) : '',
          a.since ? `since ${String(a.since).slice(0, 20)}` : '',
          a.depth ? `depth ${a.depth}/5` : '',
          a.thread ? `thread: ${String(a.thread).slice(0, 40)}` : '',
        ].filter(Boolean);
        const traj = a.trajectory ? `\n  next step they named: ${String(a.trajectory).slice(0, 120)}` : '';
        return '- ' + bits.join(' · ') + traj;
      });
      parts.push('LONG-TERM ACTIVITY THREADS (tracked across high school — depth and trajectory, not just titles):\n' + lines.join('\n'));
    }

    const sparks = sparksRes?.data || [];
    if (sparks.length) {
      const lines = sparks.map(
        (s: any) =>
          `[${s.month_key}] "${String(s.prompt || '').slice(0, 100)}"\n  → ${String(s.content || '').slice(0, 350)}`
      );
      parts.push(
        'SPARK REFLECTIONS (a private monthly journal, raw and unedited — this is the student\'s most authentic voice. ' +
          'Mine these for essay ideas: specific moments, real feelings, changed minds, things they\'d never think to brag about):\n' +
          lines.join('\n')
      );
    }

    if (parts.length === 0) return '';

    return `\n\nMULTI-YEAR BACKGROUND FROM VANTAGE FOUNDATIONS (private scaffolding gathered since 9th grade — same rules as the brainstorming notes: NEVER submitted to any college, never flag overlap with essays as duplication; overlap means the student is using their own raw material, which is exactly right. Use this to suggest specific, true stories and details the student may have forgotten they have):

${parts.join('\n\n')}`;
  } catch (err) {
    console.error('buildFoundationsBridge error:', err);
    return '';
  }
}
