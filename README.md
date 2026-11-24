# Free Games For All

One site with 146 browser games: the 21 games from the original Free Games For All Google Sites, 49 popular HTML5 games, and 76 classic Flash games that run through a self-hosted copy of [Ruffle](https://ruffle.rs).

## What's here

| Path | What it is |
| --- | --- |
| `index.html`, `assets/` | The lobby and player: search, categories, favorites, recently played, play time, fullscreen |
| `assets/catalog.js` | Every game's title, category, controls, credits. Edit this to add or change games |
| `games/` | HTML5 games: single `.html` files from the old Google Sites, plus one folder per newer game (`games/<id>/index.html`) |
| `flash/` | Flash games (`.swf`) |
| `flash.html` | Small page that runs one SWF with Ruffle |
| `ruffle/` | Ruffle 0.7.1, self-hosted so nothing loads from another site |
| `thumbs/` | Cover images |
| `sw.js`, `manifest.webmanifest` | Offline support and "Install app" |
| `tools/` | Scripts that rebuild covers and metadata |

## Put it online with GitHub Pages

1. Create an empty repository on GitHub (for example `free-games-for-all`).
2. From this folder, in PowerShell:

```powershell
git remote add origin https://github.com/YOUR-NAME/free-games-for-all.git
```

```powershell
git push -u origin main
```

3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, pick `main` and `/ (root)`, then **Save**.
4. After a minute the site is live at `https://YOUR-NAME.github.io/free-games-for-all/`.

To keep the old Google Site, add a button or an **Embed → By URL** block on it that points to that address.

## Add a game

1. Put the file in `games/` (a single-file HTML game) or `flash/` (a `.swf`). The file name becomes the game's id, e.g. `flash/bowman.swf` → id `bowman`.
2. Add a line to `assets/catalog.js` (copy a similar game's entry).
3. Make its cover and refresh sizes (needs Node with Playwright, and Python with Pillow):

```powershell
python -m http.server 8765
```

```powershell
node tools/make_thumbs.js bowman
```

```powershell
python tools/build_meta.py
```

4. Bump `VERSION` in `sw.js` so returning visitors get the new catalog right away.

## Known issues

- The nine eddynardo games (Choppy Orc and friends) have no sound effects. The single-file copies on the old Google Sites never included their `media/` sound files; the games still play fine.
- Flash games depend on Ruffle. On a computer with hardware acceleration turned off, Ruffle shows a notice and may run slowly.
- A few Flash games try to contact long-dead ad servers on startup. Those requests fail quietly and the games carry on.
