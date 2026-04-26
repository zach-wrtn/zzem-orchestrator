import { useEffect, useRef, useState } from 'react';
import {
  type Cluster,
  addExemplarToCluster,
  createCluster,
  listClusters,
  removeExemplarFromCluster,
  subscribeToClusters,
} from '@/lib/clusters';

interface Props {
  exemplarId: string;
  onClose: () => void;
  anchorRect: DOMRect;
}

export default function ClusterMenu({ exemplarId, onClose, anchorRect }: Props) {
  const [clusters, setClusters] = useState<Cluster[]>(() => listClusters());
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => subscribeToClusters(() => setClusters(listClusters())), []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  const toggle = (clusterId: string, member: boolean) => {
    if (member) removeExemplarFromCluster(clusterId, exemplarId);
    else addExemplarToCluster(clusterId, exemplarId);
  };

  const submitNew = () => {
    const name = newName.trim();
    if (!name) return;
    const c = createCluster(name);
    addExemplarToCluster(c.id, exemplarId);
    setNewName('');
    setCreating(false);
  };

  // Position: below the anchor, right-aligned to its right edge.
  const top = anchorRect.bottom + window.scrollY + 6;
  const right = window.innerWidth - anchorRect.right;

  return (
    <div
      ref={ref}
      className="cluster-menu"
      role="menu"
      style={{ position: 'absolute', top, right, zIndex: 50 }}
    >
      <p className="cluster-menu-title">Save to cluster</p>
      {clusters.length === 0 && !creating && (
        <p className="cluster-menu-empty">No clusters yet.</p>
      )}
      {clusters.length > 0 && (
        <ul className="cluster-menu-list">
          {clusters.map((c) => {
            const member = c.exemplarIds.includes(exemplarId);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className={`cluster-menu-item ${member ? 'on' : ''}`}
                  onClick={() => toggle(c.id, member)}
                  role="menuitemcheckbox"
                  aria-checked={member}
                >
                  <span className="cluster-menu-check" aria-hidden>
                    {member ? '✓' : ''}
                  </span>
                  <span className="cluster-menu-name">{c.name}</span>
                  <span className="cluster-menu-count">{c.exemplarIds.length}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {creating ? (
        <form
          className="cluster-menu-form"
          onSubmit={(e) => {
            e.preventDefault();
            submitNew();
          }}
        >
          <input
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New cluster name"
            maxLength={60}
          />
          <button type="submit" disabled={!newName.trim()}>
            Save
          </button>
        </form>
      ) : (
        <button
          type="button"
          className="cluster-menu-new"
          onClick={() => setCreating(true)}
        >
          + New cluster
        </button>
      )}
    </div>
  );
}
