import React, { useState, useEffect } from 'react';
import type { FeatureCollection } from 'geojson';
import MapComponent from './MapComponent';

const LOCALSTORAGE_KEY = 'beamGeoJSON';

function getInitialGeoJSON(): { geojson: FeatureCollection | null; input: string } {
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
  const [feedback, setFeedback] = useState(initial.geojson ? 'Restored from storage' : '');
  const [localGeoJSON, setLocalGeoJSON] = useState<FeatureCollection | null>(initial.geojson);
  const [panelOpen, setPanelOpen] = useState(true);

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
      setFeedback(`Loaded "${file.name}"`);
    } catch {
      setError('Invalid GeoJSON file');
      setFeedback('');
    }
  };

  const handleSubmit = () => {
    try {
      const json = JSON.parse(geojsonInput) as FeatureCollection;
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(json));
      setLocalGeoJSON(json);
      setError('');
      setFeedback('Saved');
    } catch {
      setError('Invalid GeoJSON format');
      setFeedback('');
    }
  };

  const handleClear = () => {
    localStorage.removeItem(LOCALSTORAGE_KEY);
    setGeojsonInput('');
    setLocalGeoJSON(null);
    setError('');
    setFeedback('Cleared');
  };

  return (
    <div className='app-layout'>
      <div className='map-fullscreen'>
        <MapComponent geojson={localGeoJSON} />
      </div>

      <div className={`geo-panel ${panelOpen ? 'geo-panel--open' : 'geo-panel--closed'}`}>
        <button
          type='button'
          className='geo-panel-toggle'
          onClick={() => setPanelOpen(!panelOpen)}
          title={panelOpen ? 'Hide panel' : 'Show panel'}
          aria-label={panelOpen ? 'Hide panel' : 'Show panel'}
        >
          {panelOpen ? '◀' : '▶'}
        </button>

        <div className='geo-panel-content'>
          <h2 className='geo-panel-title'>GeoJSON Input</h2>
          <p className='geo-panel-desc'>Paste GeoJSON below or upload a <code>.geojson</code> or <code>.json</code> file. Saved to localStorage.</p>

          <details className='geo-format-hint'>
            <summary>Expected format</summary>
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

Polygon: array of rings; each ring = closed loop of [x,y] coords`}</pre>
          </details>

          <label className='geo-input-label'>
            <span>Paste GeoJSON</span>
            <textarea
              className='geo-textarea'
              value={geojsonInput}
              onChange={handleInputChange}
              placeholder='{ "type": "FeatureCollection", "features": [...] }'
              rows={30}
              spellCheck={false}
            />
          </label>

          <div className='geo-actions'>
            <label className='geo-file-label'>
              <input type='file' accept='.geojson,.json' onChange={handleFileChange} className='geo-file-input' />
              {' '}
              Choose file
            </label>
            <button type='button' className='geo-save-btn' onClick={handleSubmit}>
              Save
            </button>
            <button type='button' className='geo-clear-btn' onClick={handleClear}>
              Clear
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
