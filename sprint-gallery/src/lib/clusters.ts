/**
 * Clusters — user-curated collections of exemplars (Cosmos-style).
 *
 * Storage: localStorage key 'zzem-clusters'. Per-browser; not synced.
 * All mutations dispatch a 'zzem:clusters-change' window event so subscribers
 * can re-render. Same-tab dispatch is the only path; cross-tab updates would
 * require a 'storage' event listener (out of scope for MVP).
 */

const STORAGE_KEY = 'zzem-clusters';
const CHANGE_EVENT = 'zzem:clusters-change';

export interface Cluster {
  id: string;
  name: string;
  createdAt: string;
  exemplarIds: string[];
}

interface StoreShape {
  version: 1;
  clusters: Cluster[];
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function read(): StoreShape {
  if (!isBrowser()) return { version: 1, clusters: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, clusters: [] };
    const parsed = JSON.parse(raw) as StoreShape;
    if (parsed && parsed.version === 1 && Array.isArray(parsed.clusters)) return parsed;
    return { version: 1, clusters: [] };
  } catch {
    return { version: 1, clusters: [] };
  }
}

function write(store: StoreShape): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function genId(): string {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function listClusters(): Cluster[] {
  return read().clusters;
}

export function getCluster(id: string): Cluster | null {
  return read().clusters.find((c) => c.id === id) ?? null;
}

export function createCluster(name: string): Cluster {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Cluster name required');
  const cluster: Cluster = {
    id: genId(),
    name: trimmed,
    createdAt: new Date().toISOString(),
    exemplarIds: [],
  };
  const store = read();
  store.clusters.push(cluster);
  write(store);
  return cluster;
}

export function renameCluster(id: string, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const store = read();
  const c = store.clusters.find((c) => c.id === id);
  if (!c) return;
  c.name = trimmed;
  write(store);
}

export function deleteCluster(id: string): void {
  const store = read();
  store.clusters = store.clusters.filter((c) => c.id !== id);
  write(store);
}

export function addExemplarToCluster(clusterId: string, exemplarId: string): void {
  const store = read();
  const c = store.clusters.find((c) => c.id === clusterId);
  if (!c) return;
  if (!c.exemplarIds.includes(exemplarId)) c.exemplarIds.push(exemplarId);
  write(store);
}

export function removeExemplarFromCluster(clusterId: string, exemplarId: string): void {
  const store = read();
  const c = store.clusters.find((c) => c.id === clusterId);
  if (!c) return;
  c.exemplarIds = c.exemplarIds.filter((id) => id !== exemplarId);
  write(store);
}

export function clustersContaining(exemplarId: string): Cluster[] {
  return read().clusters.filter((c) => c.exemplarIds.includes(exemplarId));
}

export function subscribeToClusters(handler: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
