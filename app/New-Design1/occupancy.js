/*
 * Current Parking Lot Occupancy panel.
 *
 * Replaces the sidebar widget rendered by fetchapi.js. Data comes from the
 * same UTRGV endpoint; when it can't be reached (e.g. CORS on localhost) the
 * panel falls back to the snapshot saved with the original page.
 */
(function () {
  'use strict';

  var API_URL = 'https://webapps.utrgv.edu/it/cascaderest/api/parking';
  var FETCH_TIMEOUT_MS = 6000;
  var STORAGE_KEY = 'occ-panel-open';

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

  // Same descriptions fetchapi.js used, keyed by lot code.
  var ADDRESSES = {
    B1: 'One West University Blvd',
    E9: 'Across UREC',
    E16: 'Adjacent to the Field House',
    E19: 'Adjacent to the EPAC and Tennis Courts',
    E21: 'University Dr. & Miguel Nevarez Dr.',
    E26: 'W. Van Week St./W. Schunior St.',
    E32: 'Across Baseball Stadium',
    H2: 'Adjacent to HCEBL'
  };

  // Lots the original stylesheet hid (.lotb1-wrapper { display: none }).
  var HIDDEN_LOTS = ['B1'];

  var STATUS_LABELS = {
    available: 'Available',
    busy: 'Filling up',
    full: 'Full',
    maintenance: 'Closed'
  };

  var state = { lots: [], sort: 'open', hideFull: false };

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatTime(date) {
    return new Intl.DateTimeFormat('en-US', { timeStyle: 'short' }).format(date);
  }

  function statusFor(free, total, occupancy) {
    if (total === 0) return 'maintenance';
    if (free <= 0) return 'full';
    if (occupancy >= 75) return 'busy';
    return 'available';
  }

  function normalize(raw, fallbackUpdated) {
    var name = String(raw.location_name || '').replace(/\s+/g, ' ').trim();
    var match = name.match(/lot\s*([a-z]+\d+)\s*-?\s*(.*)$/i);
    var code = match ? match[1].toUpperCase() : name;
    var section = match ? match[2].replace(/\band\b/i, '&').trim() : '';
    var total = Number(raw.total_spaces) || 0;
    var free = Math.max(0, Number(raw.free_spaces) || 0);
    var occupancy = total ? Math.round((total - free) / total * 100) : 0;

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
      address: ADDRESSES[code] || '',
      free: free,
      total: total,
      occupancy: occupancy,
      status: statusFor(free, total, occupancy),
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

  function sortLots(lots) {
    var sorted = lots.slice();
    var byCode = function (a, b) {
      return a.code.localeCompare(b.code, 'en', { numeric: true });
    };
    if (state.sort === 'open') {
      sorted.sort(function (a, b) { return b.free - a.free || byCode(a, b); });
    } else if (state.sort === 'occupancy') {
      sorted.sort(function (a, b) {
        // Lots under maintenance have no meaningful occupancy; keep them last.
        var ao = a.total ? a.occupancy : 101;
        var bo = b.total ? b.occupancy : 101;
        return ao - bo || byCode(a, b);
      });
    } else {
      sorted.sort(byCode);
    }
    return sorted;
  }

  function cardHtml(lot) {
    var meta = ['Zone 2'];
    if (lot.section) meta.push(lot.section);
    var count = lot.total
      ? '<strong>' + lot.free + '</strong> of ' + lot.total + ' open'
      : 'Under maintenance';
    var bar = lot.total
      ? '<div class="occ-bar" role="meter" aria-label="Lot ' + esc(lot.code) + ' occupancy" ' +
        'aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + lot.occupancy + '">' +
        '<span style="width:' + lot.occupancy + '%"></span></div>'
      : '<div class="occ-bar"></div>';

    return '<li class="occ-card is-' + lot.status + '">' +
      '<div class="occ-card-head">' +
        '<span class="occ-lot"><span class="occ-lot-prefix">Lot</span> ' + esc(lot.code) + '</span>' +
        '<span class="occ-badge">' + STATUS_LABELS[lot.status] + '</span>' +
      '</div>' +
      '<p class="occ-place">' + esc(lot.address || 'Lot ' + lot.code) + '</p>' +
      '<p class="occ-meta">' + esc(meta.join(' · ')) + '</p>' +
      '<p class="occ-count">' + count + '</p>' +
      bar +
      '<p class="occ-foot"><span>' + (lot.total ? lot.occupancy + '% full' : '') + '</span>' +
        '<span>Updated ' + esc(lot.updated) + '</span></p>' +
    '</li>';
  }

  function renderSummary(lots) {
    var open = 0;
    var withRoom = 0;
    lots.forEach(function (lot) {
      open += lot.free;
      if (lot.status === 'available' || lot.status === 'busy') withRoom++;
    });
    var latest = lots.length ? lots[0].updated : '';

    // Each phrase stays on one line so the subtitle only wraps between phrases.
    var parts = [
      open.toLocaleString('en-US') + ' open spaces',
      withRoom + ' of ' + lots.length + ' lots have room'
    ];
    if (latest) parts.push('Updated ' + latest);
    document.getElementById('occ-subtitle').innerHTML = parts.map(function (part) {
      return '<span>' + esc(part) + '</span>';
    }).join(' · ');

    document.getElementById('occ-chips').innerHTML = lots.map(function (lot) {
      return '<span class="occ-chip is-' + lot.status + '"><i class="occ-dot"></i>' + esc(lot.code) + '</span>';
    }).join('');
  }

  function renderTrack() {
    var track = document.getElementById('occ-track');
    var visible = sortLots(state.lots).filter(function (lot) {
      return !(state.hideFull && lot.status === 'full');
    });

    track.innerHTML = visible.length
      ? visible.map(cardHtml).join('')
      : '<li class="occ-empty">Every lot is full right now. Check back soon.</li>';
    track.scrollLeft = 0;
    updateNav();
  }

  function updateNav() {
    var track = document.getElementById('occ-track');
    var nav = document.querySelector('.occ-nav');
    var maxScroll = track.scrollWidth - track.clientWidth;
    var edge = 4; // tolerance for sub-pixel widths and snap offsets
    nav.hidden = maxScroll <= edge;
    nav.querySelector('[data-dir="-1"]').disabled = track.scrollLeft <= edge;
    nav.querySelector('[data-dir="1"]').disabled = track.scrollLeft >= maxScroll - edge;
  }

  function scrollByCard(direction) {
    var track = document.getElementById('occ-track');
    var card = track.querySelector('.occ-card');
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    var step = card ? card.getBoundingClientRect().width + gap : track.clientWidth;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  function readOpenState() {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return false; }
  }

  function saveOpenState(isOpen) {
    try { localStorage.setItem(STORAGE_KEY, isOpen ? '1' : '0'); } catch (e) { /* storage unavailable */ }
  }

  function setLots(lots, note) {
    state.lots = lots;
    renderSummary(lots);
    renderTrack();
    document.getElementById('occ-note').textContent = note;
  }

  function init() {
    var panel = document.getElementById('occ-panel');
    if (!panel) return;

    panel.open = readOpenState();
    panel.addEventListener('toggle', function () {
      saveOpenState(panel.open);
      if (panel.open) updateNav();
    });

    document.getElementById('occ-sort').addEventListener('change', function (e) {
      state.sort = e.target.value;
      renderTrack();
    });
    document.getElementById('occ-hide-full').addEventListener('change', function (e) {
      state.hideFull = e.target.checked;
      renderTrack();
    });
    Array.prototype.forEach.call(document.querySelectorAll('.occ-nav-btn'), function (btn) {
      btn.addEventListener('click', function () { scrollByCard(Number(btn.dataset.dir)); });
    });
    document.getElementById('occ-track').addEventListener('scroll', updateNav, { passive: true });
    window.addEventListener('resize', updateNav);

    setLots(prepare(SNAPSHOT.lots, SNAPSHOT.updated),
      'Loading live data… showing the saved ' + SNAPSHOT.updated + ' snapshot for now.');

    fetchLive()
      .then(function (data) {
        setLots(prepare(data, ''), 'Live data from UTRGV Parking Services.');
      })
      .catch(function () {
        document.getElementById('occ-note').textContent =
          'Live data is unavailable here, so this shows the saved ' + SNAPSHOT.updated + ' snapshot.';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
