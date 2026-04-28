// js/map.js
import { GOOGLE_MAPS_API_KEY } from '../config.js';
import { scoreToColour } from './scoring.js';

let _map = null;
let _infoWindow = null;
let _boroughData = [];

// The style function is called by Google Maps for every feature render.
// By using a function instead of a plain object, the colours persist through
// hover/click interactions — revertStyle() removes the hover override and
// falls back to this function, not to a hardcoded grey object.
function styleFeature(feature) {
  const name    = feature.getProperty('name');
  const borough = _boroughData.find(b => b.name === name);
  return {
    fillColor:   borough && !borough.failed ? scoreToColour(borough.score) : '#cccccc',
    fillOpacity: 0.65,
    strokeColor: '#ffffff',
    strokeWeight: 1,
    cursor: 'pointer',
  };
}

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

export function loadBoroughLayer(geojson, onBoroughClick) {
  _map.data.addGeoJson(geojson);

  // Use a style function so hover/click revertStyle() always falls back to
  // the scored colour, not a static grey object.
  _map.data.setStyle(styleFeature);

  _map.data.addListener('mouseover', e => {
    const name    = e.feature.getProperty('name');
    const borough = _boroughData.find(b => b.name === name);
    const score   = borough?.score ?? '?';
    _infoWindow.setContent(
      `<div style="font-family:sans-serif;padding:4px 8px;font-size:13px">
         <strong>${name}</strong><br>Score: ${score}/10
       </div>`
    );
    _infoWindow.setPosition(e.latLng);
    _infoWindow.open(_map);
    // Only override opacity — colour stays from styleFeature
    _map.data.overrideStyle(e.feature, { fillOpacity: 0.85, strokeWeight: 2 });
  });

  _map.data.addListener('mouseout', e => {
    _infoWindow.close();
    // Revert only the hovered feature — styleFeature re-applies its colour
    _map.data.revertStyle(e.feature);
  });

  _map.data.addListener('click', e => {
    onBoroughClick(e.feature.getProperty('name'));
  });
}

// Updates the stored borough data and re-triggers the style function
// across all features so the map re-colours itself.
export function colourBoroughs(boroughData) {
  _boroughData = boroughData;
  _map.data.setStyle(styleFeature);
}

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
