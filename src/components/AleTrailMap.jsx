import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icon broken by bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom marker icons
const activeIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const closedIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'leaflet-marker-closed',
})

// Hardcoded brewery coordinates keyed by name
const BREWERY_COORDS = {
  'BiaCraft':              { lat: 10.7873, lng: 106.6910, district: 'District 3' },
  'Heart of Darkness':     { lat: 10.7768, lng: 106.7010, district: 'District 1' },
  'Deme':                  { lat: 10.7901, lng: 106.6884, district: 'District 3' },
  'Steersman':             { lat: 10.8031, lng: 106.7350, district: 'Thao Dien' },
  'East West Brewing':     { lat: 10.7735, lng: 106.6965, district: 'District 1' },
  'Rooster Beers':         { lat: 10.7700, lng: 106.6935, district: 'District 1' },
  '7 Bridges Brewing Co.': { lat: 10.7750, lng: 106.6980, district: 'District 1' },
  'Belgo Saigon':          { lat: 10.7760, lng: 106.6950, district: 'District 1' },
}

const LIGHT_TILES = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}

const DARK_TILES = {
  url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
}

// Component to swap tile layers without remounting the whole map
function TileLayerSwitcher({ nightMode }) {
  const tiles = nightMode ? DARK_TILES : LIGHT_TILES
  return <TileLayer key={nightMode ? 'dark' : 'light'} url={tiles.url} attribution={tiles.attribution} />
}

export default function AleTrailMap({ breweries = [], onBack, nightMode, onBreweryNavigate }) {
  const brewsWithCoords = breweries
    .map(b => ({ ...b, coords: BREWERY_COORDS[b.name] }))
    .filter(b => b.coords)

  const handleViewBrewery = (brewery) => {
    if (typeof onBreweryNavigate === 'function') {
      onBreweryNavigate(brewery)
    }
  }

  return (
    <div className={`ale-trail-map-page${nightMode ? ' night-mode' : ''}`}>
      <button className="back-btn" onClick={onBack}>← BACK</button>
      <h2 className="ale-trail-map-title">ALE TRAIL MAP</h2>
      <p className="ale-trail-map-subtitle">{brewsWithCoords.length} breweries in Ho Chi Minh City</p>

      <div className="ale-trail-map-container">
        <MapContainer
          center={[10.78, 106.70]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayerSwitcher nightMode={nightMode} />
          {brewsWithCoords.map(brewery => (
            <Marker
              key={brewery.id}
              position={[brewery.coords.lat, brewery.coords.lng]}
              icon={brewery.status === 'temporarily_closed' ? closedIcon : activeIcon}
            >
              <Popup>
                <div className="map-popup">
                  <strong className="map-popup-name">{brewery.name}</strong>
                  <span className="map-popup-district">{brewery.coords.district}</span>
                  {brewery.status === 'temporarily_closed' && (
                    <span className="map-popup-closed">Temporarily Closed</span>
                  )}
                  <button
                    className="map-popup-btn"
                    onClick={() => handleViewBrewery(brewery)}
                  >
                    View Brewery →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
