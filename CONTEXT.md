# SF Genys project context

Last updated: 2026-10-13. Read this at the start of each session; update it after every task as required by AGENTS.md.

## Project and workflow

- Workspace: C:/Users/agned/OneDrive/Desktop/sf_genys. Static school website: HTML, CSS, JavaScript and JSON, plus Vercel API routes for the Supabase editor.
- Live site: https://genys.agne.dev. Repository: https://github.com/AgneDJ/Genys, main branch. Hosting deploys from Git pushes.
- Public language is primarily Lithuanian, with English controls/content. Preserve Lithuanian diacritics and the existing navy/blue/cream/coral visual design.
- Preserve public navigation, toolbar structure, class-tab behavior and attendance controls when changing content.
- Follow AGENTS.md team instructions. Delegate bounded independent work to suitable inexpensive specialists, with one owner per file. Leader inspects changes and verifies the affected interaction before claiming completion.
- User frequently asks to add, commit and push. Perform those actions when authorized; verify their results. User has difficulty copying code blocks from chat: provide plain .txt files for SQL or Apps Script when needed.
- Current Git/deployment state is volatile. Check git status, git log and remote status at the start; do not assume the context file proves a push or deployment.

## Implemented website changes

- Missing Google Sites content/media imported from school source pages. Historical material retained in clearly marked archive areas.
- Fixed duplicate English/Lithuanian Contacts menu label and duplicate Street View window.
- Removed the San Franciskas · Kalifornija / Tėvams | Mokytojams | Bendruomenei bar.
- Public top Registration button is commented out with an uppercase explanation.
- Latest news shows four cards; older news follows in the archive, with archive link after latest news.
- Added LT/EN September 13 and 14, 2026 news and January 17, 11 a.m. Adrijus Kveda / Statera event. No event year was invented. Existing photo placeholders reserved initially.
- CMS news/events now show excerpts up to 220 characters and Read more links; detail pages show full bodies/all photos.
- Removed failed source-image links from Contacts and the support/fundraising page, including ESAME LABAI DĖKINGI, KAD MUS PALAIKOTE! links. Importer prevents reinstating them.
- Removed public footer Prisijungti links. Admin is accessed directly at https://genys.agne.dev/admin/.
- Contacts button opens https://m.me/sfgenys, a Messenger conversation. Former local chat form was removed; no inbox API or embedded Messenger widget is implemented.

## Attendance: working live

- Form: https://genys.agne.dev/checkin/?access=sf-genys-entry&fresh=1. LT/EN Home buttons exist.
- Frontend files: checkin/index.html, config.js, checkin.js, Vaiku_sarasas.js. Version query hashes prevent stale browser scripts.
- Children have four-digit PINs, including leading zeroes. Miles is listed in K/TK/preschool class; PIN-based class/child selection implemented. Do not copy private PIN rosters into this context file.
- Receiver source: checkin/google-apps-script/Code.gs; identical copyable attendance-receiver.txt. Spreadsheet ID is configured for Lankomumas/Attendance: 1T-T-EPUCfzy0hWExJkW3UJ2Z4J9inFyVO74LiydEbW0.
- Current endpoint: https://script.google.com/macros/s/AKfycbyuXcQXsZi_wQDs5ggaX_CJ0PpWKbwY_YFbdX2nq0djvZfBK2KIWlSDWuIpcC2Ffxr3/exec.
- User confirmed attendance works after a new Apps Script deployment and endpoint update. Earlier endpoint ending AKfycbxuDUc... is obsolete.
- Receiver writes class-named worksheets, signature image in column 7; four-digit PIN validation, locking and short-lived UUID receipt confirmation. Website must not say saved until matching Google receipt confirms the write.
- Apps Script edits require updating a deployed version. checkConnection tests editor code, not the deployed web app. A new deployment requires a new endpoint in checkin/config.js, new config hash, export rebuild and site deployment.
- Git changes do not update Apps Script itself. Do not submit real attendance during automated tests.

## Supabase content editor

