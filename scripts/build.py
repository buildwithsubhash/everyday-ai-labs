#!/usr/bin/env python3
"""Generates /p/<id>/index.html for every product plus sitemap.xml and robots.txt.
Run locally:  python3 scripts/build.py     (GitHub runs it for you, see .github/workflows/build.yml)"""
import json, html, shutil, re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
site = json.loads((root / "data" / "site.json").read_text())
base_url = site["url"].rstrip("/")
cur = site.get("currency", "USD")
items = [p for p in json.loads((root / "data" / "products.json").read_text()) if not p.get("hidden")]
products = [p for p in items if p.get("type", "product") == "product" and re.fullmatch(r"[A-Za-z0-9_-]+", p.get("id", ""))]
tpl = (root / "product.html").read_text()
esc = lambda s: html.escape(str(s or ""), quote=True)

def amount(s):
    m = re.search(r"[\d.]+", str(s or "").replace(",", ""))
    return m.group(0) if m else None

shutil.rmtree(root / "p", ignore_errors=True)
for p in products:
    url = f"{base_url}/p/{p['id']}/"
    title = f"{p['title']} | Everyday AI Labs"
    desc = p.get("tagline") or p["title"]
    sale = p.get("access") != "free" and p.get("salePrice")
    price = "0" if p.get("access") == "free" else amount(p.get("salePrice") if sale else p.get("price"))
    ld = {"@context": "https://schema.org", "@type": "Product", "name": p["title"], "description": desc, "brand": {"@type": "Brand", "name": "Everyday AI Labs"}}
    if p.get("image", "").startswith("https://"): ld["image"] = p["image"]
    if price is not None:
        ld["offers"] = {"@type": "Offer", "price": price, "priceCurrency": cur, "url": url, "availability": "https://schema.org/InStock"}
    head = (
        f'<base href="../../">\n<meta name="eal-id" content="{esc(p["id"])}">\n'
        f'<link rel="canonical" href="{esc(url)}">\n<meta property="og:url" content="{esc(url)}">\n'
        f'<meta name="twitter:card" content="{"summary_large_image" if p.get("image") else "summary"}">\n'
        + (f'<meta property="og:image" content="{esc(p["image"])}">\n' if p.get("image", "").startswith("https://") else "")
        + '<script type="application/ld+json">' + json.dumps(ld).replace("<", "\\u003c") + "</script>\n"
    )
    out = tpl.replace("<title>Product | Everyday AI Labs</title>", f"<title>{esc(title)}</title>")
    out = out.replace('content="Everyday AI Labs product"', f'content="{esc(desc)}"')
    out = out.replace('content="Product | Everyday AI Labs"', f'content="{esc(title)}"')
    out = out.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + head, 1)
    out = out.replace('<p class="muted">Loading…</p>', f'<h1>{esc(p["title"])}</h1><p>{esc(desc)}</p><noscript><p>Please enable JavaScript to see the full details.</p></noscript>')
    d = root / "p" / p["id"]; d.mkdir(parents=True)
    (d / "index.html").write_text(out)

urls = [f"{base_url}/", f"{base_url}/products.html", f"{base_url}/tools.html", f"{base_url}/websites.html", f"{base_url}/legal.html"] + [f"{base_url}/p/{p['id']}/" for p in products]
(root / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"  <url><loc>{esc(u)}</loc></url>\n" for u in urls) + "</urlset>\n")
(root / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {base_url}/sitemap.xml\n")
print(f"Built {len(products)} product pages, sitemap.xml and robots.txt")
