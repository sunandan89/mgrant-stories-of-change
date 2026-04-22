# Server Script: Story of Change — Before Save
# Type: DocType Event (Before Save)
# Reference DocType: Story of Change
#
# Handles:
# 1. Featured sync — is_featured checkbox ↔ status dropdown ↔ featured_by/date
# 2. Consent validation — require consent when beneficiary data is present
# 3. Future date block — story_date cannot be in the future

# ─── 1. FEATURED SYNC ───────────────────────────────────────────────
# Detect what changed: is_featured checkbox or status dropdown
old_doc = doc.get_doc_before_save()
old_featured = old_doc.is_featured if old_doc else 0
old_status = old_doc.status if old_doc else "Draft"

# Case A: is_featured checkbox was just ticked
if doc.is_featured and not old_featured:
    doc.status = "Featured"
    if not doc.featured_by:
        doc.featured_by = frappe.session.user
    if not doc.featured_date:
        doc.featured_date = frappe.utils.today()

# Case B: is_featured checkbox was just unticked
if not doc.is_featured and old_featured:
    if doc.status == "Featured":
        doc.status = "Draft"
    doc.featured_by = None
    doc.featured_date = None

# Case C: status dropdown was changed TO Featured
if doc.status == "Featured" and old_status != "Featured":
    doc.is_featured = 1
    if not doc.featured_by:
        doc.featured_by = frappe.session.user
    if not doc.featured_date:
        doc.featured_date = frappe.utils.today()

# Case D: status dropdown was changed FROM Featured to something else
if doc.status != "Featured" and old_status == "Featured":
    doc.is_featured = 0
    doc.featured_by = None
    doc.featured_date = None

# ─── 2. CONSENT VALIDATION ──────────────────────────────────────────
has_beneficiary_data = any([
    doc.beneficiary_name,
    doc.beneficiary_quote,
    doc.beneficiary_location
])

if has_beneficiary_data and not doc.consent_obtained:
    frappe.throw(
        "Consent must be obtained when beneficiary information (name, quote, or location) is provided. "
        "Please tick the 'Consent Obtained' checkbox or remove the beneficiary details.",
        title="Consent Required"
    )

# ─── 3. FUTURE DATE BLOCK ───────────────────────────────────────────
if doc.story_date:
    story_dt = frappe.utils.getdate(doc.story_date)
    today_dt = frappe.utils.getdate(frappe.utils.today())
    if story_dt > today_dt:
        frappe.throw(
            "Story Date cannot be in the future. Stories of Change document events that have already happened.",
            title="Invalid Date"
        )

# ─── 4. CONSISTENCY FALLBACK (fixes existing out-of-sync data) ─────
# Runs unconditionally — if status or is_featured got out of sync
# (e.g., via bulk import or API), this ensures they agree on save.
if doc.status == "Featured":
    if not doc.is_featured:
        doc.is_featured = 1
    if not doc.featured_by:
        doc.featured_by = frappe.session.user
    if not doc.featured_date:
        doc.featured_date = frappe.utils.today()

if doc.is_featured and doc.status != "Featured":
    doc.status = "Featured"
    if not doc.featured_by:
        doc.featured_by = frappe.session.user
    if not doc.featured_date:
        doc.featured_date = frappe.utils.today()
