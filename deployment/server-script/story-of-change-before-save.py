# Server Script: Story of Change — Before Save
# Type: DocType Event (Before Save)
# Reference DocType: Story of Change
#
# Handles:
# 1. Status transition validation (Draft→Submitted→Approved→Featured→Archived)
# 2. Featured sync — auto-fill/clear featured_by, featured_date, is_featured
# 3. Consent validation — required only when story_type is "Beneficiary Story"
# 4. Future date block — story_date cannot be in the future

# ─── 1. STATUS TRANSITION RULES ────────────────────────────────────────
VALID_TRANSITIONS = {
    "Draft":     ["Submitted"],
    "Submitted": ["Approved", "Draft"],
    "Approved":  ["Featured", "Archived", "Submitted"],
    "Featured":  ["Approved", "Archived"],
    "Archived":  ["Draft"],
}

old_doc = doc.get_doc_before_save()
old_status = old_doc.status if old_doc else "Draft"

if old_doc and doc.status != old_status:
    allowed = VALID_TRANSITIONS.get(old_status, [])
    if doc.status not in allowed:
        msg = "Cannot move from '" + old_status + "' to '" + doc.status + "'. Allowed: " + (", ".join(allowed) if allowed else "none") + "."
        frappe.throw(msg, title="Invalid Status Transition")

# ─── 2. FEATURED SYNC ──────────────────────────────────────────────────
if doc.status == "Featured":
    doc.is_featured = 1
    if not doc.featured_by:
        doc.featured_by = frappe.session.user
    if not doc.featured_date:
        doc.featured_date = frappe.utils.today()
else:
    doc.is_featured = 0
    doc.featured_by = None
    doc.featured_date = None

# ─── 3. CONSENT VALIDATION ─────────────────────────────────────────────
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

# ─── 4. FUTURE DATE BLOCK ──────────────────────────────────────────────
if doc.story_date:
    story_dt = frappe.utils.getdate(doc.story_date)
    today_dt = frappe.utils.getdate(frappe.utils.today())
    if story_dt > today_dt:
        frappe.throw(
            "Story Date cannot be in the future. Stories of Change "
            "document events that have already happened.",
            title="Invalid Date"
        )
