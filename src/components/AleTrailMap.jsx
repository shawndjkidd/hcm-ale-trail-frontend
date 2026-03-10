import { useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl

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

const SAIGON_LANDMARKS = [
  { name: 'Notre-Dame Cathedral',    emoji: '⛪', lat: 10.7798, lng: 106.6990 },
  { name: 'Ben Thanh Market',        emoji: '🏪', lat: 10.7725, lng: 106.6980 },
  { name: 'Reunification Palace',    emoji: '🏛️', lat: 10.7770, lng: 106.6954 },
  { name: 'Bitexco Financial Tower', emoji: '🏢', lat: 10.7716, lng: 106.7041 },
  { name: 'War Remnants Museum',     emoji: '🏛️', lat: 10.7797, lng: 106.6920 },
  { name: 'Opera House',             emoji: '🎭', lat: 10.7766, lng: 106.7032 },
  { name: 'Central Post Office',     emoji: '📮', lat: 10.7800, lng: 106.6996 },
]

const breweryIcon = (number) => L.divIcon({
  className: 'brewery-map-marker',
  html: `<div class="marker-inner">${number}</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
})

const closedBreweryIcon = (number) => L.divIcon({
  className: 'brewery-map-marker brewery-map-marker-closed',
  html: `<div class="marker-inner">${number}</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
})

const landmarkIcon = (emoji) => L.divIcon({
  className: 'landmark-map-marker',
  html: `<div class="landmark-inner">${emoji}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

export default function AleTrailMap({ breweries = [], stamps = [], onBack, onBreweryNavigate }) {
  const mapRef = useRef(null)

  const brewsWithCoords = breweries
    .map(b => ({ ...b, coords: BREWERY_COORDS[b.name] }))
    .filter(b => b.coords)

  const flyToBrewery = (coords) => {
    if (mapRef.current) {
      mapRef.current.flyTo([coords.lat, coords.lng], 16, { duration: 0.8 })
    }
  }

  const handleViewBrewery = (brewery) => {
    if (typeof onBreweryNavigate === 'function') {
      onBreweryNavigate(brewery)
    }
  }

  return (
    <div className="ale-trail-map-page">
      <button className="back-btn" onClick={onBack}>← BACK</button>
      <h1 className="map-page-title">ALE TRAIL MAP</h1>
      <p className="map-page-subtitle">{brewsWithCoords.length} breweries across Ho Chi Minh City</p>

      <div className="map-wrapper">
        <MapContainer
          ref={mapRef}
          center={[10.7800, 106.6970]}
          zoom={14}
          minZoom={12}
          maxZoom={18}
          style={{ height: '55vh', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
            attribution=""
          />
          <ZoomControl position="bottomright" />

          {SAIGON_LANDMARKS.map(lm => (
            <Marker
              key={lm.name}
              position={[lm.lat, lm.lng]}
              icon={landmarkIcon(lm.emoji)}
              interactive={true}
            >
              <Tooltip className="landmark-tooltip" direction="top">{lm.name}</Tooltip>
            </Marker>
          ))}

          {brewsWithCoords.map((brewery, i) => (
            <Marker
              key={brewery.id}
              position={[brewery.coords.lat, brewery.coords.lng]}
              icon={brewery.status === 'temporarily_closed'
                ? closedBreweryIcon(i + 1)
                : breweryIcon(i + 1)
              }
            >
              <Popup>
                <div>
                  <div className="brewery-popup-name">{brewery.name}</div>
                  <div className="brewery-popup-district">{brewery.coords.district}</div>
                  {brewery.status === 'temporarily_closed' && (
                    <div style={{ color: '#ff6b6b', fontSize: '0.75rem', marginBottom: 6 }}>
                      Temporarily Closed
                    </div>
                  )}
                  <button
                    className="brewery-popup-btn"
                    onClick={() => handleViewBrewery(brewery)}
                  >
                    VIEW BREWERY →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="map-brewery-list">
        {brewsWithCoords.map((brewery, i) => (
          <div
            key={brewery.id}
            className="map-brewery-card"
            onClick={() => flyToBrewery(brewery.coords)}
          >
            <div className="map-card-number">{i + 1}</div>
            <div className="map-card-info">
              <div className="map-card-name">{brewery.name}</div>
              <div className="map-card-district">{brewery.coords.district}</div>
            </div>
            {stamps.includes(brewery.id) && (
              <div className="map-card-stamp">✅</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
