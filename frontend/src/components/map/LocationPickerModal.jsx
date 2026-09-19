import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { fixLeafletMarkerIcons, createColoredIcon, reverseGeocodeNominatim, searchAddressNominatim } from '../../utils/geo';
import { MapPin, X, Check, Search, Loader2 } from 'lucide-react';

export const LocationPickerModal = ({
  isOpen,
  onClose,
  onConfirm,
  initialCoordinates = [73.8567, 18.5204], // Pune default [lng, lat]
  title = 'Pick Location on Map',
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [selectedCoords, setSelectedCoords] = useState(initialCoordinates);
  const [selectedAddress, setSelectedAddress] = useState('Resolving address...');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fixLeafletMarkerIcons();
  }, []);

  // Initialize Leaflet map when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const [initLng, initLat] = initialCoordinates || [73.8567, 18.5204];

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [initLat, initLng],
          zoom: 13,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        const marker = L.marker([initLat, initLng], {
          icon: createColoredIcon('#10b981'),
          draggable: true,
        }).addTo(map);

        marker.on('dragend', async () => {
          const pos = marker.getLatLng();
          handleLocationUpdate(pos.lng, pos.lat);
        });

        map.on('click', (e) => {
          marker.setLatLng(e.latlng);
          handleLocationUpdate(e.latlng.lng, e.latlng.lat);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
      } else {
        mapInstanceRef.current.invalidateSize();
        mapInstanceRef.current.setView([initLat, initLng], 13);
        if (markerRef.current) {
          markerRef.current.setLatLng([initLat, initLng]);
        }
      }

      handleLocationUpdate(initLng, initLat);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen]);

  const handleLocationUpdate = async (lng, lat) => {
    setSelectedCoords([lng, lat]);
    setLoadingAddress(true);
    const address = await reverseGeocodeNominatim(lng, lat);
    setSelectedAddress(address);
    setLoadingAddress(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchAddressNominatim(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const selectSearchResult = (item) => {
    const [lng, lat] = item.coordinates;
    setSelectedCoords([lng, lat]);
    setSelectedAddress(item.address);
    setSearchResults([]);
    setSearchQuery('');

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm({
        address: selectedAddress,
        coordinates: selectedCoords,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">{title}</h3>
              <p className="text-[11px] text-slate-400">Click map or drag the pin to pinpoint location</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search inside Modal */}
        <div className="p-3 bg-slate-950/70 border-b border-slate-800 relative">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search place name in map..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition disabled:opacity-50"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Search Dropdown in Modal */}
          {searchResults.length > 0 && (
            <div className="absolute left-3 right-3 mt-1.5 z-20 max-h-48 overflow-y-auto rounded-xl bg-slate-900 border border-slate-800 shadow-2xl divide-y divide-slate-800/60">
              {searchResults.map((res, i) => (
                <div
                  key={i}
                  onClick={() => selectSearchResult(res)}
                  className="p-2.5 hover:bg-slate-800 cursor-pointer text-xs transition"
                >
                  <p className="font-bold text-white">{res.shortName}</p>
                  <p className="text-slate-400 line-clamp-1 text-[11px]">{res.address}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaflet Map Canvas */}
        <div className="flex-1 min-h-[320px] w-full relative">
          <div ref={mapContainerRef} className="w-full h-full min-h-[320px]" />
        </div>

        {/* Selected Location Bar & Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 pr-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Selected Address
            </span>
            <p className="text-xs text-slate-200 font-medium line-clamp-2 mt-0.5">
              {loadingAddress ? 'Reverse geocoding coordinates...' : selectedAddress}
            </p>
            <span className="text-[10px] font-mono text-brand-400/80 mt-0.5 block">
              [{selectedCoords[0]?.toFixed(4)}, {selectedCoords[1]?.toFixed(4)}]
            </span>
          </div>

          <div className="flex gap-2 self-end sm:self-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" /> Confirm Pin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
