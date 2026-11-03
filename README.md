# MyPod

MyPod is a podcast web app that I am building as a portfolio project. It started as an old practice clone of another podcast app, and I rebuilt it with its own design, name and features.

**This is a portfolio project. It has no real users, and it is not deployed yet.** The shows in the app are sample data that I made up, and their audio is a generated tone.

This repo is the frontend. The API is in a separate repo.

## What works today

- Browse shows, search them by name, and filter them by topic
- Open a show and see its episodes
- Play, pause, skip and seek with a player shaped like a radio tuner dial
- Create an account and log in
- Resume an episode from where you stopped
- See recently listened episodes
- Save favorites
- Create playlists, add and remove episodes, and delete playlists
- Customize your home page: move sections with arrows or by dragging, hide them, choose small or large, and choose what appears inside
- Use it on a phone-sized screen

## Built with

React 19, TypeScript, Vite, Tailwind CSS v4, React Router, the free components from [BoardUI](https://www.boardui.com), and Vitest with Testing Library.

## Run it

You need the API running first. See the README in the API repo.

```bash
npm install
cp .env.example .env
npm run dev
```

Then open http://localhost:5173. Run the tests with `npm test`.

`VITE_API_URL` in `.env` sets the address of the API, so nothing is hardcoded.

## Security decisions

- **Access token:** it is kept in memory only, never in `localStorage`, so a script injected into the page has no saved token to find in browser storage.
- **Refresh token:** it is kept in an httpOnly cookie, which page scripts cannot read. When the access token expires, the app gets a new one and retries once.
- **Audio links:** the app asks for audio by episode ID. It never sends a file path.
- **Cover images:** only `http` and `https` image links are loaded. Anything else falls back to generated art.

## How customizing works

**Customize home** turns on an edit mode on the real page, and I kept it simple on purpose:

- **Clear mode:** a bar stays at the top, and play buttons and links stop working while you edit.
- **Safe changes:** nothing reaches the server until you press Save. Cancel throws your changes away, and if a save fails, your changes stay on screen so you can try again.
- **Set positions:** sections snap into a list, so nobody can make a messy layout.
- **Not only a mouse:** every drag has arrow buttons that do the same thing, so it also works by touch and keyboard.

## Design

The player's progress bar is a radio dial with tick marks and a moving orange needle, and that idea runs through the rest of the design. The colors are navy, cobalt, butter yellow and signal orange on pale blue. Headings use Bricolage Grotesque and body text uses Instrument Sans. Cover art is generated from each show's ID, so the app uses no real show art.

## What is not done yet

- **More of the build-your-own pod:** the home page can already be customized. Next come more pages, free card resizing, notes, and collections that you fill yourself.
- **Import:** bring in podcasts from public RSS feeds, OPML files and audio files you already own.
- **Deployment:** a live version on a cloud provider, with HTTPS, backups and monitoring.

There are also no popularity charts, because with no real users those numbers would be invented.
