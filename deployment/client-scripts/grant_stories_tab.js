// Stories of Change — Grant form integration
frappe.ui.form.on('Grant', {
    refresh: function(frm) {
        if (frm.is_new()) return;
        render_stories_of_change(frm);
    }
});

function render_stories_of_change(frm) {
    let wrapper = frm.fields_dict.stories_of_change_html;
    if (!wrapper) return;

    let $wrapper = $(wrapper.wrapper).empty();

    // Loading state
    $wrapper.html('<div style="padding:20px;color:#666;">Loading stories...</div>');

    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Story of Change',
            filters: { grant: frm.doc.name },
            fields: ['name', 'title', 'story_date', 'status', 'cover_image', 'ngo_name'],
            order_by: 'story_date desc',
            limit_page_length: 20
        },
        callback: function(r) {
            let stories = r.message || [];

            let featured_count = stories.filter(s => s.status === 'Featured').length;
            let submitted_count = stories.filter(s => s.status === 'Submitted').length;
            let last_date = stories.length ? stories[0].story_date : null;

            let status_colors = {
                'Draft': '#78716c',
                'Submitted': '#2563eb',
                'Featured': '#16a34a',
                'Archived': '#a8a29e'
            };

            let html = `
                <div style="padding:16px 0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                        <div>
                            <span style="font-size:14px;color:#666;">
                                <strong>${stories.length}</strong> ${stories.length === 1 ? 'story' : 'stories'}
                                ${featured_count ? ' &middot; <span style="color:#16a34a">' + featured_count + ' featured</span>' : ''}
                                ${last_date ? ' &middot; Last: ' + frappe.datetime.str_to_user(last_date) : ''}
                            </span>
                        </div>
                        <button class="btn btn-primary btn-sm btn-add-story">
                            + Add Story of Change
                        </button>
                    </div>`;

            if (stories.length === 0) {
                html += `
                    <div style="text-align:center;padding:40px 20px;background:#fafaf9;border-radius:8px;border:1px dashed #d6d3d1;">
                        <div style="font-size:24px;margin-bottom:8px;">📖</div>
                        <p style="color:#78716c;margin:0;">No stories uploaded yet.</p>
                        <p style="color:#a8a29e;font-size:13px;margin:4px 0 0;">Click "+ Add Story of Change" to capture an impact story.</p>
                    </div>`;
            } else {
                html += `
                    <table class="table table-bordered" style="font-size:13px;">
                        <thead>
                            <tr style="background:#f5f5f4;">
                                <th style="width:100px;">Date</th>
                                <th>Title</th>
                                <th style="width:100px;">Status</th>
                                <th style="width:60px;"></th>
                            </tr>
                        </thead>
                        <tbody>`;

                stories.forEach(function(s) {
                    let color = status_colors[s.status] || '#78716c';
                    html += `
                        <tr>
                            <td>${frappe.datetime.str_to_user(s.story_date)}</td>
                            <td><a href="/app/story-of-change/${s.name}">${frappe.utils.escape_html(s.title)}</a></td>
                            <td><span style="color:${color};font-weight:500;">${s.status}</span></td>
                            <td><a href="/app/story-of-change/${s.name}" class="btn btn-xs btn-default">Open</a></td>
                        </tr>`;
                });

                html += `</tbody></table>`;
            }

            html += `
                <div style="text-align:right;margin-top:8px;">
                    <a href="/app/story-of-change?grant=${frm.doc.name}" style="font-size:13px;color:#2563eb;">
                        View All in Stories Hub →
                    </a>
                </div>
            </div>`;

            $wrapper.html(html);

            $wrapper.find('.btn-add-story').on('click', function() {
                frappe.new_doc('Story of Change', {
                    grant: frm.doc.name
                });
            });
        }
    });
}
