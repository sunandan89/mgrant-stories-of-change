
(function() {
  var $ = function(sel) { return root_element.querySelector(sel); };
  var $$ = function(sel) { return root_element.querySelectorAll(sel); };

  var allStories = [];
  var currentSlide = 0;

  function goToNewStory() { window.location.href = '/app/story-of-change/new'; }
  function goToStory(name) { window.location.href = '/app/story-of-change/' + name; }

  // ── Event listeners ──
  $('#btn-new-story').addEventListener('click', goToNewStory);
  $('#btn-empty-new').addEventListener('click', goToNewStory);
  $('#filter-status').addEventListener('change', applyFilters);
  $('#filter-ngo').addEventListener('change', applyFilters);
  $('#filter-theme').addEventListener('change', applyFilters);
  $('#filter-project').addEventListener('change', applyFilters);
  $('#filter-grant').addEventListener('change', applyFilters);

  var searchTimeout;
  $('#filter-search').addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 300);
  });
  ['keydown', 'keypress', 'keyup'].forEach(function(evt) {
    $('#filter-search').addEventListener(evt, function(e) {
      e.stopPropagation();
      if (e.type === 'keydown' && (e.key === 'Enter' || e.keyCode === 13)) {
        e.preventDefault();
        clearTimeout(searchTimeout);
        applyFilters();
      }
    });
  });
  $('#btn-reset').addEventListener('click', function() {
    $('#filter-status').value = '';
    $('#filter-ngo').value = '';
    $('#filter-theme').value = '';
    $('#filter-project').value = '';
    $('#filter-grant').value = '';
    $('#filter-search').value = '';
    $$('.kpi-card').forEach(function(c) { c.classList.remove('kpi-active'); });
    applyFilters();
  });

  // ── View toggle: grid = this hub, list = native Frappe list ──
  $('#btn-list').addEventListener('click', function() {
    window.location.href = '/app/story-of-change';
  });

  // ── Clickable KPIs — each maps to a workflow status ──
  var kpiMap = {
    'kpi-draft': 'Draft',
    'kpi-submitted': 'Submitted',
    'kpi-approved': 'Approved',
    'kpi-featured': 'Featured'
  };
  Object.keys(kpiMap).forEach(function(id) {
    $('#' + id).addEventListener('click', function() {
      var val = kpiMap[id];
      var statusSel = $('#filter-status');
      // Toggle: click again to clear
      statusSel.value = (statusSel.value === val) ? '' : val;
      $$('.kpi-card').forEach(function(c) { c.classList.remove('kpi-active'); });
      if (statusSel.value) {
        $('#' + id).classList.add('kpi-active');
      }
      applyFilters();
    });
  });

  // ── Carousel navigation + autoplay ──
  var autoplayTimer = null;

  $('#carousel-prev').addEventListener('click', function() { slideCarousel(-1); });
  $('#carousel-next').addEventListener('click', function() { slideCarousel(1); });

  // Pause autoplay on hover, resume on leave
  $('#carousel-wrap').addEventListener('mouseenter', function() { stopAutoplay(); });
  $('#carousel-wrap').addEventListener('mouseleave', function() { startAutoplay(); });

  function slideCarousel(dir) {
    var slides = $$('.carousel-slide');
    if (!slides.length) return;
    currentSlide = (currentSlide + dir + slides.length) % slides.length;
    updateCarouselPosition();
  }

  function startAutoplay() {
    stopAutoplay();
    var slides = $$('.carousel-slide');
    if (slides.length > 1) {
      autoplayTimer = setInterval(function() { slideCarousel(1); }, 5000);
    }
  }

  function stopAutoplay() {
    if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
  }

  function goToSlide(i) {
    currentSlide = i;
    updateCarouselPosition();
  }

  function updateCarouselPosition() {
    var track = $('#carousel-track');
    if (track) track.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
    $$('.carousel-dot').forEach(function(d, idx) {
      d.classList.toggle('dot-active', idx === currentSlide);
    });
  }

  // ── Utilities ──
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

  // ── Carousel rendering ──
  function renderCarousel(featured) {
    var section = $('#carousel-section');
    var track = $('#carousel-track');
    var dots = $('#carousel-dots');

    if (!featured || featured.length === 0) {
      section.style.display = 'none';
      stopAutoplay();
      return;
    }
    section.style.display = '';
    track.innerHTML = '';
    dots.innerHTML = '';

    var icons = ['\u{1F4D6}', '\u{1F331}', '\u{2728}', '\u{1F3AF}', '\u{1F4A1}', '\u{1F30D}'];

    featured.forEach(function(s, i) {
      var imageHtml = '';
      if (s.cover_image) {
        imageHtml = '<img src="' + s.cover_image + '" alt="" />';
      } else {
        var icon = icons[Math.abs(s.name.charCodeAt(s.name.length-1)) % icons.length];
        imageHtml = '<span style="font-size:48px;">' + icon + '</span>';
      }

      var narrativePreview = stripHtml(s.narrative || '');
      var excerptHtml = narrativePreview ?
        '<p class="carousel-slide-excerpt">' + narrativePreview + '</p>' : '';

      var slide = document.createElement('div');
      slide.className = 'carousel-slide';
      slide.innerHTML =
        '<div class="carousel-slide-image">' + imageHtml + '</div>' +
        '<div class="carousel-slide-body">' +
          '<span class="carousel-slide-badge">Featured</span>' +
          '<h3 class="carousel-slide-title">' + (s.title || 'Untitled Story') + '</h3>' +
          '<p class="carousel-slide-ngo">' + (s.ngo_name || '') + '</p>' +
          (s.grant_name ? '<p class="carousel-slide-grant">' + s.grant_name + '</p>' : '') +
          excerptHtml +
        '</div>';
      slide.addEventListener('click', function() { goToStory(s.name); });
      track.appendChild(slide);

      var dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' dot-active' : '');
      dot.addEventListener('click', function() { goToSlide(i); });
      dots.appendChild(dot);
    });

    // Hide nav if only 1 slide
    $('#carousel-prev').style.display = featured.length <= 1 ? 'none' : '';
    $('#carousel-next').style.display = featured.length <= 1 ? 'none' : '';
    if (featured.length <= 1) dots.style.display = 'none';
    else dots.style.display = '';

    currentSlide = 0;
    updateCarouselPosition();
    startAutoplay();
  }

  // ── Grid rendering ──
  function renderStories(stories, featured) {
    var grid = $('#stories-grid');
    var gridLabel = $('#grid-label');
    grid.innerHTML = '';

    // Filter out featured from grid (they're in the carousel)
    var featuredNames = {};
    (featured || []).forEach(function(f) { featuredNames[f.name] = true; });
    var gridStories = stories.filter(function(s) { return !featuredNames[s.name]; });

    if (gridStories.length === 0 && (!featured || featured.length === 0)) {
      grid.style.display = 'none';
      gridLabel.style.display = 'none';
      $('#empty-state').style.display = 'block';
      return;
    }
    grid.style.display = '';
    gridLabel.style.display = (featured && featured.length > 0) ? '' : 'none';
    $('#empty-state').style.display = 'none';

    var icons = ['\u{1F4D6}', '\u{1F331}', '\u{2728}', '\u{1F3AF}', '\u{1F4A1}', '\u{1F30D}'];

    gridStories.forEach(function(s) {
      var card = document.createElement('div');
      card.className = 'story-card';

      var imageInner = '';
      if (s.cover_image) {
        imageInner = '<div class="card-image"><img src="' + s.cover_image + '" alt="" /></div>';
      } else {
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

  // ── Trigram fuzzy matching ──
  function trigrams(str) {
    var t = {};
    var s = '  ' + str.toLowerCase().replace(/\s+/g, ' ').trim() + '  ';
    for (var i = 0; i < s.length - 2; i++) t[s.substr(i, 3)] = true;
    return t;
  }

  function similarity(a, b) {
    if (!a || !b) return 0;
    var tA = trigrams(a), tB = trigrams(b);
    var shared = 0, total = 0;
    for (var k in tA) { total++; if (tB[k]) shared++; }
    for (var k in tB) { if (!tA[k]) total++; }
    return total ? shared / total : 0;
  }

  var FUZZY_THRESHOLD = 0.4;

  function fuzzyMatchFields(word, fieldValues) {
    return fieldValues.some(function(val) {
      if (!val) return false;
      var parts = val.toLowerCase().split(/\s+/);
      return parts.some(function(part) {
        return similarity(word, part) > FUZZY_THRESHOLD;
      });
    });
  }

  // ── Filter + render pipeline ──
  function applyFilters() {
    var status = $('#filter-status').value;
    var ngo = $('#filter-ngo').value;
    var theme = $('#filter-theme').value;
    var project = $('#filter-project').value;
    var grant = $('#filter-grant').value;
    var search = ($('#filter-search').value || '').toLowerCase().trim();
    var hasFilter = status || ngo || theme || project || grant || search;
    $('#btn-reset').style.display = hasFilter ? '' : 'none';

    var filtered = allStories.filter(function(s) {
      if (status && s.status !== status) return false;
      if (ngo && s.ngo_name !== ngo) return false;
      if (theme && (s.theme_name || s.theme) !== theme) return false;
      if (project && (s.project_name || '') !== project) return false;
      if (grant && s.grant_name !== grant) return false;
      if (search) {
        var searchableFields = [
          s.title, s.ngo_name, s.grant_name, s.theme_name, s.theme,
          s.state, s.district, s.name, s.project_name, s.donor_name
        ];
        var hay = searchableFields.concat([stripHtml(s.narrative || '')])
          .filter(Boolean).join(' ').toLowerCase();
        var words = search.split(/\s+/);
        var match = words.every(function(word) {
          if (hay.indexOf(word) !== -1) return true;
          return fuzzyMatchFields(word, searchableFields.filter(Boolean));
        });
        if (!match) return false;
      }
      return true;
    });

    // Split featured from rest
    var featured = filtered.filter(function(s) { return s.status === 'Featured'; });
    var rest = filtered;

    renderCarousel(featured);
    renderStories(rest, featured);
    updateKPIs(filtered);
  }

  // ── KPIs: now reactive to filtered set (#2, #6) ──
  function updateKPIs(stories) {
    var list = stories || allStories;
    var counts = { Draft: 0, Submitted: 0, Approved: 0, Featured: 0 };
    list.forEach(function(s) {
      if (counts.hasOwnProperty(s.status)) counts[s.status]++;
    });
    $('#kpi-draft .kpi-value').textContent = counts.Draft;
    $('#kpi-submitted .kpi-value').textContent = counts.Submitted;
    $('#kpi-approved .kpi-value').textContent = counts.Approved;
    $('#kpi-featured .kpi-value').textContent = counts.Featured;
  }

  // ── Populate filter dropdowns ──
  function populateFilterOptions() {
    var ngos = {}, themes = {}, projects = {}, grants = {};
    allStories.forEach(function(s) {
      if (s.ngo_name) ngos[s.ngo_name] = true;
      var tn = s.theme_name || s.theme;
      if (tn) themes[tn] = true;
      if (s.project_name) projects[s.project_name] = true;
      if (s.grant_name) grants[s.grant_name] = true;
    });

    function fillSelect(sel, items) {
      Object.keys(items).sort().forEach(function(v) {
        var opt = document.createElement('option');
        opt.value = v; opt.textContent = v;
        sel.appendChild(opt);
      });
    }

    fillSelect($('#filter-ngo'), ngos);
    fillSelect($('#filter-theme'), themes);
    fillSelect($('#filter-project'), projects);
    fillSelect($('#filter-grant'), grants);
  }

  // ── Main: fetch and render ──
  frappe.call({
    method: 'frappe.client.get_list',
    args: {
      doctype: 'Story of Change',
      fields: ['name', 'title', 'story_date', 'status', 'cover_image',
               'ngo_name', 'grant', 'grant_name', 'narrative', 'theme',
               'theme_name', 'project_name', 'donor_name',
               'state', 'district'],
      filters: [['status', '!=', 'Archived']],
      order_by: 'story_date desc',
      limit_page_length: 100
    },
    async: true,
    callback: function(r) {
      allStories = r.message || [];
      $('#loading-state').style.display = 'none';
      populateFilterOptions();
      applyFilters();
    },
    error: function() {
      $('#loading-state').style.display = 'none';
      $('#empty-state').style.display = 'block';
    }
  });
})();
