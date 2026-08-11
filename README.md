# SF „Genys“

Static, responsive website for San Francisco Lithuanian School „Genys“.

## Run locally

Open [index.html](index.html) in a browser, or serve this folder with any static web server. Using a server is recommended so the JSON content files load consistently.

## Project structure

- `index.html` — home page
- `pages/` — news, contact, registration, parent, and school-information pages
- `articles/` — individual news and teacher pages
- `styles.css` — home-page styling
- `pages/article.css` — styling for the secondary pages
- `app.js` — home-page content rendering and interactions
- `assets/` — images and logo files

## Editable content

- [data/site-data.json](data/site-data.json) — home-page news cards and gallery captions
- [data/teachers.json](data/teachers.json) — teaching-team profiles and article links

## Included features

- Sticky navigation, including the same menu on secondary pages
- Responsive mobile menu and navigation dropdowns
- Lithuanian and English home-page language switch
- Registration and calendar embeds
- Contact page with address, map links, Google Street View, and a chat-style contact interface
- Naujienos page with the embedded SF „Genys“ Facebook timeline, which updates as new Facebook posts are published

## Notes

The chat interface currently provides the on-page conversation layout only. To deliver submitted messages to staff, connect it to a form endpoint, email service, or chat backend.
