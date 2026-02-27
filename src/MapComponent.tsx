import React from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { FeatureCollection } from 'geojson';

interface MapComponentProps {
  geojson?: FeatureCollection | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ geojson }) => {
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
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      {geojson && (
        <GeoJSON data={geojson} style={geoJSONStyle} />
      )}
    </MapContainer>
  );
};

export default MapComponent;
