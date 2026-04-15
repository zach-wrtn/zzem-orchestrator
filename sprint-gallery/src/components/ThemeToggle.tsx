import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const initial = stored ?? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      style={{
        background: 'transparent',
        border: '1px solid var(--border)',
        color: 'var(--text)',
        borderRadius: 8,
        padding: '6px 10px',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
      }}
    >
      {theme === 'dark' ? '◐ Light' : '◑ Dark'}
    </button>
  );
}
