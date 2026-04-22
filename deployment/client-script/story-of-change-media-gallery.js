// Client Script: Story of Change — Media Gallery
// Type: Form
// Reference DocType: Story of Change
//
// Handles:
// 1. "Use as Cover" toggle — only one image can be cover at a time
// 2. Auto-sync cover_image field from the gallery row marked as cover
// 3. Multi-upload button for media gallery
// 4. Hide the standalone Cover Image section (gallery is the single source)

frappe.ui.form.on('Story of Change', {

    refresh: function(frm) {
        // Hide standalone cover image section — gallery is the source now
        frm.toggle_display('section_cover_image', false);

        // Add multi-upload button above the media gallery
        setup_multi_upload(frm);

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


// ─── MULTI-UPLOAD BUTTON ───────────────────────────────────────────────
function setup_multi_upload(frm) {
    if (frm.is_new()) return;

    // Find the media gallery section
    var section = frm.fields_dict.section_media_gallery;
    if (!section || !section.$wrapper) return;

    // Don't add twice
    if (section.$wrapper.find('.soc-multi-upload-btn').length) return;

    var $btn = $('<button class="btn btn-xs btn-default soc-multi-upload-btn" ' +
        'style="margin: 8px 0 4px 0;">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" ' +
        'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
        'stroke-linejoin="round" style="margin-right:4px;vertical-align:-2px;">' +
        '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>' +
        '<line x1="12" y1="8" x2="12" y2="16"></line>' +
        '<line x1="8" y1="12" x2="16" y2="12"></line>' +
        '</svg>' +
        'Upload Multiple Images</button>');

    $btn.on('click', function() {
        // Create a hidden multi-file input
        var $input = $('<input type="file" multiple accept="image/*" style="display:none">');
        $input.on('change', function() {
            var files = this.files;
            if (!files || !files.length) return;

            var pending = files.length;
            var first = true;

            Array.from(files).forEach(function(file) {
                // Upload each file
                frappe.call({
                    method: 'upload_file',
                    args: {
                        file: file,
                        doctype: 'Story of Change',
                        docname: frm.doc.name,
                        fieldname: 'file',
                        is_private: 0
                    },
                    callback: function(r) {
                        if (r.message && r.message.file_url) {
                            // Add a row to the media table
                            var row = frm.add_child('media');
                            row.media_type = 'Image';
                            row.file = r.message.file_url;
                            row.caption = file.name.replace(/\.[^/.]+$/, '');

                            // Mark first uploaded as cover if no cover exists
                            if (first) {
                                var has_cover = (frm.doc.media || []).some(function(r2) {
                                    return r2.is_cover && r2.file && r2.name !== row.name;
                                });
                                if (!has_cover) {
                                    row.is_cover = 1;
                                }
                                first = false;
                            }
                        }

                        pending--;
                        if (pending === 0) {
                            frm.refresh_field('media');
                            sync_cover_image(frm);
                            frm.dirty();
                            frappe.show_alert({
                                message: files.length + ' image(s) added to gallery',
                                indicator: 'green'
                            });
                        }
                    }
                });
            });

            $input.remove();
        });

        $('body').append($input);
        $input.trigger('click');
    });

    section.$wrapper.find('.section-head').after($btn);
}
