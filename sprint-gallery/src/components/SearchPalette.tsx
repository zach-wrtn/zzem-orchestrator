import { useEffect, useMemo, useState } from 'react';

interface SearchItem { slug: string; title: string; tags: string[]; prototypes: string[]; }
interface Props { data: SearchItem[]; }

export default function SearchPalette({ data }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('#open-search')) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, []);

  const hits = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return data.slice(0, 12);
    return data
      .filter((s) =>
        s.title.toLowerCase().includes(needle) ||
        s.tags.some((t) => t.toLowerCase().includes(needle)) ||
        s.prototypes.some((p) => p.toLowerCase().includes(needle)),
      )
      .slice(0, 12);
  }, [q, data]);

  if (!open) return null;
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
         style={{
           position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
           display: 'grid', placeItems: 'start center', paddingTop: '12vh', zIndex: 60,
         }}>
      <div style={{
        width: 'min(640px, 92vw)',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', overflow: 'hidden',
      }}>
        <input autoFocus placeholder="Search sprints, tags, prototypes…"
               value={q} onChange={(e) => setQ(e.target.value)}
               style={{
                 width: '100%', padding: '14px 16px',
                 background: 'transparent', border: 'none',
                 borderBottom: '1px solid var(--border)',
                 color: 'var(--text)', fontSize: 14, outline: 'none',
               }} />
        <ul style={{ listStyle: 'none', margin: 0, padding: 6, maxHeight: '60vh', overflowY: 'auto' }}>
          {hits.length === 0 && (
            <li style={{ padding: 12, color: 'var(--text-faint)', fontSize: 13 }}>No matches</li>
          )}
          {hits.map((s) => (
            <li key={s.slug}>
              <a href={`#${s.slug}`} onClick={() => setOpen(false)}
                 style={{
                   display: 'flex', justifyContent: 'space-between',
                   padding: '10px 12px', borderRadius: 8,
                   color: 'var(--text)',
                 }}
                 onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                 onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <span>{s.title}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', fontSize: 12 }}>
                  {s.tags.map((t) => `#${t}`).join(' ')}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
