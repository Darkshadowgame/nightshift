import { spawnSync } from 'child_process';
import { join } from 'path';

/**
 * A theme token read at module load keeps the colour of the mode the app started in. The audit
 * script (scripts/audit-theme-captures.cjs) lists them; use themedStyles(() => ...) or read the
 * token inside the component.
 */
it('reads no theme token at module load', () => {
  const r = spawnSync('node', [join(__dirname, '..', 'scripts', 'audit-theme-captures.cjs')], { encoding: 'utf8', cwd: join(__dirname, '..') });
  expect(r.stdout.trim().split('\n').filter((l) => l.includes(':')).join('\n')).toBe('');
  expect(r.status).toBe(0);
});
