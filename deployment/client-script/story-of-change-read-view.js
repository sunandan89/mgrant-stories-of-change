frappe.ui.form.on('Story of Change', {
    refresh: function(frm) {
        if (frm.is_new()) return;

        // Build read-view on a short delay so the form fully renders first
        setTimeout(function() {
            build_read_view(frm);
        }, 100);
    }
});

function build_read_view(frm) {
    // Find the Story tab via frm.layout.tabs (Frappe v16 pattern)
    var storyTab = null;
    if (frm.layout && frm.layout.tabs) {
        frm.layout.tabs.forEach(function(t) {
            if (t.df.fieldname === 'tab_story') storyTab = t;
        });
    }
    var $tab = storyTab && storyTab.wrapper;
    if (!$tab || !$tab.length) return;

    // Remove any previous read-view
    var existing = $tab.find('.soc-read-view');
    if (existing && existing.length) existing.remove();

    // Gather data
    var doc = frm.doc;
    var title = doc.title || 'Untitled Story';
    var narrative = doc.narrative || '';
    var cover = doc.cover_image || '';
    var ngo = doc.ngo_name || '';
    var grant = doc.grant_name || '';
    var status = doc.status || 'Draft';
    var date = doc.story_date ? format_date(doc.story_date) : '';
    var theme = doc.theme || '';
    var story_type = doc.story_type || '';
    var state = doc.state || '';
    var district = doc.district || '';
    var beneficiary = doc.beneficiary_name || '';
    var quote = doc.beneficiary_quote || '';
    var location = doc.beneficiary_location || '';

    // Build location string
    var loc_parts = [district, state].filter(Boolean);
    var location_str = loc_parts.join(', ');

    // Build metadata chips
    var chips = [];
    if (date) chips.push('<span class="rv-chip rv-chip-date">' + date + '</span>');
    chips.push('<span class="rv-chip rv-chip-status rv-status-' + status.toLowerCase() + '">' + status + '</span>');
    if (ngo) chips.push('<span class="rv-chip rv-chip-ngo">' + ngo + '</span>');
    if (theme) chips.push('<span class="rv-chip rv-chip-theme">' + theme + '</span>');
    if (location_str) chips.push('<span class="rv-chip rv-chip-location">' + location_str + '</span>');

    // Build beneficiary block
    var beneficiary_html = '';
    if (beneficiary || quote) {
        beneficiary_html = '<div class="rv-beneficiary">';
        if (quote) {
            beneficiary_html += '<blockquote class="rv-quote">' +
                '<span class="rv-quote-mark">\u201C</span>' +
                quote +
                '<span class="rv-quote-mark">\u201D</span>' +
                '</blockquote>';
        }
        if (beneficiary) {
            beneficiary_html += '<p class="rv-beneficiary-name">\u2014 ' + beneficiary;
            if (location) beneficiary_html += ', ' + location;
            beneficiary_html += '</p>';
        }
        beneficiary_html += '</div>';
    }

    // Build grant attribution
    var attribution_html = '';
    if (grant || ngo) {
        var parts = [];
        if (ngo) parts.push(ngo);
        if (grant) parts.push(grant);
        attribution_html = '<div class="rv-attribution">' + parts.join(' &middot; ') + '</div>';
    }

    // Build media gallery (non-cover images)
    var gallery_html = '';
    var gallery_images = (doc.media || []).filter(function(m) {
        return m.file && m.media_type === 'Image' && m.file !== cover;
    });
    if (gallery_images.length > 0) {
        gallery_html = '<div class="rv-gallery">' +
            '<h3 class="rv-gallery-title">Gallery</h3>' +
            '<div class="rv-gallery-grid">';
        gallery_images.forEach(function(m) {
            gallery_html += '<div class="rv-gallery-item">' +
                '<img src="' + m.file + '" alt="' + (m.caption || '') + '" />' +
                (m.caption ? '<p class="rv-gallery-caption">' + m.caption + '</p>' : '') +
                '</div>';
        });
        gallery_html += '</div></div>';
    }

    // Build the full read-view
    var html = '<div class="soc-read-view">' +
        '<style>' + get_read_view_css() + '</style>' +

        // Edit button bar
        '<div class="rv-toolbar">' +
            '<button class="btn btn-sm rv-btn-edit">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:-2px;">' +
                    '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>' +
                    '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>' +
                '</svg>' +
                'Edit Story' +
            '</button>' +
            '<button class="btn btn-sm rv-btn-back">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:-2px;">' +
                    '<path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path>' +
                '</svg>' +
                'Back to Stories' +
            '</button>' +
        '</div>' +

        // Hero image
        (cover ?
            '<div class="rv-hero">' +
                '<img src="' + cover + '" alt="" />' +
            '</div>'
            : '') +

        // Article body
        '<article class="rv-article">' +
            '<h1 class="rv-title">' + title + '</h1>' +
            '<div class="rv-meta">' + chips.join('') + '</div>' +
            attribution_html +
            '<div class="rv-narrative">' + narrative + '</div>' +
            beneficiary_html +
            gallery_html +
        '</article>' +
    '</div>';

    // Hide all form children (sections, controls, dashboard) within Story tab
    $tab.children().hide();

    // Inject
    $tab.prepend(html);

    // Wire up Edit button
    $tab.find('.rv-btn-edit').on('click', function() {
        $tab.find('.soc-read-view').remove();
        $tab.children().show();
    });

    // Wire up Back button
    $tab.find('.rv-btn-back').on('click', function() {
        window.location.href = '/app/stories-of-change';
    });
}

