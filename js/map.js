// js/map.js
import { GOOGLE_MAPS_API_KEY } from '../config.js';
import { scoreToColour } from './scoring.js';

let _map = null;
let _infoWindow = null;
let _boroughData = [];

// Dynamically creates a <script> tag pointing at the Maps SDK.
// Resolves once window.google.maps is available.
function loadMapsScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Google Maps SDK'));
    document.head.appendChild(script);
  });
}

export async function initMap(containerId) {
  await loadMapsScript();
  _map = new google.maps.Map(document.getElementById(containerId), {
    center: { lat: 51.5074, lng: -0.1278 },
    zoom: 10,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: [
      { featureType: 'poi',     stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    ],
  });
  _infoWindow = new google.maps.InfoWindow();
}

// Loads GeoJSON polygons onto the map and wires up hover + click events.
// onBoroughClick(boroughName) is called when the user clicks a polygon.
export function loadBoroughLayer(geojson, onBoroughClick) {
  _map.data.addGeoJson(geojson);
  _map.data.setStyle({
    fillColor: '#cccccc',
    fillOpacity: 0.65,
    strokeColor: '#ffffff',
    strokeWeight: 1,
    cursor: 'pointer',
  });

  _map.data.addListener('mouseover', e => {
    const name = e.feature.getProperty('name');
    const borough = _boroughData.find(b => b.name === name);
    const score = borough?.score ?? '?';
    _infoWindow.setContent(
      `<div style="font-family:sans-serif;padding:4px 8px;font-size:13px">
         <strong>${name}</strong><br>Score: ${score}/10
       </div>`
    );
    _infoWindow.setPosition(e.latLng);
    _infoWindow.open(_map);
    _map.data.overrideStyle(e.feature, { fillOpacity: 0.85, strokeWeight: 2 });
  });

  _map.data.addListener('mouseout', () => {
    _infoWindow.close();
    _map.data.revertStyle();
  });

  _map.data.addListener('click', e => {
    onBoroughClick(e.feature.getProperty('name'));
  });
}

// Colours every polygon based on its score.
// Also stores boroughData so the hover tooltip can show the score.
export function colourBoroughs(boroughData) {
  _boroughData = boroughData;
  _map.data.forEach(feature => {
    const name = feature.getProperty('name');
    const borough = boroughData.find(b => b.name === name);
    const colour = borough?.failed ? '#cccccc' : scoreToColour(borough?.score ?? 5);
    _map.data.overrideStyle(feature, { fillColor: colour, fillOpacity: 0.65 });
  });
}

// Pans and zooms the map to fit the named borough's polygon bounds.
// Returns true if found, false if the borough name wasn't in the layer.
export function panToBorough(boroughName) {
  let found = false;
  _map.data.forEach(feature => {
    if (feature.getProperty('name') !== boroughName) return;
    const bounds = new google.maps.LatLngBounds();
    feature.getGeometry().forEachLatLng(latlng => bounds.extend(latlng));
    _map.fitBounds(bounds);
    found = true;
  });
  return found;
}
