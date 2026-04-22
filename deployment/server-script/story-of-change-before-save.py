# Server Script: Story of Change — Before Save
# Type: DocType Event (Before Save)
# Reference DocType: Story of Change
#
# Handles (business rules only — transition validation is handled by Frappe Workflow):
# 1. Featured sync — auto-fill/clear featured_by, featured_date, is_featured
# 2. Consent validation — required only when story_type is "Beneficiary Story"
# 3. Future date block — story_date cannot be in the future
# 4. Cover image sync from media gallery
#
# NOTE: Status transitions (Draft→Submitted→Approved→Featured→Archived) and
# role-gated actions are handled by the native "Story of Change Workflow"
# Workflow document. Do NOT add custom transition logic here.

# ─── 1. FEATURED SYNC ──────────────────────────────────────────────────
# Use workflow_state since Frappe Workflow is active
current_status = doc.workflow_state or doc.status or "Draft"

if current_status == "Featured":
    doc.is_featured = 1
    if not doc.featured_by:
        doc.featured_by = frappe.session.user
    if not doc.featured_date:
        doc.featured_date = frappe.utils.today()
else:
    doc.is_featured = 0
    doc.featured_by = None
    doc.featured_date = None

# ─── 2. CONSENT VALIDATION ─────────────────────────────────────────────
if doc.story_type == "Beneficiary Story":
    has_beneficiary_data = any([
        doc.beneficiary_name,
        doc.beneficiary_quote,
        doc.beneficiary_location
    ])
    if has_beneficiary_data and not doc.consent_obtained:
        frappe.throw(
            "Consent must be obtained for Beneficiary Stories when beneficiary "
            "information (name, quote, or location) is provided. "
            "Please tick the 'Consent Obtained' checkbox.",
            title="Consent Required"
        )

# ─── 3. FUTURE DATE BLOCK ──────────────────────────────────────────────
if doc.story_date:
    story_dt = frappe.utils.getdate(doc.story_date)
    today_dt = frappe.utils.getdate(frappe.utils.today())
    if story_dt > today_dt:
        frappe.throw(
            "Story Date cannot be in the future. Stories of Change "
            "document events that have already happened.",
            title="Invalid Date"
        )

# ─── 4. COVER IMAGE SYNC FROM GALLERY ──────────────────────────────────
# If any media row is marked is_cover, sync its file to cover_image
cover_url = None
for row in (doc.media or []):
    if row.is_cover and row.file:
        cover_url = row.file
        break

if cover_url:
    doc.cover_image = cover_url
elif doc.media and len(doc.media) > 0:
    # No row marked as cover — use first image if available
    for row in doc.media:
        if row.file and row.media_type in ("Image", "Photo"):
            doc.cover_image = row.file
            row.is_cover = 1
            break