function format_date(d) {
    if (!d) return '';
    var parts = d.split('-');
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return parseInt(parts[2]) + ' ' + months[parseInt(parts[1]) - 1] + ' ' + parts[0];
}

function get_read_view_css() {
    return '' +
    '.soc-read-view {' +
    '  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;' +
    '  max-width: 820px;' +
    '  margin: 0 auto;' +
    '  padding-bottom: 40px;' +
    '}' +

    /* Toolbar */
    '.rv-toolbar {' +
    '  display: flex;' +
    '  justify-content: space-between;' +
    '  align-items: center;' +
    '  margin-bottom: 20px;' +
    '  padding: 0 4px;' +
    '}' +
    '.rv-btn-edit {' +
    '  background: #B45309 !important;' +
    '  color: white !important;' +
    '  border: none !important;' +
    '  padding: 7px 18px !important;' +
    '  border-radius: 6px !important;' +
    '  font-size: 13px !important;' +
    '  font-weight: 600 !important;' +
    '  cursor: pointer !important;' +
    '  transition: all 0.15s ease !important;' +
    '}' +
    '.rv-btn-edit:hover {' +
    '  background: #92400E !important;' +
    '  transform: translateY(-1px) !important;' +
    '  box-shadow: 0 4px 12px rgba(180, 83, 9, 0.3) !important;' +
    '}' +
    '.rv-btn-back {' +
    '  background: #F3F4F6 !important;' +
    '  color: #374151 !important;' +
    '  border: 1px solid #E5E7EB !important;' +
    '  padding: 7px 16px !important;' +
    '  border-radius: 6px !important;' +
    '  font-size: 13px !important;' +
    '  font-weight: 500 !important;' +
    '  cursor: pointer !important;' +
    '  transition: all 0.15s ease !important;' +
    '}' +
    '.rv-btn-back:hover {' +
    '  background: #E5E7EB !important;' +
    '}' +

    /* Hero */
    '.rv-hero {' +
    '  width: 100%;' +
    '  border-radius: 12px;' +
    '  overflow: hidden;' +
    '  margin-bottom: 32px;' +
    '  box-shadow: 0 4px 20px rgba(0,0,0,0.08);' +
    '  max-height: 420px;' +
    '}' +
    '.rv-hero img {' +
    '  width: 100%;' +
    '  height: auto;' +
    '  max-height: 420px;' +
    '  object-fit: cover;' +
    '  display: block;' +
    '}' +

    /* Article */
    '.rv-article {' +
    '  padding: 0 4px;' +
    '}' +
    '.rv-title {' +
    '  font-size: 32px;' +
    '  font-weight: 800;' +
    '  color: #111827;' +
    '  line-height: 1.25;' +
    '  margin: 0 0 16px 0;' +
    '  letter-spacing: -0.02em;' +
    '}' +

    /* Metadata chips */
    '.rv-meta {' +
    '  display: flex;' +
    '  flex-wrap: wrap;' +
    '  gap: 8px;' +
    '  margin-bottom: 12px;' +
    '}' +
    '.rv-chip {' +
    '  font-size: 12px;' +
    '  font-weight: 500;' +
    '  padding: 3px 12px;' +
    '  border-radius: 20px;' +
    '  background: #F3F4F6;' +
    '  color: #4B5563;' +
    '}' +
    '.rv-chip-date { background: #FEF3C7; color: #92400E; }' +
    '.rv-status-featured { background: #DCFCE7; color: #15803D; }' +
    '.rv-status-submitted { background: #DBEAFE; color: #1D4ED8; }' +
    '.rv-status-draft { background: #F3F4F6; color: #6B7280; }' +
    '.rv-status-approved { background: #FEF3C7; color: #B45309; }' +
    '.rv-status-archived { background: #F3F4F6; color: #9CA3AF; }' +
    '.rv-chip-ngo { background: #EDE9FE; color: #6D28D9; }' +
    '.rv-chip-theme { background: #E0F2FE; color: #0369A1; }' +
    '.rv-chip-location { background: #FEF3C7; color: #92400E; }' +

    /* Attribution */
    '.rv-attribution {' +
    '  font-size: 14px;' +
    '  color: #6B7280;' +
    '  margin-bottom: 28px;' +
    '  padding-bottom: 20px;' +
    '  border-bottom: 1px solid #E5E7EB;' +
    '}' +

    /* Narrative */
    '.rv-narrative {' +
    '  font-size: 16px;' +
    '  line-height: 1.75;' +
    '  color: #1F2937;' +
    '}' +
    '.rv-narrative p {' +
    '  margin-bottom: 16px;' +
    '}' +
    '.rv-narrative img {' +
    '  max-width: 100%;' +
    '  border-radius: 8px;' +
    '  margin: 16px 0;' +
    '}' +

    /* Beneficiary quote */
    '.rv-beneficiary {' +
    '  margin-top: 32px;' +
    '  padding: 24px 28px;' +
    '  background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);' +
    '  border-radius: 12px;' +
    '  border-left: 4px solid #D97706;' +
    '}' +
    '.rv-quote {' +
    '  font-size: 17px;' +
    '  font-style: italic;' +
    '  color: #92400E;' +
    '  line-height: 1.6;' +
    '  margin: 0;' +
    '  padding: 0;' +
    '  border: none;' +
    '}' +
    '.rv-quote-mark {' +
    '  font-size: 24px;' +
    '  font-weight: 700;' +
    '  color: #D97706;' +
    '}' +
    '.rv-beneficiary-name {' +
    '  font-size: 14px;' +
    '  color: #B45309;' +
    '  font-weight: 600;' +
    '  margin: 12px 0 0 0;' +
    '}' +

    /* Gallery */
    '.rv-gallery {' +
    '  margin-top: 36px;' +
    '  padding-top: 24px;' +
    '  border-top: 1px solid #E5E7EB;' +
    '}' +
    '.rv-gallery-title {' +
    '  font-size: 18px;' +
    '  font-weight: 700;' +
    '  color: #374151;' +
    '  margin: 0 0 16px 0;' +
    '}' +
    '.rv-gallery-grid {' +
    '  display: grid;' +
    '  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));' +
    '  gap: 12px;' +
    '}' +
    '.rv-gallery-item img {' +
    '  width: 100%;' +
    '  height: 180px;' +
    '  object-fit: cover;' +
    '  border-radius: 8px;' +
    '  cursor: pointer;' +
    '  transition: transform 0.15s ease;' +
    '}' +
    '.rv-gallery-item img:hover {' +
    '  transform: scale(1.02);' +
    '}' +
    '.rv-gallery-caption {' +
    '  font-size: 12px;' +
    '  color: #6B7280;' +
    '  margin: 6px 0 0;' +
    '  text-align: center;' +
    '}' +
    '';
}
