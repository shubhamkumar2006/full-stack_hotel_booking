import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { Star, MapPin, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export const INDIAN_CITIES_MAP = {
  'India (All)': { coords: [22.5937, 78.9629], zoom: 5, icon: '🇮🇳' },
  'Kasauli': { coords: [30.9013, 76.9649], zoom: 12, icon: '🏰' },
  'Goa': { coords: [15.2993, 74.1240], zoom: 11, icon: '🏖️' },
  'Mumbai': { coords: [19.0760, 72.8777], zoom: 11, icon: '🏙️' },
  'Delhi': { coords: [28.6139, 77.2090], zoom: 11, icon: '🏛️' },
  'Bangalore': { coords: [12.9716, 77.5946], zoom: 11, icon: '💻' },
  'Udaipur': { coords: [24.5854, 73.7125], zoom: 12, icon: '⛵' },
  'Manali': { coords: [32.2432, 77.1892], zoom: 12, icon: '⛰️' },
  'Shimla': { coords: [31.1048, 77.1734], zoom: 12, icon: '🌲' },
  'Jaipur': { coords: [26.9124, 75.7873], zoom: 11, icon: '👑' },
  'Kerala': { coords: [10.8505, 76.2711], zoom: 9, icon: '🌴' },
};

export default function PropertyMap({ properties = [], activeCity = '', hoveredPropertyId, onMarkerHover, onSelectCity }) {
  const [selectedCity, setSelectedCity] = useState(activeCity || '');

  useEffect(() => {
    setSelectedCity(activeCity || '');
  }, [activeCity]);

  let center = [22.5937, 78.9629];
  let zoom = 5;

  const cityKey = Object.keys(INDIAN_CITIES_MAP).find(
    k => k.toLowerCase() === selectedCity?.trim().toLowerCase()
  );

  if (cityKey && INDIAN_CITIES_MAP[cityKey]) {
    center = INDIAN_CITIES_MAP[cityKey].coords;
    zoom = INDIAN_CITIES_MAP[cityKey].zoom;
  } else if (properties.length > 0) {
    const validProps = properties.filter(p => p.geoLat && p.geoLng);
    if (validProps.length > 0) {
      const avgLat = validProps.reduce((sum, p) => sum + p.geoLat, 0) / validProps.length;
      const avgLng = validProps.reduce((sum, p) => sum + p.geoLng, 0) / validProps.length;
      center = [avgLat, avgLng];
      zoom = validProps.length === 1 ? 13 : 8;
    }
  }

  const createPriceIcon = (price, isSelectedCity, isHovered) => {
    const formattedPrice = `₹${(price || 2000).toLocaleString()}`;

    let bgStyle = 'background-color: #ffffff; color: #0f172a; font-weight: 800; border: 1px solid rgba(0, 0, 0, 0.12); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);';

    if (isHovered) {
      bgStyle = 'background-color: #6366f1; color: #ffffff; font-weight: 800; transform: scale(1.18); box-shadow: 0 8px 22px rgba(99, 102, 241, 0.5); border: 2px solid #ffffff; z-index: 9999;';
    } else if (isSelectedCity) {
      bgStyle = 'background-color: #a855f7; color: #ffffff; font-weight: 800; transform: scale(1.1); box-shadow: 0 6px 18px rgba(168, 85, 247, 0.6); border: 2px solid #ffffff; z-index: 8888;';
    }

    const html = `
      <div style="display: inline-flex; align-items: center; justify-content: center; padding: 5px 12px; border-radius: 9999px; font-size: 13px; font-family: Inter, sans-serif; white-space: nowrap; cursor: pointer; transition: all 0.15s ease-in-out; ${bgStyle}">
        <span>${formattedPrice}</span>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-price-marker',
      iconSize: [76, 28],
      iconAnchor: [38, 14],
    });
  };

  const handleCityClick = (cityName) => {
    if (cityName === 'India (All)') {
      setSelectedCity('');
      if (onSelectCity) onSelectCity('');
    } else {
      setSelectedCity(cityName);
      if (onSelectCity) onSelectCity(cityName);
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border/80 shadow-2xl bg-card flex flex-col">
      {/* Top Floating Cities Navigation */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between gap-2 flex-wrap pointer-events-none">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 px-2 rounded-2xl bg-background/90 border border-border/80 backdrop-blur-xl shadow-xl pointer-events-auto max-w-full">
          {Object.entries(INDIAN_CITIES_MAP).map(([name, meta]) => {
            const isActive = (name === 'India (All)' && !selectedCity) || selectedCity.toLowerCase() === name.toLowerCase();
            return (
              <Button
                key={name}
                type="button"
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => handleCityClick(name)}
                className={`h-7 px-2.5 rounded-xl text-xs font-medium whitespace-nowrap gap-1 ${
                  isActive ? 'shadow-md font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{meta.icon}</span>
                <span>{name}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', background: '#0f172a' }}
        zoomControl={false}
      >
        <ChangeView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {properties.map((p, idx) => {
          const baseCoords = INDIAN_CITIES_MAP[p.city]?.coords || [28.6139, 77.2090];
          const lat = p.geoLat || baseCoords[0] + (((idx * 17) % 20) - 10) * 0.003;
          const lng = p.geoLng || baseCoords[1] + (((idx * 23) % 20) - 10) * 0.003;

          const lowestPrice = p.lowestPrice || p.rooms?.[0]?.pricePerNight || 2000;
          const isSelectedCity = selectedCity ? p.city?.toLowerCase()?.includes(selectedCity.toLowerCase()) : false;
          const isHovered = p.id === hoveredPropertyId;

          return (
            <Marker
              key={p.id}
              position={[lat, lng]}
              icon={createPriceIcon(lowestPrice, isSelectedCity, isHovered)}
              eventHandlers={{
                mouseover: () => onMarkerHover && onMarkerHover(p.id),
                mouseout: () => onMarkerHover && onMarkerHover(null),
              }}
            >
              <Popup className="custom-map-popup">
                <div className="w-56 p-1 text-slate-900">
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-2">
                    <img
                      src={p.thumbnailImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1 right-1 bg-black/70 text-white font-bold text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                      📍 {p.city}
                    </span>
                    {p.rooms?.some(r => r.isInstantBook) && (
                      <span className="absolute top-1 left-1 bg-indigo-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Zap size={9} /> Instant
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-600 mb-0.5 font-medium">
                    <MapPin size={11} className="text-indigo-600" />
                    <span>{p.city}, India</span>
                  </div>
                  <h4 className="font-bold text-xs leading-tight mb-1 line-clamp-1">{p.name}</h4>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200">
                    <div className="flex items-center gap-1 text-xs">
                      {p.avgRating ? (
                        <>
                          <Star size={11} className="text-amber-500 fill-amber-500" />
                          <span className="font-bold">{p.avgRating.toFixed(1)}</span>
                        </>
                      ) : (
                        <span className="text-slate-500 text-[10px]">New</span>
                      )}
                    </div>
                    <span className="font-bold text-xs text-indigo-700">₹{lowestPrice.toLocaleString()} / night</span>
                  </div>
                  <Button asChild size="sm" className="w-full mt-2 h-7 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Link to={`/properties/${p.id}`}>
                      View Property
                    </Link>
                  </Button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
