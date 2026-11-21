# Ту Школа — school coins

Ту Школа is a website and demo app for a school currency. Students earn **coins** for good grades, homework, helping classmates, duty, contests and attendance. They spend them on **lunches**, **privileges** and a shared **class goal**.

- `/` is the landing page. It has the name and description, how to earn coins, what to spend them on, who the site is for (student, parent, teacher, administration), a safety section, and the buttons **Open demo** and **Sign in as a student**.
- `/app.html` is the demo app, with a role picker, all four roles and the admin panel. The **← Back to site** link returns to the landing page.
  - `/app.html#student`, `#parent`, `#teacher` and `#admin` open a role directly.
- Languages: Russian, English, Tatar, Vietnamese and Chinese. The switcher is in the header of both pages, and the choice is remembered. `?lang=en` in the URL also works.
- The site installs on a phone as a PWA (manifest, icons and an offline service worker).

## Technologies
Plain HTML, CSS and vanilla JavaScript with no build step and no dependencies, hosted on Netlify (`netlify.toml` publishes `public/`). Google Fonts: Unbounded and Nunito.

## Running locally
Serve the `public/` folder with any static server, for example `npx serve public` or `netlify dev`. You can also drag the `public/` folder onto https://app.netlify.com/drop.

## Demo data
The demo keeps its state (balances, purchases, requests, rules, catalogue) in the browser's `localStorage`. All roles share it, so an award from the teacher shows up for the student right away. Admin → "Reset demo data" restores the seed.

## Next steps
- Real accounts and roles (Netlify Identity) instead of the demo role switcher.
- Server-side storage of operations in Netlify Database, with per-role access rules.
- Canteen checkout screen that redeems lunch codes.
