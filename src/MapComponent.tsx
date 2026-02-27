import React from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { FeatureCollection } from 'geojson';

interface MapComponentProps {
  geojson?: FeatureCollection | null;
  mapUrl?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({ geojson, mapUrl }) => {
  const center: [number, number] = [0.01, 0.01];
  const zoom = 15;
  const geoJSONStyle = {
    color: '#3388ff',
    weight: 2,
    fillColor: '#3388ff',
    fillOpacity: 0.3,
  };

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
      {mapUrl && (
        <TileLayer
          attribution=''
          url={mapUrl}
        />
      )}
      {geojson && (
        <GeoJSON data={geojson} style={geoJSONStyle} />
      )}
    </MapContainer>
  );
};

export default MapComponent;
