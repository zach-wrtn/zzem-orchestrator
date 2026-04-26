import { useEffect, useMemo, useState } from 'react';
import {
  type Cluster,
  createCluster,
  deleteCluster,
  listClusters,
  removeExemplarFromCluster,
  renameCluster,
  subscribeToClusters,
} from '@/lib/clusters';
import type { ExemplarItem } from '@/components/explore/ExemplarExplore';

interface Props {
  exemplars: ExemplarItem[];
  base: string;
}

function readIdParam(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('id');
}

function writeIdParam(id: string | null) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (id) url.searchParams.set('id', id);
  else url.searchParams.delete('id');
  window.history.pushState({}, '', url);
}

export default function ClusterApp({ exemplars, base }: Props) {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setClusters(listClusters());
    setActiveId(readIdParam());
    setHydrated(true);
  }, []);

  useEffect(() => subscribeToClusters(() => setClusters(listClusters())), []);

  useEffect(() => {
    const onPop = () => setActiveId(readIdParam());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const exemplarsById = useMemo(() => {
    const m = new Map<string, ExemplarItem>();
    for (const e of exemplars) m.set(e.id, e);
    return m;
  }, [exemplars]);

  const navigate = (id: string | null) => {
    writeIdParam(id);
    setActiveId(id);
  };

  if (!hydrated) {
    return (
      <div className="cluster-app">
        <p className="cluster-loading">Loading clusters...</p>
      </div>
    );
  }

  if (activeId) {
    const cluster = clusters.find((c) => c.id === activeId);
    if (!cluster) {
      return (
        <div className="cluster-app">
          <p className="cluster-empty">Cluster not found.</p>
          <button type="button" className="cluster-back" onClick={() => navigate(null)}>
            ← All clusters
          </button>
        </div>
      );
    }
    return (
      <ClusterDetail
        cluster={cluster}
        exemplarsById={exemplarsById}
        onBack={() => navigate(null)}
      />
    );
  }

  return (
    <ClusterIndex
      clusters={clusters}
      exemplarsById={exemplarsById}
      base={base}
      onOpen={(id) => navigate(id)}
    />
  );
}

interface IndexProps {
  clusters: Cluster[];
  exemplarsById: Map<string, ExemplarItem>;
  base: string;
  onOpen: (id: string) => void;
}

function ClusterIndex({ clusters, exemplarsById, base, onOpen }: IndexProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const c = createCluster(trimmed);
    setName('');
    setCreating(false);
    onOpen(c.id);
  };

  return (
    <div className="cluster-app">
      <div className="cluster-toolbar">
        <p className="cluster-count">
          {clusters.length} cluster{clusters.length === 1 ? '' : 's'}
        </p>
        {creating ? (
          <form className="cluster-create" onSubmit={submit}>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cluster name"
              maxLength={60}
            />
            <button type="submit" disabled={!name.trim()}>Create</button>
            <button
              type="button"
              className="cluster-create-cancel"
              onClick={() => { setCreating(false); setName(''); }}
            >
              Cancel
            </button>
          </form>
        ) : (
          <button type="button" className="cluster-new" onClick={() => setCreating(true)}>
            + New cluster
          </button>
        )}
      </div>

      {clusters.length === 0 ? (
        <div className="cluster-empty-state">
          <p className="cluster-empty-title">No clusters yet</p>
          <p className="cluster-empty-body">
            Visit <a href={`${base}/explore/`.replace(/\/+/g, '/')}>Explore</a> and click ☆ on
            any exemplar to start a collection.
          </p>
        </div>
      ) : (
        <ul className="cluster-grid">
          {clusters.map((c) => {
            const previews = c.exemplarIds
              .map((id) => exemplarsById.get(id))
              .filter((e): e is ExemplarItem => Boolean(e))
              .slice(0, 4);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className="cluster-card"
                  onClick={() => onOpen(c.id)}
                  aria-label={`Open ${c.name}`}
                >
                  <div className="cluster-mosaic">
                    {previews.length === 0 ? (
                      <div className="cluster-mosaic-empty">Empty</div>
                    ) : (
                      Array.from({ length: 4 }, (_, i) => {
                        const e = previews[i];
                        if (!e) return <div key={`slot-${i}`} className="cluster-mosaic-placeholder" />;
                        return e.thumbnail ? (
                          <img key={e.id} src={e.thumbnail} alt="" loading="lazy" />
                        ) : (
                          <div key={e.id} className="cluster-mosaic-placeholder" />
                        );
                      })
                    )}
                  </div>
                  <div className="cluster-card-meta">
                    <span className="cluster-card-name">{c.name}</span>
                    <span className="cluster-card-count">
                      {c.exemplarIds.length} item{c.exemplarIds.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface DetailProps {
  cluster: Cluster;
  exemplarsById: Map<string, ExemplarItem>;
  onBack: () => void;
}

function ClusterDetail({ cluster, exemplarsById, onBack }: DetailProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cluster.name);

  useEffect(() => setName(cluster.name), [cluster.name]);

  const items = cluster.exemplarIds
    .map((id) => exemplarsById.get(id))
    .filter((e): e is ExemplarItem => Boolean(e));

  const saveName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== cluster.name) renameCluster(cluster.id, trimmed);
    setEditing(false);
  };

  const onDelete = () => {
    if (!confirm(`Delete cluster "${cluster.name}"? Exemplars themselves are not removed.`)) return;
    deleteCluster(cluster.id);
    onBack();
  };

  return (
    <div className="cluster-app">
      <div className="cluster-detail-head">
        <button type="button" className="cluster-back" onClick={onBack}>
          ← All clusters
        </button>
        <div className="cluster-detail-title-row">
          {editing ? (
            <input
              className="cluster-detail-title-input"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveName();
                else if (e.key === 'Escape') { setName(cluster.name); setEditing(false); }
              }}
              maxLength={60}
            />
          ) : (
            <h1 className="cluster-detail-title" onClick={() => setEditing(true)}>
              {cluster.name}
            </h1>
          )}
          <span className="cluster-detail-count">
            {items.length} item{items.length === 1 ? '' : 's'}
          </span>
        </div>
        <button type="button" className="cluster-delete" onClick={onDelete}>
          Delete cluster
        </button>
      </div>

      {items.length === 0 ? (
        <p className="cluster-empty-body">
          Empty cluster. Add exemplars from <a href="../explore/">Explore</a>.
        </p>
      ) : (
        <ul className="exp-grid">
          {items.map((it) => (
            <li key={it.id} className="exp-card-cell">
              <button
                type="button"
                className="exp-save on"
                aria-label={`Remove ${it.title} from ${cluster.name}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeExemplarFromCluster(cluster.id, it.id);
                }}
                title="Remove from cluster"
              >
                <span aria-hidden>✕</span>
              </button>
              <a
                className="exp-card"
                href={it.href}
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
    </div>
  );
}
