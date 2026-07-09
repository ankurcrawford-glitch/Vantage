// Shared Round Table gate logic. Used by both the API route and the
// school page UI so the lock state on screen always matches what the
// server would actually enforce. Round Table is a final-stage tool —
// for "almost ready to submit," not first-draft review — so the gate
// requires every supplemental to look genuinely refined.

export const ROUND_TABLE_WORD_RATIO = 0.8; // essay must be at least this share of its word limit
export const ROUND_TABLE_MIN_VERSIONS = 2; // and have at least this many saved versions

export interface PromptReadiness {
  promptId: string;
  promptOrder: number;
  promptLabel: string; // "Prompt 1", "Prompt 2", etc.
  wordLimit: number | null;
  wordCount: number;
  versionCount: number;
  wordTarget: number | null; // wordLimit * ROUND_TABLE_WORD_RATIO, ceiled. Null if no limit set.
  meetsWords: boolean;
  meetsVersions: boolean;
  started: boolean; // essay has any current content at all
  ready: boolean; // meetsWords && meetsVersions
}

export function evaluatePromptReadiness(input: {
  promptId: string;
  promptOrder: number;
  wordLimit: number | null;
  wordCount: number;
  versionCount: number;
  hasContent: boolean;
}): PromptReadiness {
  const { promptId, promptOrder, wordLimit, wordCount, versionCount, hasContent } = input;
  const wordTarget = wordLimit ? Math.ceil(wordLimit * ROUND_TABLE_WORD_RATIO) : null;
  // If no word limit is set, fall back to "has some content" — better
  // than blocking forever on prompts with no limit metadata.
  const meetsWords = wordTarget ? wordCount >= wordTarget : hasContent;
  const meetsVersions = versionCount >= ROUND_TABLE_MIN_VERSIONS;
  return {
    promptId,
    promptOrder,
    promptLabel: `Prompt ${promptOrder}`,
    wordLimit,
    wordCount,
    versionCount,
    wordTarget,
    meetsWords,
    meetsVersions,
    started: hasContent,
    ready: meetsWords && meetsVersions,
  };
}

export function allReady(items: PromptReadiness[]): boolean {
  if (items.length === 0) return false;
  return items.every((r) => r.ready);
}
