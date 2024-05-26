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

// Function to update the ISS position
function updateISSPosition() {
    fetch('https://api.wheretheiss.at/v1/satellites/25544')
        .then(response => response.json())
        .then(data => {
            const { latitude, longitude } = data;
            issMarker.setLatLng([latitude, longitude]);
            map.panTo([latitude, longitude]);
        })
        .catch(error => console.error('Error:', error));
}

// Update the ISS position every half seconds
setInterval(updateISSPosition, 500);


