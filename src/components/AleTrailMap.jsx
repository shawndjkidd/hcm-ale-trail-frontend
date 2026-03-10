import { useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl

const BREWERY_COORDS = {
  'BiaCraft':              { lat: 10.7764, lng: 106.6855, district: 'District 3',  address: '1 Lê Ngô Cát, Võ Thị Sáu, Quận 3' },
  'Heart of Darkness':     { lat: 10.7798, lng: 106.7029, district: 'District 1',  address: '31D Lý Tự Trọng, Bến Nghé, Quận 1' },
  'Deme':                  { lat: 10.7901, lng: 106.6884, district: 'District 3',  address: '393/7 Hai Bà Trưng, Võ Thị Sáu, Quận 3' },
  'Steersman':             { lat: 10.7901, lng: 106.7120, district: 'Bình Thạnh',  address: '84 Phạm Viết Chánh, Phường 19, Bình Thạnh' },
  'East West Brewing':     { lat: 10.7731, lng: 106.6961, district: 'District 1',  address: '181 Lý Tự Trọng, Bến Thành, Quận 1' },
  'Rooster Beers':         { lat: 10.7677, lng: 106.6945, district: 'District 1',  address: '40 Bùi Viện, Phạm Ngũ Lão, Quận 1' },
  '7 Bridges Brewing Co.': { lat: 10.7766, lng: 106.7049, district: 'District 1',  address: '38 Đông Du, Bến Nghé, Quận 1' },
  'Belgo Saigon':          { lat: 10.7732, lng: 106.7021, district: 'District 1',  address: '29-31 Đ. Tôn Thất Thiệp, Bến Nghé, Quận 1' },
}

const SAIGON_LANDMARKS = [
  {
    name: 'Nhà Thờ Đức Bà',
    lat: 10.7798, lng: 106.6990,
    svg: `<svg viewBox="0 0 40 50" width="40" height="50" xmlns="http://www.w3.org/2000/svg">
      <g fill="#D4574A" opacity="0.85">
        <rect x="6" y="8" width="5" height="30" rx="1"/>
        <polygon points="8.5,0 4,10 13,10"/>
        <rect x="29" y="8" width="5" height="30" rx="1"/>
        <polygon points="31.5,0 27,10 36,10"/>
        <rect x="11" y="18" width="18" height="20" rx="1"/>
        <circle cx="20" cy="25" r="4" fill="#F0A0A0"/>
        <polygon points="20,10 11,20 29,20"/>
        <rect x="4" y="38" width="32" height="5" rx="1"/>
      </g>
    </svg>`,
  },
  {
    name: 'Bitexco Financial Tower',
    lat: 10.7716, lng: 106.7041,
    svg: `<svg viewBox="0 0 24 55" width="24" height="55" xmlns="http://www.w3.org/2000/svg">
      <g fill="#5A7A9A" opacity="0.8">
        <polygon points="12,0 6,50 18,50"/>
        <ellipse cx="18" cy="20" rx="6" ry="2" fill="#4A6A8A"/>
        <line x1="10" y1="10" x2="14" y2="10" stroke="#8AB" stroke-width="0.5"/>
        <line x1="9" y1="20" x2="15" y2="20" stroke="#8AB" stroke-width="0.5"/>
        <line x1="8" y1="30" x2="16" y2="30" stroke="#8AB" stroke-width="0.5"/>
        <line x1="7" y1="40" x2="17" y2="40" stroke="#8AB" stroke-width="0.5"/>
        <rect x="4" y="50" width="16" height="3" rx="1"/>
      </g>
    </svg>`,
  },
  {
    name: 'Nhà Thờ Tân Định',
    lat: 10.7883, lng: 106.6907,
    svg: `<svg viewBox="0 0 36 52" width="36" height="52" xmlns="http://www.w3.org/2000/svg">
      <g fill="#E8829A" opacity="0.85">
        <rect x="15" y="0" width="6" height="3" rx="1"/>
        <polygon points="18,3 14,12 22,12"/>
        <rect x="15" y="10" width="6" height="24" rx="1"/>
        <rect x="8" y="20" width="20" height="14" rx="1"/>
        <rect x="13" y="23" width="4" height="6" rx="1" fill="#F4B8C8"/>
        <rect x="19" y="23" width="4" height="6" rx="1" fill="#F4B8C8"/>
        <polygon points="18,12 8,22 28,22"/>
        <rect x="4" y="34" width="28" height="5" rx="1"/>
        <rect x="0" y="39" width="36" height="4" rx="1"/>
      </g>
    </svg>`,
  },
  {
    name: 'Chợ Bến Thành',
    lat: 10.7726, lng: 106.6980,
    svg: `<svg viewBox="0 0 52 40" width="52" height="40" xmlns="http://www.w3.org/2000/svg">
      <g fill="#C8963E" opacity="0.85">
        <rect x="0" y="18" width="52" height="18" rx="1"/>
        <rect x="20" y="6" width="12" height="14" rx="1"/>
        <rect x="24" y="1" width="4" height="7" rx="1"/>
        <circle cx="26" cy="12" r="4" fill="#E0B060"/>
        <circle cx="26" cy="12" r="2.5" fill="#C8963E"/>
        <line x1="26" y1="8" x2="26" y2="16" stroke="#E0B060" stroke-width="1"/>
        <line x1="22" y1="12" x2="30" y2="12" stroke="#E0B060" stroke-width="1"/>
        <polygon points="26,4 20,8 32,8"/>
        <rect x="6" y="14" width="10" height="8" rx="0"/>
        <rect x="36" y="14" width="10" height="8" rx="0"/>
      </g>
    </svg>`,
  },
  {
    name: 'Japan Town',
    lat: 10.7794, lng: 106.7047,
    svg: `<svg viewBox="0 0 40 38" width="40" height="38" xmlns="http://www.w3.org/2000/svg">
      <g fill="#CC3333" opacity="0.85">
        <rect x="2" y="8" width="36" height="5" rx="2"/>
        <rect x="6" y="3" width="28" height="4" rx="2"/>
        <rect x="7" y="13" width="5" height="22" rx="1"/>
        <rect x="28" y="13" width="5" height="22" rx="1"/>
      </g>
    </svg>`,
  },
]

const breweryIcon = (logoUrl, name) => L.divIcon({
  className: 'brewery-logo-pin',
  html: `
    <div class="logo-pin-container">
      <div class="logo-pin-head">
        ${logoUrl
          ? `<img src="${logoUrl}" alt="${name}" class="logo-pin-img" />`
          : `<span class="logo-pin-fallback">🍺</span>`
        }
      </div>
      <div class="logo-pin-tail"></div>
    </div>
  `,
  iconSize: [48, 58],
  iconAnchor: [24, 58],
  popupAnchor: [0, -55],
})

const closedBreweryIcon = (logoUrl, name) => L.divIcon({
  className: 'brewery-logo-pin brewery-logo-pin-closed',
  html: `
    <div class="logo-pin-container">
      <div class="logo-pin-head logo-pin-head-closed">
        ${logoUrl
          ? `<img src="${logoUrl}" alt="${name}" class="logo-pin-img" style="filter:grayscale(1);opacity:0.5" />`
          : `<span class="logo-pin-fallback">🍺</span>`
        }
      </div>
      <div class="logo-pin-tail logo-pin-tail-closed"></div>
    </div>
  `,
  iconSize: [48, 58],
  iconAnchor: [24, 58],
  popupAnchor: [0, -55],
})

const landmarkIcon = (svgHtml) => L.divIcon({
  className: 'landmark-svg-marker',
  html: svgHtml,
  iconSize: [40, 55],
  iconAnchor: [20, 50],
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
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
            attribution=""
          />
          <ZoomControl position="bottomright" />

          {SAIGON_LANDMARKS.map(lm => (
            <Marker
              key={lm.name}
              position={[lm.lat, lm.lng]}
              icon={landmarkIcon(lm.svg)}
              interactive={false}
            >
              <Tooltip className="landmark-tooltip" direction="top" offset={[0, -50]}>
                {lm.name}
              </Tooltip>
            </Marker>
          ))}

          {brewsWithCoords.map(brewery => (
            <Marker
              key={brewery.id}
              position={[brewery.coords.lat, brewery.coords.lng]}
              icon={brewery.status === 'temporarily_closed'
                ? closedBreweryIcon(brewery.logo_url, brewery.name)
                : breweryIcon(brewery.logo_url, brewery.name)
              }
            >
              <Popup>
                <div>
                  <div className="brewery-popup-name">{brewery.name}</div>
                  <div className="brewery-popup-district">{brewery.coords.address}</div>
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
        {brewsWithCoords.map(brewery => (
          <div
            key={brewery.id}
            className="map-brewery-card"
            onClick={() => flyToBrewery(brewery.coords)}
          >
            <div className="map-card-number">
              {brewery.logo_url
                ? <img src={brewery.logo_url} alt={brewery.name} className="map-card-logo" />
                : <span>🍺</span>
              }
            </div>
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
