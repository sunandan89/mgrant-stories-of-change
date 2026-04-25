// Client Script: Story of Change — Media Gallery
// Type: Form
// Reference DocType: Story of Change
//
// Handles:
// 1. "Use as Cover" toggle — only one image can be cover at a time
// 2. Auto-sync cover_image field from the gallery row marked as cover
// 3. Hide the standalone Cover Image section (gallery is the single source)

frappe.ui.form.on('Story of Change', {

    refresh: function(frm) {
        // Hide standalone cover image section — gallery is the source now
        frm.toggle_display('section_cover_image', false);

        // Sync cover on load
        sync_cover_image(frm);
    }
});

frappe.ui.form.on('Story of Change Media', {

    is_cover: function(frm, cdt, cdn) {
        var row = locals[cdt][cdn];

        if (row.is_cover) {
            // Uncheck all other rows
            (frm.doc.media || []).forEach(function(r) {
                if (r.name !== cdn && r.is_cover) {
                    frappe.model.set_value(r.doctype, r.name, 'is_cover', 0);
                }
            });
        }

        sync_cover_image(frm);
    },

    file: function(frm, cdt, cdn) {
        // When a file is uploaded, if no cover is set yet, auto-mark it
        var row = locals[cdt][cdn];
        if (row.file) {
            var has_cover = (frm.doc.media || []).some(function(r) {
                return r.is_cover && r.file;
            });
            if (!has_cover) {
                frappe.model.set_value(cdt, cdn, 'is_cover', 1);
            }
        }
    },

    media_remove: function(frm) {
        // When a row is deleted, re-sync cover
        sync_cover_image(frm);
    }
});


// ─── COVER IMAGE SYNC ──────────────────────────────────────────────────
function sync_cover_image(frm) {
    var cover_url = '';
    (frm.doc.media || []).forEach(function(r) {
        if (r.is_cover && r.file) {
            cover_url = r.file;
        }
    });

    if (frm.doc.cover_image !== cover_url) {
        frm.set_value('cover_image', cover_url);
    }
}
