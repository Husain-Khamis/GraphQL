# GraphQL Profile

A profile page built with vanilla JavaScript that logs in through JWT authentication, pulls data from a GraphQL API, and shows XP, audits and skills with D3 SVG charts in a Metal Gear Solid Codec style.

## Features

- Login with username or email, plus logout
- Profile contacts: identity, XP, audits, skills
- SVG charts: XP over time and skills
- Codec look: scanlines, glow, sounds, tuning between contacts with the buttons or the arrow keys

## Tech

- HTML, CSS, vanilla JavaScript
- GraphQL over `fetch`, JWT in `localStorage`
- D3 for the SVG charts

## Run locally

This can be either done by live server or NPM's http server package using:

```
npm dev run
```

Then open the login page in your browser.

## Structure

```
login.html      login page
profile.html    profile page
style.css       theme
assets/         sounds and images
js/
  auth.js       login and JWT storage
  api.js        GraphQL helper and queries
  codec.js      sound playback
  profile.js    contacts and profile data
  graphs.js     SVG charts
```