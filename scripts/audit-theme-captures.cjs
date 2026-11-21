// Finds theme tokens read at module load (outside any function): they would keep the colour of the
// mode the app started in. Fix with themedStyles(() => ...) or by reading the token inside a component.
// Usage: node scripts/audit-theme-captures.cjs   (exit 1 when it finds any)
const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const LIVE = new Set(['C', 'COLOR', 'SURFACE', 'TEXT', 'STATE', 'CLASS', 'ELEVATION']);
const FIXED = [/^C\.(sodium|neon|magenta|lime|ink)$/, /^COLOR\.(paint|layer|media|badge\.fg|map\.ban|fill)/, /^COLOR\.action\.(primary|onPrimary|selectedTint|disabledBorder)$/, /^STATE\.selected$/, /^TEXT\.onAction$/, /^COLOR\.text\.onAction$/];
const CALLS = new Set(['tint', 'line', 'outline', 'inkFor', 'contentColour']);

function walk(dir, out = []) {
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(n) && n !== 'theme.ts') out.push(p);
  }
  return out;
}
function dotted(node) {
  const parts = [];
  let n = node;
  while (ts.isPropertyAccessExpression(n)) { parts.unshift(n.name.text); n = n.expression; }
  if (ts.isIdentifier(n)) { parts.unshift(n.text); return parts.join('.'); }
  return null;
}
const found = [];
for (const file of walk(path.join(__dirname, '..', 'src'))) {
  const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = (node, deferred) => {
    // Inside a function body or a themedStyles(...) factory, reads happen later.
    const isFn = ts.isFunctionLike(node) && !ts.isFunctionTypeNode(node);
    if (isFn && !ts.isMethodSignature(node)) deferred = true;
    if (ts.isTypeNode(node)) return;
    if (ts.isPropertyAccessExpression(node) && !deferred && !ts.isPropertyAccessExpression(node.parent)) {
      const d = dotted(node);
      if (d && LIVE.has(d.split('.')[0]) && !FIXED.some((r) => r.test(d))) {
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
        found.push(`${path.relative(process.cwd(), file)}:${line + 1}: ${d}`);
      }
    }
    if (ts.isCallExpression(node) && !deferred && ts.isIdentifier(node.expression) && CALLS.has(node.expression.text)) {
      const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
      found.push(`${path.relative(process.cwd(), file)}:${line + 1}: ${node.expression.text}(...)`);
    }
    ts.forEachChild(node, (c) => visit(c, deferred));
  };
  visit(sf, false);
}
console.log(found.join('\n'));
console.log(`\n${found.length} module-level theme reads`);
process.exit(found.length ? 1 : 0);