- Admin: admin/index.html, admin/admin.js, admin/admin.css. Vercel routes: api/content-config.js, content-editors.js, content-login.js; helpers in lib/.
- Supabase project URL: https://ianwqvbhshbywfhnlfok.supabase.co. User set up Supabase and has been using the editor. Never store secret keys/PINs in Git or this document.
- Server environment names: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, EDITOR_SHARED_PIN (6–12 digits), EDITOR_AUTH_SECRET (random, at least 32 chars). Legacy anon/service role aliases are supported.
- In Vercel mark secret key, shared PIN and auth secret as Secret; URL and publishable key can be Config. Redeploy after env changes. Keep EDITOR_AUTH_SECRET stable; it derives internal editor passwords.
- Owner uses a personal email/password account. Owner alone manages approved editor emails. Editors use approved email + one shared PIN. Shared PIN never grants owner access.
- Approved emails are usernames, not independent identity verification. Supabase sessions may outlast PIN changes; revoke membership to reliably remove editing access. Known Auth password/recovery caveat is documented in docs/content-editor.md.
- Membership is authoritative via RLS. Server PIN verification and atomic per-IP/per-email rate limiting; account creation restricted to dedicated CMS accounts, existing owner accounts protected. Existing unrelated Auth accounts are not overwritten.
- Schema/setup: supabase/schema.sql, seed.sql, sections.sql and identical sections.txt migration; owner-access.txt is a copyable owner SQL template. docs/content-editor.md explains setup.
- Tables: content_editors, content_posts, content_photos, content_login_limits, content_sections. Storage bucket site-photos accepts JPEG/PNG/WebP up to 8 MB. Uploaded files are public even if associated content is draft.
- News/events/photos support bilingual editing, uploads, drafts, preview, publishing and removal.
- Every existing page has its own named editing section in grouped admin navigation, alongside News, Events and Photos. A page title/status card has Edit and View page buttons; editing exposes Preview, Save draft, Publish and Reset. Both owner and editor can edit pages. There is no generic Pages dropdown.
- content_sections stores a per-page draft and published field map. Save draft preserves the live published version. Reset removes overrides and restores static content. Public reads only published columns; authenticated reads/writes require current editor membership.
- Editable catalog: data/section-catalog.js (admin), data/section-defaults/*.json (per-page public defaults). Public data/content-sections.js applies text/image/link/embed values safely to existing template slots. Menus and layout are not editable.
- Embed URLs must use the original provider hostname and no URL credentials; both admin and public renderer enforce this. Empty media URL hides media; empty link removes href.
- Regenerate after template changes: node tools/build-section-catalog.js. It derives LT/EN defaults from local templates, excludes dynamic CMS collection slots, preserves moved unique-image IDs, and reserves IDs to avoid collisions with reused DOM slots.
- Full live Supabase RLS/concurrent-rate-limit tests have not been performed by the agent; permission tests use mocked accounts. Do not claim a live database audit.

## Current task: teacher photos and schedule table editing

- User wants a photo next to every teacher biography, not only in the lower archive. All eight overview cards now include the teacher's source-section-associated photo and a short LT/EN biography; full biography pages show a larger photo next to the text.
- Source mapping was verified by original Google Sites teacher-specific DOM sections in tools/source-cache/560966d1cb59.html, not face recognition. Photos: Agnė c2dc17af8920e2cd.jpg; Erika fdb08d299e39b977.jpg; Aurelija 9b1db75055d529e0.jpg; Justė a63ff9aa8dd68f36.jpg; Rita 28b711057adf5501.png; Aistė 6e71b2dec5235d0b.png; Indrė 3e0114e8e8c2897b.jpg; Vanesa 6ac035efa59c9763.jpg. All under assets/google-site/.
- data/teachers.json contains photo, photoAlt and bilingual overview summaries. Hidden empty archive figures preserve existing sibling positions; only three additional activity photos remain in the lower archive. Portrait fields retain existing image override IDs.
- User also wants BOTH schedule tables to have editable names and add/remove row and column controls. Default names are Rugsėjo 6 d. · 9:30 and Rugsėjo 13 d.; existing dates/content are not silently updated to a new year.
- Structured table catalog fields use kind table with LT/EN name, headers and rows. data/section-tables.js normalizes and safely renders them. Legacy individual-cell overrides migrate through legacy field IDs. Admin supports row/column changes with minimum 1 and maximum 200 rows/12 columns. No new Supabase migration is needed beyond existing content_sections.
- Completed and validated: all eight overview/full-biography photos, bilingual summaries, moved image override preservation, both structured schedule tables, keyboard focus after table operations, and persistent context instructions. Commit and push were explicitly requested; use current Git/hosting checks to confirm the latest revision.

## Validation and tools

- JavaScript: node --check on changed scripts. Regression tests: node --test tests/content-access.test.js tests/content-pin.test.js tests/content-tables.test.js (17 checks).
- Use headless Playwright/Edge for desktop and mobile interaction checks. Playwright available in Codex Node dependencies; Edge executable C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe. Mock external accounts/content for editing tests; never send real invitations or attendance.
- exports: tools/build-google-sites.ps1 requires PowerShell 7, not old Windows PowerShell. Then node tools/validate-google-sites.js. Admin is excluded from Google Sites exports.
- Static export renderer inlines local JS/CSS/images; content root expressions using document.currentScript.src are rewritten. Public dynamic defaults remain static fallbacks in offline exports.
- Windows exec_command may fail with helper_unknown_error. A persistent node_repl tool supports filesystem and child-process inspection. Git index writes/network commands may require approved escalation; do not bypass failed permissions through another tool.
- Ignored tools/source-cache/*.png screenshots are verification artifacts, not production assets.

## Remaining work / next-session cautions

- No requested implementation work remains in this task. Teacher and table interactions passed browser checks at 1365px and 390px, LT/EN, owner/editor, legacy edit migration, private drafts and keyboard focus. All 17 regression tests passed; 123 export inline scripts parsed without errors.
- The next session should read this document first and verify the current Git/deployment state. No extra Supabase migration is required for the new structured schedule tables.
- Actual live Supabase RLS and rate-limit concurrency auditing remains unperformed; do not confuse mocked permission checks with live database verification.
- Do not add goals, schedule automations or send external messages unless explicitly requested.
