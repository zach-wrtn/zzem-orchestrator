import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// sprint-gallery/src/lib -> repo root
export const REPO_ROOT = resolve(here, '../../..');
export const SPRINTS_DIR = resolve(REPO_ROOT, 'sprint-orchestrator/sprints');
export const PUBLIC_DIR = resolve(here, '../../public');
export const PUBLIC_PROTOTYPES_DIR = resolve(PUBLIC_DIR, 'prototypes');
