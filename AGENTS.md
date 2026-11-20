This is Slipstream, an Expo/React Native app (see README.md and docs/SPEC.md). Prioritize mobile-first patterns.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Every UI change is checked against the scorecard (owner rule, 19 Nov 2026)

The owner's target is clarity, coherence and look all 8+ on the fixed scorecard in `docs/REDESIGN-2.md`.
Before building a feature or screen change:

1. Read REDESIGN-2.md sections 4 (rulebook), 7 (scorecard), 8 (8+ criteria) and 9 (owner decisions).
2. Design it to the rules up front: one primary per screen and never a disabled primary; nothing opens
   by itself over a toast or a motion moment; each fact said once (C5); nothing clipped at 1.3x text;
   no banned words (4.12); sheets vs pushes (4.5); one selector pattern per job (4.4).
3. If the owner's request needs an exception, add a dated owner-decision note to REDESIGN-2 section 9
   in the same change. Never leave it for a review to find.
4. Run the automated scorecard (`npm run scorecard`, or `scorecard:quick` for small changes) and
   `npx tsc --noEmit` and `npx jest` before pushing. Don't push a UI change that fails it.

Do NOT run `npx expo lint` in this repo: there is no ESLint config and it rewrites package.json.
