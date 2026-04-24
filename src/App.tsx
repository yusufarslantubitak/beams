import React, { useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { useGeoJSON } from '@/hooks/useGeoJSON';
import { useLabelFilter } from '@/hooks/useLabelFilter';
import MapComponent from '@/components/MapComponent';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ErrorOverlay } from '@/components/ErrorOverlay';
import { LabelFilter } from '@/components/LabelFilter';
import { Legend } from '@/components/Legend';
import { env } from '@/lib/env';
import { cn } from '@/lib/utils';

type Corner = 'tl' | 'tr' | 'bl' | 'br';

interface CornerPositions {
  filter: Corner;
  legend: Corner;
}

const CORNER_CLASSES: Record<Corner, string> = {
  tl: 'top-6 left-6',
  tr: 'top-6 right-6',
  bl: 'bottom-6 left-6',
  br: 'bottom-6 right-6',
};

function getNearestCorner(x: number, y: number): Corner {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const col = x < w / 2 ? 'l' : 'r';
  const row = y < h / 2 ? 't' : 'b';
  return `${row}${col}` as Corner;
}

function loadPositions(): CornerPositions {
  try {
    const saved = localStorage.getItem('geojson-viewer-panel-positions');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return { filter: 'tr', legend: 'br' };
}

function savePositions(p: CornerPositions) {
  localStorage.setItem('geojson-viewer-panel-positions', JSON.stringify(p));
}

interface DraggablePanelProps {
  id: keyof CornerPositions;
  corner: Corner;
  onSnap: (id: keyof CornerPositions, corner: Corner) => void;
  children: React.ReactNode;
}

function DraggablePanel({ id, corner, onSnap, children }: DraggablePanelProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: { point: { x: number; y: number } }) => {
    const nearest = getNearestCorner(info.point.x, info.point.y);

    if (nearest !== corner) {
      // Reset immediately so the panel doesn't fly off when re-mounted
      x.set(0);
      y.set(0);
      onSnap(id, nearest);
    } else {
      // Same corner — spring back to origin
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
      animate(y, 0, { type: 'spring', stiffness: 500, damping: 30 });
    }
  };

  return (
    <div id={`panel-${id}`} className={cn('absolute z-50', CORNER_CLASSES[corner])}>
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.05}
        style={{ x, y }}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.03, opacity: 0.9 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
              dragHandleProps: {
                style: { cursor: 'grab', touchAction: 'none' },
              },
            });
          }
          return child;
        })}
      </motion.div>
    </div>
  );
}

function App() {
  const { localGeoJSON, error, isLoading } = useGeoJSON(env.VITE_GEOJSON_URL);
  const {
    selectedLabels,
    setSelectedLabels,
    searchQuery,
    setSearchQuery,
    availableLabels,
    filteredLabels,
    filteredGeoJSON,
  } = useLabelFilter(localGeoJSON);

  const [positions, setPositions] = useState<CornerPositions>(loadPositions);

  const handleSnap = (id: keyof CornerPositions, targetCorner: Corner) => {
    setPositions((prev) => {
      const otherId = id === 'filter' ? 'legend' : 'filter';
      const next: CornerPositions =
        prev[otherId] === targetCorner
          ? { ...prev, [id]: targetCorner, [otherId]: prev[id] }
          : { ...prev, [id]: targetCorner };
      savePositions(next);
      return next;
    });
  };

  return (
    <div className='relative w-full h-screen overflow-hidden bg-slate-950'>
      {/* Map */}
      <div className='absolute inset-0 z-0'>
        <MapComponent
          geojson={filteredGeoJSON}
          mapUrl={env.VITE_MAP_TILE_URL}
          minZoom={env.VITE_MIN_ZOOM}
          maxZoom={env.VITE_MAX_ZOOM}
          defaultZoom={env.VITE_DEFAULT_ZOOM}
        />
      </div>

      {!isLoading && !error && localGeoJSON && (
        <>
          <DraggablePanel id='filter' corner={positions.filter} onSnap={handleSnap}>
            <LabelFilter
              selectedLabels={selectedLabels}
              onSelectedLabelsChange={setSelectedLabels}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filteredLabels={filteredLabels}
              availableLabels={availableLabels}
              corner={positions.filter}
            />
          </DraggablePanel>

          <DraggablePanel id='legend' corner={positions.legend} onSnap={handleSnap}>
            <Legend geojson={localGeoJSON} corner={positions.legend} />
          </DraggablePanel>
        </>
      )}

      <LoadingOverlay isLoading={isLoading && !error} />
      <ErrorOverlay error={error} />
    </div>
  );
}

export default App;
