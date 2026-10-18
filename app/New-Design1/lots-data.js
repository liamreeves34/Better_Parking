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

  /*
   * Lots without live counts. Only lots that UTRGV sources name are listed, and
   * a location/mapQuery is set only where a source says where the lot is.
   * Lots without one get "Show on map" (the campus parking map) but no
   * directions. Researched Oct 2026 from search results; utrgv.edu itself
   * could not be fetched, so check against the official maps before launch.
   */
  otherLots: [
    // Edinburg
    { code: 'E2', campus: 'edinburg', location: 'Along W. University Dr.',
      features: ['Visitor parking (permit required)'] },
      // Edinburg map PDFs list E2; location/visitor label from its Waze listing (user-edited).
    { code: 'E3', campus: 'edinburg' },
      // Newsroom, May 2020 (Wi-Fi in lots E3, E6, E9, E12, E14, E16).
    { code: 'E4', campus: 'edinburg',
      features: ['Visitor pay station ($0.50/hr, card only)', 'MobilePay'] },
      // parking-services/pay-stations; visitor-parking-policy-fy24.pdf; parking-services/mobilepay
    { code: 'E6', campus: 'edinburg', location: 'South/east side of campus, by the PAC, ITT and Fieldhouse',
      features: ['Event parking after 5 PM'] },
      // visitor-parking-policy-fy24.pdf: "lots E6, E16, and E19 ... adjacent to the Performing
      // Art Center, ITT and Fieldhouse" (the policy doesn't say which lot is next to which).
    { code: 'E7', campus: 'edinburg', zone: 'Zone 3 spaces',
      features: ['MobilePay', 'Theatre parking (Jeffers Theatre)'] },
      // parking-services/mobilepay; Dept. of Theatre ticketing page ("zone 3 parking in lots E7 & E8")
    { code: 'E8', campus: 'edinburg', zone: 'Zone 3 spaces',
      features: ['MobilePay', 'Theatre parking (Jeffers Theatre)'] },
      // same sources as E7
    { code: 'E10', campus: 'edinburg',
      features: ['Football game-day park & ride (2025 season)'] },
      // goutrgv.com 2025-08-22 game-day parking release; PTS football route PDF
    { code: 'E11', campus: 'edinburg',
      features: ['Football game-day park & ride (2025 season)'] },
      // same sources as E10
    { code: 'E12', campus: 'edinburg',
      features: ['ACT/SAT exam-day parking'] },
      // UTRGV P16 National Exams page (E12 and E16)
    { code: 'E29', campus: 'edinburg',
      features: ['Football game-day park & ride (2025 season)'] },
      // PTS football route PDF ("LOTS E9, E10, E11, E28, E29, E31, & E32"); goutrgv.com
    { code: 'E33', campus: 'edinburg', location: 'Northeast of the Baseball Stadium, behind right-center field',
      mapQuery: 'UTRGV Baseball Stadium, Edinburg, TX',
      features: ['Baseball tailgating', 'Vaquero Express call stop'] },
      // goutrgv.com baseball game-day releases (2022-2025); Vaquero Express spring 2025 map
    { code: 'E34', campus: 'edinburg', location: 'Near the University Recreation Center (UREC)',
      mapQuery: 'UTRGV University Recreation Center, Edinburg, TX',
      features: ['VOLT shuttle stop (North and Remote West circuits)'] },
      // transportation-services/volt; UREC facility map

    // Brownsville
    { code: 'B1', campus: 'brownsville', location: 'Pay stations are south of Sabal Hall',
      mapQuery: 'Sabal Hall, UTRGV, Brownsville, TX',
      features: ['Visitor pay station', 'MobilePay (B1 West)'] },
      // parking-services/pay-stations ("Brownsville Campus in Lot B1, south of Sabal Hall");
      // parking-services/mobilepay. B1's live feed is hidden on the original page.
    { code: 'B2', campus: 'brownsville', location: 'By the Brownsville Student Union',
      mapQuery: 'UTRGV Student Union, Brownsville, TX',
      features: ['Vaquero Express call stop'] },
      // Vaquero Express spring 2025 timetable: "Brownsville Student Union (B2)"
    { code: 'B4', campus: 'brownsville', zone: 'Zone 1',
      location: 'SW corner of FJRM Ave. & Tyler St., across from Casa Bella',
      mapQuery: 'FJRM Ave & E Tyler St, Brownsville, TX 78520',
      features: ['VOLT East Circuit stop', 'Football game-day bus pickup'] },
      // Parking FAQ 2018 (295 Zone 1 spaces); transportation-services/volt; PTS football page

    // Harlingen
    { name: 'Park & Ride: Harlingen Convention Center', campus: 'harlingen',
      location: '701 Harlingen Heights Dr.',
      mapQuery: 'Harlingen Convention Center, 701 Harlingen Heights Dr, Harlingen, TX',
      infoUrl: 'https://www.utrgv.edu/parking-and-transportation-services/parking-services/harlingen-convention-center/index.htm',
      features: ['Park & ride'] }
      // Linked from this page's sidebar ("Harlingen Convention Center").
  ]
};
