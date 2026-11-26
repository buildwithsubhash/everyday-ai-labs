(function () {
  "use strict";
  // Refuse to run inside someone else's frame (clickjacking protection).
  if (window.top !== window.self) { document.body.textContent = "Please open this page directly in its own tab."; return; }
  var DRAFT_KEY = "eal_products_draft", CFG_KEY = "eal_gh_cfg", TOK_KEY = "eal_gh_token", REPO_PATH = "data/products.json", FETCH_PATH = "../data/products.json";
  var products = [];
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function status(msg, bad) { $("status").textContent = msg; $("status").className = "status" + (bad ? " err" : ""); }
  function setDirty(b) { $("dirty").hidden = !b; }
  function saveDraft() { localStorage.setItem(DRAFT_KEY, JSON.stringify(products)); setDirty(true); }
  function b64(s) { return btoa(unescape(encodeURIComponent(s))); }

  // ---- GitHub connection settings ----
  function guess() {
    var m = /^(.+)\.github\.io$/.exec(location.hostname); if (!m) return {};
    var seg = location.pathname.split("/")[1];
    return { owner: m[1], repo: seg && seg !== "admin.html" ? seg : m[1] + ".github.io" };
  }
  function loadCfg() {
    var c = {}; try { c = JSON.parse(localStorage.getItem(CFG_KEY)) || {}; } catch (e) {}
    var g = guess();
    $("ghOwner").value = c.owner || g.owner || ""; $("ghRepo").value = c.repo || g.repo || ""; $("ghBranch").value = c.branch || "main";
    var t = localStorage.getItem(TOK_KEY) || sessionStorage.getItem(TOK_KEY) || "";
    $("ghToken").value = t; $("ghRemember").checked = !!localStorage.getItem(TOK_KEY);
    if (!t) $("gh").open = true;
  }
  function readCfg() {
    return { owner: $("ghOwner").value.trim(), repo: $("ghRepo").value.trim(), branch: $("ghBranch").value.trim() || "main", token: $("ghToken").value.trim() };
  }
  function persistCfg(c) {
    localStorage.setItem(CFG_KEY, JSON.stringify({ owner: c.owner, repo: c.repo, branch: c.branch }));
    localStorage.removeItem(TOK_KEY); sessionStorage.removeItem(TOK_KEY);
    (($("ghRemember").checked) ? localStorage : sessionStorage).setItem(TOK_KEY, c.token);
  }

  // ---- Publish: commit products.json to the repo via the GitHub API ----
  var ERRORS = {
    401: "The token is invalid or expired.",
    403: "The token cannot write to this repo. It needs Contents: Read and write.",
    404: "Repo or branch not found. Check username, repository and branch (a token without access also shows this).",
    409: "The file changed on GitHub meanwhile. Click Publish again.",
    422: "GitHub rejected the update. Check the branch name."
  };
  function fail(r) { status(ERRORS[r.status] || "GitHub error " + r.status + ".", true); }

  async function publish() {
    var c = readCfg();
    if (!c.owner || !c.repo || !c.token) { $("gh").open = true; status("Fill in the GitHub connection details first.", true); return; }
    persistCfg(c);
    var api = "https://api.github.com/repos/" + encodeURIComponent(c.owner) + "/" + encodeURIComponent(c.repo) + "/contents/" + REPO_PATH;
    var h = { Authorization: "Bearer " + c.token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    $("publish").disabled = true; status("Publishing…");
    try {
      var g = await fetch(api + "?ref=" + encodeURIComponent(c.branch), { headers: h, cache: "no-store" });
      var sha;
      if (g.ok) sha = (await g.json()).sha; else if (g.status !== 404) { fail(g); return; }
      var body = { message: "Update products from admin panel", content: b64(JSON.stringify(products, null, 2) + "\n"), branch: c.branch };
      if (sha) body.sha = sha;
      var p = await fetch(api, { method: "PUT", headers: Object.assign({ "Content-Type": "application/json" }, h), body: JSON.stringify(body) });
      if (!p.ok) { fail(p); return; }
      localStorage.removeItem(DRAFT_KEY); setDirty(false);
      status("Published. GitHub Pages will show the changes in about 1 to 2 minutes." + (/^ghp_/.test(c.token) ? " Warning: this is a classic token that can reach all your repos. Replace it with a fine-grained token limited to this one repo." : ""));
    } catch (e) { status("Network error. Check your connection and try again.", true); }
    finally { $("publish").disabled = false; }
  }
  $("publish").addEventListener("click", publish);

  // ---- Product list and form ----
  async function init() {
    loadCfg();
    try { var d = JSON.parse(localStorage.getItem(DRAFT_KEY)); if (Array.isArray(d)) { products = d; setDirty(true); } } catch (e) {}
    if (!products.length && $("dirty").hidden) {
      try { var r = await fetch(FETCH_PATH + "?t=" + Date.now(), { cache: "no-store" }); products = await r.json(); } catch (e) { products = []; }
    }
    render();
  }

  var TYPES = [["product", "Products"], ["tool", "AI tools"], ["site", "Useful websites"]];
  function typeOf(p) { return p.type || "product"; }
  function catOf(p) { return p.category || "No category"; }
  function groupsOf() {
    var out = [];
    TYPES.forEach(function (t) {
      var cats = [];
      products.forEach(function (p) { if (typeOf(p) === t[0] && cats.indexOf(catOf(p)) < 0) cats.push(catOf(p)); });
      cats.forEach(function (c) { out.push({ label: t[1] + " \u00b7 " + c, items: products.filter(function (p) { return typeOf(p) === t[0] && catOf(p) === c; }) }); });
    });
    return out;
  }
  function row(p, grp) {
    var li = el("li"), info = el("div");
    info.appendChild(el("div", "t", p.title + " (" + p.price + ")" + (p.hidden ? " [hidden]" : "")));
    info.appendChild(el("div", "m", p.url));
    var act = el("div", "actions");
    function mv(d, lbl) {
      var b = el("button", "btn ghost small", lbl); b.type = "button"; b.setAttribute("aria-label", "Move " + p.title + (d < 0 ? " up" : " down"));
      b.addEventListener("click", function () { var n = grp[grp.indexOf(p) + d]; if (!n) return; var a = products.indexOf(p), c = products.indexOf(n); products[a] = n; products[c] = p; saveDraft(); render(); });
      act.appendChild(b);
    }
    mv(-1, "Up"); mv(1, "Down");
    var ed = el("button", "btn ghost small", "Edit"); ed.type = "button";
    ed.addEventListener("click", function () { edit(p.id); });
    var del = el("button", "btn ghost small danger", "Delete"); del.type = "button";
    del.addEventListener("click", function () {
      if (!confirm("Delete \"" + p.title + "\"?")) return;
      products = products.filter(function (x) { return x.id !== p.id; }); saveDraft(); render(); resetForm();
    });
    act.appendChild(ed); act.appendChild(del); li.appendChild(info); li.appendChild(act);
    return li;
  }
  function render() {
    var ul = $("list"); ul.textContent = "";
    $("count").textContent = "(" + products.length + ")";
    var dl = $("cats"), seen = {}; dl.textContent = "";
    products.forEach(function (p) { if (p.category && !seen[p.category]) { seen[p.category] = 1; var o = document.createElement("option"); o.value = p.category; dl.appendChild(o); } });
    if (!products.length) ul.appendChild(el("li", "muted", "No products yet. Add your first one."));
    groupsOf().forEach(function (g) {
      ul.appendChild(el("li", "grp", g.label + " (" + g.items.length + ")"));
      g.items.forEach(function (p) { ul.appendChild(row(p, g.items)); });
    });
  }

  var fields = ["type", "access", "title", "tagline", "description", "features", "faq", "gallery", "reviews", "tags", "why", "price", "salePrice", "saleEnds", "code", "meta", "category", "url", "image", "badge"];
  function edit(id) {
    var p = products.find(function (x) { return x.id === id; }); if (!p) return;
    $("id").value = p.id;
    fields.forEach(function (f) { $(f).value = p[f] || ""; });
    $("featured").checked = !!p.featured; $("hidden").checked = !!p.hidden;
    $("formTitle").textContent = "Edit item"; $("save").textContent = "Save changes"; $("cancel").hidden = false;
    $("title").focus();
  }
  function resetForm() {
    $("form").reset(); $("id").value = ""; $("type").value = "product"; $("access").value = "premium"; $("formErr").textContent = "";
    $("formTitle").textContent = "Add item"; $("save").textContent = "Add item"; $("cancel").hidden = true;
  }
  $("cancel").addEventListener("click", resetForm);

  $("form").addEventListener("submit", function (e) {
    e.preventDefault();
    var item = { id: $("id").value || "p" + Date.now() };
    fields.forEach(function (f) { item[f] = $(f).value.trim(); });
    item.featured = $("featured").checked; item.hidden = $("hidden").checked;
    if (item.type !== "product") item.access = "";
    try { if (new URL(item.url).protocol !== "https:") throw 0; } catch (x) { $("formErr").textContent = "The link must start with https://"; return; }
    if (item.image) { try { if (new URL(item.image).protocol !== "https:") throw 0; } catch (x) { $("formErr").textContent = "The image URL must start with https://"; return; } }
    var i = products.findIndex(function (p) { return p.id === item.id; });
    if (i > -1) products[i] = item; else products.unshift(item); // new items go to the top
    saveDraft(); render(); resetForm(); status("Draft saved. Click Publish to put it on the live site.");
  });

  $("download").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(products, null, 2)], { type: "application/json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "products.json";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
  });

  $("import").addEventListener("change", function (e) {
    var f = e.target.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var d = JSON.parse(rd.result);
        if (!Array.isArray(d) || d.some(function (p) { return !p || !p.title || !p.url; })) throw 0;
        products = d; saveDraft(); render();
      } catch (x) { alert("That file is not a valid products.json."); }
    };
    rd.readAsText(f); e.target.value = "";
  });

  $("reset").addEventListener("click", function () {
    if (confirm("Discard your draft and reload the live products.json?")) { localStorage.removeItem(DRAFT_KEY); products = []; setDirty(false); resetForm(); init(); }
  });

  init();
})();
