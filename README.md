# Hub

A quick-capture daily planner, thought notebook, and journal — rolled into
one small local-first app, for mixed work and personal life.

The idea: brief moments of thought shouldn't require finding a notepad.
Open the app (or its home-screen icon), type or speak, done. Tag it Work or
Personal (or skip that entirely), and sort it out later from the Inbox if
you want to.

## Features

- **Quick capture, from anywhere.** A floating button (mobile) or `C`
  keyboard shortcut (desktop) opens a capture box from any screen. Saving
  needs nothing but text — type or tag are both optional.
- **Voice capture.** The mic button transcribes speech to text live, using
  the browser's built-in speech recognition (no account, no API key).
- **Today.** A daily planner view: today's tasks plus anything still open
  from earlier automatically show up here too — no task silently falls off
  a list, and nothing is destructively rescheduled to make that happen.
- **Notebook.** Every note and journal entry, searchable, filterable by
  type and tag, grouped by day.
- **Inbox.** Anything captured but not yet tagged, dated, or typed. One-tap
  actions to turn it into a task, a journal entry, or just tag it and move
  on — entirely optional, Notebook already has everything regardless.
- **Work / Personal tags** (plus your own custom tags) to slice a mixed-use
  space back apart when you need to.
- **Local-first.** Everything is stored in this browser only, via
  IndexedDB. No account, no server, no data leaving the device.
- **Optional PIN lock** as a casual deterrent against someone picking up
  your phone and reading your journal — see the honesty note in Settings
  about what this does and doesn't protect against.
- **Installable PWA**, works offline once loaded.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. On your phone, open the deployed URL (see
below) and use "Add to Home Screen" for an app-like icon.

### Scripts

| Command                 | What it does                                   |
| ------------------------ | ----------------------------------------------- |
| `npm run dev`            | Local dev server with hot reload                |
| `npm run build`          | Type-checks and builds to `dist/`                |
| `npm test`                | Runs the test suite once                        |
| `npm run test:watch`      | Runs tests in watch mode                         |
| `npm run lint`            | Lints with oxlint                                |
| `npm run preview`         | Serves the production build locally              |
| `npm run generate-icons`  | Regenerates `public/**/*.png` (see below)        |

## Deploying (GitHub Pages)

A workflow at `.github/workflows/deploy.yml` builds and deploys `main` to
GitHub Pages automatically. **One manual step is required once**, since
this repo can't flip its own settings: in the repo's **Settings → Pages**,
set **Build and deployment → Source** to **GitHub Actions**. After that,
every push to `main` redeploys, and the workflow's summary/Deployments tab
has the live URL.

The app is built with a base path of `/arborvacuum-central-hub/` to match
this repo's name as a GitHub Pages project site (see `vite.config.ts`) — if
you ever rename the repo or move to a custom domain, update `REPO_NAME`
there.

## Architecture

- **React + TypeScript + Vite**, styled with **Tailwind CSS v4**.
- **IndexedDB via Dexie** for storage; **`vite-plugin-pwa`** for the
  installable/offline app shell.
- **`react-router-dom`** with a `HashRouter` (avoids needing server-side
  rewrite rules on a static host like Pages).
- Browser **Web Speech API** for transcription, behind a small
  `useSpeechRecognition` hook.

### Data model & the "sync-ready" seam

Everything is local-only today, but deliberately shaped so that doesn't
have to be permanent:

- Every record (`Entry`, `Tag`) has a random UUID plus
  `createdAt` / `updatedAt` / `deletedAt` (soft delete). That's the shape a
  future sync backend needs to do last-write-wins merging.
- All storage access goes through **`src/data/repository.ts`** — no
  component ever imports Dexie directly. Adding real sync later means
  writing one new module behind that same boundary, not touching UI code.
- **Settings → Export/Import** is a JSON backup today, and it doubles as a
  manual "sync": export on one device, import on another. Import is a
  merge (last-write-wins by `updatedAt`), not a destructive replace, so
  it's safe to run more than once. It uses the exact same record shape a
  real sync engine would use on the wire.

See `src/data/types.ts`, `src/data/repository.ts`, and
`src/data/selectors.ts` for the core logic — `selectors.ts` in particular
is what decides "what counts as today" and is unit tested in
`src/data/selectors.test.ts`.

### Icons

There's no image-editing tool in this project's toolchain, so
`scripts/generate-icons.mjs` renders the PWA icons from scratch — a small
pixel-by-pixel gradient + glyph renderer plus a hand-rolled PNG encoder
(the only dependency is Node's built-in `zlib`). Run
`npm run generate-icons` after editing that script to regenerate
`public/favicon.png` and `public/icons/*.png`.

## Browser support notes

- Voice capture uses the (still non-standard) Web Speech API. It works
  well in desktop Chrome/Edge and Android Chrome. It's unsupported in
  Firefox and weak in iOS Safari — the mic button disables itself with an
  explanatory tooltip there rather than failing silently; typing always
  works everywhere.
- Everything else targets evergreen browsers generally.

## Privacy & the PIN lock

All data stays in this browser's IndexedDB — nothing is sent anywhere.
The optional PIN lock (Settings → App lock) is a **casual deterrent**
against someone glancing at your phone, not real security: the underlying
data isn't encrypted, and "Forgot your PIN?" on the lock screen removes
the lock without knowing it, on purpose, so you can never be locked out of
your own journal. Don't rely on it for anything truly sensitive.

Because everything is local-only, **losing the browser's storage (clearing
site data, a fresh browser profile, a new device) loses your data.**
Export a backup from Settings periodically.

## Roadmap / deliberately not in v1

- **Real multi-device sync.** The data layer is shaped for it (see above);
  it isn't built because it requires standing up a hosted backend (e.g. a
  free-tier Supabase project) that only you can create an account for.
- **Whisper-API-based transcription** as an alternative to the free
  browser speech recognition, for full iOS support and higher accuracy —
  `useSpeechRecognition`'s interface is intentionally provider-shaped so a
  second implementation can sit behind the same mic button.
- **Calendar integration** (e.g. Google Calendar) for the Today view.
- **Reminders/notifications** for due tasks.
