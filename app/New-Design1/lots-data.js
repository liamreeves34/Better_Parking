/*
 * Parking lot reference data for the parking lots panel (occupancy.js).
 *
 * Edit this file to add lots or fix locations; the panel renders from it.
 *   mapQuery  - what Google Maps searches for when someone taps "Directions".
 *               Prefer exact coordinates ("26.3049,-98.1739") once known;
 *               until then it points at the street corner or building that
 *               UTRGV's own lot description names.
 *   lat/lng   - optional. When set, "Show on campus map" centres the map on
 *               the lot instead of showing the whole campus.
 */
window.UTRGV_PARKING = {
  campuses: {
    edinburg: {
      name: 'Edinburg',
      // UTRGV parking-zone maps (Google My Maps) already linked from this page.
      mapId: 'zpZjxrrx6Mgw.k4Ln2F5Ydm8Q',
      mapQuery: 'The University of Texas Rio Grande Valley, 1201 W University Dr, Edinburg, TX 78539'
    },
    brownsville: {
      name: 'Brownsville',
      mapId: 'zpZjxrrx6Mgw.k2X62KUwdRck',
      mapQuery: 'The University of Texas Rio Grande Valley, One West University Blvd, Brownsville, TX 78520'
    },
    harlingen: {
      name: 'Harlingen',
      mapId: '1dpLpMHr1GWGUrhJvEFe8Xa3B-8A',
      mapQuery: 'UTRGV Harlingen Campus, Harlingen, TX'
    },
    weslaco: {
      name: 'Weslaco',
      mapId: '11uSlFk7dgdARUWGWELn-fspn_L6G-aMc',
      // Centre point from the Weslaco map link on this page.
      lat: 26.159610728402882,
      lng: -97.98781400000001,
      mapQuery: '26.159610728402882,-97.98781400000001'
    }
  },

  // Lots that report live occupancy, keyed by lot code. Descriptions are the
  // ones UTRGV's original widget (fetchapi.js) shows.
  liveLots: {
    E9:  { campus: 'edinburg', location: 'Across UREC',
           mapQuery: 'UTRGV University Recreation Center, Edinburg, TX' },
    E16: { campus: 'edinburg', location: 'Adjacent to the Field House',
           mapQuery: 'UTRGV Fieldhouse, Edinburg, TX' },
    E19: { campus: 'edinburg', location: 'Adjacent to the EPAC and Tennis Courts',
           mapQuery: 'UTRGV Performing Arts Complex, Edinburg, TX' },
    E21: { campus: 'edinburg', location: 'University Dr. & Miguel Nevarez Dr.',
           mapQuery: 'W University Dr & Miguel Nevarez Dr, Edinburg, TX 78539' },
    E26: { campus: 'edinburg', location: 'W. Van Week St./W. Schunior St.',
           mapQuery: 'W Van Week St & W Schunior St, Edinburg, TX 78539' },
    E32: { campus: 'edinburg', location: 'Across Baseball Stadium',
           mapQuery: 'UTRGV Baseball Stadium, Edinburg, TX' },
    H2:  { campus: 'harlingen', location: 'Adjacent to HCEBL',
           mapQuery: 'UTRGV Harlingen Campus, Harlingen, TX' },
    B1:  { campus: 'brownsville', location: 'One West University Blvd',
           mapQuery: 'One West University Blvd, Brownsville, TX 78520' }
  },

  // Lots without live counts. Only lots named in a UTRGV source are listed.
  otherLots: []
};
