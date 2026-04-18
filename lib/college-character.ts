/**
 * College character and values map.
 *
 * Used by the Round Table holistic review to evaluate an application through
 * the lens of what a specific admissions reader at that school actually values.
 *
 * Keys match the `id` column in the `colleges` table (kebab-case).
 *
 * Each entry describes:
 *   - mission: the school's institutional identity in one or two sentences
 *   - looksFor: what admissions readers at this school specifically look for
 *     in an applicant's essays and activities (not academics — that's handled
 *     by SAT/GPA data elsewhere)
 *   - redFlags: things that specifically signal "not a fit" for this school
 *
 * Long-term this should live in a `colleges.character` JSON column in
 * Supabase. Hardcoded here for speed.
 */

export interface CollegeCharacter {
  mission: string;
  looksFor: string;
  redFlags?: string;
}

export const COLLEGE_CHARACTER: Record<string, CollegeCharacter> = {
  'princeton-university': {
    mission:
      'Princeton\'s informal motto is "in the nation\'s service and the service of humanity." It prizes generalist liberal-arts depth, serious intellectual engagement, and undergraduate-focused education within a residential college system.',
    looksFor:
      'Readers look for intellectual seriousness over polish, evidence of thinking deeply about ideas (not just achievements), and a sense that the student will contribute to civic life and scholarly community beyond themselves.',
    redFlags:
      'Pure resume-polishing without intellectual depth. Essays that treat learning as a means to an end rather than something the student loves.',
  },
  'mit': {
    mission:
      'MIT\'s motto is "mens et manus" (mind and hand). It prizes hands-on problem-solving, scientific and engineering rigor, a collaborative and quirky hacking culture, and the drive to use technical work to make the world better.',
    looksFor:
      'Readers look for a specific, obsessive, hands-on passion for making or building something — a project, a product, a piece of research, a community. Evidence that the student builds, not just studies. Collaboration and quirky sense of humor are plusses.',
    redFlags:
      'Generic "I love STEM" framing without a specific obsession. Essays that sound like they were written for a humanities-focused school.',
  },
  'harvard-university': {
    mission:
      'Harvard prizes independence of thought, demonstrated excellence across multiple domains, and the potential for leadership and public contribution at scale.',
    looksFor:
      'Readers look for evidence of original thinking, leadership that has already had tangible impact, and a student who will use their platform after graduation to shape institutions and public life.',
    redFlags:
      'Essays that feel small in ambition, or that read as strong-student-by-the-numbers without a distinct intellectual voice.',
  },
  'stanford-university': {
    mission:
      'Stanford\'s motto is "the wind of freedom blows." It prizes entrepreneurial energy, interdisciplinary curiosity, applied intellectual vitality, and world-changing ambition.',
    looksFor:
      'Readers look for a student who blends curiosity with agency — someone who builds, ships, iterates, and crosses disciplinary boundaries. Playfulness and originality matter.',
    redFlags:
      'Traditional "sit-still-and-study" excellence without evidence of doing. Essays that are intellectually admirable but show no action.',
  },
  'yale-university': {
    mission:
      'Yale prizes intellectual curiosity for its own sake, a rich residential college community, and a strong liberal-arts and humanities tradition.',
    looksFor:
      'Readers look for love of learning independent of outcome, aesthetic sensibility, and a student who will show up for the community — not just the classroom.',
    redFlags:
      'Narrowly pre-professional framing. Essays that treat intellectual life as instrumental.',
  },
  'caltech': {
    mission:
      'Caltech is a small, intense community built around pure scientific rigor and mathematical depth. Honor code. No hiding from hard problems.',
    looksFor:
      'Readers look for evidence of serious scientific or mathematical obsession pursued independently, not just in class. Curiosity about how things work at a fundamental level.',
    redFlags:
      'Any sense of dilettantism or breadth-over-depth. Caltech is unapologetic about wanting specialists.',
  },
  'duke-university': {
    mission:
      'Duke blends Southern residential warmth with serious research ambitions. It prizes leadership with service, intellectual range, and a distinctive sense of school community and athletics.',
    looksFor:
      'Readers look for a student who combines academic seriousness with real social engagement — leadership that shows up in action, not titles, and contribution to communities outside themselves.',
  },
  'johns-hopkins-university': {
    mission:
      'Johns Hopkins is defined by research intensity, a scholar-practitioner model, and particular strength in medicine, public health, and the sciences.',
    looksFor:
      'Readers look for a student who has already started doing something that looks like research — a question pursued, a problem investigated, curiosity turned into work — and an interest in the application of knowledge to human problems.',
  },
  'university-of-chicago': {
    mission:
      'UChicago\'s ethos is "the life of the mind." It prizes intense intellectual seriousness, quirky original thinking, and a culture that takes ideas on their own terms.',
    looksFor:
      'Readers look for a student whose intellectual life runs deeper than their transcript — an idea they have pursued past the point of usefulness, an argument they have with themselves, a distinctive voice on the page.',
    redFlags:
      'Essays that feel resume-driven or polished for admissions. UChicago rewards strangeness and depth over slickness.',
  },
  'brown-university': {
    mission:
      'Brown\'s Open Curriculum makes students the authors of their own education. It prizes intellectual autonomy, social consciousness, and a willingness to cross boundaries.',
    looksFor:
      'Readers look for a student who has already been making choices about what to learn and why, and who thinks seriously about the world beyond school.',
  },
  'columbia-university': {
    mission:
      'Columbia combines the Core Curriculum\'s shared intellectual tradition with the engagement of New York City. It prizes urban, diverse, interdisciplinary intellectualism.',
    looksFor:
      'Readers look for a student who will draw on the city as part of their education — someone whose curiosity extends past the classroom into culture, policy, neighborhoods, and people.',
  },
  'dartmouth-college': {
    mission:
      'Dartmouth is undergraduate-focused, outdoorsy, and close-knit. It prizes genuine community, leadership within groups, and the kind of student who will throw themselves into residential college life.',
    looksFor:
      'Readers look for warmth, communal engagement, physicality, and a student who will show up for their dorm, their team, their trail, and their classmates.',
  },
  'university-of-notre-dame': {
    mission:
      'Notre Dame is rooted in Catholic intellectual tradition and prizes community, service, and the formation of the whole person. Tradition, spirit, and a sense of belonging run deep.',
    looksFor:
      'Readers look for genuine care for others, participation in community, and a student whose values include something larger than individual achievement.',
  },
  'georgetown-university': {
    mission:
      'Georgetown is Jesuit, DC-centered, and globally oriented. It prizes policy engagement, international curiosity, and the Jesuit principle of educating the whole person (cura personalis).',
    looksFor:
      'Readers look for a student engaged with the world — policy, international issues, service — and evidence of reflection that goes beyond achievement.',
  },
  'boston-college': {
    mission:
      'Boston College is a Jesuit, Catholic liberal arts university grounded in the principles of cura personalis (care for the whole person) and "men and women for others." It prizes the formation of mind, heart, and spirit; a strong sense of community; intellectual engagement with a values dimension; and commitment to service and social justice.',
    looksFor:
      'Readers look for evidence that the student cares about questions of meaning, community, and service — not just achievement. They want to see a student who will engage with BC\'s traditions, its residential community, and its invitation to reflect on how one\'s education serves others. Authentic self-reflection, care for others, and a sense of purpose beyond the self are the core signals.',
    redFlags:
      'Essays that are purely self-focused or achievement-driven without a relational or reflective dimension. Treating community as a buzzword rather than a lived experience. A tone that would feel misaligned with a Jesuit liberal arts tradition.',
  },
  'vanderbilt-university': {
    mission:
      'Vanderbilt blends Southern sophistication with academic excellence and social warmth. It prizes a student who is intellectually serious and also a genuine presence in community.',
    looksFor:
      'Readers look for both sharpness and warmth — a student who does the work and shows up for people.',
  },
  'northwestern-university': {
    mission:
      'Northwestern combines Midwestern rigor with applied intellectual practicality. Particular strengths in journalism, business, and performance make it a school for students with specific professional ambitions alongside liberal-arts depth.',
    looksFor:
      'Readers look for specificity — a student who knows what they want to do at Northwestern and can articulate why this school in particular.',
  },
  'university-of-pennsylvania': {
    mission:
      'Penn blends pre-professional orientation (especially Wharton) with liberal-arts depth. It prizes interdisciplinary students who want both rigor and application.',
    looksFor:
      'Readers look for a student who can do serious academic work and also has clear professional direction. Specificity about what they\'d do at Penn matters.',
  },
  'cornell-university': {
    mission:
      'Cornell\'s founding motto is "any person, any study." It contains seven undergraduate colleges with distinct missions, including a land-grant service tradition.',
    looksFor:
      'Readers look for a student whose interests align specifically with one of Cornell\'s colleges, and evidence of real engagement with that field rather than a generic "Ivy League" pitch.',
  },
  'rice-university': {
    mission:
      'Rice is a small residential-college research university in Texas. It prizes close mentorship, intellectual seriousness, and a distinctive culture of unpretentious excellence.',
    looksFor:
      'Readers look for a student who will engage with the residential college system and contribute to Rice\'s tight-knit community, alongside academic rigor.',
  },
  'ucla': {
    mission:
      'UCLA is a California public flagship: a massive research university with a diverse student body and strong connections to creative industries, entertainment, and LA culture.',
    looksFor:
      'Readers at UCLA weigh the California public mission heavily — they look for students who reflect the diversity and ambition of the state and will thrive at scale.',
  },
  'uc-berkeley': {
    mission:
      'Berkeley combines a serious intellectual culture with a deep tradition of public research and social activism. It prizes independence, intellectual courage, and public engagement.',
    looksFor:
      'Readers look for a student with a point of view — someone who is already thinking about how they want to engage with the world and who isn\'t afraid to take a position.',
  },
  'university-of-michigan-ann-arbor': {
    mission:
      'Michigan is a large public research university with strong school spirit and an applied, Midwestern intellectual culture.',
    looksFor:
      'Readers look for a student who will engage at scale — community, school spirit, applied excellence — and who knows why Michigan specifically.',
  },
};

