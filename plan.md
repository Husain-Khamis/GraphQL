# Codec Profile Page: Plan

Solo project. Vanilla JS, two pages (login page + profile page, not a SPA), Metal Gear Solid Codec theme (original CSS/SVG look, no game assets).

## Spec checklist (from graphql.md)

- [✔] Login page works with **username:password** AND **email:password**
- [✔] Invalid credentials show an appropriate error message
- [✔] Logout method
- [✔] JWT sent as `Bearer` on GraphQL requests
- [✔] Profile shows 3+ pieces of info (identity, XP, audits, skills)
- [✔] Statistics section with **at least 2 different SVG graphs**
- [✔] Queries use all three types: **normal**, **nested**, **with arguments** (nested query exists but is not used on the page yet)
- [ ] Hosted online (GitHub Pages / Netlify)
- [✔] Follows good UI principles (responsive check pending)

## Endpoints

- Signin: `POST https://learn.reboot01.com/api/auth/signin` (Basic auth, base64 of `identifier:password`)
- GraphQL: `https://learn.reboot01.com/api/graphql-engine/v1/graphql` (Bearer JWT)
- Explore schema: `https://learn.reboot01.com/graphiql/`

## File structure

```
/
├── index.html       # login page
├── profile.html     # profile page
├── style.css
├── assets/          # sounds (.mp3) and contact images (.png)
└── js/
    ├── auth.js      # login, JWT storage, calling animation + sounds
    ├── api.js       # graphql() helper + queries, logout()
    ├── codec.js     # sound playback, sound toggle
    ├── profile.js   # route guard, contacts, rows, init
    └── graphs.js    # D3 SVG charts
```

## Phases

### 1. Login + JWT
- [✔] Login form (identifier + password)
- [✔] Base64 encode `identifier:password`, POST to signin with `Authorization: Basic ...`
- [✔] Store JWT (`localStorage`)
- [✔] Show error message on failed login
- [✔] On successful login: redirect to `profile.html`
- [✔] Logout button: clear JWT, redirect to `index.html`
- [✔] Route guard on `profile.html`: no JWT -> redirect to `index.html`
- [✔] If JWT exists on `index.html`, redirect to `profile.html`
- [✔] Test with both username and email

### 2. First query
- [✔] Decode JWT payload to find the user ID
- [✔] Send `{ user { id login } }` with Bearer header
- [✔] Log result to console

### 3. Data layer (`api.js`)
- [✔] `graphql(query, variables)` helper (Bearer header, errors, expired JWT -> logout)
- [✔] **Normal** query: `getUser`
- [✔] **Arguments** query: `getXPOverTime` (where + order_by + variables, filtered to event 1829 to match the platform)
- [✔] **Nested** query: `getResults` exists (`result { user { ... } }`) but nothing on the page uses it yet
- [✔] XP, audit totals and ratio (`user_by_pk`), skills (highest amount per skill, same as the platform)

### 4. Profile sections
- [✔] Identity (id, login)
- [✔] XP (total, matches the platform)
- [✔] Audits (done, received, ratio, matches the platform)
- [✔] Skills (matches the platform)
- [ ] Add more to the XP contact (ideas: level, latest award, top projects by XP)

### 5. SVG graphs (min 2)
- [✔] Graph 1: XP over time (line + area, gridlines, hover tooltips, reversed awards cancelled)
- [✔] Graph 2: skills (bars out of 100)
- [✔] Labels, axes, readable values
- [✔] Confirm that using D3 is allowed (the spec only requires SVG output)

### 6. Codec theme
- [✔] Green-on-black palette via CSS variables
- [✔] Codec layout (portrait frames, tune display, contacts, data rows)
- [✔] "Calling" overlay and sounds on login, logout, switching and buttons
- [✔] Pixel font, scanlines, glow, vignette, flicker, styled scrollbars
- [✔] Contact images (`ID.png`, `xp.png`, `audits.png`, `skills.png`, `user.png`)
- [✔] Responsive check (phone width)
- [✔] Fix `assets/btnClick.mp3` (0 bytes) and `assets/switching.mp3` (WebM, not MP3)

### 7. Polish + host
- [✔] Empty states for the charts
- [✔] Error handling review on every fetch
- [ ] Deploy to GitHub Pages or Netlify
- [ ] Test the hosted version end to end (login, data, graphs, sounds, logout)

## Decisions

| Decision | Choice |
|---|---|
| Profile sections | Identity, XP, audits, skills |
| Graphs | XP over time (line), skills (bar) |
| Charts | D3 (SVG output) |
| Hosting | Not decided |