(function () {
  "use strict";

  var GAMES = window.CATALOG || [];
  var META = window.META || {};
  var byId = {};
  GAMES.forEach(function (g) { byId[g.id] = g; });

  // Order used by "Featured" sort and for today's pick. Anything not listed follows in catalog order.
  var FEATURED = [
    "retro-bowl", "slope", "subway-surfers", "ovo", "henry-stickmin-fleeing-the-complex", "run-3", "cookie-clicker",
    "tunnel-rush", "temple-run-2", "fireboy-and-watergirl", "bloons-td-5", "drive-mad", "papas-pizzeria", "moto-x3m",
    "jetpack-joyride", "full-screen-mario", "bitlife", "happy-wheels", "basket-random", "choppy-orc", "stickman-hook",
    "vex-5", "monkey-mart", "big-tower-tiny-square", "drift-boss", "snow-rider-3d", "learn-to-fly-2", "learn-to-fly-3", "fruit-ninja", "rooftop-snipers",
    "paper-io-2", "age-of-war", "the-worlds-hardest-game", "super-mario-63", "2048", "celeste-classic", "idle-breakout",
    "gun-mayhem-2", "riddle-school", "duck-life-4", "super-smash-flash", "the-impossible-quiz", "bad-ice-cream",
    "tiny-fishing", "fancy-pants-adventure", "basketball-stars", "qwop", "one-trick-mage", "portal-flash", "bloxorz",
    "dino", "little-alchemy", "red-ball-4", "motherload", "pandemic-2", "just-one-boss", "tag"
  ];
  var rank = {};
  GAMES.forEach(function (g, i) { rank[g.id] = 1000 + i; });
  FEATURED.forEach(function (id, i) { if (byId[id]) rank[id] = i; });
  // Games whose cover is a sponsor splash screen don't make a good "Today's pick".
  var NO_PICK = ["pandemic-2", "portal-flash", "mario-kart-flash", "paper-io-2", "duck-life-4"];
  var PICK_POOL = FEATURED.slice(0, 40).filter(function (id) { return byId[id] && NO_PICK.indexOf(id) === -1; });

  var CATS = ["Platformer", "Arcade", "Action", "Adventure", "Puzzle", "Strategy", "Racing", "Sports", "2 Player", "Idle", "Simulation", "Board", "Sandbox"];

  // ---------- Per-browser profile ----------
  var KEY = "fgfa:v1";
  function blankProfile() { return { favs: [], plays: {}, time: {}, last: {}, ui: {} }; }
  function loadProfile() {
    try {
      var p = JSON.parse(localStorage.getItem(KEY));
      if (p && typeof p === "object") {
        var b = blankProfile();
        Object.keys(b).forEach(function (k) { if (p[k] && typeof p[k] === typeof b[k]) b[k] = p[k]; });
        return b;
      }
    } catch (e) {}
    return blankProfile();
  }
  var prof = loadProfile();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(prof)); } catch (e) {} }
  function isFav(id) { return prof.favs.indexOf(id) !== -1; }

  // ---------- Helpers ----------
  function $(id) { return document.getElementById(id); }
  function fileOf(g) {
    if (g.type === "flash") return "flash/" + g.id + ".swf";
    return g.dir ? "games/" + g.id + "/index.html" : "games/" + g.id + ".html";
  }
  function srcOf(g) { return g.type === "flash" ? "flash.html?swf=flash/" + g.id + ".swf" : fileOf(g); }
  function thumbOf(g) { return "thumbs/" + g.id + ".webp"; }
  function fmtSize(b) { return b >= 1e6 ? (b / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1e3)) + " KB"; }
  function ago(t) {
    var s = (Date.now() - t) / 1000;
    if (s < 3600) return Math.max(1, Math.round(s / 60)) + "m ago";
    if (s < 86400) return Math.round(s / 3600) + "h ago";
    return Math.round(s / 86400) + "d ago";
  }
  var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  function needsKeyboard(g) { return g.input === "keys"; }
  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';

  var toastTimer;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2200);
  }

  // ---------- Cards ----------
  function thumbImg(g) {
    var img = new Image();
    img.loading = "lazy"; img.decoding = "async"; img.alt = "";
    img.src = thumbOf(g);
    img.onerror = function () {
      var ph = h("div", "ph-title", g.title);
      img.replaceWith(ph);
    };
    return img;
  }
  function card(g) {
    var art = h("article", "card");
    art.style.setProperty("--tint", (META[g.id] && META[g.id].tint) || "#2c2448");
    var a = h("a", "card-link"); a.href = "#" + g.id;
    var th = h("div", "thumb"); th.appendChild(thumbImg(g));
    var n = prof.plays[g.id] || 0;
    if (n) th.appendChild(h("span", "played", n === 1 ? "Played" : "Played " + n + "×"));
    var body = h("div", "card-body");
    body.appendChild(h("h3", null, g.title));
    var meta = h("p", "meta");
    meta.appendChild(h("span", null, g.cat));
    meta.appendChild(h("span", "badge " + (g.type === "flash" ? "badge-flash" : "badge-html"), g.type === "flash" ? "Flash" : "HTML5"));
    if (coarse && needsKeyboard(g)) meta.appendChild(h("span", "badge badge-keys", "Keyboard"));
    body.appendChild(meta);
    a.appendChild(th); a.appendChild(body);
    var fav = h("button", "fav"); fav.type = "button";
    fav.dataset.fav = g.id;
    fav.setAttribute("aria-pressed", String(isFav(g.id)));
    fav.setAttribute("aria-label", (isFav(g.id) ? "Remove " : "Add ") + g.title + (isFav(g.id) ? " from" : " to") + " favorites");
    fav.innerHTML = HEART;
    art.appendChild(a); art.appendChild(fav);
    return art;
  }

  function toggleFav(id) {
    var i = prof.favs.indexOf(id);
    if (i === -1) prof.favs.push(id); else prof.favs.splice(i, 1);
    save();
    var on = i === -1;
    toast(on ? "Added " + byId[id].title + " to favorites" : "Removed from favorites");
    document.querySelectorAll('[data-fav="' + id + '"]').forEach(function (b) {
      b.setAttribute("aria-pressed", String(on));
      b.setAttribute("aria-label", (on ? "Remove " : "Add ") + byId[id].title + (on ? " from" : " to") + " favorites");
    });
    if (current && current.id === id) syncPlayerFav();
    renderChips();
    if (state.cat === "Favorites") renderGrid();
  }

  // ---------- Lobby ----------
  var state = {
    q: "",
    cat: prof.ui.cat || "All",
    sort: prof.ui.sort || "featured"
  };

  function score(g, q) {
    if (!q) return 1;
    var title = g.title.toLowerCase();
    var hay = [title, g.cat, g.by || "", g.series || "", g.blurb, g.type === "flash" ? "flash" : "html5"].join(" ").toLowerCase();
    var words = q.split(/\s+/).filter(Boolean);
    for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) === -1) return 0;
    if (title.indexOf(q) === 0) return 4;
    if (title.indexOf(q) !== -1) return 3;
    if (words.every(function (w) { return title.indexOf(w) !== -1; })) return 2;
    return 1;
  }

  function visibleGames() {
    var q = state.q.trim().toLowerCase();
    var list = GAMES.filter(function (g) {
      if (state.cat === "Favorites") { if (!isFav(g.id)) return false; }
      else if (state.cat === "Flash") { if (g.type !== "flash") return false; }
      else if (state.cat !== "All" && g.cat !== state.cat) return false;
      return score(g, q) > 0;
    });
    var cmp = {
      featured: function (a, b) { return rank[a.id] - rank[b.id]; },
      az: function (a, b) { return a.title.localeCompare(b.title); },
      recent: function (a, b) { return (prof.last[b.id] || 0) - (prof.last[a.id] || 0) || rank[a.id] - rank[b.id]; },
      most: function (a, b) { return (prof.plays[b.id] || 0) - (prof.plays[a.id] || 0) || rank[a.id] - rank[b.id]; }
    }[state.sort] || function () { return 0; };
    list.sort(function (a, b) { return q ? (score(b, q) - score(a, q)) || cmp(a, b) : cmp(a, b); });
    return list;
  }

  function renderGrid() {
    var list = visibleGames();
    var grid = $("grid");
    var frag = document.createDocumentFragment();
    list.forEach(function (g) { frag.appendChild(card(g)); });
    grid.replaceChildren(frag);
    $("empty").hidden = list.length > 0;
    if (state.cat === "Favorites" && !prof.favs.length) {
      $("empty").textContent = "No favorites yet. Tap the heart on any game to keep it here.";
    } else {
      $("empty").textContent = "No games match. Try a shorter search or another category.";
    }
    var parts = [];
    if (state.q.trim()) parts.push(list.length + (list.length === 1 ? " game matches" : " games match") + " “" + state.q.trim() + "”");
    else if (state.cat !== "All") parts.push(list.length + (list.length === 1 ? " game" : " games"));
    $("result-line").textContent = parts.join("");
    $("result-line").hidden = !parts.length;
  }

  function renderChips() {
    var counts = { All: GAMES.length, Favorites: prof.favs.filter(function (id) { return byId[id]; }).length, Flash: 0 };
    GAMES.forEach(function (g) { counts[g.cat] = (counts[g.cat] || 0) + 1; if (g.type === "flash") counts.Flash++; });
    var names = ["All", "Favorites"].concat(CATS.filter(function (c) { return counts[c]; }), ["Flash"]);
    var wrap = $("chips");
    var frag = document.createDocumentFragment();
    names.forEach(function (c) {
      var b = h("button", "chip" + (c === "Favorites" ? " fav-chip" : "")); b.type = "button";
      b.dataset.cat = c;
      b.setAttribute("aria-pressed", String(state.cat === c));
      if (c === "Favorites") b.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" style="fill:currentColor"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>');
      b.appendChild(document.createTextNode(c === "Flash" ? "All Flash" : c));
      b.appendChild(h("b", null, String(counts[c] || 0)));
      frag.appendChild(b);
    });
    wrap.replaceChildren(frag);
  }

  function renderSide() {
    var played = Object.keys(prof.plays).filter(function (id) { return byId[id]; });
    var secs = Object.keys(prof.time).reduce(function (s, id) { return s + (prof.time[id] || 0); }, 0);
    $("c-total").textContent = GAMES.length;
    $("c-played").textContent = played.length;
    var hrs = secs / 3600;
    $("c-hours").textContent = hrs < 10 ? hrs.toFixed(1) : Math.round(hrs);
    var recent = played.sort(function (a, b) { return (prof.last[b] || 0) - (prof.last[a] || 0); }).slice(0, 5);
    var ul = $("recent");
    var frag = document.createDocumentFragment();
    recent.forEach(function (id) {
      var g = byId[id];
      var li = h("li"); var a = h("a"); a.href = "#" + id;
      var img = new Image(); img.alt = ""; img.loading = "lazy"; img.src = thumbOf(g);
      img.onerror = function () { img.replaceWith(h("span", "ph")); };
      a.appendChild(img);
      a.appendChild(h("span", "r-title", g.title));
      a.appendChild(h("span", "r-meta", ago(prof.last[id])));
      li.appendChild(a); frag.appendChild(li);
    });
    ul.replaceChildren(frag);
    $("recent-empty").hidden = recent.length > 0;
  }

  var pickIndex = (function () {
    var d = new Date(), key = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate();
    return key % PICK_POOL.length;
  })();
  function renderFeature() {
    var g = byId[PICK_POOL[pickIndex % PICK_POOL.length]];
    if (!g) return;
    $("feature-title").textContent = g.title;
    $("feature-by").textContent = [g.cat, g.type === "flash" ? "Flash" : "HTML5", g.by].filter(Boolean).join(" · ");
    $("feature-blurb").textContent = g.blurb;
    $("feature-play").href = "#" + g.id;
    $("feature-art").href = "#" + g.id;
    var img = $("feature-img");
    img.onerror = function () { img.removeAttribute("src"); };
    img.src = thumbOf(g);
    $("feature").style.setProperty("--tint", (META[g.id] && META[g.id].tint) || "#2c2448");
  }

  function renderLobby() {
    renderFeature(); renderSide(); renderChips(); renderGrid();
    $("sort").value = state.sort;
  }

  // ---------- Player ----------
  var current = null, frame = null, lobbyScroll = 0, tick = null, unsaved = 0;

  function syncPlayerFav() {
    var on = isFav(current.id), b = $("p-fav");
    b.dataset.fav = current.id;
    b.setAttribute("aria-pressed", String(on));
    b.setAttribute("aria-label", on ? "Remove from favorites" : "Add to favorites");
  }

  function layout() {
    if (!current) return;
    var box = $("frame-box"), stage = $("pstage");
    if (document.fullscreenElement === box) { box.style.width = ""; box.style.height = ""; return; }
    var cs = getComputedStyle(stage);
    var availW = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var availH = window.innerHeight - $("player").querySelector(".pbar").offsetHeight - 20;
    availH = Math.max(availH, 240);
    var w = availW, hh = availH;
    if (current.aspect) {
      if (w / hh > current.aspect) w = hh * current.aspect; else hh = w / current.aspect;
    }
    box.style.width = Math.floor(w) + "px";
    box.style.height = Math.floor(hh) + "px";
  }

  function focusGame() {
    if (!frame) return;
    try { frame.focus(); frame.contentWindow && frame.contentWindow.focus(); } catch (e) {}
  }

  function loadFrame() {
    var box = $("frame-box");
    if (frame) { frame.remove(); frame = null; }
    $("loading").hidden = false;
    $("loading-text").textContent = "Loading " + current.title;
    var m = META[current.id];
    $("loading-size").textContent = m && m.size ? fmtSize(m.size) : "";
    frame = document.createElement("iframe");
    frame.title = current.title;
    frame.setAttribute("allow", "autoplay; fullscreen; gamepad; pointer-lock; clipboard-write");
    frame.setAttribute("allowfullscreen", "");
    frame.addEventListener("load", function () {
      $("loading").hidden = true;
      focusGame();
    });
    frame.src = srcOf(current);
    box.appendChild(frame);
  }

  function renderInfo(g) {
    $("p-blurb").textContent = g.blurb;
    var facts = $("p-facts");
    facts.replaceChildren();
    facts.appendChild(h("span", "fact", g.cat));
    facts.appendChild(h("span", "fact", g.type === "flash" ? "Flash, runs with Ruffle" : "HTML5"));
    var m = META[g.id];
    if (m && m.size) facts.appendChild(h("span", "fact", fmtSize(m.size)));
    if (needsKeyboard(g)) facts.appendChild(h("span", "fact" + (coarse ? " warn" : ""), coarse ? "Needs a keyboard" : "Keyboard"));
    else if (g.input === "mouse") facts.appendChild(h("span", "fact", "Mouse or touch"));
    else facts.appendChild(h("span", "fact", "Keyboard and mouse"));
    if (window.caches && caches.match) {
      caches.match(fileOf(g), { ignoreSearch: true }).then(function (r) {
        if (r && current === g) facts.appendChild(h("span", "fact ok", "Saved for offline"));
      }).catch(function () {});
    }

    var dl = $("p-controls");
    dl.replaceChildren();
    (g.controls || []).forEach(function (c) {
      var dt = h("dt");
      c[0].split(" / ").forEach(function (k) { dt.appendChild(h("kbd", null, k)); });
      dl.appendChild(dt);
      dl.appendChild(h("dd", null, c[1]));
    });

    var same = g.series ? GAMES.filter(function (x) { return x.series === g.series && x.id !== g.id; }) : [];
    var pool = same.length ? same : GAMES.filter(function (x) { return x.cat === g.cat && x.id !== g.id; });
    if (same.length && same.length < 6) {
      pool = pool.concat(GAMES.filter(function (x) { return x.cat === g.cat && x.id !== g.id && same.indexOf(x) === -1; }));
    }
    pool.sort(function (a, b) {
      var sa = a.series === g.series && g.series ? 0 : 1, sb = b.series === g.series && g.series ? 0 : 1;
      return sa - sb || rank[a.id] - rank[b.id];
    });
    $("more-title").textContent = same.length ? (g.series === "eddynardo" ? "More from eddynardo" : "More in the " + g.series + " series") : "More " + g.cat.toLowerCase() + " games";
    var more = $("more"); var frag = document.createDocumentFragment();
    pool.slice(0, 6).forEach(function (x) { frag.appendChild(card(x)); });
    more.replaceChildren(frag);
  }

  function openGame(g) {
    if (current && current.id === g.id) return;
    if (!current) lobbyScroll = window.scrollY;
    stopTimer();
    current = g;
    document.body.classList.add("playing");
    $("lobby").hidden = true;
    $("player").hidden = false;
    document.title = g.title + " · Free Games For All";
    $("p-title").textContent = g.title;
    $("p-by").textContent = g.by ? "by " + g.by : (g.type === "flash" ? "Classic Flash game" : "HTML5 game");
    $("p-newtab").href = srcOf(g);
    syncPlayerFav();
    renderInfo(g);
    window.scrollTo(0, 0);
    layout();
    loadFrame();
    prof.plays[g.id] = (prof.plays[g.id] || 0) + 1;
    prof.last[g.id] = Date.now();
    save();
    startTimer();
  }

  function closeGame() {
    if (!current) return;
    stopTimer();
    if (frame) { frame.src = "about:blank"; frame.remove(); frame = null; }
    current = null;
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
    document.body.classList.remove("playing");
    $("player").hidden = true;
    $("lobby").hidden = false;
    document.title = "Free Games For All";
    renderLobby();
    window.scrollTo(0, lobbyScroll);
  }

  function startTimer() {
    tick = setInterval(function () {
      if (!current || document.hidden) return;
      prof.time[current.id] = (prof.time[current.id] || 0) + 5;
      if (++unsaved >= 6) { unsaved = 0; save(); }
    }, 5000);
  }
  function stopTimer() { if (tick) { clearInterval(tick); tick = null; save(); unsaved = 0; } }

  function route() {
    var id = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (id && byId[id]) openGame(byId[id]);
    else closeGame();
  }

  function randomGame() {
    var list = visibleGames();
    if (!list.length) list = GAMES;
    var pick = list[Math.floor(Math.random() * list.length)];
    if (current && list.length > 1 && pick.id === current.id) return randomGame();
    location.hash = pick.id;
  }

  // ---------- Events ----------
  $("q").addEventListener("input", function (e) { state.q = e.target.value; renderGrid(); });
  $("q").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      var first = visibleGames()[0];
      if (first) location.hash = first.id;
    } else if (e.key === "Escape") {
      e.target.value = ""; state.q = ""; renderGrid(); e.target.blur();
    }
  });
  $("chips").addEventListener("click", function (e) {
    var b = e.target.closest(".chip");
    if (!b) return;
    state.cat = b.dataset.cat;
    prof.ui.cat = state.cat; save();
    renderChips(); renderGrid();
  });
  $("sort").addEventListener("change", function (e) {
    state.sort = e.target.value; prof.ui.sort = state.sort; save(); renderGrid();
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-fav]");
    if (b) { e.preventDefault(); toggleFav(b.dataset.fav); }
  });
  $("random").addEventListener("click", randomGame);
  $("feature-next").addEventListener("click", function () { pickIndex++; renderFeature(); });
  $("p-restart").addEventListener("click", function () { if (current) { loadFrame(); toast("Restarted " + current.title); } });
  $("p-full").addEventListener("click", function () {
    var box = $("frame-box");
    var req = box.requestFullscreen || box.webkitRequestFullscreen;
    if (!req) { toast("Fullscreen isn't available here"); return; }
    try {
      var p = req.call(box);
      if (p && p.catch) p.catch(function () { toast("Fullscreen isn't available here"); });
    } catch (err) { toast("Fullscreen isn't available here"); }
  });
  document.addEventListener("fullscreenchange", function () { layout(); focusGame(); });
  window.addEventListener("resize", layout);
  window.addEventListener("hashchange", route);
  document.addEventListener("keydown", function (e) {
    var t = e.target;
    var typing = t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!current) {
      if (e.key === "/") { e.preventDefault(); $("q").focus(); }
      else if (e.key === "r" || e.key === "R") randomGame();
    } else if (e.key === "Escape" && !document.fullscreenElement) {
      location.hash = "";
    }
  });
  document.addEventListener("visibilitychange", function () { if (document.hidden) save(); });
  window.addEventListener("pagehide", save);

  // Install as an app (Chrome/Edge show this when the site qualifies as a PWA).
  var deferredInstall = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); deferredInstall = e; $("install").hidden = false;
  });
  $("install").addEventListener("click", function () {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    deferredInstall = null; $("install").hidden = true;
  });

  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }

  $("q").placeholder = "Search " + GAMES.length + " games";
  renderLobby();
  route();
})();
