(function () {
  "use strict";
  var E = EAL, el = E.el, page = document.getElementById("page");
  var idMeta = document.querySelector('meta[name="eal-id"]');
  var id = idMeta ? idMeta.content : new URLSearchParams(location.search).get("id");
  var lines = function (s) { return String(s || "").split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean); };
  function section(cls, title, sub) {
    var s = el("section", cls), w = el("div", "wrap"); s.appendChild(w);
    w.appendChild(el("h2", "", title)); if (sub) w.appendChild(el("p", "sub", sub));
    page.appendChild(s); return w;
  }
  function notFound() {
    page.textContent = "";
    var w = el("div", "wrap"); w.appendChild(el("h1", "", "Product not found"));
    w.appendChild(el("p", "sub", "This link may be old or the product was removed."));
    var a = el("a", "btn", "See all products"); a.href = "index.html#products"; a.style.marginTop = "1.5rem";
    w.appendChild(a); page.appendChild(w);
  }
  function render(p, all) {
    page.textContent = "";
    document.title = p.title + " | Everyday AI Labs";
    var md = document.querySelector('meta[name="description"]'); if (md) md.content = p.tagline || p.title;
    var free = p.access === "free", k = E.tone(p).slice(2);

    var hero = el("section", "pl"), left = el("div");
    var back = el("a", "crumb", "All products"); back.href = "index.html#products";
    left.appendChild(back); left.appendChild(document.createElement("br"));
    left.appendChild(el("span", "tag k-" + k, E.kindLabel(p)));
    if (p.category) left.appendChild(el("span", "tag", p.category));
    left.appendChild(el("h1", "", p.title));
    left.appendChild(el("p", "lede", p.tagline || ""));
    var pb = el("div", "pricebox"); pb.appendChild(E.priceNode(p)); pb.appendChild(E.buyButton(p, "big")); left.appendChild(pb);
    if (E.saleOn(p) && p.saleEnds) {
      var d = new Date(p.saleEnds + "T00:00:00");
      var days = Math.ceil((new Date(p.saleEnds + "T23:59:59") - new Date()) / 864e5);
      var when = d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
      left.appendChild(el("p", "sale-end", days <= 1 ? "Sale ends today." : days <= 14 ? "Sale ends in " + days + " days (" + when + ")." : "Sale price ends " + when + "."));
    }
    if (p.meta) left.appendChild(el("p", "fine", p.meta));
    left.appendChild(el("p", "fine", free ? "Free download. You will check out on Gumroad for $0." : "Secure checkout on Gumroad. Instant download."));
    var cover = el("div", "cover k-" + k); cover.setAttribute("aria-hidden", "true");
    if (p.image) { var im = document.createElement("img"); im.src = E.safeUrl(p.image); im.alt = ""; cover.appendChild(im); }
    else { cover.appendChild(el("b", "", p.title)); if (p.category) cover.appendChild(el("small", "", p.category)); }
    hero.appendChild(left); hero.appendChild(cover); page.appendChild(hero);

    var about = section("alt", "About this " + (free ? "download" : "product"));
    var long = el("div", "long");
    var paras = String(p.description || "").split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean);
    paras.forEach(function (t) { long.appendChild(el("p", "", t)); });
    about.appendChild(long);

    var shots = lines(p.gallery).map(E.safeUrl).filter(function (u) { return u !== "#"; });
    if (shots.length) {
      var gw = section("", "Preview"), gg = el("div", "shots");
      shots.forEach(function (u) { var im = document.createElement("img"); im.src = u; im.alt = p.title + " preview"; im.loading = "lazy"; gg.appendChild(im); });
      gw.appendChild(gg);
    }
    var feats = lines(p.features);
    if (feats.length) {
      var w = section("", "What is included"), ul = el("ul", "incl");
      feats.forEach(function (f) { ul.appendChild(el("li", "", f)); }); w.appendChild(ul);
    }
    var revs = lines(p.reviews);
    if (revs.length) {
      var rw = section("", "What buyers say"), rg = el("div", "quotes");
      revs.forEach(function (row) {
        var i = row.lastIndexOf("|"); var f = el("figure");
        f.appendChild(el("blockquote", "", i > 0 ? row.slice(0, i).trim() : row));
        if (i > 0) f.appendChild(el("figcaption", "", row.slice(i + 1).trim()));
        rg.appendChild(f);
      });
      rw.appendChild(rg);
    }
    var faq = lines(p.faq);
    if (faq.length) {
      var fw = section("", "Questions");
      faq.forEach(function (row) {
        var i = row.indexOf("|"); if (i < 1) return;
        var d = el("details"); d.appendChild(el("summary", "", row.slice(0, i).trim())); d.appendChild(el("p", "", row.slice(i + 1).trim())); fw.appendChild(d);
      });
    }
    var fin = section("final alt", free ? "Grab it while you are here." : "Ready to start?");
    fin.appendChild(el("p", "", free ? "It costs nothing and arrives straight to your Gumroad library." : "One payment, instant download, yours to keep."));
    var pb2 = el("div", "pricebox"); pb2.style.justifyContent = "center";
    pb2.appendChild(E.priceNode(p)); pb2.appendChild(E.buyButton(p, "big")); fin.appendChild(pb2);

    var more = all.filter(function (x) { return x.type === "product" && x.id !== p.id; }).slice(0, 3);
    if (more.length) {
      var mw = section("", "More from Everyday AI Labs"), g = el("div", "grid");
      more.forEach(function (x) {
        var a = el("a", "card"); a.href = "p/" + encodeURIComponent(x.id) + "/";
        var b = el("div", "body"); b.appendChild(el("h3", "", x.title)); b.appendChild(el("p", "", x.tagline || ""));
        var buy = el("div", "buy"); buy.appendChild(E.priceNode(x)); b.appendChild(buy);
        a.appendChild(E.thumb(x)); a.appendChild(b); g.appendChild(a);
      });
      mw.appendChild(g);
    }
    var bar = el("div", "stick"); bar.appendChild(E.priceNode(p)); bar.appendChild(E.buyButton(p));
    document.body.appendChild(bar);
    window.addEventListener("scroll", function () { bar.classList.toggle("on", window.scrollY > 420); }, { passive: true });
    E.reveal();
  }
  E.load().then(function (all) {
    var p = all.find(function (x) { return x.type === "product" && x.id === id; });
    p ? render(p, all) : notFound();
  });
})();
