window.EAL = (function () {
  "use strict";
  var DRAFT_KEY = "eal_products_draft";
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function safeUrl(u) { try { var x = new URL(u); return x.protocol === "https:" ? x.href : "#"; } catch (e) { return "#"; } }
  async function load() {
    var list = [];
    var wantDraft = new URLSearchParams(location.search).has("preview");
    try {
      var d = wantDraft && JSON.parse(localStorage.getItem(DRAFT_KEY));
      if (Array.isArray(d)) list = d;
      else { var r = await fetch("data/products.json?t=" + Date.now(), { cache: "no-store" }); if (r.ok) list = await r.json(); }
    } catch (e) {}
    return list.filter(function (p) { return !p.hidden; }).map(function (p) { p.type = p.type || "product"; return p; });
  }
  var TONE_MAP = { guides: "peach", prompts: "butter", templates: "lav", bundles: "mint", courses: "sky", pinterest: "peach", marketing: "mint", wellness: "lav", "social media": "sky", automation: "lav", productivity: "butter" }, TONES = ["peach", "butter", "mint", "lav", "sky"];
  function tone(p) {
    if (p.type === "tool") return "k-sky"; if (p.type === "site") return "k-lav";
    var c = String(p.category || "x").toLowerCase(), h = 0;
    if (TONE_MAP[c]) return "k-" + TONE_MAP[c];
    for (var i = 0; i < c.length; i++) h = (h * 31 + c.charCodeAt(i)) >>> 0;
    return "k-" + TONES[h % 5];
  }
  function book(p, cls) {
    var b = el("div", "book " + (cls || "")); b.appendChild(el("b", "", p.title)); if (p.category) b.appendChild(el("small", "", p.category)); return b;
  }
  function reveal() {
    var els = document.querySelectorAll(".card:not(.reveal),.row:not(.reveal),.quotes figure:not(.reveal),.shots img:not(.reveal),.incl li:not(.reveal)");
    var io = "IntersectionObserver" in window ? new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -40px 0px" }) : null;
    els.forEach(function (n) { n.classList.add("reveal"); io ? io.observe(n) : n.classList.add("in"); });
  }
  function kind(p) { return p.type === "tool" ? "tool" : p.type === "site" ? "site" : (p.access === "free" ? "free" : "premium"); }
  function kindLabel(p) { return { tool: "AI tool", site: "Useful website", free: "Free download", premium: "Premium" }[kind(p)]; }
  function num(s) { var m = String(s || "").replace(/,/g, "").match(/[\d.]+/); return m ? parseFloat(m[0]) : NaN; }
  function saleOn(p) { return !!(p.salePrice && p.access !== "free" && (!p.saleEnds || new Date(p.saleEnds + "T23:59:59") >= new Date())); }
  function priceNode(p) {
    var box = el("span", "price");
    if (p.type !== "product") { box.appendChild(el("span", "", p.price || "Free")); return box; }
    if (p.access === "free") { box.appendChild(el("span", "", "Free")); return box; }
    if (saleOn(p)) {
      box.appendChild(el("span", "", p.salePrice)); box.appendChild(el("span", "was", p.price));
      var a = num(p.price), b = num(p.salePrice);
      if (a > b && b >= 0) box.appendChild(el("span", "off", "Save " + Math.round((1 - b / a) * 100) + "%"));
    } else box.appendChild(el("span", "", p.price));
    return box;
  }
  function buyUrl(p) {
    var u = safeUrl(p.url);
    if (u !== "#" && p.code && saleOn(p)) { var x = new URL(u); x.searchParams.set("offer_code", p.code); return x.href; }
    return u;
  }
  function buyButton(p, cls) {
    var a = el("a", "btn " + (cls || ""), p.access === "free" ? "Get it free" : "Buy now");
    a.href = buyUrl(p);
    a.target = "_blank"; a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", a.textContent + ": " + p.title);
    return a;
  }
  function thumb(p) {
    var t = el("div", "thumb " + tone(p));
    if (p.image) { var i = document.createElement("img"); i.src = safeUrl(p.image); i.alt = ""; i.loading = "lazy"; t.appendChild(i); }
    else t.appendChild(book(p));
    if (p.badge) t.appendChild(el("span", "badge", p.badge));
    else if (saleOn(p)) t.appendChild(el("span", "badge", "On sale"));
    return t;
  }
  document.querySelectorAll("[data-yr]").forEach(function (n) { n.textContent = new Date().getFullYear(); });
  var nav = document.querySelector(".bar nav");
  if (nav) {
    var root = document.documentElement, tb = el("button", "theme"); tb.type = "button";
    var cur = function () { return root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); };
    var paint = function () { var d = cur() === "dark"; tb.textContent = d ? "Light" : "Dark"; tb.setAttribute("aria-label", "Switch to " + (d ? "light" : "dark") + " theme"); };
    tb.addEventListener("click", function () { var n = cur() === "dark" ? "light" : "dark"; root.dataset.theme = n; try { localStorage.setItem("eal_theme", n); } catch (e) {} paint(); });
    paint(); nav.appendChild(tb);
  }
  return { tone: tone, book: book, reveal: reveal, el: el, safeUrl: safeUrl, load: load, kindLabel: kindLabel, saleOn: saleOn, priceNode: priceNode, buyButton: buyButton, thumb: thumb };
})();
