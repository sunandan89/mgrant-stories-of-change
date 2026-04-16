
(function() {
  var $ = function(sel) { return root_element.querySelector(sel); };
  var $$ = function(sel) { return root_element.querySelectorAll(sel); };

  var allStories = [];

  function goToNewStory() { window.location.href = '/app/story-of-change/new'; }
  function goToStory(name) { window.location.href = '/app/story-of-change/' + name; }

  $('#btn-new-story').addEventListener('click', goToNewStory);
  $('#btn-empty-new').addEventListener('click', goToNewStory);
  $('#filter-status').addEventListener('change', applyFilters);
  $('#filter-ngo').addEventListener('change', applyFilters);
  $('#filter-theme').addEventListener('change', applyFilters);
  var searchTimeout;
  $('#filter-search').addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 300);
  });
  $('#btn-reset').addEventListener('click', function() {
    $('#filter-status').value = '';
    $('#filter-ngo').value = '';
    $('#filter-theme').value = '';
    $('#filter-search').value = '';
    applyFilters();
  });

  function fmtDate(d) {
    if (!d) return '';
    var parts = d.split('-');
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return parts[2] + ' ' + months[parseInt(parts[1])-1] + ' ' + parts[0];
  }

  function badgeClass(s) {
    return 'status-badge badge-' + (s || 'draft').toLowerCase();
  }

  function stripHtml(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
  }

  function renderStories(stories) {
    var grid = $('#stories-grid');
    grid.innerHTML = '';

    if (stories.length === 0) {
      grid.style.display = 'none';
      $('#empty-state').style.display = 'block';
      return;
    }
    grid.style.display = '';
    $('#empty-state').style.display = 'none';

    stories.forEach(function(s) {
      var card = document.createElement('div');
      card.className = 'story-card';

      var imageInner = '';
      if (s.cover_image) {
        imageInner = '<div class="card-image"><img src="' + s.cover_image + '" alt="" /></div>';
      } else {
        var icons = ['\u{1F4D6}', '\u{1F331}', '\u{2728}', '\u{1F3AF}', '\u{1F4A1}', '\u{1F30D}'];
        var icon = icons[Math.abs(s.name.charCodeAt(s.name.length-1)) % icons.length];
        imageInner = '<div class="card-image">' + icon + '</div>';
      }

      var narrativePreview = stripHtml(s.narrative || '');
      var narrativeHtml = narrativePreview ? '<p class="card-narrative">' + narrativePreview + '</p>' : '';

      card.innerHTML =
        '<div class="card-image-wrap">' + imageInner + '</div>' +
        '<div class="card-body">' +
          '<div class="card-meta">' +
            '<span class="' + badgeClass(s.status) + '">' + (s.status || 'Draft') + '</span>' +
            '<span class="card-date">' + fmtDate(s.story_date) + '</span>' +
          '</div>' +
          '<h3 class="card-title">' + (s.title || 'Untitled Story') + '</h3>' +
          '<p class="card-ngo">' + (s.ngo_name || '') + '</p>' +
          (s.grant_name ? '<p class="card-grant">' + s.grant_name + '</p>' : '') +
          narrativeHtml +
        '</div>';

      card.addEventListener('click', function() { goToStory(s.name); });
      grid.appendChild(card);
    });
  }

  function applyFilters() {
    var status = $('#filter-status').value;
    var ngo = $('#filter-ngo').value;
    var theme = $('#filter-theme').value;
    var search = ($('#filter-search').value || '').toLowerCase();
    var hasFilter = status || ngo || theme || search;
    $('#btn-reset').style.display = hasFilter ? '' : 'none';

    var filtered = allStories.filter(function(s) {
      if (status && s.status !== status) return false;
      if (ngo && s.ngo_name !== ngo) return false;
      if (theme && s.theme !== theme) return false;
      if (search) {
        var hay = ((s.title || '') + ' ' + (s.ngo_name || '') + ' ' + stripHtml(s.narrative || '')).toLowerCase();
        if (hay.indexOf(search) === -1) return false;
      }
      return true;
    });
    renderStories(filtered);
  }

  function updateKPIs() {
    var counts = { Draft: 0, Submitted: 0, Featured: 0, Archived: 0 };
    allStories.forEach(function(s) {
      if (counts.hasOwnProperty(s.status)) counts[s.status]++;
    });
    $('#kpi-total .kpi-value').textContent = allStories.length;
    $('#kpi-featured .kpi-value').textContent = counts.Featured;
    $('#kpi-submitted .kpi-value').textContent = counts.Submitted;
    $('#kpi-draft .kpi-value').textContent = counts.Draft;
  }

  function populateFilterOptions() {
    var ngos = {}, themes = {};
    allStories.forEach(function(s) {
      if (s.ngo_name) ngos[s.ngo_name] = true;
      if (s.theme) themes[s.theme] = true;
    });
    var ngoSel = $('#filter-ngo');
    Object.keys(ngos).sort().forEach(function(n) {
      var opt = document.createElement('option');
      opt.value = n; opt.textContent = n;
      ngoSel.appendChild(opt);
    });
    var themeSel = $('#filter-theme');
    Object.keys(themes).sort().forEach(function(t) {
      var opt = document.createElement('option');
      opt.value = t; opt.textContent = t;
      themeSel.appendChild(opt);
    });
  }

  // Main: fetch story list and render
  frappe.call({
    method: 'frappe.client.get_list',
    args: {
      doctype: 'Story of Change',
      fields: ['name', 'title', 'story_date', 'status', 'cover_image',
               'ngo_name', 'grant', 'grant_name', 'narrative', 'theme',
               'story_type', 'state'],
      order_by: 'creation desc',
      limit_page_length: 100
    },
    async: true,
    callback: function(r) {
      allStories = r.message || [];
      $('#loading-state').style.display = 'none';
      updateKPIs();
      populateFilterOptions();
      renderStories(allStories);
    },
    error: function() {
      $('#loading-state').style.display = 'none';
      $('#empty-state').style.display = 'block';
    }
  });
})();
