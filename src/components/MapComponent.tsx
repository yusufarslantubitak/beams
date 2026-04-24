import React, { useCallback, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { FeatureCollection } from '@/lib/geoJSONSchema';
import type {
  Feature as GeoJSONFeature,
  Geometry as GeoJSONGeometry,
} from 'geojson';
import { getGroupColorMapping, getFeatureColor } from '@/lib/colorMapping';
import type { Feature } from '@/lib/geoJSONSchema';
import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CircleX, X } from 'lucide-react';

interface MapComponentProps {
  geojson?: FeatureCollection | null;
  mapUrl: string;
  minZoom: number;
  maxZoom: number;
  defaultZoom: number;
}

const DEFAULT_COLOR = '#3388ff';

const MapComponent: React.FC<MapComponentProps> = ({
  geojson,
  mapUrl,
  minZoom,
  maxZoom,
  defaultZoom,
}) => {
  // Always center on 0,0
  const center: [number, number] = [0, 0];

  const [tileErrorCount, setTileErrorCount] = useState(0);
  const [prevMapUrl, setPrevMapUrl] = useState(mapUrl);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);

  // Build group-to-color mapping from features
  const groupColorMap = useMemo(() => getGroupColorMapping(geojson), [geojson]);

  // Reset errors if mapUrl prop changes
  if (mapUrl !== prevMapUrl) {
    setPrevMapUrl(mapUrl);
    setTileErrorCount(0);
    setIsWarningDismissed(false);
  }

  const showWarning = tileErrorCount > 3 && !isWarningDismissed;

  const featureStyle = useCallback(
    (geoFeature?: GeoJSONFeature<GeoJSONGeometry>) => {
      // Cast the geojson library type to our Zod-inferred type for color lookup.
      // This is safe because the data has already been validated through our schema.
      const feature = geoFeature as Feature | undefined;
      const color = getFeatureColor(feature, groupColorMap, DEFAULT_COLOR);
      return {
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.3,
      };
    },
    [groupColorMap],
  );

  const onEachFeature = useCallback(
    (feature: GeoJSONFeature<GeoJSONGeometry>, layer: L.Layer) => {
      const props = feature.properties;
      if (props && typeof props === 'object' && 'label' in props) {
        const label = props.label;
        if (typeof label === 'string') {
          layer.bindTooltip(label, {
            permanent: true,
            direction: 'center',
            className: 'geojson-label',
          });
        }
      }
    },
    [],
  );

  return (
    <div className='relative w-full h-full'>
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
              },
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
        <div className='absolute bottom-6 left-6 z-50'>
          <Alert
            variant='destructive'
            className='shadow-lg border-red-200 bg-red-50 ring-1 ring-red-100'
          >
            <CircleX className='w-5 h-5' />
            <AlertTitle className='text-sm font-medium'>
              Map server unreachable. Check the Map URL.
            </AlertTitle>
            <AlertAction>
              <Button
                variant='ghost'
                size='icon-xs'
                onClick={() => setIsWarningDismissed(true)}
                className='text-red-600 hover:text-red-700'
                aria-label='Close'
              >
                <X className='w-4 h-4' />
              </Button>
            </AlertAction>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
