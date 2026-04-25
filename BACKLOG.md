# Stories of Change — Enhancement Backlog

PM enhancement recommendations mapped against current implementation status.
Last updated: 26 Apr 2026

---

## Done (shipped in go-live)

### R1: KPI & Activity tagging on media
**Status: Done** — Commit `f5bce0b`, deployed to staging

Allow tagging images to KPIs and Activities to build the qual-quant bridge. Two Custom Fields added to the Story of Change Media child table: `linked_kpi` (Link → KPIs) and `linked_activity` (Link → Activity Master). Both fields are optional and can be used independently or together, following the LFA results-chain model where the same evidence may relate to both an Activity and a KPI at different levels.

### R3: Reduce hero image height in read view
**Status: Done** — Commit `f5bce0b`, deployed to staging

When clicking a story, most of the page was taken up by the cover image. Hero image max-height reduced from 420px to 280px for better content-to-image proportion in the read view.

### Grant Dashboard — Featured Stories CHB
**Status: Done** — Commit `f5bce0b`, deployed to staging

Featured stories now auto-appear on the Grant Dashboard via a new Custom HTML Block ("Grant Dashboard - Stories"). Shows up to 6 most recent Featured stories with cover images, metadata chips, and narrative excerpts. Click-through navigates to the full story read view.

---

## Backlog (Phase 2+)

### B1: Curation child table for multi-target publishing
**Priority: High** — Foundation for B2 and donor-specific dashboards

The Curation tab should house a child table enabling per-target publishing. Each row would specify a target dashboard/context, with its own date override and narrative variant. This decouples "Featured" (editorial quality gate) from "published to X dashboard" (distribution decision).

Needed because: (1) the list of publishing targets will grow — Vedanta theme dashboards, donor-specific views, annual reports; (2) the same story may need different framing or date for different audiences; (3) not all Approved/Featured stories should appear everywhere.

Current state: The Curation tab exists but is empty. For go-live, `status = 'Featured'` serves as the publish trigger. This backlog item replaces that with explicit curation rows.

### B2: Featured image carousel on dashboard
**Priority: Medium** — Depends on B1

Show curated story cover images as a carousel/slider section on the Grant Dashboard, separate from the card grid. This gives donors a visual highlight reel. Curation (B1) is needed so that specific stories can be selected for the carousel rather than showing all Featured stories.

Design note: The Stories of Change hub page already has a carousel for Featured stories. The dashboard version would be a slimmer, auto-playing variant.

### B3: Story Type dropdown — make MECE with "Other"
**Priority: Medium** — Needs client discussion

The current Story Type dropdown has overlapping categories that can make selection ambiguous. Recommendations: (1) review with clients to identify the 4–6 most distinct categories they actually use; (2) ensure categories are mutually exclusive and collectively exhaustive (MECE); (3) add an "Other" option with a free-text field for edge cases.

This is a taxonomy decision — best resolved in a workshop with the comms team who will be creating stories.

### B4: Showcase stories count growth on widgets
**Priority: Low** — Nice-to-have for KPI cards

Add a growth indicator to the Stories of Change KPI cards showing increase over time (e.g., "↑ 12 new this quarter" or "32 stories, +8 vs last FY"). This gives programme teams a sense of momentum and encourages story submission.

Implementation: Add a time-comparison query to the hub page KPI cards and/or the Grant Dashboard CHB header area.

### B5: Beneficiary quote input box reflected on dashboard
**Priority: Low** — Nice-to-have, depends on B1/B2

Allow a dedicated input for beneficiary quotes (already exists as `beneficiary_quote` field on the DocType) that can be pulled into dashboard display — either as a rotating quote section or overlaid on the carousel (B2). The field exists; this is about surfacing it in the dashboard CHB and/or carousel.

---

## Summary

| # | Enhancement | Status | Priority |
|---|------------|--------|----------|
| R1 | KPI & Activity tagging on media | Done | — |
| R3 | Hero image height reduction | Done | — |
| — | Grant Dashboard Featured Stories CHB | Done | — |
| B1 | Curation child table | Backlog | High |
| B2 | Featured image carousel on dashboard | Backlog | Medium |
| B3 | Story Type dropdown — MECE + Other | Backlog | Medium |
| B4 | Stories count growth on widgets | Backlog | Low |
| B5 | Beneficiary quotes on dashboard | Backlog | Low |
