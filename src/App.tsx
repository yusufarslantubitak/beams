import { useGeoJSON } from './hooks/useGeoJSON';
import MapComponent from './components/MapComponent';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ErrorOverlay } from './components/ErrorOverlay';

function App() {
  const mapUrl = import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const geojsonUrl = import.meta.env.VITE_GEOJSON_URL || 'http://localhost:8000/hexagons.geojson';
  const minZoom = parseInt(import.meta.env.VITE_MIN_ZOOM || '2', 10);
  const maxZoom = parseInt(import.meta.env.VITE_MAX_ZOOM || '18', 10);
  const defaultZoom = parseInt(import.meta.env.VITE_DEFAULT_ZOOM || '4', 10);

  const { localGeoJSON, error, isLoading } = useGeoJSON(geojsonUrl);

  return (
    <div className='relative w-full h-screen overflow-hidden bg-slate-950'>
      {/* Map Container */}
      <div className='absolute inset-0 z-0'>
        <MapComponent
          geojson={localGeoJSON}
          mapUrl={mapUrl}
          minZoom={minZoom}
          maxZoom={maxZoom}
          defaultZoom={defaultZoom}
        />
      </div>

      <LoadingOverlay isLoading={isLoading && !error} />
      <ErrorOverlay error={error} />
    </div>
  );
}

export default App;
