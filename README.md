# Everyday AI Labs

A static website (no server, no database) for GitHub Pages: a hub for your Gumroad products, AI tools and useful websites, with a landing page for every product.

## Folder structure

```
index.html, products.html, tools.html, websites.html   Public pages
product.html                                            Template for product pages
legal.html                                              Privacy, refunds, disclosure
admin/                                                  Admin panel (index.html, admin.js, admin.css)
assets/css/styles.css                                   Site design
assets/js/                                              common.js, app.js, product.js
data/products.json                                      ALL your products, tools and websites
data/site.json                                          Your site address and currency
scripts/build.py                                        Builds product pages, sitemap.xml, robots.txt
p/                                                      Generated product pages (do not edit by hand)
sitemap.xml, robots.txt                                 Generated for search engines
.github/workflows/build.yml                             Rebuilds the generated files automatically
```

## Publish on GitHub Pages
1. Create a repository, then upload the **contents** of this folder (so `index.html` sits at the top of the repo, not inside a subfolder). Make sure `.github` and `.nojekyll` go up too.
2. Settings, Pages: deploy from branch `main`, folder `/ (root)`.
3. Settings, Actions, General, Workflow permissions: choose **Read and write** (lets the automatic rebuild save its files).
4. Edit `data/site.json`: set `url` to your real address (for example `https://yourname.github.io/your-repo`) and your `currency`.
5. Replace the placeholders: contact email `hello@everydayailabs.com` (footer of every page and `legal.html`), and check every product link.

## Adding and editing items
Open `https://YOUR-SITE/admin/` (bookmark it), connect with a GitHub token, add or edit items, press Publish. The live site updates in 1 to 2 minutes and the Action rebuilds the product pages, sitemap and robots file.
- **Products** get their own page at `/p/<id>/`. Fill the long description (blank line between paragraphs), "What is included", FAQ, price, optional discounted price, sale end date, discount code, cover image URL, preview images and buyer reviews.
- **Sale pricing:** with a discounted price the page shows the regular price struck through and the percentage saved. A sale end date switches back to the regular price automatically. A Gumroad discount code is added to the buy link only while the sale is on.
- **AI tools and websites** link straight to the tool. Fill category and "Best for".
- New items go to the top. Up/Down reorders inside a category. "Hide from site" unlists without deleting.
- The hub shows 6 items per section with a "Show all" link to the full page.
- If you edit from phone and computer, press "Discard draft" first so an old draft cannot overwrite newer changes.
- Without GitHub Actions, run `python3 scripts/build.py` yourself and upload the changed files.

## Security
- Publishing needs your GitHub token. Use a fine-grained token limited to this one repo (Contents: Read and write) with an expiry. Turn on GitHub 2FA. Leave "Remember token" off on shared devices.
- Every page has a Content-Security-Policy. The small theme script is allowed by its hash: if you edit that inline script in the HTML files, update the hash in each file's policy or the theme toggle stops working.
- All text from your data is shown as plain text, and links must be https.
- The admin page has `noindex`, but it is public. Only your token can publish. You may delete the `admin/` folder from the live repo if you prefer to run it elsewhere.
- Google Fonts and tool logos (Google favicon service) are loaded from Google, which receives the visitor's IP. This is mentioned in `legal.html`.
