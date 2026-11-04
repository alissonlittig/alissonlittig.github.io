# Mansa Vet — custom WordPress theme

A hand-built WordPress theme for **Mansa**, a fictional veterinary clinic in Curitiba, Brazil. No page builder, no starter theme, no plugins required.

![Cover](prints/capa-1280x800.png)

| Desktop | Mobile |
|---|---|
| ![Desktop](prints/desktop-home.png) | ![Mobile](prints/mobile-home.png) |

## What's inside

- **Classic PHP theme** with `header.php`, `footer.php`, `front-page.php`, `single-servico.php`, `archive-servico.php`, `page.php`, `404.php`, `index.php`.
- **Template parts** (`template-parts/`): hero, numbers, services, team, stories, contact, service card, inline SVG artwork.
- **Two custom post types** with REST support and meta boxes: `servico` (Services, with starting price) and `profissional` (Team, with role/CRMV).
- **`theme.json`** (v3): color palette, fluid typography, self-hosted variable fonts (Fraunces + Inter), layout sizes.
- **Menus** (`primary`, `footer`) with a fallback, a **widget area**, and **Customizer** settings (phone, address, hours).
- **Contact form** handled via `admin-post.php`: nonce, honeypot, sanitization, `wp_mail`.
- Accessible by default: skip link, visible focus, AA contrast, `prefers-reduced-motion`, keyboard-friendly mobile menu.
- Pure CSS/JS (no build step, ~1 KB of JavaScript).

## Install

1. Download `tema/mansa-vet.zip`.
2. WordPress admin → Appearance → Themes → Add New → Upload Theme → activate.
3. Add content: **Services** and **Team** appear in the admin menu. Create a Menu and assign it to *Primary menu* / *Footer menu*.
4. Settings → Permalinks → *Post name*, then Save (flushes the `/servicos/` and `/equipe/` rewrites).
5. Appearance → Customize → *Clinic contact* to edit phone, address and hours.

Requires WordPress 6.4+ and PHP 7.4+.

## Run it locally (no Docker, no MySQL)

Uses [WordPress Playground](https://wordpress.github.io/wordpress-playground/) and a blueprint that activates the theme and loads demo content (`tema/blueprint/seed.php`):

```bash
cd tema
npx @wp-playground/cli server --blueprint blueprint/blueprint.json \
  --mount-dir ./mansa-vet /wordpress/wp-content/themes/mansa-vet \
  --mount-dir ./blueprint /wordpress/wp-content/mansa-bp
```

Open http://127.0.0.1:9400. On Windows Git Bash, prefix with `MSYS_NO_PATHCONV=1`.

## Static preview

`estatico/` is a crawled copy of the running site (relative links, so it opens from any static host or `python -m http.server`). The contact form is disabled there because there is no PHP behind it. The crawler is `tema/blueprint/export_static.py`.

## Structure

```
tema/mansa-vet/
  style.css  theme.json  functions.php
  header.php footer.php front-page.php index.php page.php 404.php
  single-servico.php archive-servico.php
  inc/            post-types.php  contact-form.php
  template-parts/ hero numbers services team stories contact card-service art
  assets/         css/main.css  js/main.js  fonts/
```

Mansa is a fictional business; all names, numbers and CRMV registrations are placeholders.
