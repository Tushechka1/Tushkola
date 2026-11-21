# AGENTS.md

## Architecture
A static site with no build step and no framework. Everything that ships lives in `public/` (see `netlify.toml`).

- `public/index.html`: landing page. Text comes from `data-i18n` keys. Behaviour is in `assets/site.js` (sticky header, scroll reveal, PWA install prompt, SW registration).
- `public/app.html` + `assets/app.js`: demo app. A hash router (`#student`, `#parent`, `#teacher`, `#admin`; empty hash shows the role picker). Views are template-string functions (`viewStudent`, `viewParent`, `viewTeacher`, `viewAdmin`). They re-render fully on every state change. Clicks are handled with one delegated listener on `#view` via `data-action`.
- `assets/i18n.js`: dictionaries for `ru`, `en`, `tt`, `vi`, `zh` plus `window.I18N` (`t(key, vars)`, `setLang`, `onChange`, `locale()`). Every language must define exactly the same keys. Russian is the fallback. Any `<select class="lang-select">` becomes a switcher automatically.
- `assets/style.css`: shared design tokens and styles for both pages.
- `manifest.webmanifest`, `sw.js`, `icons/`: PWA. Bump `CACHE` in `sw.js` when the asset list changes.

## State (demo)
`localStorage['tushkola-demo-v1']`, seeded by `seed()` in `app.js`. Balances are never stored. They are computed from the `ops` ledger (award / buy / request / refund / approve / goal; `amount` is signed). Seeded catalogue items and the goal use translation keys (`key`). Admin-created ones store a raw `name`.

## Conventions
- Never put user-facing text directly in markup or JS; add an i18n key to all five dictionaries.
- Escape any user-entered string with `esc()` before injecting HTML.
- Student names have `ru` and `en` forms. `ru`/`tt` show Cyrillic, others show Latin.
- Don't add a build step unless moving to a framework; the folder must stay drag-and-drop deployable.
