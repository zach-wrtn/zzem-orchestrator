import { useEffect, useState } from 'react';

interface PreviewState { entry: string; title: string; }

export default function PreviewModal() {
  const [state, setState] = useState<PreviewState | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const btn = t.closest<HTMLElement>('.open-preview');
      if (!btn) return;
      e.preventDefault();
      const entry = btn.dataset.entry!;
      const title = btn.dataset.title ?? '';
      setState({ entry, title });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setState(null);
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!state) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={state.title}
         style={{
           position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
           display: 'grid', placeItems: 'center', zIndex: 50, padding: 24,
         }}
         onClick={(e) => { if (e.target === e.currentTarget) setState(null); }}>
      <div style={{
        background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', width: 'min(1200px, 96vw)', height: '88vh',
        display: 'flex', flexDirection: 'column',
      }}>
        <header style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', borderBottom: '1px solid var(--border)',
          fontFamily: 'var(--font-mono)', fontSize: 12,
        }}>
          <span style={{ color: 'var(--text-dim)' }}>{state.title}</span>
          <span style={{ flex: 1 }} />
          <a href={state.entry} target="_blank" rel="noopener"
             style={{ color: 'var(--text-dim)' }}>Open ↗</a>
          <button onClick={() => setState(null)}
                  style={{
                    background: 'transparent', color: 'var(--text)',
                    border: '1px solid var(--border)', borderRadius: 6,
                    padding: '4px 8px', cursor: 'pointer',
                  }}>Close</button>
        </header>
        <iframe src={state.entry} title={state.title} sandbox="allow-scripts allow-same-origin"
                style={{ flex: 1, border: 'none', background: 'white' }} />
      </div>
    </div>
  );
}
