import React, { useState, useEffect, useMemo } from 'react';
import type { FeatureCollection } from '@/lib/geoJSONSchema';
import type { MarkerFeatureCollection } from '@/lib/markerSchema';
import { getMarkerBackgroundColor } from '@/lib/markerSchema';
import { getLucideIcon } from '@/lib/markerIcons';
import { getGroupColorMapping } from '@/lib/colorMapping';
import { storage } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardContent } from '@/components/ui/card';
import { List, X } from 'lucide-react';

interface LegendProps {
  geojson: FeatureCollection | null;
  markers?: MarkerFeatureCollection | null;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  corner?: 'tl' | 'tr' | 'bl' | 'br';
}

interface GroupColorEntry {
  group: string;
  color: string;
}

interface UniqueMarkerEntry {
  id?: string;
  title: string;
  icon?: string;
  color: string;
  backgroundColor: string;
}

export const Legend: React.FC<LegendProps> = ({
  geojson,
  markers,
  dragHandleProps,
  corner = 'br',
}) => {
  const [isExpanded, setIsExpanded] = useState(() =>
    storage.getLegendExpanded(),
  );

  useEffect(() => {
    storage.setLegendExpanded(isExpanded);
  }, [isExpanded]);

  // Extract unique hexagon groups
  const hasHexagons = Boolean(geojson?.features && geojson.features.length > 0);
  const groupsList: GroupColorEntry[] = useMemo(() => {
    if (!hasHexagons || !geojson) return [];
    const groupColorMap = getGroupColorMapping(geojson);
    return Array.from(groupColorMap.entries()).map(([group, color]) => ({
      group,
      color,
    }));
  }, [hasHexagons, geojson]);

  // Extract unique markers by title (or id if title missing)
  const uniqueMarkers = useMemo(() => {
    if (!markers?.features) return [];
    const map = new Map<string, UniqueMarkerEntry>();
    for (const f of markers.features) {
      const p = f.properties;
      const key = p.title || p.id;
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, {
          id: p.id,
          title: p.title,
          icon: p.icon,
          color: p.color || '#3b82f6',
          backgroundColor: getMarkerBackgroundColor(p),
        });
      }
    }
    return Array.from(map.values());
  }, [markers]);

  if (groupsList.length === 0 && uniqueMarkers.length === 0) {
    return null;
  }

  const isLeft = corner.includes('l');
  const isTop = corner.includes('t');

  return (
    <div
      className={cn(
        'relative grid grid-cols-1 grid-rows-1',
        isTop ? 'items-start' : 'items-end',
        isLeft ? 'justify-items-start' : 'justify-items-end',
      )}
    >
      {/* Collapse/Expand Button */}
      <div
        className={cn(
          'row-start-1 col-start-1 transition-all duration-300 ease-in-out transform',
          isTop
            ? isLeft
              ? 'origin-top-left'
              : 'origin-top-right'
            : isLeft
              ? 'origin-bottom-left'
              : 'origin-bottom-right',
          isExpanded
            ? 'opacity-0 scale-90 pointer-events-none'
            : 'opacity-100 scale-100 pointer-events-auto',
        )}
      >
        <Button
          variant='outline'
          size='sm'
          onClick={() => setIsExpanded(true)}
          {...dragHandleProps}
          className='bg-white/40 hover:bg-white/60 backdrop-blur-md border-white/30 shadow-lg py-5 px-5 cursor-move active:cursor-grabbing'
          aria-label='Open Legend'
        >
          <List className='w-4 h-4' />
          <span>Legend</span>
        </Button>
      </div>

      {/* Legend Panel */}
      <div
        className={cn(
          'row-start-1 col-start-1 transition-all duration-300 ease-in-out transform',
          isTop
            ? isLeft
              ? 'origin-top-left'
              : 'origin-top-right'
            : isLeft
              ? 'origin-bottom-left'
              : 'origin-bottom-right',
          isExpanded
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-90 pointer-events-none',
        )}
      >
        <Card className='w-64 bg-white/60 backdrop-blur-lg border-white/30 shadow-lg pt-0'>
          <div
            className='flex border-b border-border/50 items-center justify-between px-4 py-2 cursor-move active:cursor-grabbing'
            {...dragHandleProps}
          >
            <CardTitle className='text-xs font-semibold'>Legend</CardTitle>
            <div className='flex items-center gap-1'>
              <div
                className='p-1 text-muted-foreground/40 hover:text-primary transition-colors cursor-help'
                title='Map Data Layout:&#10;1. Machine No&#10;2. Sat ID&#10;3. Spot Beam • ARFCN'
              >
                <List className='w-3 h-3' />
              </div>
              <Button
                variant='ghost'
                size='icon-xs'
                onClick={() => setIsExpanded(false)}
                className='text-muted-foreground hover:text-foreground'
                aria-label='Close'
              >
                <X className='w-3.5 h-3.5' />
              </Button>
            </div>
          </div>
          <CardContent className='p-2 pt-1 max-h-60 overflow-y-auto space-y-2.5'>
            {/* Hexagon Groups Section */}
            {groupsList.length > 0 && (
              <div className='flex flex-col gap-0.5'>
                {uniqueMarkers.length > 0 && (
                  <div className='text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-2 py-0.5'>
                    Beams
                  </div>
                )}
                {groupsList.map((item) => (
                  <div
                    key={item.group}
                    className='flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-white/50 transition-colors'
                  >
                    <div
                      className='w-3 h-3 rounded-full shrink-0 shadow-sm border border-black/10'
                      style={{ backgroundColor: item.color }}
                    />
                    <div className='flex flex-col overflow-hidden'>
                      <span className='text-xs font-medium text-foreground truncate'>
                        {item.group}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Markers Section */}
            {uniqueMarkers.length > 0 && (
              <div className='flex flex-col gap-0.5'>
                {groupsList.length > 0 && (
                  <div className='text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-2 pt-1 pb-0.5 border-t border-border/40'>
                    Markers
                  </div>
                )}
                {uniqueMarkers.map((marker) => {
                  const IconComp = getLucideIcon(marker.icon);
                  return (
                    <div
                      key={marker.id || marker.title}
                      title={marker.title}
                      className='flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-white/50 transition-colors group'
                    >
                      <div
                        className='w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-xs'
                        style={{
                          backgroundColor: marker.backgroundColor,
                          border: `1.5px solid ${marker.color}`,
                        }}
                      >
                        <IconComp
                          className='w-2.5 h-2.5'
                          style={{ color: marker.color }}
                          strokeWidth={2.5}
                        />
                      </div>
                      <div className='flex flex-col min-w-0 flex-1 overflow-hidden'>
                        <span className='text-xs font-medium text-foreground truncate'>
                          {marker.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
