async function getLots() {
    let url = 'https://webapps.utrgv.edu/it/cascaderest/api/parking';
  try {
    let response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.log(error);
  }
}

async function renderLots() {
  let parkingLots = await getLots();
  
  let html = '';

  parkingLots.forEach(parkingLot => {
    const date = new Date(parkingLot.date_time);
    date.setHours(date.getHours() - 1);
    
    if (parkingLot.location_name === 'LOT E16 -North and South') {
      // date.setHours(date.getHours() + 1);
    }
  
    if (parkingLot.location_name === 'LOT E19-North and South') {
      // date.setHours(date.getHours() + 1);
    }
    
    let occupancyLevel = Math.round(Number(parkingLot.total_spaces - parkingLot.free_spaces) / parkingLot.total_spaces * 100);
    
       // Set occupancyLevel to 0 for Lot E21 to display "Under Maintenance"
        // if (parkingLot.location_name === 'Lot  E21') {
        //     // occupancyLevel = 0;
        // }
    
    const lots = `
      <div class="parking_lot ${parkingLot.location_name.toLocaleLowerCase().replace(/\s/g, "")} column column-4-of-12">
        <div class="${parkingLot.location_name.toLocaleLowerCase().replace(/\s/g, "")}-wrapper">
          <div class="column column-12-of-12">
            <div class="location_address">
              <span class="emphasis">
                ${parkingLot.location_name} - Zone 2</span>
              
${parkingLot.location_name === 'Lot B1' ? "One West University Blvd" 
: parkingLot.location_name === 'Lot E9' ? "Across UREC" 
: parkingLot.location_name === 'Lot E32' ? "Across Baseball Stadium" 
: parkingLot.location_name === 'LOT E16 -North and South' ? "Adjacent to the Field House" 
: parkingLot.location_name === 'LOT E19-North and South' ? "Adjacent to the EPAC and Tennis Courts" 
: parkingLot.location_name === 'Lot  E21' ? "University Dr. & Miguel Nevarez Dr. " 
: parkingLot.location_name === 'Lot  E26' ? "W. Van Week St./W. Schunior St." 
              : parkingLot.location_name === 'Lot H2' ? "Adjacent to HCEBL"
              : ""} 
              
              <span class="small">Updated as of ${new Intl.DateTimeFormat('en-US', {timeStyle: 'short'}).format(date)}</span>
            </div>
          </div>
          <div class="column column-6-of-12">
            <div class="location_name">Available Spaces</div>
          </div>
          <div class="column column-6-of-12">
            <div class="time">${parkingLot.total_spaces === 0 ? "Under Maintenance" : `${parkingLot.free_spaces} out of ${parkingLot.total_spaces}`}</div>
          </div>
          <div class="occupancy column column-12-of-12">
            <div class="label">${parkingLot.total_spaces === 0 ? "Under Maintenance" : `Occupancy Level: ${occupancyLevel + "%"}`}</div>
            ${parkingLot.total_spaces !== 0 ? `
            <div class="range">
              <meter high="700" low="0" max="100" value="${occupancyLevel}">${occupancyLevel + "%"}</meter>
            </div>` : ""}
          </div>
        </div>
        
        ${parkingLot.lot_details
          .filter(childLots => parkingLot.location_name === 'Lot B1')
          .map(childLots => {
            const childDate = new Date(childLots.date_time);
            childDate.setHours(childDate.getHours() - 1);
            let childOccupancyLevel = Math.round(Number(childLots.total_spaces - childLots.free_spaces) / childLots.total_spaces * 100);
            return `
              <div class="child_lot ${parkingLot.location_name.toLocaleLowerCase().replace(/\s/g, "")}-${childLots.level} level${childLots.level} column column-12-of-12">
                <div class="column column-12-of-12">
                  <div class="location_address">
                    <span class="emphasis">${parkingLot.location_name} - ${childLots.level === 1 ? 'East': 'West'} - Zone 2</span>
                    
${parkingLot.location_name === 'Lot B1' ? "One West University Blvd" 
: parkingLot.location_name === 'Lot E9' ? "Across UREC" 
: parkingLot.location_name === 'Lot E32' ? "Across Baseball Stadium" 
: parkingLot.location_name === 'LOT E16 -North and South' ? "Adjacent to the Field House" 
: parkingLot.location_name === 'LOT E19-North and South' ? "Adjacent to the EPAC and Tennis Courts" 
: parkingLot.location_name === 'Lot  E21' ? "University Dr. & Miguel Nevarez Dr. " 
: parkingLot.location_name === 'Lot  E26' ? "W. Van Week St./W. Schunior St." 
                    : parkingLot.location_name === 'Lot H2' ? "Adjacent to HCEBL"
                    : ""} 
                    
                    <span class="small">Updated as of ${new Intl.DateTimeFormat('en-US', {timeStyle:'short'}).format(childDate)}</span>
                  </div>
                </div>
                <div class="column column-6-of-12">
                  <div class="location_name">Available Spaces</div>
                </div>
                <div class="column column-6-of-12">
                  <div class="time">${childLots.total_spaces === 0 ? "Under Maintenance" : `${childLots.free_spaces} out of ${childLots.total_spaces}`}</div>
                </div>
                <div class="occupancy column column-12-of-12">
                  <div class="label">${childLots.total_spaces === 0 ? "Under Maintenance" : `Occupancy Level: ${childOccupancyLevel + "%"}`}</div>
                  ${childLots.total_spaces !== 0 ? `
                  <div class="range">
                    <meter high="700" low="0" max="100" value="${childOccupancyLevel}">${childOccupancyLevel + "%"}</meter>
                  </div>` : ""}
                </div>
              </div>
            `;
          }).join("")}                  
      </div>
    `;
    html += lots;
  });

  const container = document.querySelector('.parkingWidget');
  container.innerHTML = html;
}

renderLots();
