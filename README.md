# mGrant — Stories of Change

Impact storytelling module for the mGrant platform (Frappe v16). Enables CSR teams and communications staff to capture, curate, and showcase field impact stories linked to grants.

## What's Included

### `/spec/`
- **stories-of-change-feature-spec.html** — Full feature specification with user stories, data model, workflows, and permissions
- **stories-of-change-wireframes.html** — Interactive wireframes showing the Stories Hub, story form, and grant integration

### `/deployment/`
- **story_of_change_doctype.json** — DocType definition for `Story of Change`
- **story_of_change_media_doctype.json** — Child table DocType for `Story of Change Media`
- **client-scripts/grant_stories_tab.js** — Client Script for Grant form integration (Stories of Change tab)
- **custom-html-block/** — Custom HTML Block deployed as the Stories Hub workspace:
  - `stories-of-change-hub.html` — Hub markup (KPI cards, filter strip, story card grid, empty state)
  - `stories-of-change-hub.css` — Shadow DOM styles (responsive grid, badges, shimmer loading)
  - `stories-of-change-hub.js` — Hub logic (fetch stories, render cards, filters, KPIs)

## Staging

Deployed at: `https://stg.lichfl.mgrant.in/app/stories-of-change`

The Stories of Change workspace appears in the sidebar after Document Repository and renders a Custom HTML Block with:
- KPI summary cards (Total / Featured / Submitted / Drafts)
- Filter bar (Status, NGO, Theme, Search)
- Responsive card grid with cover images and status badges
- Click-through to individual story forms

## Architecture Notes

- **Custom HTML Block** approach chosen because `developer_mode` is OFF on staging — Frappe Pages won't persist JS/CSS via API
- CHB renders inside Shadow DOM with three-field split: `html`, `style`, `script`
- Script uses `root_element.querySelector()` (not `document.querySelector()`) to stay within shadow boundary
- Workspace `sequence_id: 15.5` positions it after Document Repository (`15.0`)

## Sample Stories

Three sample stories created on staging:
1. **From Dropout to District Topper: Priya's Journey** (Featured)
2. **Stitching Independence: Mahila Self-Help Groups in Rural Bihar** (Submitted)
3. **Mobile Health Camps Reach 2,000 Families in Underserved Blocks** (Submitted)
