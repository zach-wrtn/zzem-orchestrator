import { useEffect, useRef, useState } from 'react';
import ClusterMenu from '@/components/clusters/ClusterMenu';
import { clustersContaining, subscribeToClusters } from '@/lib/clusters';

interface PatternLink {
  key: string;
  name: string;
  href: string;
}

interface FoundationLink {
  key: string;
  name: string;
  href: string;
}

interface Props {
  exemplarId: string;
  archetype: string;
  designDimensions: string[];
  whyCurated: string;
  sprintId: string;
  lastValidatedAt: string;
  patterns?: PatternLink[];
  foundations?: FoundationLink[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

export default function RationalePanel({
  exemplarId,
  archetype,
  designDimensions,
  whyCurated,
  sprintId,
  lastValidatedAt,
  patterns = [],
  foundations = [],
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const refresh = () => setMemberCount(clustersContaining(exemplarId).length);
    refresh();
    return subscribeToClusters(refresh);
  }, [exemplarId]);

  const openMenu = () => {
    if (!btnRef.current) return;
    setAnchorRect(btnRef.current.getBoundingClientRect());
    setMenuOpen(true);
  };

  return (
    <>
      <div className="rationale">
        <div className="rationale-tags">
          <span className="rationale-archetype" data-archetype={archetype}>
            <span className="rationale-archetype-dot" aria-hidden />
            {archetype.replace('_', ' ')}
          </span>
          {designDimensions.map((d) => (
            <span key={d} className="rationale-dim">{d.replace(/_/g, ' ')}</span>
          ))}
        </div>

        <p className="rationale-why">{whyCurated}</p>

        <dl className="rationale-meta">
          <div>
            <dt>Source sprint</dt>
            <dd>{sprintId}</dd>
          </div>
          <div>
            <dt>Last validated</dt>
            <dd>{formatDate(lastValidatedAt)}</dd>
          </div>
        </dl>

        {patterns.length > 0 && (
          <div className="rationale-patterns">
            <p className="rationale-patterns-label">Pattern</p>
            <ul>
              {patterns.map((p) => (
                <li key={p.key}>
                  <a href={p.href}>{p.name} →</a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {foundations.length > 0 && (
          <div className="rationale-foundations">
            <p className="rationale-foundations-label">Foundations exercised</p>
            <div className="rationale-foundations-row">
              {foundations.map((f) => (
                <a key={f.key} className="rationale-foundation-chip" href={f.href}>
                  {f.name}
                </a>
              ))}
            </div>
          </div>
        )}

        <button
          ref={btnRef}
          type="button"
          className={`rationale-save ${memberCount > 0 ? 'on' : ''}`}
          onClick={openMenu}
        >
          <span aria-hidden>{memberCount > 0 ? '★' : '☆'}</span>
          {memberCount > 0
            ? `Saved in ${memberCount} cluster${memberCount === 1 ? '' : 's'}`
            : 'Save to cluster'}
        </button>
      </div>

      {menuOpen && anchorRect && (
        <ClusterMenu
          exemplarId={exemplarId}
          anchorRect={anchorRect}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
