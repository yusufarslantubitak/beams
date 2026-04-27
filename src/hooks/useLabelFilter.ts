import { useMemo, useState } from 'react';
import type { FeatureCollection } from '@/lib/geoJSONSchema';
import { FeatureCollectionSchema } from '@/lib/geoJSONSchema';
import { storage } from '@/lib/storage';

interface FilterGroup {
  name: string;
  color: string;
}

interface UseLabelFilterReturn {
  selectedItems: string[];
  setSelectedItems: (items: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableGroups: FilterGroup[];
  availableLabels: string[];
  availableBeams: string[];
  availableArfcns: string[];
  filteredGroups: FilterGroup[];
  filteredLabels: string[];
  filteredBeams: string[];
  filteredArfcns: string[];
  filteredGeoJSON: FeatureCollection | null;
}

export function useLabelFilter(
  geojson: FeatureCollection | null | undefined,
): UseLabelFilterReturn {
  const [selectedItems, setSelectedItemsState] = useState<string[]>(() =>
    storage.getSelectedLabels(),
  );
  const [searchQuery, setSearchQueryState] = useState(() =>
    storage.getSearchQuery(),
  );

  const setSearchQuery = (query: string) => {
    setSearchQueryState(query);
    storage.setSearchQuery(query);
  };

  const setSelectedItems = (items: string[]) => {
    setSelectedItemsState(items);
    storage.setSelectedLabels(items);
  };

  const { availableGroups, availableLabels, availableBeams, availableArfcns } = useMemo(() => {
    if (!geojson?.features) return { availableGroups: [], availableLabels: [], availableBeams: [], availableArfcns: [] };

    const labels = new Set<string>();
    const beams = new Set<string>();
    const arfcns = new Set<string>();
    const groupsMap = new Map<string, string>();

    for (const feature of geojson.features) {
      if (feature.properties.sat_id) {
        labels.add(feature.properties.sat_id);
      }
      if (feature.properties.spot_beam) {
        beams.add(feature.properties.spot_beam);
      }
      if (feature.properties.arfcn) {
        arfcns.add(String(feature.properties.arfcn));
      }
      if (feature.properties.machine_no) {
        if (!groupsMap.has(feature.properties.machine_no)) {
          groupsMap.set(
            feature.properties.machine_no,
            feature.properties.color || '#3388ff',
          );
        }
      }
    }

    return {
      availableGroups: Array.from(groupsMap.entries())
        .map(([name, color]) => ({ name, color }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      availableLabels: Array.from(labels).sort(),
      availableBeams: Array.from(beams).sort(),
      availableArfcns: Array.from(arfcns).sort(),
    };
  }, [geojson]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return availableGroups;
    const lowerQuery = searchQuery.toLowerCase();
    return availableGroups.filter((g) =>
      g.name.toLowerCase().includes(lowerQuery),
    );
  }, [availableGroups, searchQuery]);

  const filteredLabels = useMemo(() => {
    if (!searchQuery) return availableLabels;
    const lowerQuery = searchQuery.toLowerCase();
    return availableLabels.filter((label) =>
      label.toLowerCase().includes(lowerQuery),
    );
  }, [availableLabels, searchQuery]);

  const filteredBeams = useMemo(() => {
    if (!searchQuery) return availableBeams;
    const lowerQuery = searchQuery.toLowerCase();
    return availableBeams.filter((beam) =>
      beam.toLowerCase().includes(lowerQuery),
    );
  }, [availableBeams, searchQuery]);

  const filteredArfcns = useMemo(() => {
    if (!searchQuery) return availableArfcns;
    const lowerQuery = searchQuery.toLowerCase();
    return availableArfcns.filter((a) => a.toLowerCase().includes(lowerQuery));
  }, [availableArfcns, searchQuery]);

  const filteredGeoJSON = useMemo((): FeatureCollection | null => {
    if (!geojson) return null;
    if (selectedItems.length === 0) return geojson;

    const groupNames = availableGroups.map(g => g.name);

    const selectedGroupNames = selectedItems.filter(item => groupNames.includes(item));
    const selectedLabelNames = selectedItems.filter(item => availableLabels.includes(item));
    const selectedBeamNames = selectedItems.filter(item => availableBeams.includes(item));
    const selectedArfcnNames = selectedItems.filter(item => availableArfcns.includes(item));
    const customMatches = selectedItems.filter(
      (item) => !groupNames.includes(item) && !availableLabels.includes(item) && !availableBeams.includes(item) && !availableArfcns.includes(item),
    );

    const candidate = {
      type: 'FeatureCollection' as const,
      features: geojson.features.filter((feature) => {
        const { sat_id, machine_no, spot_beam, arfcn } = feature.properties;

        if (machine_no && selectedGroupNames.includes(machine_no)) {
          return true;
        }

        if (sat_id && selectedLabelNames.includes(sat_id)) {
          return true;
        }

        if (spot_beam && selectedBeamNames.includes(spot_beam)) {
          return true;
        }

        if (arfcn && selectedArfcnNames.includes(String(arfcn))) {
          return true;
        }

        if (customMatches.length > 0) {
          const lowerLabel = sat_id?.toLowerCase() || '';
          const lowerGroup = machine_no?.toLowerCase() || '';
          const lowerBeam = spot_beam?.toLowerCase() || '';
          const lowerArfcn = String(arfcn || '').toLowerCase();
          return customMatches.some((custom) => {
            const lowerCustom = custom.toLowerCase();
            return (
              lowerLabel.includes(lowerCustom) ||
              lowerGroup.includes(lowerCustom) ||
              lowerBeam.includes(lowerCustom) ||
              lowerArfcn.includes(lowerCustom)
            );
          });
        }

        return false;
      }),
    };

    const result = FeatureCollectionSchema.safeParse(candidate);
    return result.success ? result.data : null;
  }, [geojson, selectedItems, availableGroups, availableLabels, availableBeams, availableArfcns]);

  return {
    selectedItems,
    setSelectedItems,
    searchQuery,
    onSearchChange: setSearchQuery,
    availableGroups,
    availableLabels,
    availableBeams,
    availableArfcns,
    filteredGroups,
    filteredLabels,
    filteredBeams,
    filteredArfcns,
    filteredGeoJSON,
  };
}