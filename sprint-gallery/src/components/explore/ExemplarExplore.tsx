import { useEffect, useMemo, useState } from 'react';

export type ExemplarItem = {
  id: string;
  title: string;
  archetype: string;
  sprintSlug: string;
  sprintTitle: string;
  designDimensions: string[];
  thumbnail: string | null;
  href: string;
  vtName: string;
  whyCurated: string;
  lastValidatedAt: string;
};

type SortMode = 'archetype' | 'recent';

interface Props {
  items: ExemplarItem[];
  base: string;
}

const ARCHETYPE_ORDER = ['feed', 'detail', 'onboarding', 'form', 'modal', 'empty_state', 'nav_list'] as const;

function readParam(name: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const raw = new URLSearchParams(window.location.search).get(name);
  if (!raw) return new Set();
  return new Set(raw.split(',').filter(Boolean));
}

function readSortParam(): SortMode {
  if (typeof window === 'undefined') return 'archetype';
  const raw = new URLSearchParams(window.location.search).get('sort');
  return raw === 'recent' ? 'recent' : 'archetype';
}

function writeParams(params: {
  archetype: Set<string>;
  sprint: Set<string>;
  dimension: Set<string>;
  sort: SortMode;
}) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const setOrDelete = (key: string, val: Set<string>) => {
    if (val.size === 0) url.searchParams.delete(key);
    else url.searchParams.set(key, [...val].join(','));
  };
  setOrDelete('archetype', params.archetype);
  setOrDelete('sprint', params.sprint);
  setOrDelete('dimension', params.dimension);
  if (params.sort === 'archetype') url.searchParams.delete('sort');
  else url.searchParams.set('sort', params.sort);
  window.history.replaceState({}, '', url);
}

