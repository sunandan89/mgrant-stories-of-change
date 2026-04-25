
(function() {
  var $ = function(sel) { return root_element.querySelector(sel); };

  var icons = ['\u{1F4D6}', '\u{1F331}', '\u{2728}', '\u{1F3AF}', '\u{1F4A1}', '\u{1F30D}'];

  function fmtDate(d) {
    if (!d) return '';
    var parts = d.split('-');
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return parts[2] + ' ' + months[parseInt(parts[1])-1] + ' ' + parts[0];
  }

  function stripHtml(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
  }

  function goToStory(name) {
    window.location.href = '/app/story-of-change/' + name;
  }

  function renderStories(stories) {
    var loading = $('#gds-loading');
    var grid = $('#gds-grid');
    var empty = $('#gds-empty');

    if (loading) loading.style.display = 'none';

    if (!stories || stories.length === 0) {
      grid.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    grid.style.display = '';
    empty.style.display = 'none';
    grid.innerHTML = '';

    stories.forEach(function(s) {
      var card = document.createElement('div');
      card.className = 'gds-card';

      var imageInner = '';
      if (s.cover_image) {
        imageInner = '<img src="' + s.cover_image + '" alt="" />';
      } else {
        var icon = icons[Math.abs(s.name.charCodeAt(s.name.length-1)) % icons.length];
        imageInner = icon;
      }

      var narrativePreview = stripHtml(s.narrative || '');
      var excerptHtml = narrativePreview ?
        '<p class="gds-card-excerpt">' + narrativePreview + '</p>' : '';

      card.innerHTML =
        '<div class="gds-card-img">' + imageInner + '</div>' +
        '<div class="gds-card-body">' +
          '<div class="gds-card-meta">' +
            '<span class="gds-badge">Featured</span>' +
            '<span class="gds-card-date">' + fmtDate(s.story_date) + '</span>' +
          '</div>' +
          '<h4 class="gds-card-title">' + (s.title || 'Untitled Story') + '</h4>' +
          '<p class="gds-card-ngo">' + (s.ngo_name || '') + '</p>' +
          (s.theme_name ? '<p class="gds-card-theme">' + s.theme_name + '</p>' : '') +
          excerptHtml +
        '</div>';

      card.addEventListener('click', function() { goToStory(s.name); });
      grid.appendChild(card);
    });
  }

  // Fetch featured stories
  frappe.call({
    method: 'frappe.client.get_list',
    args: {
      doctype: 'Story of Change',
      fields: ['name', 'title', 'story_date', 'status', 'cover_image',
               'ngo_name', 'grant_name', 'narrative', 'theme_name',
               'project_name'],
      filters: [['status', '=', 'Featured']],
      order_by: 'story_date desc',
      limit_page_length: 6
    },
    async: true,
    callback: function(r) {
      renderStories(r.message || []);
    },
    error: function() {
      var loading = $('#gds-loading');
      if (loading) loading.style.display = 'none';
      var empty = $('#gds-empty');
      if (empty) empty.style.display = 'block';
    }
  });
})();
