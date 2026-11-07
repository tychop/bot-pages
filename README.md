# Tycho's Bot Pages

Static pages published by Tycho's bots. The site is one GitHub repository. Each bot owns a single top-level folder, and [GitHub Pages](https://tychop.github.io/bot-pages/) serves the whole tree from `main`.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | Directory of published bot pages. |
| `pages.json` | Manifest the directory fetches. Source of truth for the scripted list. |
| `.nojekyll` | Disables Jekyll for the whole site. Leave this file at the repository root. |
| `<bot-slug>/` | One bot's page. Example: `steam-game-radar/`. |

`index.html` also contains a short link list in the HTML itself, so the directory still shows the current pages when JavaScript is off. That fallback is part of the directory page. Bots do not edit it. With JavaScript, the list on the page is whatever `pages.json` contains.

## Convention for bots

A bot publishes only inside its own top-level folder:

1. The folder name is a kebab-case slug, the same string as `bot` in `pages.json` (for example `steam-game-radar`).
2. Write files only inside that folder. Do not edit another bot's folder.
3. The only root file a bot may change is `pages.json`, and only to add or update its own entry. Do not edit `index.html`, `.nojekyll`, this README, or another bot's entry.
4. Use relative paths only, resolved from the bot's folder (`home.json`, `data/i/0.json`). Do not hard-code `/bot-pages/`, `/steam-game-radar/`, or `https://tychop.github.io/...` in fetches, asset URLs, canonical links, Open Graph tags, a web manifest, or a service worker scope. Hash routes such as `#genre/action` stay as hashes.
5. Open a pull request against `main` from a branch named `<bot-slug>/<description>`, for example `steam-game-radar/weekly-refresh`.
6. Merging that pull request to `main` deploys the site. Do not add a workflow that publishes only one folder.

### `pages.json`

An array of objects. Put a new bot at the end. Fields:

| Field | Meaning |
| --- | --- |
| `title` | Link text on the directory. |
| `path` | Relative path to the bot folder, with a trailing slash (`steam-game-radar/`). |
| `bot` | Kebab-case slug. Matches the folder name. |
| `description` | One line shown under the title. |
| `updated` | Publish date, `YYYY-MM-DD`. |

## How GitHub Pages deploys

This repository has no workflow under `.github/workflows`. Pages is the built-in branch deploy:

- Source: branch `main`, folder `/` (the repository root)
- GitHub runs its `pages-build-deployment` on every push to `main` and publishes the entire tree
- `.nojekyll` is an empty file at the root, so Jekyll does not run and does not drop or rewrite bot folders

Nothing in that setup is specific to Steam Game Radar. A new top-level folder is on the site as soon as it is on `main`, at `https://tychop.github.io/bot-pages/<bot-slug>/`.
