// Client Script: Story of Change — Form Logic
// Type: Form
// Reference DocType: Story of Change
//
// Handles (business rules only — workflow transitions are handled by Frappe Workflow):
// 1. Auto-fetch theme, state, district from Grant profile
// 2. story_type mandatory + consent logic for Beneficiary type
// 3. Curation tab visibility (hide for non-comms roles)
//
// NOTE: Status transitions (Draft→Submitted→Approved→Featured→Archived) and
// role-gated action buttons are handled by the native "Story of Change Workflow"
// Workflow document. Do NOT add custom transition logic here.

// Roles that can see the Curation tab
var CURATION_ROLES = ['PM', 'SPM', 'CSR & ESG JGM', 'Comms User', 'System Manager'];

function has_curation_role() {
    return CURATION_ROLES.some(function(role) {
        return frappe.user_roles.indexOf(role) !== -1;
    });
}

frappe.ui.form.on('Story of Change', {

    refresh: function(frm) {
        // Make story_type mandatory in UI
        frm.set_df_property('story_type', 'reqd', 1);

        // Consent indicator
        update_consent_requirement(frm);

        // Role-based: hide Curation tab for non-comms roles
        if (!has_curation_role()) {
            if (frm.layout && frm.layout.tabs) {
                frm.layout.tabs.forEach(function(t) {
                    if (t.df.fieldname === 'tab_curation' && t.tab_link) {
                        $(t.tab_link).hide();
                    }
                });
            }
        }

        // Set theme query filter based on grant's themes
        if (frm.doc.grant && frm._grant_themes && frm._grant_themes.length) {
            frm.set_query('theme', function() {
                return { filters: { name: ['in', frm._grant_themes] } };
            });
        }

        // Cascading district filter: only show districts for selected state (#13)
        setup_district_filter(frm);
    },

    grant: function(frm) {
        if (frm.doc.grant) {
            auto_fetch_from_grant(frm);
        } else {
            // Clear cached grant data
            frm._grant_themes = null;
            frm._grant_states = null;
            frm._grant_districts = null;
        }
    },

    story_type: function(frm) {
        update_consent_requirement(frm);
    },

    state: function(frm) {
        // When state changes, clear district and update filter
        frm.set_value('district', '');
        setup_district_filter(frm);
    }
});


// ─── 1. AUTO-FETCH FROM GRANT ──────────────────────────────────────────
function auto_fetch_from_grant(frm) {
    frappe.call({
        method: 'frappe.client.get',
        args: { doctype: 'Grant', name: frm.doc.grant },
        callback: function(r) {
            if (!r.message) return;
            var grant = r.message;

            // ── Theme: read from custom_project_theme child table ──
            var themes = (grant.custom_project_theme || []).map(function(row) {
                return row.theme;
            }).filter(Boolean);

            // Cache for query filter
            frm._grant_themes = themes;

            // Set dropdown filter to only show grant's themes
            if (themes.length > 0) {
                frm.set_query('theme', function() {
                    return { filters: { name: ['in', themes] } };
                });
            }

            // Auto-fill if exactly one theme and field is empty
            if (themes.length === 1 && !frm.doc.theme) {
                frm.set_value('theme', themes[0]);
            }

            // ── State: read from states Table MultiSelect ──
            var states = (grant.states || []).map(function(row) {
                return row.state;
            }).filter(Boolean);

            // Cache for reference
            frm._grant_states = states;

            // Auto-fill if exactly one state and field is empty
            if (states.length === 1 && !frm.doc.state) {
                frm.set_value('state', states[0]);
            }

            // ── District: read from districts Table MultiSelect ──
            var districts = (grant.districts || []).map(function(row) {
                return row.district;
            }).filter(Boolean);

            // Cache for reference
            frm._grant_districts = districts;

            // Auto-fill if exactly one district and field is empty
            if (districts.length === 1 && !frm.doc.district) {
                frm.set_value('district', districts[0]);
            }
        }
    });
}


// ─── 2. CASCADING DISTRICT FILTER (#13) ───────────────────────────
// District DocType has a 'state' Link field — filter districts to selected state
function setup_district_filter(frm) {
    if (frm.doc.state) {
        frm.set_query('district', function() {
            var filters = { state: frm.doc.state };
            // If grant has specific districts, further restrict
            if (frm._grant_districts && frm._grant_districts.length) {
                filters.name = ['in', frm._grant_districts];
            }
            return { filters: filters };
        });
    } else if (frm._grant_districts && frm._grant_districts.length) {
        // No state selected but grant has districts — restrict to grant's districts
        frm.set_query('district', function() {
            return { filters: { name: ['in', frm._grant_districts] } };
        });
    } else {
        // No constraints — clear any previous filter
        frm.set_query('district', function() { return {}; });
    }
}


// ─── 3. CONSENT REQUIREMENT ───────────────────────────────────────
function update_consent_requirement(frm) {
    var is_beneficiary = frm.doc.story_type === 'Beneficiary Story';

    // Show/hide beneficiary section based on story type
    frm.toggle_display('section_beneficiary', is_beneficiary);

    // Make consent visually required for beneficiary stories
    frm.toggle_reqd('consent_obtained', is_beneficiary);

    // Add a description hint
    if (is_beneficiary) {
        frm.set_df_property('consent_obtained', 'description',
            'Required for Beneficiary Stories when beneficiary details are provided.');
    } else {
        frm.set_df_property('consent_obtained', 'description', '');
    }
}