export default function ExemplarExplore({ items }: Props) {
  // Initialize empty so SSR markup matches client first render. Hydrate from URL
  // after mount to avoid React hydration mismatch warnings.
  const [selectedArchetypes, setSelectedArchetypes] = useState<Set<string>>(() => new Set());
  const [selectedSprints, setSelectedSprints] = useState<Set<string>>(() => new Set());
  const [selectedDimensions, setSelectedDimensions] = useState<Set<string>>(() => new Set());
  const [sortMode, setSortMode] = useState<SortMode>('archetype');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSelectedArchetypes(readParam('archetype'));
    setSelectedSprints(readParam('sprint'));
    setSelectedDimensions(readParam('dimension'));
    setSortMode(readSortParam());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeParams({
      archetype: selectedArchetypes,
      sprint: selectedSprints,
      dimension: selectedDimensions,
      sort: sortMode,
    });
  }, [selectedArchetypes, selectedSprints, selectedDimensions, sortMode, hydrated]);

  const archetypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of items) counts.set(it.archetype, (counts.get(it.archetype) ?? 0) + 1);
    return counts;
  }, [items]);

  const sprintInfo = useMemo(() => {
    const map = new Map<string, { title: string; count: number }>();
    for (const it of items) {
      const e = map.get(it.sprintSlug);
      if (e) e.count += 1;
      else map.set(it.sprintSlug, { title: it.sprintTitle, count: 1 });
    }
    return [...map.entries()].sort((a, b) => a[1].title.localeCompare(b[1].title));
  }, [items]);

  const dimensionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of items) {
      for (const d of it.designDimensions) counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  const filtered = useMemo(() => {
    const matched = items.filter((it) => {
      if (selectedArchetypes.size > 0 && !selectedArchetypes.has(it.archetype)) return false;
      if (selectedSprints.size > 0 && !selectedSprints.has(it.sprintSlug)) return false;
      if (
        selectedDimensions.size > 0 &&
        ![...selectedDimensions].every((d) => it.designDimensions.includes(d))
      )
        return false;
      return true;
    });
    const sorted = [...matched];
    if (sortMode === 'recent') {
      sorted.sort((a, b) => (a.lastValidatedAt < b.lastValidatedAt ? 1 : -1));
    } else {
      sorted.sort(
        (a, b) =>
          a.archetype.localeCompare(b.archetype) || a.title.localeCompare(b.title),
      );
    }
    return sorted;
  }, [items, selectedArchetypes, selectedSprints, selectedDimensions, sortMode]);

  const toggle = (set: Set<string>, val: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    setter(next);
  };

  const totalSelected = selectedArchetypes.size + selectedSprints.size + selectedDimensions.size;

  const reset = () => {
    setSelectedArchetypes(new Set());
    setSelectedSprints(new Set());
    setSelectedDimensions(new Set());
  };

  return (
    <div className="exp-layout">
      <aside className="exp-rail">
        <div className="exp-rail-section">
          <h3 className="exp-rail-title">Archetype</h3>
          <ul className="exp-facet-list">
            {ARCHETYPE_ORDER.filter((a) => archetypeCounts.has(a)).map((a) => {
              const count = archetypeCounts.get(a) ?? 0;
              const checked = selectedArchetypes.has(a);
              return (
                <li key={a}>
                  <label className={`exp-facet exp-facet-archetype ${checked ? 'on' : ''}`} data-archetype={a}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(selectedArchetypes, a, setSelectedArchetypes)}
                    />
                    <span className="exp-facet-dot" aria-hidden="true" />
                    <span className="exp-facet-label">{a.replace('_', ' ')}</span>
                    <span className="exp-facet-count">{count}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        {sprintInfo.length > 1 && (
          <div className="exp-rail-section">
            <h3 className="exp-rail-title">Sprint</h3>
            <ul className="exp-facet-list">
              {sprintInfo.map(([slug, info]) => {
                const checked = selectedSprints.has(slug);
                return (
                  <li key={slug}>
                    <label className={`exp-facet ${checked ? 'on' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(selectedSprints, slug, setSelectedSprints)}
                      />
                      <span className="exp-facet-label" title={info.title}>{info.title}</span>
                      <span className="exp-facet-count">{info.count}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {dimensionCounts.length > 0 && (
          <div className="exp-rail-section">
            <h3 className="exp-rail-title">Dimension</h3>
            <ul className="exp-facet-list">
              {dimensionCounts.map(([d, count]) => {
                const checked = selectedDimensions.has(d);
                return (
                  <li key={d}>
                    <label className={`exp-facet ${checked ? 'on' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(selectedDimensions, d, setSelectedDimensions)}
                      />
                      <span className="exp-facet-label">{d.replace(/_/g, ' ')}</span>
                      <span className="exp-facet-count">{count}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {totalSelected > 0 && (
          <button type="button" className="exp-reset" onClick={reset}>
            Reset filters
          </button>
        )}
      </aside>

      <section className="exp-results">
        <header className="exp-results-head">
          <div className="exp-results-row">
            <p className="exp-count">
              {filtered.length} of {items.length} exemplar{items.length === 1 ? '' : 's'}
            </p>
            <label className="exp-sort">
              <span className="exp-sort-label">Sort</span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
              >
                <option value="archetype">Archetype</option>
                <option value="recent">Recent</option>
              </select>
            </label>
          </div>
          {totalSelected > 0 && (
            <div className="exp-applied">
              {[...selectedArchetypes].map((a) => (
                <button
                  key={`a-${a}`}
                  type="button"
                  className="exp-chip"
                  onClick={() => toggle(selectedArchetypes, a, setSelectedArchetypes)}
                  aria-label={`Remove archetype filter ${a}`}
                >
                  {a.replace('_', ' ')} <span aria-hidden>✕</span>
                </button>
              ))}
              {[...selectedSprints].map((s) => {
                const info = sprintInfo.find((x) => x[0] === s);
                return (
                  <button
                    key={`s-${s}`}
                    type="button"
                    className="exp-chip"
                    onClick={() => toggle(selectedSprints, s, setSelectedSprints)}
                    aria-label={`Remove sprint filter ${info?.[1].title ?? s}`}
                  >
                    {info?.[1].title ?? s} <span aria-hidden>✕</span>
                  </button>
                );
              })}
              {[...selectedDimensions].map((d) => (
                <button
                  key={`d-${d}`}
                  type="button"
                  className="exp-chip"
                  onClick={() => toggle(selectedDimensions, d, setSelectedDimensions)}
                  aria-label={`Remove dimension filter ${d}`}
                >
                  {d.replace(/_/g, ' ')} <span aria-hidden>✕</span>
                </button>
              ))}
            </div>
          )}
        </header>

        {filtered.length === 0 ? (
          <p className="exp-empty">No exemplars match these filters.</p>
        ) : (
          <ul className="exp-grid">
            {filtered.map((it) => (
              <li key={it.id}>
                <a
                  className="exp-card"
                  href={it.href}
                  style={{ viewTransitionName: it.vtName } as React.CSSProperties}
                  aria-label={`Open ${it.title}`}
                >
                  <div className="exp-thumb">
                    {it.thumbnail ? (
                      <img src={it.thumbnail} alt={it.title} loading="lazy" />
                    ) : (
                      <div className="exp-placeholder">{it.title}</div>
                    )}
                    <span className="exp-archetype" data-archetype={it.archetype}>
                      <span className="exp-archetype-dot" aria-hidden="true" />
                      {it.archetype.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="exp-meta">
                    <span className="exp-title">{it.title}</span>
                    <span className="exp-sprint">{it.sprintTitle}</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
