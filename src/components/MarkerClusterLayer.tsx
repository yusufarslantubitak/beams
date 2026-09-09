import React, { useEffect, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import { L } from '@/lib/leafletCluster';
import type { MarkerFeature, MarkerFeatureCollection } from '@/lib/markerSchema';
import {
  getMarkerBackgroundColor,
  isMarkerUnclustered,
} from '@/lib/markerSchema';
import { createMarkerIcon } from '@/lib/markerIcons';

export interface LocationMarkerGroup {
  coordinates: [number, number]; // [lng, lat]
  key: string;
  features: MarkerFeature[];
}

interface MarkerClusterLayerProps {
  markers?: MarkerFeatureCollection | null;
  disableClusteringAtZoom?: number;
  onMarkerGroupClick?: (
    group: LocationMarkerGroup,
    e: L.LeafletMouseEvent,
  ) => void;
}

export const MarkerClusterLayer: React.FC<MarkerClusterLayerProps> = ({
  markers,
  disableClusteringAtZoom = 11,
  onMarkerGroupClick,
}) => {
  const map = useMap();

  // Separate clusterable location groups from unclustered standalone markers
  const { clusteredGroups, unclusteredMarkers } = useMemo(() => {
    if (!markers?.features || markers.features.length === 0) {
      return { clusteredGroups: [], unclusteredMarkers: [] };
    }

    const mapGroups = new Map<string, LocationMarkerGroup>();
    const unclusteredList: LocationMarkerGroup[] = [];

    for (let idx = 0; idx < markers.features.length; idx++) {
      const feature = markers.features[idx];
      const [lng, lat] = feature.geometry.coordinates;

      if (isMarkerUnclustered(feature.properties)) {
        // Markers with no-cluster: true bypass clustering and render directly on the map
        unclusteredList.push({
          coordinates: [lng, lat],
          key: `unclustered-${feature.properties.id || idx}`,
          features: [feature],
        });
      } else {
        // Group exact coordinates together
        const key = `${lng.toFixed(6)},${lat.toFixed(6)}`;
        let group = mapGroups.get(key);
        if (!group) {
          group = { coordinates: [lng, lat], key, features: [] };
          mapGroups.set(key, group);
        }
        group.features.push(feature);
      }
    }

    return {
      clusteredGroups: Array.from(mapGroups.values()),
      unclusteredMarkers: unclusteredList,
    };
  }, [markers]);

  useEffect(() => {
    if (!map) return;

    // 1. Cluster Group for standard markers
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      clusterPane: 'markerPane',
      disableClusteringAtZoom,
      iconCreateFunction: (cluster: L.MarkerCluster) => {
        const childMarkers = cluster.getAllChildMarkers();
        let totalCount = 0;
        for (const m of childMarkers) {
          totalCount +=
            (m as unknown as { _featureCount?: number })._featureCount || 1;
        }

        let size = 36;
        let sizeClass = 'cluster-sm';
        if (totalCount >= 100) {
          size = 48;
          sizeClass = 'cluster-lg';
        } else if (totalCount >= 10) {
          size = 40;
          sizeClass = 'cluster-md';
        }

        return L.divIcon({
          html: `<div class="cluster-bubble ${sizeClass}"><span>${totalCount}</span></div>`,
          className: 'custom-marker-cluster',
          iconSize: L.point(size, size),
        });
      },
    });

    const clusterLeafletMarkers: L.Marker[] = [];

    for (const group of clusteredGroups) {
      const [lng, lat] = group.coordinates;
      const repFeature = group.features[0];
      const count = group.features.length;

      const bgColor = getMarkerBackgroundColor(repFeature.properties);
      const icon = createMarkerIcon(
        repFeature.properties.icon,
        repFeature.properties.color,
        bgColor,
        count > 1 ? count : undefined,
      );

      const marker = L.marker([lat, lng], { icon, pane: 'markerPane' });
      (marker as unknown as { _featureCount: number })._featureCount = count;

      if (onMarkerGroupClick) {
        marker.on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          onMarkerGroupClick(group, e);
        });
      }

      clusterLeafletMarkers.push(marker);
    }

    clusterGroup.addLayers(clusterLeafletMarkers);
    map.addLayer(clusterGroup);

    // 2. Standalone Group for unclustered markers (rendered directly on map with maximum z-index)
    if (!map.getPane('noClusterPane')) {
      const pane = map.createPane('noClusterPane');
      pane.style.zIndex = '690';
    }

    const standaloneGroup = L.featureGroup();

    for (const group of unclusteredMarkers) {
      const [lng, lat] = group.coordinates;
      const repFeature = group.features[0];

      const bgColor = getMarkerBackgroundColor(repFeature.properties);
      const icon = createMarkerIcon(
        repFeature.properties.icon,
        repFeature.properties.color,
        bgColor,
        undefined,
      );

      const marker = L.marker([lat, lng], {
        icon,
        pane: 'noClusterPane',
        zIndexOffset: 10000,
      });

      if (onMarkerGroupClick) {
        marker.on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          onMarkerGroupClick(group, e);
        });
      }

      standaloneGroup.addLayer(marker);
    }

    map.addLayer(standaloneGroup);

    return () => {
      clusterGroup.clearLayers();
      map.removeLayer(clusterGroup);
      standaloneGroup.clearLayers();
      map.removeLayer(standaloneGroup);
    };
  }, [
    map,
    clusteredGroups,
    unclusteredMarkers,
    disableClusteringAtZoom,
    onMarkerGroupClick,
  ]);

  return null;
};

export default MarkerClusterLayer;
