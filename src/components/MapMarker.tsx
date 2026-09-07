import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import type { MarkerFeature } from '@/lib/markerSchema';
import { createMarkerIcon, getLucideIcon } from '@/lib/markerIcons';

interface DynamicMarkerIconProps {
  name?: string;
  className?: string;
}

const DynamicMarkerIcon: React.FC<DynamicMarkerIconProps> = ({
  name,
  className,
}) => {
  return React.createElement(getLucideIcon(name), { className });
};

interface MapMarkerProps {
  feature: MarkerFeature;
}

export const MapMarker: React.FC<MapMarkerProps> = ({ feature }) => {
  const { geometry, properties } = feature;
  // GeoJSON coordinates are [longitude, latitude]
  const [lng, lat] = geometry.coordinates;
  const position: [number, number] = [lat, lng];

  const icon = useMemo(
    () => createMarkerIcon(properties.icon, properties.color),
    [properties.icon, properties.color],
  );

  return (
    <Marker position={position} icon={icon}>
      <Popup className='feature-popup marker-popup'>
        <div className='flex flex-col min-w-52 max-w-72'>
          {/* Header with icon and title */}
          <div className='flex items-start gap-2 border-b border-border/30 pb-1.5'>
            <div
              className='p-1 rounded-md shrink-0 flex items-center justify-center'
              style={{
                backgroundColor: `${properties.color || '#3b82f6'}15`,
                border: `1px solid ${properties.color || '#3b82f6'}35`,
                color: properties.color || '#3b82f6',
              }}
            >
              <DynamicMarkerIcon name={properties.icon} className='w-4 h-4' />
            </div>
            <div className='flex flex-col min-w-0 flex-1'>
              <span className='font-bold text-xs text-foreground leading-snug'>
                {properties.title}
              </span>
              {properties.id && (
                <span className='text-[9px] font-mono uppercase tracking-wider text-muted-foreground'>
                  ID: {properties.id}
                </span>
              )}
            </div>
          </div>

          {/* Description / Tooltip Body */}
          {properties.description && (
            <div className='py-1'>
              <p className='text-[11px] text-foreground/80 leading-normal m-0'>
                {properties.description}
              </p>
            </div>
          )}

          {/* Details / Footer: Coordinates */}
          <div className='flex items-center justify-start pt-1.5 border-t border-border/30 text-muted-foreground'>
            <div className='flex items-center gap-1 font-mono text-[9.5px]'>
              <MapPin className='w-3 h-3 opacity-60 shrink-0' />
              <span>
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default MapMarker;
