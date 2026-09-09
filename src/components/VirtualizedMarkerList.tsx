import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { MarkerFeature } from '@/lib/markerSchema';
import { MarkerTooltipCard } from '@/components/MapMarker';

export interface VirtualizedMarkerListProps {
  markers: MarkerFeature[];
  onSelectMarkerSite?: (site: string) => void;
  maxHeight?: number;
}

export const VirtualizedMarkerList: React.FC<VirtualizedMarkerListProps> = ({
  markers,
  onSelectMarkerSite,
  maxHeight = 320,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: markers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 78,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className='overflow-y-auto w-full pr-1 select-text'
      style={{
        maxHeight: `${maxHeight}px`,
        scrollbarWidth: 'thin',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const feature = markers[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className='py-2 border-b border-border/30 last:border-b-0'>
                <MarkerTooltipCard
                  feature={feature}
                  onSelectMarkerSite={onSelectMarkerSite}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VirtualizedMarkerList;
