// Client Script: Story of Change — Form (refresh)
// Purpose: Compact form layout, hide redundant fetched fields,
//          collapse optional sections by default on new docs
//
// Deployed as: Client Script "Story of Change-Form-compact"

frappe.ui.form.on('Story of Change', {
    refresh: function(frm) {
        // Hide redundant fetched-name fields
        // Link fields already show the linked doc's title,
        // so the separate *_name Data fields are duplicate noise.
        frm.set_df_property('grant_name', 'hidden', 1);
        frm.set_df_property('ngo_name', 'hidden', 1);

        // Collapse optional sections on new docs
        if (frm.is_new()) {
            setTimeout(function() {
                var targets = ['Beneficiary', 'Media Gallery', 'Classification'];
                document.querySelectorAll('.section-head').forEach(function(el) {
                    var label = el.textContent.trim();
                    if (targets.indexOf(label) !== -1 && !el.classList.contains('collapsed')) {
                        el.click();
                    }
                });
            }, 500);
        }
    }
});
