import React, { useState, useEffect } from 'react';
import type { FeatureCollection } from 'geojson';
import MapComponent from './MapComponent';

const LOCALSTORAGE_KEY = 'beamGeoJSON';
const MAP_URL_KEY = 'beamMapUrl';

function getInitialGeoJSON(): {
  geojson: FeatureCollection | null;
  input: string;
} {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as FeatureCollection;
      return { geojson: parsed, input: JSON.stringify(parsed, null, 2) };
    }
  } catch {
    /* ignore */
  }
  return { geojson: null, input: '' };
}

function App() {
  const initial = getInitialGeoJSON();
  const [geojsonInput, setGeojsonInput] = useState(initial.input);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(
    initial.geojson ? 'Depolamadan geri yüklendi' : '',
  );
  const [localGeoJSON, setLocalGeoJSON] = useState<FeatureCollection | null>(
    initial.geojson,
  );
  const [panelOpen, setPanelOpen] = useState(true);
  const [mapUrl, setMapUrl] = useState(
    () =>
      localStorage.getItem(MAP_URL_KEY) ??
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  );

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(''), 2500);
    return () => clearTimeout(t);
  }, [feedback]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGeojsonInput(e.target.value);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text) as FeatureCollection;
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(json));
      setLocalGeoJSON(json);
      setGeojsonInput(JSON.stringify(json, null, 2));
      setError('');
      setFeedback(`"${file.name}" yüklendi`);
    } catch {
      setError('Geçersiz GeoJSON dosyası');
      setFeedback('');
    }
  };

  const handleSubmit = () => {
    try {
      const json = JSON.parse(geojsonInput) as FeatureCollection;
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(json));
      setLocalGeoJSON(json);
      setError('');
      setFeedback('Kaydedildi');
    } catch {
      setError('Geçersiz GeoJSON biçimi');
      setFeedback('');
    }
  };

  const handleClear = () => {
    localStorage.removeItem(LOCALSTORAGE_KEY);
    setGeojsonInput('');
    setLocalGeoJSON(null);
    setError('');
    setFeedback('Temizlendi');
  };

  const handleMapUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMapUrl(value);
    const trimmed = value.trim();
    if (trimmed) {
      localStorage.setItem(MAP_URL_KEY, trimmed);
    } else {
      localStorage.removeItem(MAP_URL_KEY);
    }
  };

  return (
    <div className='app-layout'>
      <div className='map-fullscreen'>
        <MapComponent geojson={localGeoJSON} mapUrl={mapUrl || undefined} />
      </div>

      <div
        className={`geo-panel ${panelOpen ? 'geo-panel--open' : 'geo-panel--closed'}`}
      >
        <button
          type='button'
          className='geo-panel-toggle'
          onClick={() => setPanelOpen(!panelOpen)}
          title={panelOpen ? 'Paneli gizle' : 'Paneli göster'}
          aria-label={panelOpen ? 'Paneli gizle' : 'Paneli göster'}
        >
          {panelOpen ? '◀' : '▶'}
        </button>

        <div className='geo-panel-content'>
          <h2 className='geo-panel-title'>GeoJSON Girişi</h2>

          <label className='geo-input-label'>
            <span>Harita döşeme URL'si</span>
            <input
              type='text'
              className='geo-map-url-input'
              value={mapUrl}
              onChange={handleMapUrlChange}
              placeholder='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />
          </label>
          <p className='geo-panel-desc'>
            GeoJSON'u aşağıya yapıştırın veya <code>.geojson</code> ya da{' '}
            <code>.json</code> dosyası yükleyin.
          </p>

          <details className='geo-format-hint'>
            <summary>Beklenen biçim</summary>
            <pre className='geo-format-example'>{`{
  "type": "FeatureCollection",
  "features": [           // features[0], features[1], ...
    {
      "type": "Feature",
      "properties": { "id": "hex_1" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [x, y], [x, y], [x, y], ...
        ]]
      }
    }
  ]
}

Polygon: halka dizisi; her halka = [x,y] koordinatlarından kapalı döngü`}</pre>
          </details>

          <label className='geo-input-label'>
            <span>GeoJSON Yapıştır</span>
            <textarea
              className='geo-textarea'
              value={geojsonInput}
              onChange={handleInputChange}
              placeholder='{ "type": "FeatureCollection", "features": [...] }'
              rows={20}
              spellCheck={false}
            />
          </label>

          <div className='geo-actions'>
            <label className='geo-file-label'>
              <input
                type='file'
                accept='.geojson,.json'
                onChange={handleFileChange}
                className='geo-file-input'
              />{' '}
              Dosya seç
            </label>
            <button
              type='button'
              className='geo-save-btn'
              onClick={handleSubmit}
            >
              Kaydet
            </button>
            <button
              type='button'
              className='geo-clear-btn'
              onClick={handleClear}
            >
              Temizle
            </button>
          </div>

          {error && <p className='geo-error'>{error}</p>}
          {feedback && <p className='geo-feedback'>{feedback}</p>}
        </div>
      </div>
    </div>
  );
}

export default App;
