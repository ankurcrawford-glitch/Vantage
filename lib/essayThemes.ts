// Vantage — essay prompt theme clustering ("leverage map")
// ----------------------------------------------------------------------
// Pure logic, no DB or React. Classifies supplemental essay prompts into
// a small set of themes so the essays page can offer a "sort by question"
// view: prompts that ask essentially the same thing, grouped together,
// so one strong draft can be adapted across schools instead of written
// from scratch N times.
//
// Keyword-based on purpose — runs instantly client-side, costs nothing,
// and misclassifying an edge case is harmless (the college view is one
// toggle away). Order matters: first matching theme wins.

export interface EssayTheme {
  key: string;
  name: string;
  hint: string; // the leverage line shown under the theme header
}

export const THEMES: EssayTheme[] = [
  {
    key: 'why-school',
    name: 'Why This School',
    hint: 'Same question, different name in the blank — but never reuse the research. Each answer must prove you know THIS school specifically.',
  },
  {
    key: 'community',
    name: 'Community, Background & Identity',
    hint: 'High leverage: one honest story about where you come from and what you bring usually adapts across all of these.',
  },
  {
    key: 'academic',
    name: 'Academic Interest & Intellectual Curiosity',
    hint: 'One core story about what you love learning and why — retune the school-specific details for each.',
  },
  {
    key: 'activity',
    name: 'Activities & How You Spend Your Time',
    hint: 'Pick your deepest commitment and write it once, well. Trim to each word limit.',
  },
  {
    key: 'growth',
    name: 'Challenge, Disagreement & Growth',
    hint: 'One moment where something was hard or your mind changed — adaptable across all of these.',
  },
  {
    key: 'impact',
    name: 'Leadership, Impact & Problems to Solve',
    hint: 'What do you want to change, and what have you already done about it? One draft flexes across these.',
  },
  {
    key: 'creative',
    name: 'Creative & Short Answers',
    hint: 'These reward personality over polish. Write them fresh — recycling shows.',
  },
  {
    key: 'other',
    name: 'Everything Else',
    hint: 'Prompts that are their own thing — read each carefully.',
  },
];

const RULES: { key: string; patterns: RegExp[] }[] = [
  {
    key: 'why-school',
    patterns: [
      /why (do you want|are you (applying|interested)|have you chosen|would you choose|.{0,30}(attend|apply))/i,
      /(interest|interested) in (attending|applying|pursuing your interest)/i,
      /why .{0,40}(university|college|school|us)\b.{0,10}\?/i,
      /good fit for you/i,
      /(motivated|led) you to apply/i,
      /how did you (first )?learn about/i,
      /what specific aspects of our (community|campus|school)/i,
      /explain why you want to attend/i,
    ],
  },
  {
    key: 'community',
    patterns: [
      /\b(communit(y|ies))\b.{0,80}(belong|shaped|part of|identify|describe|contribute)/i,
      /(background|identity|lived experience|upbringing|culture|heritage)\b/i,
      /grown up|context in which you have grown/i,
      /neighbors|residential environment|roommate/i,
      /perspectives? (different|diverse)|viewpoint diversity/i,
      /what would you bring to/i,
    ],
  },
  {
    key: 'academic',
    patterns: [
      /\b(major|field of study|academic (interest|area|program)|intended (area|major))\b/i,
      /intellectual|curiosity|curious|fascinat/i,
      /love (of|for) learning|excites? you academically/i,
      /(topic|idea|concept|question) that (engages|excites|interests)/i,
      /research (opportunit|interest)/i,
      /what do you (hope|want) to study/i,
      /drives your interest in pursuing/i,
    ],
  },
  {
    key: 'activity',
    patterns: [
      /\b(extracurricular|activit(y|ies))\b.{0,60}(meaningful|important|significant|elaborate|describe)/i,
      /outside (of )?the classroom/i,
      /how (do )?you spend (your )?(free )?time/i,
      /\b(hobby|hobbies|pursuit|passion project)\b/i,
      /talent|skill.{0,30}(proud|developed)/i,
    ],
  },
  {
    key: 'growth',
    patterns: [
      /\b(challenge|obstacle|setback|failure|adversity|difficult)\b/i,
      /(changed|changing) (your|their) (mind|attitude|belief|behavior)/i,
      /disagree|debate|conflict|uncomfortable/i,
      /(learned|grew|growth) from/i,
      /asking for help/i,
      /risk you('ve| have)? taken/i,
    ],
  },
  {
    key: 'impact',
    patterns: [
      /\b(leader|leadership)\b/i,
      /impact (you|on)|make (an|a positive) (impact|difference)/i,
      /problems? you want to solve|challenge facing/i,
      /change the world|better world|greater good|common good/i,
      /contribut(e|ion|ing) to (your|our|the)/i,
      /\bmission\b.{0,60}(align|mind)/i,
      /service|volunteer/i,
    ],
  },
  {
    key: 'creative',
    patterns: [
      /time machine|trade lives|invent|superpower|dinner (guest|party)/i,
      /podcast|playlist|soundtrack|song|book(s)? (that|you)/i,
      /what('s| is) something great happening/i,
      /surprise|quirky|fun fact|make you laugh|bring(s)? you joy/i,
      /fill in (each|the) blank/i,
      /letter to your (future|younger)/i,
      /if you could/i,
    ],
  },
];

/** Classify one prompt's text into a theme key. */
export function classifyPrompt(promptText: string): string {
  const text = (promptText || '').slice(0, 1200);
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(text))) return rule.key;
  }
  return 'other';
}

export function themeByKey(key: string): EssayTheme {
  return THEMES.find((t) => t.key === key) || THEMES[THEMES.length - 1];
}
