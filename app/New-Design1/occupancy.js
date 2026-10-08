/*
 * Parking lots panel: live occupancy, other lots and campus map.
 *
 * Replaces the sidebar widget rendered by fetchapi.js. Live counts come from
 * the same UTRGV endpoint; when it can't be reached (e.g. CORS on localhost)
 * the panel falls back to the snapshot saved with the original page.
 * Lot locations and campus maps come from lots-data.js.
 */
(function () {
  'use strict';

  var DATA = window.UTRGV_PARKING || { campuses: {}, liveLots: {}, otherLots: [] };

  var API_URL = 'https://webapps.utrgv.edu/it/cascaderest/api/parking';
  var FETCH_TIMEOUT_MS = 6000;
  var STORAGE_KEY = 'occ-panel-open';
  var WIDE_PAGE_MIN_WIDTH = 620; // below this a page holds 1x2 cards instead of 2x2

  // Values captured from the saved page (Updated as of 1:06 PM).
  var SNAPSHOT = {
    updated: '1:06 PM',
    lots: [
      { location_name: 'Lot  E21', free_spaces: 0, total_spaces: 245 },
      { location_name: 'Lot  E26', free_spaces: 184, total_spaces: 320 },
      { location_name: 'LOT E16 -North and South', free_spaces: 213, total_spaces: 885 },
      { location_name: 'LOT E19-North and South', free_spaces: 0, total_spaces: 687 },
      { location_name: 'Lot E32', free_spaces: 0, total_spaces: 496 },
      { location_name: 'Lot E9', free_spaces: 140, total_spaces: 741 },
      { location_name: 'Lot H2', free_spaces: 197, total_spaces: 252 }
    ]
  };

  // Lots the original stylesheet hid (.lotb1-wrapper { display: none }).
  var HIDDEN_LOTS = ['B1'];

  var STATUS_LABELS = {
    available: 'Available',
    busy: 'Filling up',
    full: 'Full',
    maintenance: 'Closed'
  };

  var ICON_EXTERNAL = '<svg class="occ-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">' +
    '<path d="M14 5h5v5M19 5l-8 8M17 14v5H5V7h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_PIN = '<svg class="occ-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">' +
    '<path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>' +
    '<circle cx="12" cy="10" r="2.2" fill="currentColor"/></svg>';

  var state = {
    lots: [],
    live: false,
    updated: '',
    sort: 'open',
    hideFull: false,
    pageSize: 4,
    page: 0,
    otherCampus: 'all',
    mapCampus: null
  };

  var els = {};
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- helpers ---------- */

  function $(id) { return document.getElementById(id); }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatTime(date) {
    return new Intl.DateTimeFormat('en-US', { timeStyle: 'short' }).format(date);
  }

  function campusOf(key) {
    return DATA.campuses[key] || null;
  }

  function directionsUrl(place) {
    var query = place.lat != null ? place.lat + ',' + place.lng : place.mapQuery;
    return query ? 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(query) : '';
  }

  function campusMapUrl(campus, focus, embed) {
    var url = 'https://www.google.com/maps/d/' + (embed ? 'embed' : 'viewer') + '?mid=' + encodeURIComponent(campus.mapId);
    var point = focus && focus.lat != null ? focus : null;
    if (point) url += '&ll=' + point.lat + ',' + point.lng + '&z=18';
    return url;
  }

  function directionsLink(place, label) {
    var url = directionsUrl(place);
    if (!url) return '';
    return '<a class="occ-action" href="' + esc(url) + '" target="_blank" rel="noopener">' +
      ICON_EXTERNAL + 'Directions<span class="occ-sr"> to ' + esc(label) + ' (Google Maps, opens in a new tab)</span></a>';
  }

  function mapButton(campusKey, code, label) {
    if (!campusOf(campusKey)) return '';
    return '<button type="button" class="occ-action" data-map-campus="' + esc(campusKey) + '"' +
      (code ? ' data-map-lot="' + esc(code) + '"' : '') + '>' +
      ICON_PIN + 'Show on map<span class="occ-sr">: ' + esc(label) + '</span></button>';
  }

  /* ---------- live data ---------- */

  function statusFor(free, total) {
    if (total === 0) return 'maintenance';
    if (free <= 0) return 'full';
    if ((total - free) / total >= 0.75) return 'busy';
    return 'available';
  }

  function normalize(raw, fallbackUpdated) {
    var name = String(raw.location_name || '').replace(/\s+/g, ' ').trim();
    var match = name.match(/lot\s*([a-z]+\d+)\s*-?\s*(.*)$/i);
    var code = match ? match[1].toUpperCase() : name;
    var section = match ? match[2].replace(/\band\b/i, '&').trim() : '';
    var total = Number(raw.total_spaces) || 0;
    var free = Math.max(0, Number(raw.free_spaces) || 0);
    var meta = DATA.liveLots[code] || {};

    var updated = fallbackUpdated;
    if (raw.date_time) {
      var date = new Date(raw.date_time);
      // The API reports an hour ahead; fetchapi.js applies the same correction.
      date.setHours(date.getHours() - 1);
      if (!isNaN(date)) updated = formatTime(date);
    }

    return {
      code: code,
      section: section,
      campus: meta.campus || '',
      location: meta.location || '',
      mapQuery: meta.mapQuery || '',
      lat: meta.lat != null ? meta.lat : null,
      lng: meta.lng != null ? meta.lng : null,
      free: free,
      total: total,
      occupancy: total ? Math.round((total - free) / total * 100) : 0,
      status: statusFor(free, total),
      updated: updated
    };
  }

  function prepare(rawLots, fallbackUpdated) {
    return rawLots
      .map(function (lot) { return normalize(lot, fallbackUpdated); })
      .filter(function (lot) { return HIDDEN_LOTS.indexOf(lot.code) === -1; });
  }

  function fetchLive() {
    var controller = 'AbortController' in window ? new AbortController() : null;
    var timer = controller && setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT_MS);
    return fetch(API_URL, controller ? { signal: controller.signal } : undefined)
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        if (!Array.isArray(data) || !data.length) throw new Error('Empty response');
        return data;
      })
      .finally(function () { clearTimeout(timer); });
  }

  /* ---------- trigger + disclosure ---------- */

  function renderTrigger() {
    var open = 0;
    var withRoom = 0;
    state.lots.forEach(function (lot) {
      open += lot.free;
      if (lot.status === 'available' || lot.status === 'busy') withRoom++;
    });
    var source = state.live ? 'Live, updated ' + state.updated : 'Snapshot from ' + state.updated;
    // Each phrase stays on one line so the text only wraps between phrases.
    els.triggerStats.innerHTML = '<span>' + esc(open.toLocaleString('en-US') + ' spaces open in ' + withRoom +
      ' of ' + state.lots.length + ' lots') + '</span> · <span>' + esc(source) + '</span>';
    els.trigger.classList.toggle('is-live', state.live);
  }

  function setOpen(isOpen, save) {
    els.region.hidden = !isOpen;
    els.trigger.setAttribute('aria-expanded', String(isOpen));
    els.ctaLabel.textContent = isOpen ? 'Hide lots' : 'View lots';
    if (save) {
      try { localStorage.setItem(STORAGE_KEY, isOpen ? '1' : '0'); } catch (e) { /* storage unavailable */ }
    }
    if (isOpen) refreshPageSize();
  }

  function readOpenState() {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return false; }
  }

  /* ---------- tabs (WAI-ARIA tabs pattern, automatic activation) ---------- */

  function selectTab(tab, moveFocus) {
    els.tabs.forEach(function (t) {
      var selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
      $(t.getAttribute('aria-controls')).hidden = !selected;
    });
    if (moveFocus) tab.focus();
    if (tab === els.tabLive) refreshPageSize();
    if (tab === els.tabMap && !state.mapCampus) showMap(firstMapCampus(), null);
  }

  /*
   * The site's tabs-accessible.js binds click/keydown/keyup to every
   * [role="tab"] on the page, which would move focus twice and hide unrelated
   * panels. These listeners run in the capture phase on the tablist and stop
   * the events there, so only this widget handles its own tabs.
   */
  function onTablistEvent(e) {
    var tab = e.target.closest('[role="tab"]');
    if (!tab || els.tabs.indexOf(tab) === -1) return;
    e.stopPropagation();

    if (e.type === 'click') {
      selectTab(tab, false);
      return;
    }
    if (e.type !== 'keydown') return;

    var i = els.tabs.indexOf(tab);
    var next = null;
    if (e.key === 'ArrowRight') next = els.tabs[(i + 1) % els.tabs.length];
    else if (e.key === 'ArrowLeft') next = els.tabs[(i - 1 + els.tabs.length) % els.tabs.length];
    else if (e.key === 'Home') next = els.tabs[0];
    else if (e.key === 'End') next = els.tabs[els.tabs.length - 1];
    if (next) {
      e.preventDefault();
      selectTab(next, true);
    }
  }

  /* ---------- live occupancy pages ---------- */

  function sortedVisibleLots() {
    var lots = state.lots.slice();
    var byCode = function (a, b) {
      return a.code.localeCompare(b.code, 'en', { numeric: true });
    };
    if (state.sort === 'open') {
      lots.sort(function (a, b) { return b.free - a.free || byCode(a, b); });
    } else if (state.sort === 'occupancy') {
      lots.sort(function (a, b) {
        // Lots under maintenance have no meaningful occupancy; keep them last.
        var ao = a.total ? a.occupancy : 101;
        var bo = b.total ? b.occupancy : 101;
        return ao - bo || byCode(a, b);
      });
    } else {
      lots.sort(byCode);
    }
    return lots.filter(function (lot) { return !(state.hideFull && lot.status === 'full'); });
  }

  function liveCardHtml(lot) {
    var label = 'Lot ' + lot.code;
    var campus = campusOf(lot.campus);
    var meta = [];
    if (campus) meta.push(campus.name);
    meta.push('Zone 2');
    if (lot.section) meta.push(lot.section);

    var stats = lot.total
      ? '<p class="occ-count"><strong>' + lot.free + '</strong> of ' + lot.total + ' open</p>' +
        '<p class="occ-pct">' + lot.occupancy + '% full</p>'
      : '<p class="occ-count">Under maintenance</p>';

    return '<li class="occ-card is-' + lot.status + '">' +
      '<div class="occ-card-top">' +
        '<h3 class="occ-card-title"><span class="occ-lot-prefix">Lot</span> ' + esc(lot.code) + '</h3>' +
        '<span class="occ-badge">' + STATUS_LABELS[lot.status] + '</span>' +
      '</div>' +
      '<p class="occ-place">' + esc(lot.location || label) + '</p>' +
      '<p class="occ-meta">' + esc(meta.join(' · ')) + '</p>' +
      '<div class="occ-stats">' + stats + '</div>' +
      '<div class="occ-bar" aria-hidden="true"><span style="width:' + (lot.total ? lot.occupancy : 0) + '%"></span></div>' +
      '<div class="occ-card-foot">' +
        '<span class="occ-updated">Updated ' + esc(lot.updated) + '</span>' +
        '<span class="occ-actions">' + directionsLink(lot, label) + mapButton(lot.campus, lot.code, label) + '</span>' +
      '</div>' +
    '</li>';
  }

  function renderPages() {
    var lots = sortedVisibleLots();
    var size = state.pageSize;
    var pageCount = Math.max(1, Math.ceil(lots.length / size));
    var html = '';

    if (!lots.length) {
      html = '<p class="occ-empty">Every lot with a live count is full right now. ' +
        'Try the <strong>Other parking lots</strong> tab.</p>';
    }
    for (var p = 0; p < pageCount && lots.length; p++) {
      var slice = lots.slice(p * size, p * size + size);
      var first = p * size + 1;
      var last = p * size + slice.length;
      html += '<ul class="occ-page occ-page--' + size + '" aria-label="Lots ' + first + ' to ' + last + ' of ' + lots.length + '">' +
        slice.map(liveCardHtml).join('') + '</ul>';
    }

    els.pages.innerHTML = html;
    els.pages.scrollLeft = 0;
    state.pageCount = lots.length ? pageCount : 0;
    state.visibleCount = lots.length;
    state.page = 0;

    els.dots.innerHTML = '';
    for (var d = 0; d < state.pageCount; d++) {
      els.dots.insertAdjacentHTML('beforeend',
        '<button type="button" class="occ-dot-btn" data-page="' + d + '" aria-controls="occ-pages">' +
        '<span class="occ-sr">Page ' + (d + 1) + ' of ' + state.pageCount + '</span></button>');
    }
    els.pager.hidden = state.pageCount <= 1;
    updatePager(false);
  }

  function updatePager(announce) {
    var count = state.pageCount;
    var page = state.page;
    els.prev.disabled = page <= 0;
    els.next.disabled = page >= count - 1;
    Array.prototype.forEach.call(els.dots.children, function (dot, i) {
      if (i === page) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    var first = page * state.pageSize + 1;
    var last = Math.min(state.visibleCount, first + state.pageSize - 1);
    var text = count ? 'Lots ' + first + '–' + last + ' of ' + state.visibleCount : '';
    els.pageStatus.textContent = text;
    // Announce page changes (buttons, dots, swipes) but not re-renders.
    els.announcer.textContent = announce ? 'Showing ' + text.toLowerCase() : '';
  }

  function goToPage(page) {
    var target = Math.max(0, Math.min(state.pageCount - 1, page));
    els.pages.scrollTo({ left: target * els.pages.clientWidth, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    setPage(target);
  }

  function setPage(page) {
    if (page === state.page) return;
    state.page = page;
    updatePager(true);
  }

  var scrollTimer = null;
  function onPagesScroll() {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () {
      var width = els.pages.clientWidth || 1;
      setPage(Math.round(els.pages.scrollLeft / width));
    }, 80);
  }

  function refreshPageSize() {
    if (els.region.hidden || els.panelLive.hidden) return;
    var size = els.pages.clientWidth >= WIDE_PAGE_MIN_WIDTH ? 4 : 2;
    if (size !== state.pageSize) {
      state.pageSize = size;
      renderPages();
    }
  }

  /* ---------- other lots ---------- */

  function otherCampusKeys() {
    return Object.keys(DATA.campuses);
  }

  function renderOtherCampusFilter() {
    var options = '<option value="all">All campuses</option>' + otherCampusKeys().map(function (key) {
      return '<option value="' + esc(key) + '">' + esc(DATA.campuses[key].name) + '</option>';
    }).join('');
    els.otherCampus.innerHTML = options;
    els.otherCampus.value = state.otherCampus;
  }

  function otherLotLabel(lot) {
    return lot.name || 'Lot ' + lot.code;
  }

  function otherCardHtml(lot) {
    var label = otherLotLabel(lot);
    var meta = [];
    if (lot.zone) meta.push(lot.zone);
    if (lot.features && lot.features.length) meta = meta.concat(lot.features);
    var title = lot.code
      ? '<span class="occ-lot-prefix">Lot</span> ' + esc(lot.code)
      : esc(lot.name);
    var details = lot.infoUrl
      ? '<a class="occ-action" href="' + esc(lot.infoUrl) + '">Details<span class="occ-sr"> about ' + esc(label) + '</span></a>'
      : '';
    return '<li class="occ-other-card">' +
      '<h4 class="occ-card-title' + (lot.code ? '' : ' occ-card-title--name') + '">' + title + '</h4>' +
      (lot.location
        ? '<p class="occ-place">' + esc(lot.location) + '</p>'
        : '<p class="occ-place occ-place--unknown">Location: see the campus parking map</p>') +
      (meta.length ? '<p class="occ-meta">' + esc(meta.join(' · ')) + '</p>' : '') +
      '<div class="occ-actions">' +
        // Directions only where a source says where the lot is.
        directionsLink(lot, label) +
        mapButton(lot.campus, lot.code || '', label) +
        details +
      '</div>' +
    '</li>';
  }

  function renderOtherLots() {
    var liveCodes = state.lots.map(function (lot) { return lot.code; });
    var others = (DATA.otherLots || []).filter(function (lot) {
      return !lot.code || liveCodes.indexOf(lot.code) === -1;
    });
    $('occ-count-other').textContent = others.length ? '(' + others.length + ')' : '';

    var keys = state.otherCampus === 'all' ? otherCampusKeys() : [state.otherCampus];
    els.otherList.innerHTML = keys.map(function (key) {
      var campus = DATA.campuses[key];
      var lots = others
        .filter(function (lot) { return lot.campus === key; })
        .sort(function (a, b) {
          // Lettered lots first in natural order (E2 before E10), then named sites.
          if (!a.code || !b.code) return a.code ? -1 : b.code ? 1 : otherLotLabel(a).localeCompare(otherLotLabel(b));
          return a.code.localeCompare(b.code, 'en', { numeric: true });
        });
      var headingId = 'occ-campus-' + key;
      var body = lots.length
        ? '<ul class="occ-other-grid">' + lots.map(otherCardHtml).join('') + '</ul>'
        : '<p class="occ-other-empty">Lot-by-lot details aren&rsquo;t listed for this campus yet. ' +
          'Every lot is drawn on the campus parking map.</p>';
      return '<section class="occ-campus-group" aria-labelledby="' + headingId + '">' +
        '<div class="occ-campus-head">' +
          '<h3 class="occ-campus-title" id="' + headingId + '">' + esc(campus.name) + ' Campus</h3>' +
          '<div class="occ-actions">' +
            directionsLink(campus, campus.name + ' Campus') +
            mapButton(key, '', campus.name + ' Campus parking map') +
          '</div>' +
        '</div>' + body +
      '</section>';
    }).join('');
  }

  /* ---------- campus map ---------- */

  function firstMapCampus() {
    return otherCampusKeys()[0];
  }

  function findLot(code) {
    if (!code) return null;
    var live = state.lots.filter(function (lot) { return lot.code === code; })[0];
    if (live) return live;
    return (DATA.otherLots || []).filter(function (lot) { return lot.code === code; })[0] || null;
  }

  function renderMapCampuses() {
    els.mapCampuses.innerHTML = otherCampusKeys().map(function (key) {
      return '<label class="occ-campus-option"><input type="radio" name="occ-map-campus" value="' + esc(key) + '"> ' +
        esc(DATA.campuses[key].name) + '</label>';
    }).join('');
  }

  function showMap(campusKey, lot) {
    var campus = campusOf(campusKey);
    if (!campus) return;
    state.mapCampus = campusKey;

    Array.prototype.forEach.call(els.mapCampuses.querySelectorAll('input'), function (input) {
      input.checked = input.value === campusKey;
    });

    var title = campus.name + ' campus parking map';
    var src = campusMapUrl(campus, lot || campus, true);
    var frame = els.mapFrame.querySelector('iframe');
    if (!frame) {
      frame = document.createElement('iframe');
      frame.setAttribute('loading', 'lazy');
      frame.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      frame.setAttribute('allowfullscreen', '');
      els.mapFrame.appendChild(frame);
    }
    frame.title = title + ' (Google My Maps)';
    if (frame.getAttribute('src') !== src) frame.setAttribute('src', src);

    var focusText = 'Showing the ' + title + '.';
    if (lot) {
      focusText = lot.lat != null
        ? 'Showing the ' + title + ', centred on Lot ' + lot.code + '.'
        : 'Showing the ' + title + '. Look for Lot ' + lot.code +
          (lot.location ? ' (' + lot.location + ')' : '') + '.';
    }
    els.mapFocus.textContent = focusText;

    els.mapAlt.innerHTML = 'Map from UTRGV Parking &amp; Transportation (Google My Maps). ' +
      '<a href="' + esc(campusMapUrl(campus, lot || campus, false)) + '" target="_blank" rel="noopener">' +
      'Open the ' + esc(campus.name) + ' map in a new tab</a>. ' +
      'The <strong>Live occupancy</strong> and <strong>Other parking lots</strong> tabs list the same lots as text, with directions.';
  }

  function onMapButton(e) {
    var btn = e.target.closest('[data-map-campus]');
    if (!btn) return;
    var lot = findLot(btn.getAttribute('data-map-lot'));
    selectTab(els.tabMap, false);
    showMap(btn.getAttribute('data-map-campus'), lot);
    // Move keyboard/screen-reader focus to the map's description.
    els.mapFocus.focus();
  }

  /* ---------- wiring ---------- */

  function setLots(lots, live, updated, note) {
    state.lots = lots;
    state.live = live;
    state.updated = updated || (lots[0] && lots[0].updated) || '';
    $('occ-count-live').textContent = '(' + lots.length + ')';
    renderTrigger();
    renderPages();
    renderOtherLots();
    els.note.textContent = note;
  }

  function init() {
    els.trigger = $('occ-trigger');
    els.region = $('occ-region');
    if (!els.trigger || !els.region) return;

    els.triggerStats = els.trigger.querySelector('.occ-trigger-stats');
    els.ctaLabel = els.trigger.querySelector('.occ-cta-label');
    els.note = $('occ-note');
    els.tabLive = $('occ-tab-live');
    els.tabOther = $('occ-tab-other');
    els.tabMap = $('occ-tab-map');
    els.tabs = [els.tabLive, els.tabOther, els.tabMap];
    els.panelLive = $('occ-panel-live');
    els.pages = $('occ-pages');
    els.pager = $('occ-pager');
    els.prev = $('occ-prev');
    els.next = $('occ-next');
    els.dots = $('occ-dots');
    els.pageStatus = $('occ-page-status');
    els.announcer = $('occ-announcer');
    els.otherCampus = $('occ-other-campus');
    els.otherList = $('occ-other-list');
    els.mapCampuses = $('occ-map-campuses');
    els.mapFocus = $('occ-map-focus');
    els.mapFrame = $('occ-map-frame');
    els.mapAlt = $('occ-map-alt');
    els.mapFocus.tabIndex = -1;

    els.trigger.addEventListener('click', function () {
      setOpen(els.region.hidden, true);
    });

    var tablist = els.tabLive.parentNode;
    ['click', 'keydown', 'keyup'].forEach(function (type) {
      tablist.addEventListener(type, onTablistEvent, true);
    });

    $('occ-sort').addEventListener('change', function (e) {
      state.sort = e.target.value;
      renderPages();
    });
    $('occ-hide-full').addEventListener('change', function (e) {
      state.hideFull = e.target.checked;
      renderPages();
    });
    els.prev.addEventListener('click', function () { goToPage(state.page - 1); });
    els.next.addEventListener('click', function () { goToPage(state.page + 1); });
    els.dots.addEventListener('click', function (e) {
      var dot = e.target.closest('[data-page]');
      if (dot) goToPage(Number(dot.getAttribute('data-page')));
    });
    els.pages.addEventListener('scroll', onPagesScroll, { passive: true });

    els.otherCampus.addEventListener('change', function (e) {
      state.otherCampus = e.target.value;
      renderOtherLots();
    });
    els.mapCampuses.addEventListener('change', function (e) {
      if (e.target.name === 'occ-map-campus') showMap(e.target.value, null);
    });
    els.region.addEventListener('click', onMapButton);

    if ('ResizeObserver' in window) {
      new ResizeObserver(refreshPageSize).observe(els.pages);
    } else {
      window.addEventListener('resize', refreshPageSize);
    }

    renderOtherCampusFilter();
    renderMapCampuses();
    setLots(prepare(SNAPSHOT.lots, SNAPSHOT.updated), false, SNAPSHOT.updated,
      'Checking for live data… showing the saved ' + SNAPSHOT.updated + ' snapshot for now.');
    setOpen(readOpenState(), false);

    fetchLive()
      .then(function (data) {
        var lots = prepare(data, '');
        setLots(lots, true, lots[0] && lots[0].updated, 'Live data from UTRGV Parking Services.');
      })
      .catch(function () {
        els.note.textContent = 'Live data is unavailable here, so the counts are the saved ' +
          SNAPSHOT.updated + ' snapshot.';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
