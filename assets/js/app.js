(function () {
  "use strict";
  var E = EAL, el = E.el, items = [], q = "", LIMIT = 3;
  var MODE = document.body.dataset.type || "";
  var TYPES = MODE ? [MODE] : ["product", "tool", "site"];
  var $ = function (id) { return document.getElementById(id); };
  var byFeatured = function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); };
  var state = { product: { f: "all", open: false }, tool: { f: "all", open: false }, site: { f: "all", open: false } };
  function match(p) { return !q || [p.title, p.tagline, p.category, p.tags, p.why].join(" ").toLowerCase().indexOf(q) > -1; }

  function productCard(p) {
    var a = el("a", "card"); a.href = "p/" + encodeURIComponent(p.id) + "/";
    var body = el("div", "body");
    body.appendChild(el("h3", "", p.title));
    body.appendChild(el("p", "", p.tagline || ""));
    var buy = el("div", "buy"); buy.appendChild(E.priceNode(p)); buy.appendChild(el("span", "go", "View details"));
    body.appendChild(buy); a.appendChild(E.thumb(p)); a.appendChild(body);
    return a;
  }
  function linkRow(p) {
    var a = el("a", "row"); a.href = E.safeUrl(p.url); a.target = "_blank"; a.rel = "noopener noreferrer";
    var rh = el("div", "rh"), host = ""; try { host = new URL(E.safeUrl(p.url)).hostname; } catch (e) {}
    if (host) { var lg = document.createElement("img"); lg.src = "https://www.google.com/s2/favicons?domain=" + host + "&sz=64"; lg.alt = ""; lg.width = 28; lg.height = 28; lg.loading = "lazy"; lg.addEventListener("error", function () { lg.remove(); }); rh.appendChild(lg); }
    rh.appendChild(el("b", "", p.title));
    a.appendChild(el("i", E.tone(p), p.price || "Free")); a.appendChild(rh); a.appendChild(el("span", "", p.tagline || ""));
    if (p.why) a.appendChild(el("span", "why", "Best for: " + p.why));
    a.setAttribute("aria-label", p.title + " (opens in a new tab)");
    return a;
  }
  var SEC = {
    product: { grid: "grid", chips: "filters", more: "productMore", card: productCard, empty: "Nothing here yet. Check back soon.", page: "products.html" },
    tool: { grid: "toolRows", chips: "toolFilters", more: "toolMore", card: linkRow, empty: "No tools listed yet.", page: "tools.html" },
    site: { grid: "siteRows", chips: "siteFilters", more: "siteMore", card: linkRow, empty: "No websites listed yet.", page: "websites.html" }
  };
  function ofType(t) { return items.filter(function (p) { return p.type === t; }); }
  function passes(p, t) {
    var f = state[t].f;
    if (f === "all") return true;
    if (f === "free") return p.access === "free";
    if (f === "premium") return p.access !== "free";
    return (p.category || "") === f.slice(4);
  }
  function chips(t) {
    var box = $(SEC[t].chips); box.textContent = "";
    var cats = []; ofType(t).forEach(function (p) { if (p.category && cats.indexOf(p.category) < 0) cats.push(p.category); });
    var opts = [["all", "All"]];
    if (t === "product") opts.push(["free", "Free"], ["premium", "Premium"]);
    cats.forEach(function (c) { opts.push(["cat:" + c, c]); });
    if (opts.length === 1) return;
    opts.forEach(function (o) {
      var b = el("button", "chip", o[1]); b.type = "button"; b.setAttribute("aria-pressed", String(state[t].f === o[0]));
      b.addEventListener("click", function () { state[t].f = o[0]; state[t].open = false; chips(t); draw(t); });
      box.appendChild(b);
    });
  }
  function draw(t) {
    var s = SEC[t], box = $(s.grid), more = $(s.more); box.textContent = ""; more.textContent = "";
    var list = ofType(t).filter(function (p) { return match(p) && passes(p, t); }).sort(byFeatured);
    var plain = !q && state[t].f === "all";
    if (!list.length) box.appendChild(el("p", "muted", plain ? s.empty : "No matches."));
    var cut = !MODE && plain && list.length > LIMIT;
    (cut ? list.slice(0, LIMIT) : list).forEach(function (p) { box.appendChild(s.card(p)); });
    if (cut) { var a = el("a", "btn ghost", "Show all " + list.length); a.href = s.page; more.appendChild(a); }
    E.reveal();
  }
  function renderStack(list) {
    var s = $("stack"), rot = [-9, 0, 9];
    list.slice(0, 3).forEach(function (p, i) { var b = E.book(p, E.tone(p)); b.style.setProperty("--r", rot[i] + "deg"); b.style.setProperty("--i", i); s.appendChild(b); });
  }
  if ($("q")) $("q").addEventListener("input", function (e) { q = e.target.value.trim().toLowerCase(); TYPES.forEach(draw); });
  E.load().then(function (data) {
    items = data;
    if ($("stack")) renderStack(ofType("product").sort(byFeatured));
    TYPES.forEach(function (t) { chips(t); draw(t); });
  });
})();
