/*
 * Parking lots panel: live occupancy, other lots and campus map.
 *
 * Replaces the sidebar widget rendered by fetchapi.js. Live counts come from
 * the same UTRGV endpoint. If it can't be reached, the panel says so and still
 * offers each lot's directions and map; only when the page is opened locally
 * (where the endpoint is always blocked) does it show the counts saved with the
 * original page, labelled as a snapshot.
 * Lot locations and campus maps come from lots-data.js.
 */
(function () {
  'use strict';

  var SRC = window.UTRGV_PARKING || {};
  var DATA = {
    campuses: SRC.campuses && typeof SRC.campuses === 'object' ? SRC.campuses : {},
    liveLots: SRC.liveLots && typeof SRC.liveLots === 'object' ? SRC.liveLots : {},
    otherLots: Array.isArray(SRC.otherLots) ? SRC.otherLots : []
  };

  var API_URL = 'https://webapps.utrgv.edu/it/cascaderest/api/parking';
  var FETCH_TIMEOUT_MS = 6000;
  var WIDE_PAGE_MIN_WIDTH = 620; // below this a page holds 1x2 cards instead of 2x2
  var IS_LOCAL = location.protocol === 'file:' ||
    /^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(location.hostname);

  // Counts shown on the saved copy of the original page (Oct 8, 2026).
  var SNAPSHOT = {
    label: 'Oct 8, 2026, 1:06 PM',
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

  // Lot-code prefix -> campus, for lots the data file doesn't describe yet.
  var CAMPUS_BY_PREFIX = { E: 'edinburg', B: 'brownsville', H: 'harlingen' };

  var STATUS_LABELS = {
    available: 'Available',
    busy: 'Filling up',
    full: 'Full',
    maintenance: 'Closed',
    unknown: 'No count'
  };

  var SORT_LABELS = {
    open: 'most open spaces',
    occupancy: 'least full',
    name: 'lot name'
  };

  var ICON_EXTERNAL = '<svg class="occ-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">' +
    '<path d="M14 5h5v5M19 5l-8 8M17 14v5H5V7h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_PIN = '<svg class="occ-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">' +
    '<path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>' +
    '<circle cx="12" cy="10" r="2.2" fill="currentColor"/></svg>';

  var state = {
    mode: 'loading', // loading | live | snapshot | unavailable
    lots: [],
    updated: '',
    sort: 'open',
    hideFull: false,
    pageSize: 4,
    page: 0,
    pageCount: 0,
    visibleCount: 0,
    otherCampus: 'all',
    mapCampus: null
  };

  var els = {};
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

  /* ---------- helpers ---------- */

  function $(id) { return document.getElementById(id); }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : many);
  }

  function safeId(key) {
    return String(key).replace(/[^a-z0-9_-]/gi, '-');
  }

  function formatTime(date) {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
  }

  function coord(value) {
    var n = Number(value);
    return value != null && value !== '' && isFinite(n) ? n : null;
  }

  function campusOf(key) {
    var campus = DATA.campuses[key];
    return campus && campus.name && campus.mapId ? campus : null;
  }

  function campusKeys() {
    return Object.keys(DATA.campuses).filter(campusOf);
  }

  function point(place) {
    var lat = coord(place && place.lat);
    var lng = coord(place && place.lng);
    return lat != null && lng != null ? lat + ',' + lng : null;
  }

  function directionsUrl(place) {
    var query = point(place) || place.mapQuery;
    return query ? 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(query) : '';
  }

  function campusMapUrl(campus, focus, embed) {
    var url = 'https://www.google.com/maps/d/' + (embed ? 'embed' : 'viewer') + '?mid=' + encodeURIComponent(campus.mapId);
    var at = point(focus);
    if (at) url += '&ll=' + at + '&z=18';
    return url;
  }

  function directionsLink(place, key, label) {
    var url = directionsUrl(place);
    if (!url) return '';
    return '<a class="occ-action" href="' + esc(url) + '" target="_blank" rel="noopener"' +
      ' data-lot="' + esc(key) + '" data-action="directions">' +
      ICON_EXTERNAL + 'Directions<span class="occ-sr"> to ' + esc(label) + ' (Google Maps, opens in a new tab)</span></a>';
  }

  function mapButton(campusKey, key, label) {
    if (!campusOf(campusKey)) return '';
    return '<button type="button" class="occ-action" data-map-campus="' + esc(campusKey) + '"' +
      (key ? ' data-lot="' + esc(key) + '"' : '') + ' data-action="map">' +
      ICON_PIN + 'Show on map<span class="occ-sr">: ' + esc(label) + '</span></button>';
  }

  /* ---------- live data ---------- */

  function statusFor(free, total, occupancy) {
    if (total === 0) return 'maintenance';
    if (free <= 0) return 'full';
    if (occupancy >= 75) return 'busy';
    return 'available';
  }

  function normalize(raw, fallbackUpdated) {
    var name = String(raw.location_name).replace(/\s+/g, ' ').trim();
    var match = name.match(/^lot\s*([a-z]+\d+)\s*-?\s*(.*)$/i);
    var code = match ? match[1].toUpperCase() : null;
    var meta = (code && DATA.liveLots[code]) || {};
    var total = Math.max(0, Number(raw.total_spaces) || 0);
    // Sensors can over-count; keep the open count within the lot's capacity.
    var free = Math.min(total, Math.max(0, Number(raw.free_spaces) || 0));
    var occupancy = total ? Math.floor((total - free) / total * 100) : 0;

    var updated = fallbackUpdated;
    if (raw.date_time) {
      var date = new Date(raw.date_time);
      // The API reports an hour ahead; fetchapi.js applies the same correction.
      date.setHours(date.getHours() - 1);
      if (!isNaN(date)) updated = formatTime(date);
    }

    return {
      key: code || name,
      code: code,
      title: code ? null : name,
      section: match ? match[2].replace(/\band\b/i, '&').trim() : '',
      campus: meta.campus || (code && CAMPUS_BY_PREFIX[code.charAt(0)]) || '',
      location: meta.location || '',
      mapQuery: meta.mapQuery || '',
      lat: meta.lat,
      lng: meta.lng,
      free: free,
      total: total,
      occupancy: occupancy,
      status: statusFor(free, total, occupancy),
      updated: updated
    };
  }

  function prepare(rawLots, fallbackUpdated) {
    return rawLots
      .filter(function (raw) {
        return raw && typeof raw === 'object' && String(raw.location_name || '').trim() &&
          raw.total_spaces !== '' && isFinite(Number(raw.total_spaces));
      })
      .map(function (raw) { return normalize(raw, fallbackUpdated); })
      .filter(function (lot) { return HIDDEN_LOTS.indexOf(lot.code) === -1; });
  }

  // Lots from lots-data.js with no count, used when live data is unavailable.
  function lotsWithoutCounts() {
    return Object.keys(DATA.liveLots)
      .filter(function (code) { return HIDDEN_LOTS.indexOf(code) === -1; })
      .map(function (code) {
        var meta = DATA.liveLots[code];
        return {
          key: code, code: code, title: null, section: '',
          campus: meta.campus || '', location: meta.location || '', mapQuery: meta.mapQuery || '',
          lat: meta.lat, lng: meta.lng,
          free: 0, total: 0, occupancy: 0, status: 'unknown', updated: ''
        };
      });
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
        var lots = Array.isArray(data) ? prepare(data, formatTime(new Date())) : [];
        if (!lots.length) throw new Error('No usable lots in response');
        return lots;
      })
      .finally(function () { clearTimeout(timer); });
  }

  /* ---------- trigger + disclosure ---------- */

  function renderTrigger() {
    var stats;
    var source;
    if (state.mode === 'loading') {
      stats = 'Checking live counts\u2026';
    } else if (state.mode === 'unavailable') {
      stats = 'Live counts unavailable right now';
      source = 'Lot locations still work';
    } else {
      var open = 0;
      var withRoom = 0;
      state.lots.forEach(function (lot) {
        if (lot.status === 'available' || lot.status === 'busy') {
          open += lot.free;
          withRoom++;
        }
      });
      stats = plural(open, 'space', 'spaces').replace(/^(\d+)/, function (n) { return Number(n).toLocaleString('en-US'); }) +
        ' open in ' + withRoom + ' of ' + plural(state.lots.length, 'lot', 'lots');
      source = state.mode === 'live'
        ? 'Live' + (state.updated ? ', updated ' + state.updated : '')
        : 'Saved snapshot, ' + SNAPSHOT.label;
    }
    // The dot and separator sit inside the no-wrap phrases so lines only break between phrases.
    els.triggerStats.innerHTML = '<span><span class="occ-source-dot" aria-hidden="true"></span>' + esc(stats) + '</span>' +
      (source ? ' <span>\u00b7 ' + esc(source) + '</span>' : '');
    els.trigger.classList.toggle('is-live', state.mode === 'live');
  }

  function setOpen(isOpen) {
    els.region.hidden = !isOpen;
    els.trigger.setAttribute('aria-expanded', String(isOpen));
    els.ctaLabel.textContent = isOpen ? 'Hide lots' : 'View lots';
    if (isOpen) refreshPageSize();
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
    if (tab === els.tabMap && !state.mapCampus) showMap(campusKeys()[0], null);
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

  function byCode(a, b) {
    return a.key.localeCompare(b.key, 'en', { numeric: true });
  }

  function sortedVisibleLots() {
    var lots = state.lots.slice();
    if (state.sort === 'open') {
      lots.sort(function (a, b) { return b.free - a.free || byCode(a, b); });
    } else if (state.sort === 'occupancy') {
      lots.sort(function (a, b) {
        // Lots without a usable count have no meaningful occupancy; keep them last.
        var ao = a.total ? a.occupancy : 101;
        var bo = b.total ? b.occupancy : 101;
        return ao - bo || byCode(a, b);
      });
    } else {
      lots.sort(byCode);
    }
    return lots.filter(function (lot) { return !(state.hideFull && lot.status === 'full'); });
  }

  function lotLabel(lot) {
    return lot.code ? 'Lot ' + lot.code : lot.title;
  }

  function liveCardHtml(lot) {
    var label = lotLabel(lot);
    var campus = campusOf(lot.campus);
    var meta = [];
    if (campus) meta.push(campus.name);
    if (lot.code) meta.push('Zone 2');
    if (lot.section) meta.push(lot.section);

    var stats;
    if (lot.status === 'unknown') stats = '<p class="occ-count">Live count unavailable</p>';
    else if (!lot.total) stats = '<p class="occ-count">Under maintenance</p>';
    else stats = '<p class="occ-count"><strong>' + lot.free + '</strong> of ' + lot.total + ' open</p>' +
      '<p class="occ-pct">' + lot.occupancy + '% full</p>';

    var title = lot.code
      ? '<span class="occ-lot-prefix">Lot</span> ' + esc(lot.code)
      : esc(lot.title);

    return '<li class="occ-card is-' + lot.status + '">' +
      '<div class="occ-card-top">' +
        '<h3 class="occ-card-title' + (lot.code ? '' : ' occ-card-title--name') + '">' + title + '</h3>' +
        '<span class="occ-badge">' + STATUS_LABELS[lot.status] + '</span>' +
      '</div>' +
      '<p class="occ-place">' + esc(lot.location || (lot.code ? 'Location: see the campus parking map' : '')) + '</p>' +
      '<p class="occ-meta">' + esc(meta.join(' \u00b7 ')) + '</p>' +
      '<div class="occ-stats">' + stats + '</div>' +
      '<div class="occ-bar" aria-hidden="true"><span style="width:' + (lot.total ? lot.occupancy : 0) + '%"></span></div>' +
      '<div class="occ-card-foot">' +
        '<span class="occ-updated">' + (lot.updated ? 'Updated ' + esc(lot.updated) : '') + '</span>' +
        '<span class="occ-actions">' +
          directionsLink(lot, lot.key, label) + mapButton(lot.campus, lot.key, label) +
        '</span>' +
      '</div>' +
    '</li>';
  }

  function rangeText(first, last, total) {
    return first === last ? 'Lot ' + first + ' of ' + total : 'Lots ' + first + '\u2013' + last + ' of ' + total;
  }

  function emptyStateHtml() {
    if (state.mode === 'loading') return '<p class="occ-empty">Checking live counts\u2026</p>';
    return '<div class="occ-empty"><p>Every lot with a live count is full right now.</p>' +
      '<p><button type="button" class="occ-action" data-goto-tab="occ-tab-other">See other parking lots</button></p></div>';
  }

  /*
   * Rebuilds the pages. With keepPlace (new data, page-size change) the user
   * stays on the lots they were looking at and keeps keyboard focus; sort and
   * filter changes start again from the first page.
   */
  function renderPages(keepPlace) {
    var lots = sortedVisibleLots();
    var size = state.pageSize;
    var firstIndex = keepPlace ? state.page * (state.lastPageSize || size) : 0;
    var active = document.activeElement;
    var focusKey = null;
    var focusAction = null;
    if (keepPlace && active && els.pages.contains(active)) {
      focusKey = active.getAttribute('data-lot');
      focusAction = active.getAttribute('data-action');
    }

    var pageCount = lots.length ? Math.ceil(lots.length / size) : 0;
    var html = lots.length ? '' : emptyStateHtml();
    for (var p = 0; p < pageCount; p++) {
      var slice = lots.slice(p * size, p * size + size);
      html += '<ul class="occ-page occ-page--' + size + '" aria-label="' +
        rangeText(p * size + 1, p * size + slice.length, lots.length) + '">' +
        slice.map(liveCardHtml).join('') + '</ul>';
    }
    els.pages.innerHTML = html;

    state.pageCount = pageCount;
    state.visibleCount = lots.length;
    state.lastPageSize = size;

    var page = Math.floor(firstIndex / size);
    if (focusKey) {
      var index = lots.map(function (lot) { return lot.key; }).indexOf(focusKey);
      if (index !== -1) page = Math.floor(index / size);
    }
    state.page = Math.max(0, Math.min(page, pageCount - 1));
    scrollTarget = null;
    els.pages.scrollLeft = state.page * els.pages.clientWidth;

    els.dots.innerHTML = '';
    for (var d = 0; d < pageCount; d++) {
      els.dots.insertAdjacentHTML('beforeend',
        '<button type="button" class="occ-dot-btn" data-page="' + d + '" aria-controls="occ-pages">' +
        '<span class="occ-sr">Page ' + (d + 1) + ' of ' + pageCount + '</span></button>');
    }
    els.pager.hidden = pageCount <= 1;
    updatePager();

    if (focusKey) {
      var target = els.pages.querySelector('[data-lot="' + cssEscape(focusKey) + '"][data-action="' + cssEscape(focusAction) + '"]');
      if (target) target.focus({ preventScroll: true });
    }
  }

  function cssEscape(value) {
    return window.CSS && CSS.escape ? CSS.escape(value) : String(value).replace(/["\\]/g, '\\$&');
  }

  function setPagerButton(btn, disabled) {
    // aria-disabled instead of disabled: a disabled button would drop keyboard focus.
    btn.setAttribute('aria-disabled', String(disabled));
  }

  function updatePager() {
    setPagerButton(els.prev, state.page <= 0);
    setPagerButton(els.next, state.page >= state.pageCount - 1);
    Array.prototype.forEach.call(els.dots.children, function (dot, i) {
      if (i === state.page) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    els.pageStatus.textContent = state.pageCount ? currentRangeText() : '';
  }

  function currentRangeText() {
    var first = state.page * state.pageSize + 1;
    var last = Math.min(state.visibleCount, first + state.pageSize - 1);
    return rangeText(first, last, state.visibleCount);
  }

  function announce(text) {
    // Clear first so repeating the same message is announced again.
    els.announcer.textContent = '';
    setTimeout(function () { els.announcer.textContent = text; }, 50);
  }

  function setPage(page, shouldAnnounce) {
    if (page === state.page) return;
    state.page = page;
    updatePager();
    if (shouldAnnounce) announce('Showing ' + currentRangeText().toLowerCase());
  }

  // Page the user is on, read from the scroll position while a swipe is still settling.
  var scrollTarget = null;
  var scrollEndTimer = null;
  var scrollStartPage = null;

  function currentScrollPage() {
    var width = els.pages.clientWidth || 1;
    return Math.max(0, Math.min(state.pageCount - 1, Math.round(els.pages.scrollLeft / width)));
  }

  function goToPage(page) {
    var base = scrollTarget === null ? currentScrollPage() : scrollTarget;
    var target = Math.max(0, Math.min(state.pageCount - 1, page(base)));
    scrollTarget = target;
    els.pages.scrollTo({ left: target * els.pages.clientWidth, behavior: scrollBehavior });
    setPage(target, true);
    // If no scroll happens (already there), release the target anyway.
    clearTimeout(scrollEndTimer);
    scrollEndTimer = setTimeout(endScroll, 700);
  }

  function endScroll() {
    var userScroll = scrollTarget === null;
    scrollTarget = null;
    var page = currentScrollPage();
    if (userScroll) {
      var moved = scrollStartPage !== null && page !== scrollStartPage;
      state.page = -1; // force setPage to refresh
      setPage(page, moved);
    }
    scrollStartPage = null;
  }

  function onPagesScroll() {
    if (scrollTarget === null) {
      if (scrollStartPage === null) scrollStartPage = state.page;
      var page = currentScrollPage();
      if (page !== state.page) setPage(page, false);
    }
    clearTimeout(scrollEndTimer);
    scrollEndTimer = setTimeout(endScroll, 120);
  }

  function refreshPageSize() {
    if (els.region.hidden || els.panelLive.hidden) return;
    var size = els.pages.clientWidth >= WIDE_PAGE_MIN_WIDTH ? 4 : 2;
    if (size !== state.pageSize) {
      state.lastPageSize = state.pageSize;
      state.pageSize = size;
      renderPages(true);
    } else if (state.pageCount) {
      // Width changed within the same layout: keep the current page aligned.
      els.pages.scrollLeft = state.page * els.pages.clientWidth;
    }
  }

  /* ---------- other lots ---------- */

  function otherLotLabel(lot) {
    return lot.name || 'Lot ' + lot.code;
  }

  function otherLots() {
    var liveCodes = state.lots.map(function (lot) { return lot.code; });
    return DATA.otherLots.filter(function (lot) {
      if (!lot || !(lot.code || lot.name)) return false;
      if (!campusOf(lot.campus)) {
        if (window.console) console.warn('lots-data.js: unknown campus "' + lot.campus + '" for', otherLotLabel(lot));
        return false;
      }
      return !lot.code || liveCodes.indexOf(lot.code) === -1;
    });
  }

  function otherCardHtml(lot) {
    var label = otherLotLabel(lot);
    var key = lot.code || lot.name;
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
      (meta.length ? '<p class="occ-meta">' + esc(meta.join(' \u00b7 ')) + '</p>' : '') +
      '<div class="occ-actions">' +
        // Directions only where a source says where the lot is.
        directionsLink(lot, key, label) +
        mapButton(lot.campus, key, label) +
        details +
      '</div>' +
    '</li>';
  }

  function renderOtherCampusFilter() {
    els.otherCampus.innerHTML = '<option value="all">All campuses</option>' + campusKeys().map(function (key) {
      return '<option value="' + esc(key) + '">' + esc(DATA.campuses[key].name) + '</option>';
    }).join('');
    els.otherCampus.value = state.otherCampus;
  }

  function renderOtherLots() {
    var others = otherLots();
    $('occ-count-other').textContent = others.length ? '(' + others.length + ')' : '';

    var keys = state.otherCampus === 'all' ? campusKeys() : [state.otherCampus];
    if (!keys.length) {
      els.otherList.innerHTML = '<p class="occ-other-empty">Lot details couldn&rsquo;t be loaded. ' +
        'The campus parking-zone maps are linked in the Overview section of this page.</p>';
      return;
    }
    els.otherList.innerHTML = keys.map(function (key) {
      var campus = DATA.campuses[key];
      var lots = others
        .filter(function (lot) { return lot.campus === key; })
        .sort(function (a, b) {
          // Lettered lots first in natural order (E2 before E10), then named sites.
          if (!a.code || !b.code) return a.code ? -1 : b.code ? 1 : otherLotLabel(a).localeCompare(otherLotLabel(b));
          return a.code.localeCompare(b.code, 'en', { numeric: true });
        });
      var headingId = 'occ-campus-' + safeId(key);
      var body = lots.length
        ? '<ul class="occ-other-grid">' + lots.map(otherCardHtml).join('') + '</ul>'
        : '<p class="occ-other-empty">Lot-by-lot details aren&rsquo;t listed for this campus yet. ' +
          'Every lot is drawn on the campus parking map.</p>';
      return '<section class="occ-campus-group" aria-labelledby="' + headingId + '">' +
        '<div class="occ-campus-head">' +
          '<h3 class="occ-campus-title" id="' + headingId + '">' + esc(campus.name) + ' Campus</h3>' +
          '<div class="occ-actions">' +
            directionsLink(campus, '', campus.name + ' Campus') +
            mapButton(key, '', campus.name + ' Campus parking map') +
          '</div>' +
        '</div>' + body +
      '</section>';
    }).join('');
  }

  /* ---------- campus map ---------- */

  function findLot(key) {
    if (!key) return null;
    var live = state.lots.filter(function (lot) { return lot.key === key; })[0];
    if (live) return { code: live.code, label: lotLabel(live), location: live.location, lat: live.lat, lng: live.lng };
    var other = DATA.otherLots.filter(function (lot) { return lot && (lot.code || lot.name) === key; })[0];
    return other ? { code: other.code, label: otherLotLabel(other), location: other.location, lat: other.lat, lng: other.lng } : null;
  }

  function renderMapCampuses() {
    var keys = campusKeys();
    els.mapCampuses.innerHTML = keys.map(function (key) {
      return '<label class="occ-campus-option"><input type="radio" name="occ-map-campus" value="' + esc(key) + '"> ' +
        esc(DATA.campuses[key].name) + '</label>';
    }).join('');
    if (!keys.length) {
      els.mapFocus.textContent = 'The campus maps couldn\u2019t be loaded. The parking-zone maps are linked in the Overview section of this page.';
    }
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
    var old = els.mapFrame.querySelector('iframe');
    if (!old || old.getAttribute('src') !== src) {
      // A new frame instead of a new src, so map changes don't add browser-history entries.
      var frame = document.createElement('iframe');
      frame.setAttribute('loading', 'lazy');
      frame.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      frame.setAttribute('allowfullscreen', '');
      frame.title = title + ' (Google My Maps)';
      frame.src = src;
      if (old) old.parentNode.replaceChild(frame, old);
      else els.mapFrame.appendChild(frame);
      els.mapFrame.classList.add('has-frame');
    }

    var focusText = 'Showing the ' + title + '.';
    if (lot) {
      focusText = point(lot)
        ? 'Showing the ' + title + ', centred on ' + lot.label + '.'
        : 'Showing the ' + title + '. Look for ' + lot.label + (lot.location ? ' (' + lot.location + ')' : '') + '.';
    }
    els.mapFocus.textContent = focusText;

    els.mapAlt.innerHTML = 'Map from UTRGV Parking &amp; Transportation (Google My Maps). ' +
      '<a href="' + esc(campusMapUrl(campus, lot || campus, false)) + '" target="_blank" rel="noopener">' +
      'Open the ' + esc(campus.name) + ' map in a new tab</a>. ' +
      'The <strong>Live occupancy</strong> and <strong>Other parking lots</strong> tabs list the same lots as text, with directions.';
  }

  function onRegionClick(e) {
    var gotoTab = e.target.closest('[data-goto-tab]');
    if (gotoTab) {
      selectTab($(gotoTab.getAttribute('data-goto-tab')), true);
      return;
    }
    var btn = e.target.closest('[data-map-campus]');
    if (!btn) return;
    selectTab(els.tabMap, false);
    showMap(btn.getAttribute('data-map-campus'), findLot(btn.getAttribute('data-lot')));
    // Bring the description and map into view, and move focus to the description.
    els.mapFocus.scrollIntoView({ block: 'start', behavior: scrollBehavior });
    els.mapFocus.focus({ preventScroll: true });
  }

  /* ---------- wiring ---------- */

  function setLots(lots, mode, updated, note) {
    state.lots = lots;
    state.mode = mode;
    state.updated = updated || '';
    $('occ-count-live').textContent = lots.length ? '(' + lots.length + ')' : '';
    renderTrigger();
    renderPages(true);
    renderOtherLots();
    els.note.textContent = note;
  }

  function filterSummary() {
    var shown = state.visibleCount;
    var total = state.lots.length;
    if (!shown) return 'No lots shown: every lot with a live count is full.';
    return shown === total ? 'Showing ' + plural(total, 'lot', 'lots') + '.' : 'Showing ' + shown + ' of ' + plural(total, 'lot', 'lots') + '.';
  }

  function init() {
    els.trigger = $('occ-trigger');
    els.region = $('occ-region');
    if (!els.trigger || !els.region) return;

    els.triggerStats = els.trigger.querySelector('.occ-trigger-stats');
    els.ctaLabel = $('occ-cta-label');
    els.note = $('occ-note');
    els.tabLive = $('occ-tab-live');
    els.tabOther = $('occ-tab-other');
    els.tabMap = $('occ-tab-map');
    els.tabs = [els.tabLive, els.tabOther, els.tabMap];
    els.panelLive = $('occ-panel-live');
    els.carousel = els.panelLive.querySelector('.occ-carousel');
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
      setOpen(els.region.hidden);
    });

    var tablist = els.tabLive.parentNode;
    ['click', 'keydown', 'keyup'].forEach(function (type) {
      tablist.addEventListener(type, onTablistEvent, true);
    });

    $('occ-sort').addEventListener('change', function (e) {
      state.sort = e.target.value;
      renderPages(false);
      announce('Sorted by ' + SORT_LABELS[state.sort] + '. ' + filterSummary());
    });
    $('occ-hide-full').addEventListener('change', function (e) {
      state.hideFull = e.target.checked;
      renderPages(false);
      announce((state.hideFull ? 'Full lots hidden. ' : 'Full lots shown. ') + filterSummary());
    });
    els.prev.addEventListener('click', function () {
      if (els.prev.getAttribute('aria-disabled') !== 'true') goToPage(function (p) { return p - 1; });
    });
    els.next.addEventListener('click', function () {
      if (els.next.getAttribute('aria-disabled') !== 'true') goToPage(function (p) { return p + 1; });
    });
    els.dots.addEventListener('click', function (e) {
      var dot = e.target.closest('[data-page]');
      if (dot) goToPage(function () { return Number(dot.getAttribute('data-page')); });
    });
    els.pages.addEventListener('scroll', onPagesScroll, { passive: true });

    els.otherCampus.addEventListener('change', function (e) {
      state.otherCampus = e.target.value;
      renderOtherLots();
    });
    els.mapCampuses.addEventListener('change', function (e) {
      if (e.target.name === 'occ-map-campus') showMap(e.target.value, null);
    });
    els.region.addEventListener('click', onRegionClick);

    // Re-layout only when the width changes; re-rendering changes the height,
    // which would otherwise feed back into the observer.
    var lastWidth = 0;
    var queued = false;
    function onResize(width) {
      if (width === lastWidth) return;
      lastWidth = width;
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; refreshPageSize(); });
    }
    if ('ResizeObserver' in window) {
      new ResizeObserver(function (entries) { onResize(Math.round(entries[0].contentRect.width)); }).observe(els.carousel);
    } else {
      window.addEventListener('resize', function () { onResize(els.carousel.clientWidth); });
    }

    renderOtherCampusFilter();
    renderMapCampuses();
    setLots([], 'loading', '', 'Checking for live counts\u2026');
    setOpen(false);
    els.trigger.hidden = false;

    fetchLive()
      .then(function (lots) {
        setLots(lots, 'live', lots[0].updated, 'Live counts from UTRGV Parking Services.');
      })
      .catch(function () {
        if (IS_LOCAL) {
          setLots(prepare(SNAPSHOT.lots, SNAPSHOT.updated), 'snapshot', SNAPSHOT.updated,
            'Live counts can\u2019t be reached from a local copy, so these are the counts saved on ' + SNAPSHOT.label + '.');
        } else {
          setLots(lotsWithoutCounts(), 'unavailable', '',
            'Live counts are unavailable right now. Directions and maps still work.');
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
