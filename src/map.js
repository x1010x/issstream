let issLine = null;

// Initialize the map
const map = L.map('map').setView([0, 0], 2);

// Add a tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Create an icon for the ISS marker
const issIcon = L.icon({
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/International_Space_Station.svg/1200px-International_Space_Station.svg.png',
  iconSize: [50, 50],
  iconAnchor: [25, 25]
});

// Create a marker for the ISS
let issMarker = L.marker([0, 0], { icon: issIcon }).addTo(map);

// Function to fetch cities data
function fetchCitiesData() {
  const currentOrigin = window.location.origin;
  return fetch(`${currentOrigin}/cities.json`)
    .then(response => response.json())
    .catch(error => {
      console.error('Error fetching cities data:', error);
      return [];
    });
}


fetchCitiesData()
  .then(cities => {
    // Update the ISS position every 1 second
    setInterval(() => fetchISSPosition(cities), 1000);

    // Update the ISS position when the page loads
    fetchISSPosition(cities);
  })
  .catch(error => console.error('Error:', error));

// Function to calculate the distance between two points using the Haversine formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
    Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in kilometers
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Function to update the ISS position
function updateISSPosition(issPosition, cities = []) {
  const { latitude, longitude } = issPosition;

  // Convert latitude and longitude to numbers
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  // Determine cardinal directions
  const latDirection = lat >= 0 ? 'N' : 'S';
  const lonDirection = lon >= 0 ? 'E' : 'W';

  console.log('ISS Position:', lat, lon);

  // Update the marker position on the map
  issMarker.setLatLng([lat, lon]);
  map.panTo([lat, lon]);

  console.log("Calculating distances to cities...");
  // Calculate distances and sort cities based on distance
  const cityDistances = cities.map(city => {
    const distance = getDistanceFromLatLonInKm(lat, lon, city.lat, city.long);
    return { ...city, distance };
  });

  //console.log('City distances before sorting:', cityDistances);

  cityDistances.sort((a, b) => a.distance - b.distance);

  //console.log('City distances after sorting:', cityDistances);

  const closestCities = cityDistances.slice(0, 10);

  //console.log('Closest cities:', closestCities);

  // Remove any existing line from the map
  if (issLine) {
    map.removeLayer(issLine);
  }

  // Draw a dotted line from the ISS to the closest city
  if (closestCities.length > 0) {
    const closestCity = closestCities[0];
    const issCoords = [lat, lon];
    const cityCoords = [closestCity.lat, closestCity.long];
    issLine = L.polyline([issCoords, cityCoords], {
      color: 'red',
      dashArray: '5, 10' // Customize the dash pattern as needed
    }).addTo(map);
  }




  // Display the closest cities
  const closestCityInfo = document.getElementById('closestCity');
  if (closestCities.length > 0) {
    const cityList = closestCities
      .map(
        ({ city, country, info, distance, lat, long }) =>
          `${city}, ${country} - Distance: ${distance.toFixed(2)} km`
      )
      .join('<br>');
    closestCityInfo.innerHTML = `ISS Coordinates: ${Math.abs(lat.toFixed(4))}° ${latDirection}, ${Math.abs(lon.toFixed(4))}° ${lonDirection}<br>Top 3 closest cities:<br>${cityList}`;
  } else {
    closestCityInfo.textContent = `ISS Coordinates: ${Math.abs(lat.toFixed(4))}° ${latDirection}, ${Math.abs(lon.toFixed(4))}° ${lonDirection}<br>No city found near the ISS position.`;
  }
}

// Function to fetch ISS position data
function fetchISSPosition() {
  fetchCitiesData()
    .then(cities => {
      fetch('https://api.wheretheiss.at/v1/satellites/25544')
        .then(response => response.json())
        .then(data => {
          const { latitude, longitude } = data;
          updateISSPosition({ latitude, longitude }, cities || []);
        })
        .catch(error => {
          console.error('Error fetching data from API:', error);
        });
    })
    .catch(error => console.error('Error:', error));
}


// Update the ISS position every 5 seconds
setInterval(fetchISSPosition, 5000);

// Update the ISS position when the page loads
//fetchISSPosition();