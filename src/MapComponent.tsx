import React, { useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { FeatureCollection, Feature, Geometry } from 'geojson';

interface MapComponentProps {
  geojson?: FeatureCollection | null;
  mapUrl?: string;
  fitBoundsFlag?: number; // increment to trigger fit bounds
}

const DEFAULT_COLOR = '#3388ff';

/** Inner component that listens for fitBoundsFlag changes */
function FitBounds({
  geojson,
  flag,
}: {
  geojson?: FeatureCollection | null;
  flag?: number;
}) {
  const map = useMap();
  const prevFlag = useRef(flag);

  useEffect(() => {
    if (flag !== prevFlag.current && geojson && geojson.features.length > 0) {
      prevFlag.current = flag;
      const geoLayer = L.geoJSON(geojson);
      const bounds = geoLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [flag, geojson, map]);

  return null;
}

const MapComponent: React.FC<MapComponentProps> = ({
  geojson,
  mapUrl,
  fitBoundsFlag,
}) => {
  const center: [number, number] = [0.01, 0.01];
  const zoom = 15;

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
    <MapContainer
      center={center}
      zoom={zoom}
      style={{
        height: '100%',
        width: '100%',
      }}
      zoomControl={true}
    >
      <FitBounds geojson={geojson} flag={fitBoundsFlag} />
      {mapUrl && <TileLayer attribution='' url={mapUrl} />}
      {geojson && (
        <GeoJSON
          key={JSON.stringify(geojson)}
          data={geojson}
          style={featureStyle}
          onEachFeature={onEachFeature}
        />
      )}
    </MapContainer>
  );
};

export default MapComponent;
