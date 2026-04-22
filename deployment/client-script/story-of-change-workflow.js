// Client Script: Story of Change — Workflow
// Type: Form
// Reference DocType: Story of Change
//
// Handles:
// 1. "Feature This Story" button on Curation tab (Approved stories, comms roles only)
// 2. Status dropdown restricted to valid transitions
// 3. Auto-fetch theme, state, district from Grant profile
// 4. story_type mandatory + consent logic for Beneficiary type
// 5. Role-based Curation tab visibility

// ─── VALID TRANSITIONS (mirrors Server Script) ────────────────────────
var TRANSITIONS = {
    'Draft':     ['Submitted'],
    'Submitted': ['Approved', 'Draft'],
    'Approved':  ['Featured', 'Archived', 'Submitted'],
    'Featured':  ['Approved', 'Archived'],
    'Archived':  ['Draft']
};

// Roles that can approve / feature stories
var COMMS_ROLES = ['PM', 'SPM', 'CSR & ESG JGM', 'System Manager'];

function has_comms_role() {
    return COMMS_ROLES.some(function(role) {
        return frappe.user_roles.indexOf(role) !== -1;
    });
}

frappe.ui.form.on('Story of Change', {

    refresh: function(frm) {
        // Make story_type mandatory in UI
        frm.set_df_property('story_type', 'reqd', 1);

        // Restrict status options to valid transitions
        restrict_status_options(frm);

        // Feature button on Curation tab
        setup_feature_button(frm);

        // Un-Feature button for Featured stories
        setup_unfeature_button(frm);

        // Consent indicator
        update_consent_requirement(frm);

        // Role-based: hide Curation tab for non-comms roles
        if (!has_comms_role()) {
            var curationTab = null;
            if (frm.layout && frm.layout.tabs) {
                frm.layout.tabs.forEach(function(t) {
                    if (t.df.fieldname === 'tab_curation') curationTab = t;
                });
            }
            if (curationTab && curationTab.wrapper) {
                // Hide the tab header itself
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


// ─── 1. FEATURE THIS STORY BUTTON ─────────────────────────────────────
function setup_feature_button(frm) {
    if (frm.is_new()) return;
    if (frm.doc.status !== 'Approved') return;
    if (!has_comms_role()) return;

    frm.add_custom_button('Feature This Story', function() {
        frappe.confirm(
            'Mark this story as <strong>Featured</strong>?<br><br>' +
            'This will set you as the curator and record today\'s date.',
            function() {
                frm.set_value('status', 'Featured');
                frm.save();
            }
        );
    }, 'Actions');

    // Style the button
    frm.change_custom_button_type('Feature This Story', 'Actions', 'primary');
}

function setup_unfeature_button(frm) {
    if (frm.is_new()) return;
    if (frm.doc.status !== 'Featured') return;
    if (!has_comms_role()) return;

    frm.add_custom_button('Remove from Featured', function() {
        frappe.confirm(
            'Move this story back to <strong>Approved</strong>?<br><br>' +
            'The Featured badge, curator, and date will be cleared.',
            function() {
                frm.set_value('status', 'Approved');
                frm.save();
            }
        );
    }, 'Actions');
}


// ─── 2. STATUS DROPDOWN RESTRICTION ───────────────────────────────────
function restrict_status_options(frm) {
    var current = frm.doc.status || 'Draft';
    var allowed = TRANSITIONS[current] || [];

    // Always include the current status in the list
    var options = [current].concat(allowed);

    // Non-comms roles cannot move to Approved or Featured
    if (!has_comms_role()) {
        options = options.filter(function(s) {
            return s !== 'Approved' && s !== 'Featured';
        });
    }

    frm.set_df_property('status', 'options', options.join('\n'));
}


// ─── 3. AUTO-FETCH FROM GRANT ──────────────────────────────────────────
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


// ─── 4. CONSENT REQUIREMENT ───────────────────────────────────────────
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