/**
 * Returns a block of text suitable for injecting into a feedback prompt
 * describing the character and values of a specific college. Returns a
 * generic fallback if the college isn't in the map.
 */
export function getCollegeCharacterBlock(
  collegeId: string | null | undefined,
  collegeName: string | null | undefined
): string {
  if (!collegeId) {
    return '';
  }

  const entry = COLLEGE_CHARACTER[collegeId];

  if (!entry) {
    // Generic fallback — still useful even without a specific entry
    return `\n\n===== ${(collegeName || 'THIS COLLEGE').toUpperCase()} — WHAT ADMISSIONS READERS VALUE =====
This school is selective, and the essays need to give a reader a clear, specific picture of who this student is. Generic "I love learning" or "I'm passionate about X" framing without evidence does not land. Readers want to see particularity, self-awareness, and a match with the kind of student who would thrive at this specific institution.`;
  }

  let block = `\n\n===== ${(collegeName || 'THIS COLLEGE').toUpperCase()} — WHAT ADMISSIONS READERS VALUE =====
MISSION & IDENTITY: ${entry.mission}

WHAT THEY LOOK FOR IN APPLICANTS: ${entry.looksFor}`;

  if (entry.redFlags) {
    block += `\n\nRED FLAGS FOR THIS SCHOOL: ${entry.redFlags}`;
  }

  block += `\n\nYour job is to evaluate this application through THIS school's specific lens — not a generic admissions lens. An essay that reads well in general but is off-key for this school's values is not actually a strong essay for THIS application.`;

  return block;
}
