// Lets the build scripts import the app's pure TypeScript helpers (src/lib) with
// Node's built-in type stripping: an extensionless relative import gets ".ts".
import { register } from 'node:module';

register('./resolve-ts-hooks.mjs', import.meta.url);
