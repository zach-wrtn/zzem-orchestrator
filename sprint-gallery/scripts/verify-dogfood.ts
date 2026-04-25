/**
 * Adhoc verifier for v2 dogfood prototype (sprint-orchestrator/dogfood/v2-exercise/...).
 * verify-prototype.ts only auto-discovers files under sprints/, so we invoke
 * verifyPrototype() directly with an explicit path.
 *
 * Usage: pnpm tsx scripts/verify-dogfood.ts <absolute-path-to-prototype.html>
 */
import { verifyPrototype } from './verify-prototype.js';

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: tsx verify-dogfood.ts <abs path to prototype.html>');
    process.exit(2);
  }
  const r = await verifyPrototype(target);
  console.log(JSON.stringify(r, null, 2));
  if (r.status === 'fail') process.exit(1);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
