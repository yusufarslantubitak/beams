import React, { useCallback, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { FeatureCollection, Feature, Geometry } from 'geojson';

interface MapComponentProps {
  geojson?: FeatureCollection | null;
  mapUrl?: string;
  minZoom?: number;
  maxZoom?: number;
  defaultZoom?: number;
}

const DEFAULT_COLOR = '#3388ff';

const MapComponent: React.FC<MapComponentProps> = ({
  geojson,
  mapUrl,
  minZoom = 2,
  maxZoom = 18,
  defaultZoom = 4,
}) => {
  // Always center on 0,0
  const center: [number, number] = [0, 0];

  const [tileErrorCount, setTileErrorCount] = useState(0);
  const [prevMapUrl, setPrevMapUrl] = useState(mapUrl);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);

  // Reset errors if mapUrl prop changes
  if (mapUrl !== prevMapUrl) {
    setPrevMapUrl(mapUrl);
    setTileErrorCount(0);
    setIsWarningDismissed(false);
  }

  const showWarning = tileErrorCount > 3 && !isWarningDismissed;

  const featureStyle = useCallback((feature?: Feature<Geometry>) => {
    const color = feature?.properties?.color || DEFAULT_COLOR;
    return {
      color,
      weight: 2,
      fillColor: color,
      fillOpacity: 0.3,
    };
  }, []);

  const onEachFeature = useCallback(
    (feature: Feature<Geometry>, layer: L.Layer) => {
      const label = feature.properties?.label;
      if (label != null) {
        layer.bindTooltip(String(label), {
          permanent: true,
          direction: 'center',
          className: 'geojson-label',
        });
      }
    },
    [],
  );

  return (
    <div className="relative w-full h-full">
      <style>{`.leaflet-control-attribution { display: none !important; }`}</style>
      <MapContainer
        center={center}
        zoom={defaultZoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        style={{
          height: '100%',
          width: '100%',
          zIndex: 0,
        }}
        zoomControl={true}
      >
        {mapUrl && (
          <TileLayer 
            attribution='' 
            url={mapUrl} 
            eventHandlers={{
              tileerror: () => {
                // Increment error count for each failed tile
                setTileErrorCount((prev) => prev + 1);
              }
            }}
          />
        )}
        {geojson && (
          <GeoJSON
            key={JSON.stringify(geojson)}
            data={geojson}
            style={featureStyle}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>

      {/* Map Tile Error Warning Toast */}
      {showWarning && (
        <div className="absolute bottom-6 right-6 z-50 px-4 py-3 bg-red-500/90 text-red-50 font-medium text-sm rounded-lg shadow-lg backdrop-blur-md border border-red-400 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>
              Harita sunucusuna ulaşılamıyor. Lütfen harita adresinizi kontrol edin.
            </span>
            <button 
              onClick={() => setIsWarningDismissed(true)} 
              className="ml-2 hover:bg-red-600/50 p-1 rounded-full text-red-100 transition-colors"
              aria-label="Kapat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
