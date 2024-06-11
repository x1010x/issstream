////////////////////////////// CONSTANTS
const ISS_POSITION_FETCH_INTERVAL = 2500;


////////////////////////////// FUNCTIONS

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

// Service representing all related functions with ISS
function getIssService() {
    ////////////////////////////// MAP

    // Initialize the map
    const map = L.map("map").setView([0, 0], 2);

    // Add a tile layer to the map
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    let issLine;

    // Create an icon for the ISS marker
    const issIcon = L.icon({
        iconUrl:
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/International_Space_Station.svg/1200px-International_Space_Station.svg.png",
        iconSize: [50, 50],
        iconAnchor: [25, 25],
    });

    // Create a marker for the ISS
    let issMarker = L.marker([0, 0], { icon: issIcon }).addTo(map);

    const fetchCitiesData = async () => {
        const currentOrigin = window.location.origin;
        const response = await fetch(`${currentOrigin}/cities.json`);
        return await response.json();
    }

    const fetchISSPosition = async () => {
        /*
        {
            "name": "iss",
            "id": 25544,
            "latitude": 26.061960949075,
            "longitude": 179.86771212697,
            "altitude": 418.01831354401,
            "velocity": 27587.073443625,
            "visibility": "daylight",
            "footprint": 4497.3677571539,
            "timestamp": 1718132204,
            "daynum": 2460473.2893981,
            "solar_lat": 23.155255218352,
            "solar_lon": 255.77803927034,
            "units": "kilometers"
        }
        */
        const response = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
        return await response.json();
    }

    const updateISSPosition = (issPosition, cities) => {
        const { latitude, longitude } = issPosition;

        // Convert latitude and longitude to numbers
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);

        // Determine cardinal directions
        const latDirection = lat >= 0 ? "N" : "S";
        const lonDirection = lon >= 0 ? "E" : "W";

        console.log("ISS Position:", lat, lon);

        // Update the marker position on the map
        issMarker.setLatLng([lat, lon]);
        map.panTo([lat, lon]);

        console.log("Calculating distances to cities...");
        // Calculate distances and sort cities based on distance
        const cityDistances = cities.map((city) => {
            const distance = getDistanceFromLatLonInKm(
                lat,
                lon,
                city.lat,
                city.long
            );
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
                color: "red",
                dashArray: "5, 10", // Customize the dash pattern as needed
            }).addTo(map);
        }

        // Display the closest cities
        const closestCityInfo = document.getElementById("closestCity");
        if (closestCities.length > 0) {
            const cityList = closestCities
                .map(
                    ({ city, country, info, distance, lat, long }) =>
                        `${city}, ${country} - Distance: ${distance.toFixed(2)} km`
                )
                .join("<br>");
            closestCityInfo.innerHTML = `ISS Coordinates: ${Math.abs(
                lat.toFixed(4)
            )}° ${latDirection}, ${Math.abs(
                lon.toFixed(4)
            )}° ${lonDirection}<br>Top 3 closest cities:<br>${cityList}`;
        } else {
            closestCityInfo.textContent = `ISS Coordinates: ${Math.abs(
                lat.toFixed(4)
            )}° ${latDirection}, ${Math.abs(
                lon.toFixed(4)
            )}° ${lonDirection}<br>No city found near the ISS position.`;
        }
    }

    return { fetchCitiesData, fetchISSPosition, updateISSPosition };
}

////////////////////////////// DATA FETCHING
async function fetchAndUpdateIssPosition(cities, fetchISSPosition, updateISSPosition) {
    const issPosition = await fetchISSPosition();
    updateISSPosition(issPosition, cities);
}

(async () => {
    const { fetchCitiesData, fetchISSPosition, updateISSPosition } = getIssService();
    const cities = await fetchCitiesData();

    // Update the ISS position every n seconds defined in constant, and also, update the ISS position when the page loads
    setInterval(() => fetchAndUpdateIssPosition(cities, fetchISSPosition, updateISSPosition), ISS_POSITION_FETCH_INTERVAL);
    fetchAndUpdateIssPosition(cities, fetchISSPosition, updateISSPosition);
})();
