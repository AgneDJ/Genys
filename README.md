# Ąžuolyno gimnazija

Static, responsive Lithuanian school website.

## Local content database

Editable content is stored in [data/site-data.json](data/site-data.json):

- `news` holds the date, category, title and text for news cards.
- `gallery` holds gallery captions and image crop positions.

The gallery images are local project assets under `assets/`. To add a new local photo, place it in that folder and update the image path in `app.js` (or extend the gallery record with an `image` field).

Open `index.html` directly in a browser, or serve the folder with any static web server. The site falls back to its built-in copy of the local data when browsers restrict JSON loading from a direct `file://` page.

# Genys
