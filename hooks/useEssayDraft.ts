'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { EssaySaveQueue, countEssayWords } from '@/lib/essay-save-queue';

export interface DraftVersion {
  id: string; version_number: number; content: string; word_count: number;
  created_at: string; is_current: boolean; is_checkpoint?: boolean;
}
type SaveResult = { essay_id: string; revision: number; version: DraftVersion | null };
type Backup = { text: string; revision: number; time: number };

/** Owns persistence for both editors. No read failure is treated as an empty essay. */
export function useEssayDraft(promptId: string | null, userId: string | null, enabled: boolean) {
  const [content, setContentState] = useState('');
  const [essayId, setEssayId] = useState<string | null>(null);
  const [versions, setVersions] = useState<DraftVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<DraftVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [generation, setGeneration] = useState(0);
  const text = useRef('');
  const baseline = useRef('');
  const revision = useRef(0);
  const ready = useRef(false);
  const conflict = useRef(false);
  const mounted = useRef(true);
  const identity = `${userId ?? ''}:${promptId ?? ''}`;
  const activeIdentity = useRef(identity);
  const queue = useRef(new EssaySaveQueue());
  const pending = useRef<{ text: string; checkpoint: boolean; request: string; expected: number } | null>(null);
  const backupKey = useRef<string | null>(null);
  const skipRecovery = useRef(false);
  const busy = useRef(0);
  const report = (message: string) => { if (mounted.current) { setError(message); setStatus('error'); } };

  const stash = useCallback((value: string) => {
    if (!backupKey.current) return;
    try { localStorage.setItem(backupKey.current, JSON.stringify({ text: value, revision: revision.current, time: Date.now() })); }
    catch { setError('This browser could not keep a recovery copy. Keep this page open until Saved appears.'); }
  }, []);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  useEffect(() => {
    let cancelled = false;
    activeIdentity.current = identity;
    ready.current = false;
    conflict.current = false;
    pending.current = null;
    queue.current = new EssaySaveQueue();
    baseline.current = ''; text.current = ''; revision.current = 0;
    setContentState(''); setEssayId(null); setVersions([]); setCurrentVersion(null);
    setLoading(true); setError(null); setStatus('idle'); setLastSavedAt(null);
    if (!enabled || !userId || !promptId) { setLoading(false); return; }
    void (async () => {
      try {
        let tabId = sessionStorage.getItem('vantage-editor-tab');
        if (!tabId) { tabId = crypto.randomUUID(); sessionStorage.setItem('vantage-editor-tab', tabId); }
        backupKey.current = `vantage-draft:${userId}:${promptId}:${tabId}`;
      } catch { backupKey.current = `vantage-draft:${userId}:${promptId}`; }
      try {
        const { data: essay, error: readError } = await supabase.from('essays').select('id, revision')
          .eq('user_id', userId).eq('college_prompt_id', promptId).maybeSingle();
        if (readError) throw readError;
        let rows: DraftVersion[] = [];
        if (essay) {
          const response = await supabase.from('essay_versions').select('*').eq('essay_id', essay.id).order('version_number', { ascending: false });
          if (response.error) throw response.error;
          rows = response.data ?? [];
        }
        if (cancelled) return;
        const current = rows.find(v => v.is_current) ?? rows[0] ?? null;
        revision.current = essay?.revision ?? 0;
        baseline.current = current?.content ?? '';
        text.current = baseline.current;
        setEssayId(essay?.id ?? null); setVersions(rows); setCurrentVersion(current);
        let recovered: Backup | null = null;
        try {
          const prefix = `vantage-draft:${userId}:${promptId}:`;
          // Prefer this tab's backup; an abandoned tab's latest backup remains recoverable.
          const own = localStorage.getItem(backupKey.current!);
          if (!skipRecovery.current && own) recovered = JSON.parse(own);
          else if (!skipRecovery.current) for (let i=0;i<localStorage.length;i++) {
            const key=localStorage.key(i);
            if (key?.startsWith(prefix)) {
              const candidate=JSON.parse(localStorage.getItem(key)!);
              if (!recovered || candidate.time > recovered.time) recovered=candidate;
            }
          }
        } catch { /* A corrupt recovery copy cannot replace server content. */ }
        if (recovered && typeof recovered.text === 'string' && recovered.text !== baseline.current) {
          text.current = recovered.text;
          if (recovered.revision !== revision.current) {
            conflict.current = true;
            setError('Recovered writing is shown, but the server has a different draft. Copy this text before reloading; automatic saving is paused.');
            setStatus('error');
          } else { setError('Recovered unsaved writing. Saving it now.'); setStatus('saving'); }
        } else setStatus(current ? 'saved' : 'idle');
        setContentState(text.current);
        ready.current = true;
      } catch {
        if (!cancelled) setError('Your essay could not be loaded. Retry before editing; existing work has not been replaced.');
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; ready.current = false; };
  }, [identity, userId, promptId, enabled, generation]);

  const edit = (value: string) => {
    text.current = value; setContentState(value); stash(value);
    if (!conflict.current) setStatus(value === baseline.current && !pending.current ? 'saved' : 'saving');
  };

  const apply = (result: SaveResult) => {
    revision.current = result.revision;
    setEssayId(result.essay_id);
    setCurrentVersion(result.version);
    setVersions(previous => result.version
      ? [result.version, ...previous.filter(v => v.id !== result.version!.id).map(v => ({ ...v, is_current: false }))].sort((a,b)=>b.version_number-a.version_number)
      : []);
  };

  const persist = async (checkpoint = false, explicitText?: string): Promise<void> => {
    const requestedIdentity = identity;
    const requestedPrompt = promptId;
    const snapshot = explicitText ?? text.current;
    if (!ready.current || !requestedPrompt) throw new Error('Wait for the essay to load.');
    if (conflict.current) throw new Error('Copy your writing and reload the newer draft before saving.');
    busy.current++;
    try {
      await queue.current.run(async () => {
        if (activeIdentity.current !== requestedIdentity) return;
        if (conflict.current) throw new Error('A newer draft exists. Copy your writing before reloading.');
        if (!checkpoint && snapshot === baseline.current && !pending.current) return;
        // Finish an ambiguous earlier request with the SAME id before accepting another write.
        const send = async (operation: NonNullable<typeof pending.current>) => {
          const { data, error: writeError } = await supabase.rpc('save_essay_draft', {
            p_prompt_id: requestedPrompt, p_content: operation.text, p_expected_revision: operation.expected,
            p_request_id: operation.request, p_checkpoint: operation.checkpoint,
          });
          if (writeError) throw writeError;
          const result = data as SaveResult;
          if (!result?.essay_id || !result.version || typeof result.revision !== 'number' || result.version.content !== operation.text) throw new Error('Save was not acknowledged. Your writing is retained.');
          if (activeIdentity.current !== requestedIdentity) return;
          revision.current = result.revision;
          baseline.current = operation.text;
          pending.current = null;
          if (mounted.current) { apply(result); setLastSavedAt(Date.now()); }
        };
        const replayedCheckpoint = !!pending.current && pending.current.checkpoint && pending.current.text === snapshot;
        if (pending.current) await send(pending.current);
        if (snapshot !== baseline.current || (checkpoint && !replayedCheckpoint)) {
          pending.current = { text: snapshot, checkpoint, expected: revision.current, request: crypto.randomUUID() };
          await send(pending.current);
        }
        if (activeIdentity.current !== requestedIdentity) return;
        if (text.current === baseline.current) {
          try { if (backupKey.current) localStorage.removeItem(backupKey.current); } catch { /* acknowledgement remains valid */ }
          if (mounted.current) { setStatus('saved'); setError(null); }
        } else { stash(text.current); if (mounted.current) setStatus('saving'); }
      });
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? 'Save failed. Your writing is retained. Retry when connected.';
      if (activeIdentity.current === requestedIdentity) {
        if (message.includes('SAVE_CONFLICT')) conflict.current = true;
        stash(text.current); report(message.includes('SAVE_CONFLICT') ? 'A newer draft exists in another session. Your text is retained here. Copy it before reloading.' : 'Could not save. Your writing is retained in this browser. Retry when connected.');
      }
      throw err;
    } finally { busy.current--; }
  };

  useEffect(() => {
    if (loading || !ready.current || conflict.current || content === baseline.current) return;
    const timer = setTimeout(() => { void persist().catch(() => undefined); }, 1000);
    return () => clearTimeout(timer);
    // persist reads the current refs; only text/loading changes schedule writes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, loading]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (text.current !== baseline.current || pending.current) { event.preventDefault(); event.returnValue=''; }
    };
    const leave = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (target && (text.current !== baseline.current || pending.current) && !window.confirm('Your latest writing has not reached the server. Leave this page with a recovery copy in this browser?')) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', warn); document.addEventListener('click', leave, true);
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', leave, true); };
  }, []);

  const restore = async (version: DraftVersion) => {
    if (busy.current || conflict.current) { report('Finish saving or resolve the save error before restoring a version.'); return; }
    if (!window.confirm('Restore this version as a new saved checkpoint? Your current writing will be saved first.')) return;
    try {
      const prior = text.current;
      await persist();
      if (text.current !== prior) return; // Do not replace writing typed during the first save.
      await persist(true, version.content);
      if (text.current === prior) {
        text.current = version.content; setContentState(version.content); setStatus("saved");
        try { if (backupKey.current) localStorage.removeItem(backupKey.current); } catch { /* server already saved */ }
      }
      else stash(text.current);
    } catch { /* retain editor contents and report from persist */ }
  };

  const remove = async (version: DraftVersion) => {
    if (busy.current || conflict.current || text.current !== baseline.current) { report('Save your current writing before deleting a version.'); return; }
    if (!window.confirm(`Delete Version ${version.version_number}? This cannot be undone.`)) return;
    busy.current++;
    try {
      await queue.current.run(async () => {
        const { data, error: deleteError } = await supabase.rpc('delete_essay_version', { p_version_id: version.id, p_expected_revision: revision.current });
        if (deleteError) throw deleteError;
        const result=data as SaveResult;
        if (!result?.essay_id || typeof result.revision !== 'number') throw new Error('Deletion was not acknowledged.');
        const before=baseline.current;
        apply(result); setVersions(previous=>previous.filter(v=>v.id!==version.id));
        baseline.current=result.version?.content ?? '';
        if (text.current === before) { text.current=baseline.current; setContentState(text.current); }
        setStatus(text.current === baseline.current ? 'saved' : 'saving');
      });
    } catch { report('Could not delete this version. Reload to verify its state before trying again.'); }
    finally { busy.current--; }
  };
  const reload = () => {
    if ((text.current !== baseline.current || pending.current) && !window.confirm('Reload the server draft and discard the writing shown here? Copy any text you want to keep first.')) return;
    try {
      if (backupKey.current) localStorage.removeItem(backupKey.current);
      skipRecovery.current = true;
    } catch { /* server read still retries */ }
    setGeneration(n=>n+1);
  };
  return { content, edit, essayId, versions, currentVersion, loading, status, error, lastSavedAt,
    wordCount: countEssayWords(content), canEdit: ready.current && !loading,
    save: () => persist(true), retry: () => persist(), restore, remove, reload };
}
