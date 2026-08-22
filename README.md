# portfolio

My personal developer portfolio — a single-file static site, no build step.

**Live:** https://webdevmatt-dot.github.io/portfolio

## Stack

Plain HTML, CSS and vanilla JS. Google Fonts (Inter + JetBrains Mono) are the only external dependency.

## Run locally

Open `index.html` in a browser, or:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Deploy

Hosted on GitHub Pages from the `main` branch root. Any push to `main` redeploys.

## Structure

Everything lives in `index.html` — styles in a single `<style>` block, behaviour (scroll reveals, sticky header, card hover glow) in one `<script>` at the bottom.

---

Built by [Matt](https://github.com/webDevMatt-dot) · Godji Tech (PTY) Ltd
