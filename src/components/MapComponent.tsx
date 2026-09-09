import React, {
  useCallback,
  useState,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
  useMapEvents,
  Popup,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { FeatureCollection, Feature } from '@/lib/geoJSONSchema';
import type { MarkerFeature, MarkerFeatureCollection } from '@/lib/markerSchema';
import { MapMarker, MarkerTooltipCard } from '@/components/MapMarker';
import type {
  Feature as GeoJSONFeature,
  Geometry as GeoJSONGeometry,
} from 'geojson';
import { getGroupColorMapping, getFeatureColor } from '@/lib/colorMapping';
import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CircleX, X, Plus, Minus } from 'lucide-react';

interface MapComponentProps {
  geojson?: FeatureCollection | null;
  markers?: MarkerFeatureCollection | null;
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

const MapInstanceCapture: React.FC<{
  onMapReady: (map: L.Map) => void;
}> = ({ onMapReady }) => {
  const map = useMap();
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  return null;
};

const MapClickHandler: React.FC<{
  geojson: FeatureCollection | null | undefined;
  onFeaturesClick: (latlng: L.LatLng, features: Feature[]) => void;
  onMapClick?: () => void;
}> = ({ geojson, onFeaturesClick, onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick?.();
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

function applyZoomClass(map: L.Map) {
  const container = map?.getContainer?.();
  if (!container) return;
  const zoom = Math.round(map.getZoom());
  const cleanClasses = container.className
    .split(' ')
    .filter((c) => !c.startsWith('zoom-'));
  cleanClasses.push(`zoom-${zoom}`);
  container.className = cleanClasses.join(' ');
}

const ZoomHandler: React.FC = () => {
  const map = useMapEvents({
    zoom(e) {
      applyZoomClass(e.target);
    },
    zoomend(e) {
      applyZoomClass(e.target);
    },
  });

  React.useEffect(() => {
    applyZoomClass(map);
  }, [map]);

  return null;
};

interface ZoomControlWithLevelProps {
  minZoom?: number;
  maxZoom?: number;
}

const ZoomControlWithLevel: React.FC<ZoomControlWithLevelProps> = ({
  minZoom,
  maxZoom,
}) => {
  const map = useMap();
  const [zoom, setZoom] = useState<number>(() => Math.round(map.getZoom()));
  const controlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (map.zoomControl) {
      try {
        map.removeControl(map.zoomControl);
      } catch {
        /* ignore */
      }
    }
    if (controlRef.current) {
      L.DomEvent.disableClickPropagation(controlRef.current);
      L.DomEvent.disableScrollPropagation(controlRef.current);
    }
  }, [map]);

  useEffect(() => {
    const updateZoom = () => {
      setZoom(Math.round(map.getZoom()));
    };
    map.on('zoom', updateZoom);
    map.on('zoomend', updateZoom);
    return () => {
      map.off('zoom', updateZoom);
      map.off('zoomend', updateZoom);
    };
  }, [map]);

  const canZoomIn = maxZoom === undefined || zoom < maxZoom;
  const canZoomOut = minZoom === undefined || zoom > minZoom;

  return (
    <div className='leaflet-top leaflet-left'>
      <div
        ref={controlRef}
        className='leaflet-control m-6 flex flex-col items-center bg-white/60 hover:bg-white/70 backdrop-blur-lg border border-white/40 shadow-lg rounded-xl overflow-hidden transition-all select-none'
      >
        <button
          type='button'
          onClick={() => map.zoomIn()}
          disabled={!canZoomIn}
          className='w-7 h-7 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-white/60 active:scale-95 transition-all disabled:opacity-25 disabled:pointer-events-none cursor-pointer'
          title='Zoom in'
          aria-label='Zoom in'
        >
          <Plus className='w-3.5 h-3.5 stroke-[2.5]' />
        </button>

        <div
          className='w-full py-0.5 px-1.5 flex flex-col items-center justify-center border-y border-white/30 bg-white/30 text-center select-none min-w-7'
          title={`Zoom level ${zoom}`}
        >
          <span className='font-mono text-[11px] font-bold text-slate-800 tracking-tight leading-tight'>
            {zoom}
          </span>
        </div>

        <button
          type='button'
          onClick={() => map.zoomOut()}
          disabled={!canZoomOut}
          className='w-7 h-7 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-white/60 active:scale-95 transition-all disabled:opacity-25 disabled:pointer-events-none cursor-pointer'
          title='Zoom out'
          aria-label='Zoom out'
        >
          <Minus className='w-3.5 h-3.5 stroke-[2.5]' />
        </button>
      </div>
    </div>
  );
};

const DEFAULT_COLOR = '#3388ff';

const MapComponent: React.FC<MapComponentProps> = ({
  geojson,
  markers,
  mapUrl,
  minZoom,
  maxZoom,
  defaultZoom,
  onFeatureSelect,
}) => {
  // Center on Europe
  const center: [number, number] = [50, 10];

  const [tileErrorCount, setTileErrorCount] = useState(0);
  const [prevMapUrl, setPrevMapUrl] = useState(mapUrl);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [popupInfo, setPopupInfo] = useState<{
    latlng: L.LatLng;
    features: Feature[];
  } | null>(null);
  const [markerPopupInfo, setMarkerPopupInfo] = useState<{
    latlng: L.LatLngExpression;
    markers: MarkerFeature[];
  } | null>(null);

  const handleMarkerClick = useCallback(
    (feature: MarkerFeature, e: L.LeafletMouseEvent) => {
      if (!mapInstance || !markers?.features) return;

      // Close polygon feature popup if open
      setPopupInfo(null);

      const [featLng, featLat] = feature.geometry.coordinates;
      const clickedMarkerPoint = mapInstance.latLngToContainerPoint([
        featLat,
        featLng,
      ]);

      // Marker icon is 28x28px (radius 14px). Two icons visually overlap
      // when their centers are within 20px of each other.
      // Only include markers that directly overlap with the clicked marker.
      const OVERLAP_RADIUS_PX = 20;

      const overlapping = markers.features.filter((m) => {
        if (m.properties.id && m.properties.id === feature.properties.id) {
          return true;
        }
        const [mLng, mLat] = m.geometry.coordinates;
        const mPoint = mapInstance.latLngToContainerPoint([mLat, mLng]);
        const distToClickedMarker = clickedMarkerPoint.distanceTo(mPoint);
        return distToClickedMarker <= OVERLAP_RADIUS_PX;
      });

      // Ensure clicked feature is first, remaining ordered by proximity to clicked marker
      overlapping.sort((a, b) => {
        if (a.properties.id === feature.properties.id) return -1;
        if (b.properties.id === feature.properties.id) return 1;
        const [aLng, aLat] = a.geometry.coordinates;
        const [bLng, bLat] = b.geometry.coordinates;
        const distA = clickedMarkerPoint.distanceTo(
          mapInstance.latLngToContainerPoint([aLat, aLng]),
        );
        const distB = clickedMarkerPoint.distanceTo(
          mapInstance.latLngToContainerPoint([bLat, bLng]),
        );
        return distA - distB;
      });

      // Use exact mouse click coordinates on the map rather than marker coordinates
      const clickLatLng = e.originalEvent
        ? mapInstance.mouseEventToLatLng(e.originalEvent)
        : (e.latlng || [featLat, featLng]);

      setMarkerPopupInfo({
        latlng: clickLatLng,
        markers: overlapping,
      });
    },
    [mapInstance, markers],
  );

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
        if (feature.geometry.type === 'Polygon') {
          const coords = feature.geometry.coordinates[0];
          if (coords && coords.length > 0) {
            let sumLng = 0;
            let sumLat = 0;
            const numPoints =
              coords.length > 1 &&
              coords[0][0] === coords[coords.length - 1][0] &&
              coords[0][1] === coords[coords.length - 1][1]
                ? coords.length - 1
                : coords.length;
            for (let i = 0; i < numPoints; i++) {
              sumLng += coords[i][0];
              sumLat += coords[i][1];
            }
            const centerLat = sumLat / numPoints;
            const centerLng = sumLng / numPoints;
            const centerLatLng = L.latLng(centerLat, centerLng);
            (layer as L.Polygon).getCenter = () => centerLatLng;
          }
        }

        const machine = props.machine_no || '';
        const sat = props.sat_id || '';
        const beam = props.spot_beam || '';
        const arfcn = props.arfcn ? ` • ${props.arfcn}` : '';
        const content = `
          <div class="map-tooltip-content">
            <div class="map-tooltip-title">
              <span class="tooltip-key">Machine: </span>${machine}
            </div>
            <div class="map-tooltip-sub">
              <span class="tooltip-key">Sat: </span>${sat}
            </div>
            <div class="map-tooltip-meta">
              <span class="tooltip-key">Beam/ARFCN: </span>${beam}${arfcn}
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
      <style>{`.leaflet-control-attribution, .leaflet-control-zoom { display: none !important; }`}</style>
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
        zoomControl={false}
      >
        <ZoomControlWithLevel minZoom={minZoom} maxZoom={maxZoom} />
        <MapInstanceCapture onMapReady={setMapInstance} />
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

        {markers?.features &&
          (() => {
            // Count occurrences of exact same [lng, lat] coordinates
            const counts = new Map<string, number>();
            for (const f of markers.features) {
              const [fLng, fLat] = f.geometry.coordinates;
              const key = `${fLng},${fLat}`;
              counts.set(key, (counts.get(key) || 0) + 1);
            }

            return markers.features.map((feature, idx) => {
              const [lng, lat] = feature.geometry.coordinates;
              const exactCount = counts.get(`${lng},${lat}`) || 1;
              return (
                <MapMarker
                  key={feature.properties.id || `marker-${idx}`}
                  feature={feature}
                  badgeCount={exactCount > 1 ? exactCount : undefined}
                  onClick={handleMarkerClick}
                />
              );
            });
          })()}

        <ZoomHandler />

        <MapClickHandler
          geojson={geojson}
          onMapClick={() => setMarkerPopupInfo(null)}
          onFeaturesClick={(latlng, features) => {
            setMarkerPopupInfo(null);
            setPopupInfo({ latlng, features });
          }}
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

        {markerPopupInfo && (
          <Popup
            position={markerPopupInfo.latlng}
            offset={[0, 0]}
            eventHandlers={{
              remove: () => setMarkerPopupInfo(null),
            }}
            className='feature-popup marker-popup'
          >
            {markerPopupInfo.markers.length === 1 ? (
              <MarkerTooltipCard feature={markerPopupInfo.markers[0]} />
            ) : (
              <div className='flex flex-col min-w-56 max-w-76 py-0.5'>
                <div className='flex items-center justify-between pb-1 mb-1.5 border-b border-border/20 text-muted-foreground'>
                  <span className='text-[10px] font-medium tracking-tight flex items-center gap-1.5'>
                    <span className='inline-flex items-center justify-center min-w-4 h-4 px-1 text-[8.5px] rounded-full bg-muted text-muted-foreground font-mono font-medium'>
                      {markerPopupInfo.markers.length}
                    </span>
                    Overlapping markers
                  </span>
                </div>

                <div className='flex flex-col divide-y divide-border/30 max-h-80 overflow-y-auto pr-1'>
                  {markerPopupInfo.markers.map((feature, idx) => (
                    <div
                      key={feature.properties.id || idx}
                      className={idx > 0 ? 'pt-2.5' : 'pb-1'}
                    >
                      <MarkerTooltipCard feature={feature} />
                    </div>
                  ))}
                </div>
              </div>
            )}
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
