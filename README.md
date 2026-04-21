# KitKing — Premium Football Jerseys

Modern, dynamic, fully-featured jersey e-commerce site built with **zero dependencies** (vanilla HTML / CSS / JS). Works offline, fully responsive, dark mode included.

## Features

- 🛒 Cart with quantity, size, customization (persisted in localStorage)
- ❤️ Wishlist
- 🔍 Live search + autocomplete (keyboard shortcut: `/`)
- 🎚️ Filters: league / team / type / size / price / rating / sale / stock
- 🔃 Sort: popularity, newest, price asc/desc, rating
- 🏆 32+ products across 6 leagues with SVG-generated jerseys
- 🎽 Custom name + number printing with live preview
- 🌗 Light / dark theme toggle
- 💱 Currency switcher (USD / EUR / GBP / BDT)
- 🛍️ Multi-step checkout (shipping → payment → review → confirmation)
- 👤 Account sign-in / sign-up (mock)
- ⏱️ Live countdown for flash deals
- 🎠 Hero carousel with auto-advance
- 💬 Floating chat widget
- 🍪 Cookie consent
- 📱 Mobile-first responsive, marquee announcement bar, toast notifications
- ⌨️ Keyboard accessible, skeleton loaders, back-to-top, recently viewed

## Run locally

```bash
python -m http.server 5500
```

Then open http://127.0.0.1:5500/

## Structure

```
index.html
css/styles.css
js/data.js       # products, leagues, SVG jersey generator
js/app.js        # all interactivity
```

## Tech

Pure HTML5 + CSS3 (custom properties, color-mix, clip-path) + vanilla ES6+. No build step. No frameworks. No CDN dependency.
