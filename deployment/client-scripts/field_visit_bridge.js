// Field Visit Report — "Create Story of Change" bridge button
frappe.ui.form.on('Field Visit Report', {
    refresh: function(frm) {
        if (!frm.is_new() && frm.doc.grant) {
            frm.add_custom_button(__('Create Story of Change'), function() {
                frappe.new_doc('Story of Change', {
                    grant: frm.doc.grant,
                    story_date: frm.doc.visit_date || frappe.datetime.get_today()
                });
            }, __('Actions'));
        }
    }
});
