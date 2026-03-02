import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { FeatureCollection, Feature } from 'geojson';
import MapComponent from './MapComponent';

const LOCALSTORAGE_KEY = 'beamGeoJSON';
const MAP_URL_KEY = 'beamMapUrl';
const MAX_PREVIEW_LINES = 40;

/** Accept a features array OR a full FeatureCollection; always return a FeatureCollection. */
function toFeatureCollection(input: unknown): FeatureCollection {
  if (Array.isArray(input)) {
    return { type: 'FeatureCollection', features: input as Feature[] };
  }
  const obj = input as Record<string, unknown>;
  if (obj.type === 'FeatureCollection' && Array.isArray(obj.features)) {
    return obj as unknown as FeatureCollection;
  }
  throw new Error('Geçersiz GeoJSON');
}

function getInitialGeoJSON(): {
  geojson: FeatureCollection | null;
  input: string;
} {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY);
    if (stored) {
      const parsed = toFeatureCollection(JSON.parse(stored));
      return { geojson: parsed, input: JSON.stringify(parsed, null, 2) };
    }
  } catch {
    /* ignore */
  }
  return { geojson: null, input: '' };
}

function truncateLines(
  text: string,
  max: number,
): { text: string; truncated: boolean; total: number } {
  const lines = text.split('\n');
  if (lines.length <= max)
    return { text, truncated: false, total: lines.length };
  return {
    text: lines.slice(0, max).join('\n') + '\n...',
    truncated: true,
    total: lines.length,
  };
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
  const [fitBoundsFlag, setFitBoundsFlag] = useState(0);
  const [editing, setEditing] = useState(!initial.geojson);
  const savedInputRef = useRef(initial.input);
  const [mapUrl, setMapUrl] = useState(
    () =>
      localStorage.getItem(MAP_URL_KEY) ??
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  );

  const preview = useMemo(() => {
    if (!geojsonInput) return null;
    return truncateLines(geojsonInput, MAX_PREVIEW_LINES);
  }, [geojsonInput]);

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
      const json = toFeatureCollection(JSON.parse(text));
      const pretty = JSON.stringify(json, null, 2);
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(json));
      setLocalGeoJSON(json);
      setGeojsonInput(pretty);
      setEditing(false);
      setError('');
      setFeedback(`"${file.name}" yüklendi`);
    } catch {
      setError('Geçersiz GeoJSON dosyası');
      setFeedback('');
    }
  };

  const handleSubmit = () => {
    try {
      const json = toFeatureCollection(JSON.parse(geojsonInput));
      const pretty = JSON.stringify(json, null, 2);
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(json));
      setLocalGeoJSON(json);
      setGeojsonInput(pretty);
      setEditing(false);
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
    setEditing(true);
    setError('');
    setFeedback('Temizlendi');
  };

  const handleMapUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMapUrl(value);
    const trimmed = value.trim();
    if (trimmed) localStorage.setItem(MAP_URL_KEY, trimmed);
    else localStorage.removeItem(MAP_URL_KEY);
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      {/* Map */}
      <div className='absolute inset-0 z-0'>
        <MapComponent
          geojson={localGeoJSON}
          mapUrl={mapUrl || undefined}
          fitBoundsFlag={fitBoundsFlag}
        />
      </div>

      {/* Panel */}
      <div className='fixed top-5 right-5 z-1000 flex flex-row-reverse'>
        {/* Toggle */}
        <button
          type='button'
          onClick={() => setPanelOpen(!panelOpen)}
          title={panelOpen ? 'Paneli gizle' : 'Paneli göster'}
          className='shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-base cursor-pointer bg-slate-900/85 text-white/90 border border-white/10 backdrop-blur-xl transition-all duration-200 hover:bg-slate-800/95 hover:text-white hover:border-white/20'
        >
          {panelOpen ? (
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M15 18l-6-6 6-6' />
            </svg>
          ) : (
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M9 18l6-6-6-6' />
            </svg>
          )}
        </button>

        {/* Content */}
        {panelOpen && (
          <div className='mr-3 flex flex-col min-w-105 max-w-135 max-h-[calc(100vh-56px)] bg-slate-900/88 rounded-xl border border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl'>
            <div className='flex-1 overflow-y-auto scrollbar-hide p-5 pb-2'>
              <h2 className='mb-1.5 text-xl font-semibold tracking-tight text-white'>
                GeoJSON Girişi
              </h2>

              {/* Map tile URL */}
              <label className='flex flex-col gap-2 mb-4'>
                <span className='text-sm font-medium text-white/90'>
                  Harita döşeme URL'si
                </span>
                <input
                  type='text'
                  value={mapUrl}
                  onChange={handleMapUrlChange}
                  placeholder='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                  className='w-full px-3 py-2.5 font-mono text-xs leading-relaxed rounded-lg border border-white/12 bg-black/25 text-white/95 placeholder:text-white/35 focus:outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/20 transition-all'
                />
              </label>

              <p className='mb-4 text-sm leading-relaxed text-white/75'>
                GeoJSON'u aşağıya yapıştırın veya{' '}
                <code className='px-1.5 py-0.5 font-mono text-[0.8em] bg-white/8 rounded text-white/90'>
                  .geojson
                </code>{' '}
                ya da{' '}
                <code className='px-1.5 py-0.5 font-mono text-[0.8em] bg-white/8 rounded text-white/90'>
                  .json
                </code>{' '}
                dosyası yükleyin.
              </p>

              {/* Format hint */}
              <details className='mb-4 text-sm'>
                <summary className='cursor-pointer text-white/85 font-medium py-2'>
                  Beklenen biçim
                </summary>
                <pre className='mt-3 p-3.5 font-mono text-xs leading-relaxed bg-black/35 rounded-lg border border-white/6 whitespace-pre-wrap text-white/85'>
                  {`{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "id": "hex_1", "color": "#e74c3c" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[ [x, y], [x, y], ... ]]
      }
    }
  ]
}

color: isteğe bağlı renk hex kodu (ör. #e74c3c)`}
                </pre>
              </details>

              {/* Content area — edit or preview */}
              <div className='min-h-0'>
                {editing ? (
                  <label className='flex flex-col gap-2'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium text-white/90'>
                        GeoJSON İçeriği
                      </span>
                      {localGeoJSON && (
                        <button
                          type='button'
                          onClick={() => {
                            setGeojsonInput(savedInputRef.current);
                            setEditing(false);
                            setError('');
                          }}
                          className='text-xs text-red-400 hover:text-red-300 cursor-pointer transition-colors'
                        >
                          İptal
                        </button>
                      )}
                    </div>
                    <div className='relative flex rounded-lg border border-white/12 bg-black/25 focus-within:border-blue-500 focus-within:ring-[3px] focus-within:ring-blue-500/20 transition-all'>
                      <div
                        className='shrink-0 py-3 pl-3 pr-1 font-mono text-xs leading-relaxed text-white/25 select-none text-right'
                        aria-hidden='true'
                      >
                        {(geojsonInput || ' ').split('\n').map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>
                      <textarea
                        value={geojsonInput}
                        onChange={handleInputChange}
                        placeholder='{ "type": "FeatureCollection", "features": [...] }'
                        rows={16}
                        spellCheck={false}
                        className='w-full min-h-30 py-3 pr-3.5 pl-2 font-mono text-xs leading-relaxed bg-transparent text-white/95 placeholder:text-white/35 resize-vertical focus:outline-none'
                      />
                    </div>
                  </label>
                ) : (
                  preview && (
                    <div>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm font-medium text-white/90'>
                          İçerik Önizleme
                        </span>
                        <div className='flex items-center gap-3'>
                          {preview.truncated && (
                            <span className='text-xs text-white/50'>
                              {preview.total} satır
                            </span>
                          )}
                          <button
                            type='button'
                            onClick={() => {
                              savedInputRef.current = geojsonInput;
                              setEditing(true);
                            }}
                            className='text-xs text-blue-400 hover:text-blue-300 cursor-pointer transition-colors'
                          >
                            Düzenle
                          </button>
                        </div>
                      </div>
                      <pre
                        className='p-3.5 font-mono text-xs leading-relaxed bg-black/25 rounded-lg border border-white/12 text-white/85 max-h-120 overflow-y-auto scrollbar-hide whitespace-pre-wrap cursor-text'
                        onClick={() => {
                          savedInputRef.current = geojsonInput;
                          setEditing(true);
                        }}
                      >
                        {preview.text.split('\n').map((line, i) => (
                          <span key={i} className='flex'>
                            <span className='inline-block w-8 shrink-0 text-right mr-3 text-white/25 select-none'>
                              {i + 1}
                            </span>
                            <span className='flex-1'>
                              {line}
                              {'\n'}
                            </span>
                          </span>
                        ))}
                      </pre>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Actions — pinned at bottom */}
            <div className='shrink-0 flex items-center gap-2.5 flex-wrap px-5 py-3 border-t border-white/8'>
              <label className='inline-flex items-center px-4 py-2.5 text-sm font-medium cursor-pointer bg-white/6 rounded-lg border border-white/12 text-white/90 hover:bg-white/10 hover:border-white/18 transition-all'>
                <input
                  type='file'
                  accept='.geojson,.json'
                  onChange={handleFileChange}
                  className='hidden'
                />
                Yükle
              </label>
              <button
                type='button'
                onClick={handleSubmit}
                className='px-5 py-2.5 text-sm font-medium bg-blue-500 text-white rounded-lg border-0 hover:bg-blue-600 transition-colors cursor-pointer'
              >
                Kaydet
              </button>
              <button
                type='button'
                onClick={handleClear}
                className='px-4 py-2.5 text-sm font-medium bg-white/6 text-white/80 border border-white/15 rounded-lg hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 transition-all cursor-pointer'
              >
                Temizle
              </button>
              {localGeoJSON && (
                <button
                  type='button'
                  onClick={() => setFitBoundsFlag((f) => f + 1)}
                  className='px-4 py-2.5 text-sm font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 hover:text-emerald-200 transition-all cursor-pointer'
                >
                  Sığdır
                </button>
              )}
            </div>

            {/* Feedback / Error */}
            {(error || feedback) && (
              <div className='shrink-0 px-5 pb-3'>
                {error && (
                  <p className='px-3 py-2.5 text-sm text-red-300 bg-red-500/15 rounded-lg border border-red-500/30'>
                    {error}
                  </p>
                )}
                {feedback && (
                  <p className='px-3 py-2.5 text-sm text-green-300 bg-green-500/15 rounded-lg border border-green-500/30'>
                    {feedback}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
