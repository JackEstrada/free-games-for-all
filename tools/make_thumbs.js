// Screenshot each game's title screen into thumbs/<id>.png (build_meta.py converts them to .webp).
// Usage (from the site folder, with a local server running on port 8765):
//   node tools/make_thumbs.js [id ...]        no ids = every game in assets/catalog.js
// Needs Playwright with Chromium installed.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "assets/catalog.js"), "utf8"), sandbox);
const catalog = sandbox.window.CATALOG;
const only = process.argv.slice(2);
const list = only.length ? catalog.filter((g) => only.includes(g.id)) : catalog;
const BASE = process.env.BASE || "http://127.0.0.1:8765/";
// Extra wait (ms) for games whose title screen shows up late, plus optional clicks to get past splash screens.
const WAIT = { slope: 16000, "among-us": 14000, "moto-x3m-winter": 14000, "duck-life-3-evolution": 22000, "duck-life-4": 22000, bloxorz: 20000, "pandemic-1": 18000 };
const CLICKS = JSON.parse(process.env.CLICKS || "{}");

(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "127.0.0.1,localhost" } : undefined;
  const browser = await chromium.launch({ proxy, args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--mute-audio", "--autoplay-policy=no-user-gesture-required"] });
  fs.mkdirSync(path.join(ROOT, "thumbs"), { recursive: true });
  for (const g of list) {
    let w = 1000, h = 625;
    if (g.aspect) {
      if (g.aspect >= 1) { w = 900; h = Math.round(900 / g.aspect); } else { h = 800; w = Math.round(800 * g.aspect); }
    }
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    const url = BASE + (g.type === "flash" ? `flash.html?swf=flash/${g.id}.swf` : g.dir ? `games/${g.id}/index.html` : `games/${g.id}.html`);
    try { await page.goto(url, { waitUntil: "load", timeout: 90000 }); } catch (e) { console.log("load timeout", g.id); }
    await page.waitForTimeout(WAIT[g.id] || +(process.env.WAIT_MS || 10000));
    // Headless Chromium has no GPU, so Ruffle shows a notice that eats the first click.
    if (CLICKS[g.id]) { await page.mouse.click(w - 4, h - 4); await page.waitForTimeout(500); }
    for (const [x, y, pause] of CLICKS[g.id] || []) { await page.mouse.click(x * w, y * h); await page.waitForTimeout(pause || 1500); }
    // Hide Ruffle's "hardware acceleration is disabled" notice, which only appears in headless Chromium.
    await page.evaluate(() => {
      const m = document.querySelector("ruffle-player")?.shadowRoot?.getElementById("hardware-acceleration-modal");
      if (m) m.style.display = "none";
    }).catch(() => {});
    try {
      await page.screenshot({ path: path.join(ROOT, "thumbs", g.id + ".png"), timeout: 20000 });
      console.log("thumb", g.id, `${w}x${h}`);
    } catch (e) {
      console.log("FAILED", g.id, e.message.split("\n")[0]); // a game that hangs the page shouldn't stop the rest
    }
    await ctx.close().catch(() => {});
  }
  await browser.close();
})();
