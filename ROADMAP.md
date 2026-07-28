# Roadmap & Known Issues

Items are loosely ordered by priority. This is a living document — add things as they come up.

---

## In Progress / Recently Done
- [x] Multiple gardeners can log on the same day (key changed to date + gardener)
- [x] Week-at-a-glance strip (Sun–Sat visual row with 💧 / ❌ per day)
- [x] Gardener name persisted in localStorage
- [x] App URL included in notification emails (via `APP_URL` Script Property)

---

## Short Term

### URL & Access
- [ ] Replace Bitly with a custom domain + Cloudflare redirect
  - Buy a short domain (~$10/yr on Porkbun or Namecheap)
  - Set up a free Cloudflare redirect rule pointing to the Apps Script URL
  - Update `APP_URL` Script Property — no code change needed

### App improvements
- [ ] Extract CSS into separate file (spec: `.kiro/specs/css-extraction/`)
  - Move all inline `<style>` content from `index.html` into `styles.html`
  - Use Apps Script `include()` pattern + `createTemplateFromFile` to inject at serve time
  - Platform constraint: Google Apps Script does not support `<link>` tags for local files
  - Purely a maintainability refactor — no visual changes
- [ ] Monthly summary view
  - Show "watered X/31 days this month" and top gardener
  - Could be a toggle or a separate section below the week view
- [ ] Gardener name dropdown (datalist)
  - Store `GARDENER_NAMES` as a comma-separated Script Property
  - Populate a `<datalist>` on the name input for autocomplete suggestions
  - Prevents inconsistent spellings ("Nicolas" vs "Nico") which would break per-gardener deduplication
  - Free-text fallback still allowed
- [ ] Plant / zone tracking
  - Instead of logging "the garden" as one unit, let users pick a zone or plant group
  - Requires a new column in the sheet and a dropdown in the form

---

## Medium Term

### Local development
- [ ] Mock server for local preview
  - Small Express server (`dev/mock-server.js`) implementing `addWateringRecord`, `getWateringRecords`, `deleteWateringRecord` with an in-memory or JSON file store
  - Local HTML variant with `google.script.run` replaced by `fetch` calls
  - `npm run dev` to spin it up

### CI / Deployment
- [ ] Set up clasp for auto-deploy
  - `clasp push` on merge to main via GitHub Actions
  - Removes the manual copy-paste step when deploying changes

### Testing
- [ ] Unit tests for pure logic (Jest)
  - Date math, week strip rendering, `getWeekStart` / `getWeekEnd`
  - No need to mock Google services for these

---

## Known Issues / Rough Edges

- `doPost` in `code.gs` is dead code — the UI uses `google.script.run` directly and never hits this endpoint. Low priority to remove but worth cleaning up eventually.
- [x] Email list stored as comma-separated string in Script Properties instead of JSON
  - Plain `"alice@example.com, bob@example.com"` — no JSON syntax to accidentally break
  - Parsed with `.split(',').map(trim).filter(@)` — safe, no throwing on malformed input
- No feedback to the user when a record is added successfully (the alert was commented out). Could replace with a subtle inline toast instead.
- Delete confirmation is a browser `confirm()` dialog — works but looks out of place on mobile. A nicer in-page confirmation would improve the feel.
- Week navigation sends a fresh network request on every prev/next click. Could cache the last few weeks in memory for snappier navigation.
