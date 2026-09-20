'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

/** User-scoped local recovery for manual-save text forms. Never sends text anywhere. */
export function useRecoverableText(scope: string, active = true) {
  const [text, setTextState] = useState('');
  const [warning, setWarning] = useState('');
  const value = useRef('');
  const key = useRef<string | null>(null);
  const dirty = useRef(false);
  const setText = (next: string) => {
    value.current=next; setTextState(next); dirty.current=!!next;
    if (key.current && active) {
      try { localStorage.setItem(key.current, next); }
      catch { setWarning('Recovery storage is unavailable. Save before leaving this page.'); }
    }
  };
  const openText = (next: string) => { key.current=null; value.current=next; setTextState(next); dirty.current=false; };
  const clearRecovery = () => {
    dirty.current=false;setWarning('');
    try { if(key.current)localStorage.removeItem(key.current); } catch { /* best effort */ }
  };
  useEffect(() => {
    let cancelled=false;key.current=null;dirty.current=false;
    if (!active) return;
    const initial=value.current;
    void supabase.auth.getUser().then(({data:{user}})=>{
      if(cancelled||!user)return;
      key.current=`vantage-form:${user.id}:${scope}`;
      try {
        const recovery=localStorage.getItem(key.current);
        if(recovery!==null && value.current===initial){value.current=recovery;setTextState(recovery);dirty.current=!!recovery;setWarning('Recovered unsaved writing. Save it when ready.');}
        else if(value.current!==initial){localStorage.setItem(key.current,value.current);dirty.current=true;}
      } catch { setWarning('Recovery storage is unavailable. Save before leaving this page.'); }
    }).catch(()=>setWarning('Sign in before saving. Keep this page open to preserve your writing.'));
    return ()=>{cancelled=true;};
  },[scope,active]);
  useEffect(()=>{
    if(!active)return;
    const unload=(e:BeforeUnloadEvent)=>{if(dirty.current){e.preventDefault();e.returnValue='';}};
    const click=(e:MouseEvent)=>{if(dirty.current&&e.target instanceof Element&&e.target.closest('a[href]')&&!confirm('This writing has not been saved. Leave with a recovery copy in this browser?')){e.preventDefault();e.stopPropagation();}};
    window.addEventListener('beforeunload',unload);document.addEventListener('click',click,true);
    return()=>{window.removeEventListener('beforeunload',unload);document.removeEventListener('click',click,true);};
  },[active]);
  return {text,setText,openText,clearRecovery,warning};
}
