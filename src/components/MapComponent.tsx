import React, { useCallback, useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMapEvents,
  Popup,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { FeatureCollection, Feature } from '@/lib/geoJSONSchema';
import type {
  Feature as GeoJSONFeature,
  Geometry as GeoJSONGeometry,
} from 'geojson';
import { getGroupColorMapping, getFeatureColor } from '@/lib/colorMapping';
import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CircleX, X } from 'lucide-react';

interface MapComponentProps {
  geojson?: FeatureCollection | null;
  mapUrl: string;
  minZoom: number;
  maxZoom: number;
  defaultZoom: number;
  onFeatureSelect: (value: string) => void;
}

/**
 * Simple point-in-polygon check using ray casting algorithm.
 */
function isPointInPolygon(
  point: [number, number],
  polygon: number[][][],
): boolean {
  const x = point[0],
    y = point[1];
  let inside = false;

  // We check each ring (outer + holes)
  for (const ring of polygon) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0],
        yi = ring[i][1];
      const xj = ring[j][0],
        yj = ring[j][1];

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
  }
  return inside;
}

const MapClickHandler: React.FC<{
  geojson: FeatureCollection | null | undefined;
  onFeaturesClick: (latlng: L.LatLng, features: Feature[]) => void;
}> = ({ geojson, onFeaturesClick }) => {
  useMapEvents({
    click(e) {
      if (!geojson?.features) return;

      const clickedFeatures = geojson.features.filter((feature) => {
        const { type, coordinates } = feature.geometry;
        if (type === 'Polygon') {
          return isPointInPolygon(
            [e.latlng.lng, e.latlng.lat],
            coordinates as number[][][],
          );
        } else if (type === 'MultiPolygon') {
          return (coordinates as number[][][][]).some((poly) =>
            isPointInPolygon([e.latlng.lng, e.latlng.lat], poly),
          );
        }
        return false;
      });

      if (clickedFeatures.length > 0) {
        onFeaturesClick(e.latlng, clickedFeatures as Feature[]);
      }
    },
  });
  return null;
};

const DEFAULT_COLOR = '#3388ff';

const MapComponent: React.FC<MapComponentProps> = ({
  geojson,
  mapUrl,
  minZoom,
  maxZoom,
  defaultZoom,
  onFeatureSelect,
}) => {
  // Always center on 0,0
  const center: [number, number] = [0, 0];

  const [tileErrorCount, setTileErrorCount] = useState(0);
  const [prevMapUrl, setPrevMapUrl] = useState(mapUrl);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);
  const [popupInfo, setPopupInfo] = useState<{
    latlng: L.LatLng;
    features: Feature[];
  } | null>(null);

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
      const props = feature.properties as Feature['properties'];
      if (props) {
        const content = `
          <div class="map-tooltip-content" style="display: flex; flex-direction: column; align-items: center; text-align: center; line-height: 1.1;">
            <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em;">
              <span class="tooltip-key">Machine: </span>${props.machine_no || ''}
            </div>
            <div style="font-size: 13px; font-weight: 600; margin-top: 1px;">
              <span class="tooltip-key">Sat: </span>${props.sat_id || ''}
            </div>
            <div style="font-size: 13px; font-weight: 500; opacity: 0.9; margin-top: 1px;">
              <span class="tooltip-key">Beam/ARFCN: </span>${props.spot_beam || ''}${props.arfcn ? ` • ${props.arfcn}` : ''}
            </div>
          </div>
        `;
        layer.bindTooltip(content, {
          permanent: true,
          direction: 'center',
          className: 'geojson-label',
        });
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

        <MapClickHandler
          geojson={geojson}
          onFeaturesClick={(latlng, features) =>
            setPopupInfo({ latlng, features })
          }
        />

        {popupInfo && (
          <Popup
            position={popupInfo.latlng}
            eventHandlers={{
              remove: () => setPopupInfo(null),
            }}
            className='feature-popup'
          >
            <div className='flex flex-col gap-2 min-w-45 max-w-65 py-0.5'>
              <div className='flex items-center border-b border-border/30 pb-1.5 mb-0.5'>
                <span className='font-bold text-[11px] text-foreground/80 uppercase tracking-tight'>
                  Features ({popupInfo.features.length})
                </span>
              </div>

              <div className='flex flex-col gap-1 max-h-60 overflow-y-auto pr-1 scrollbar-hide'>
                {popupInfo.features.map((feature, idx) => (
                  <div
                    key={feature.properties.id || idx}
                    onClick={() => {
                      if (feature.properties.sat_id) {
                        onFeatureSelect(feature.properties.sat_id);
                      }
                    }}
                    className='flex flex-col gap-0.5 p-1.5 rounded-md hover:bg-primary/5 transition-colors cursor-pointer border border-transparent hover:border-border/20 group/item'
                  >
                    {/* Row 1: Color + Sat ID (Default Click) */}
                    <div className='flex items-center gap-2'>
                      <div
                        className='w-2 h-2 rounded-full shrink-0 shadow-sm'
                        style={{ backgroundColor: feature.properties.color }}
                      />
                      <div
                        className='text-[12px] font-bold text-foreground leading-tight truncate'
                        title='Sat ID'
                      >
                        {feature.properties.sat_id}
                      </div>
                    </div>

                    {/* Row 2: Machine No (Clickable) + Spot Beam + ARFCN */}
                    <div className='flex items-center gap-1.5 pl-4 overflow-hidden mt-0.5'>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            onFeatureSelect &&
                            feature.properties.machine_no
                          ) {
                            onFeatureSelect(feature.properties.machine_no);
                          }
                        }}
                        className='text-[9px] font-bold text-muted-foreground uppercase tracking-tight shrink-0 hover:text-primary underline decoration-muted-foreground/30 underline-offset-2 hover:decoration-primary/50 transition-colors cursor-pointer'
                        title='Machine No'
                      >
                        {feature.properties.machine_no || 'General'}
                      </button>
                      {feature.properties.spot_beam && (
                        <>
                          <span className='text-muted-foreground/20 text-[9px]'>
                            |
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                onFeatureSelect &&
                                feature.properties.spot_beam
                              ) {
                                onFeatureSelect(feature.properties.spot_beam);
                              }
                            }}
                            className='text-[10px] text-muted-foreground italic truncate opacity-80 hover:text-primary hover:opacity-100 underline decoration-muted-foreground/20 underline-offset-2 hover:decoration-primary/40 transition-colors cursor-pointer'
                            title='Spot Beam'
                          >
                            {feature.properties.spot_beam}
                          </button>
                        </>
                      )}
                      {feature.properties.arfcn !== undefined && (
                        <>
                          <span className='text-muted-foreground/20 text-[9px]'>
                            |
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                onFeatureSelect &&
                                feature.properties.arfcn !== undefined
                              ) {
                                onFeatureSelect(
                                  String(feature.properties.arfcn),
                                );
                              }
                            }}
                            className='text-[10px] font-mono text-primary/70 font-semibold tracking-tighter hover:text-primary underline decoration-primary/20 underline-offset-2 hover:decoration-primary/50 transition-colors cursor-pointer'
                            title='ARFCN'
                          >
                            {feature.properties.arfcn}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Popup>
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
