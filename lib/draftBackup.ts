// lib/draftBackup.ts
//
// Local (browser-only) backup of unsaved essay text. The editors mirror the
// textarea into localStorage while it differs from the last confirmed save,
// and clear it once the database has the same text. On load, if a backup
// exists that the server does not have, the editor offers to restore it.
//
// This is insurance against a closed tab, a crash, or a dropped connection
// between autosaves. It is per browser and per user; it is not a server
// backup. Every call is wrapped so a blocked or full localStorage can never
// break the editor.

export interface DraftBackup {
  content: string;
  at: number; // epoch ms
}

export function draftBackupKey(userId: string, essayKey: string): string {
  return `vantage:draft:${userId}:${essayKey}`;
}

export function readDraftBackup(key: string): DraftBackup | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.content !== "string" || typeof parsed?.at !== "number") return null;
    return parsed as DraftBackup;
  } catch {
    return null;
  }
}

export function writeDraftBackup(key: string, content: string): void {
  try {
    window.localStorage.setItem(key, JSON.stringify({ content, at: Date.now() }));
  } catch {
    // Quota exceeded or storage blocked — nothing to do; the server autosave
    // is still the primary path.
  }
}

export function clearDraftBackup(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
