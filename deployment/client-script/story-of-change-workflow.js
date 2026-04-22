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
    },

    grant: function(frm) {
        if (frm.doc.grant) {
            auto_fetch_from_grant(frm);
        }
    },

    story_type: function(frm) {
        update_consent_requirement(frm);
    },

    state: function(frm) {
        // When state changes, clear district so user picks fresh
        if (frm.doc.grant) {
            frm.set_value('district', '');
            load_district_options(frm);
        }
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

            // Auto-fill theme (Focus Area) if empty
            if (grant.focus_area && !frm.doc.theme) {
                frm.set_value('theme', grant.focus_area);
            }

            // Extract unique states from geography_details
            var geo = grant.geography_details || [];
            if (geo.length > 0) {
                var states = [];
                var seen = {};
                geo.forEach(function(g) {
                    if (g.state_name && !seen[g.state_name]) {
                        seen[g.state_name] = true;
                        states.push(g.state_name);
                    }
                });

                // Auto-fill state if only one and field is empty
                if (states.length === 1 && !frm.doc.state) {
                    frm.set_value('state', states[0]);
                }

                // Store for district lookup
                frm._grant_geo = geo;

                // Load district options if state is set
                if (frm.doc.state) {
                    load_district_options(frm);
                }
            }
        }
    });
}

function load_district_options(frm) {
    if (!frm._grant_geo || !frm.doc.state) return;

    var districts = [];
    var seen = {};
    frm._grant_geo.forEach(function(g) {
        if (g.state_name === frm.doc.state && g.district_name && !seen[g.district_name]) {
            seen[g.district_name] = true;
            districts.push(g.district_name);
        }
    });

    // Auto-fill district if only one and field is empty
    if (districts.length === 1 && !frm.doc.district) {
        frm.set_value('district', districts[0]);
    }
}


// ─── 2. CONSENT REQUIREMENT ───────────────────────────────────────────
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
