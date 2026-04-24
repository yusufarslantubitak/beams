import { useMemo, useState } from 'react';
import type { FeatureCollection } from '@/lib/geoJSONSchema';
import { FeatureCollectionSchema } from '@/lib/geoJSONSchema';
import { storage } from '@/lib/storage';

interface UseLabelFilterReturn {
  selectedLabels: string[];
  setSelectedLabels: (labels: string[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  availableLabels: string[];
  filteredLabels: string[];
  filteredGeoJSON: FeatureCollection | null;
}

export function useLabelFilter(
  geojson: FeatureCollection | null | undefined,
): UseLabelFilterReturn {
  const [selectedLabels, setSelectedLabelsState] = useState<string[]>(() =>
    storage.getSelectedLabels(),
  );
  const [searchQuery, setSearchQueryState] = useState(() =>
    storage.getSearchQuery(),
  );

  const setSearchQuery = (query: string) => {
    setSearchQueryState(query);
    storage.setSearchQuery(query);
  };

  const setSelectedLabels = (labels: string[]) => {
    setSelectedLabelsState(labels);
    storage.setSelectedLabels(labels);
  };

  const availableLabels = useMemo(() => {
    if (!geojson?.features) return [];

    const labels = new Set<string>();
    for (const feature of geojson.features) {
      labels.add(feature.properties.label);
    }

    return Array.from(labels).sort();
  }, [geojson]);

  const filteredLabels = useMemo(() => {
    if (!searchQuery) return availableLabels;

    const lowerQuery = searchQuery.toLowerCase();
    return availableLabels.filter((label) =>
      label.toLowerCase().includes(lowerQuery),
    );
  }, [availableLabels, searchQuery]);

  const filteredGeoJSON = useMemo((): FeatureCollection | null => {
    if (!geojson) return null;
    if (selectedLabels.length === 0) return geojson;

    const explicitLabels = selectedLabels.filter((l) =>
      availableLabels.includes(l),
    );
    const customMatches = selectedLabels.filter(
      (l) => !availableLabels.includes(l),
    );

    const candidate = {
      type: 'FeatureCollection' as const,
      features: geojson.features.filter((feature) => {
        const label = feature.properties.label;

        if (explicitLabels.includes(label)) {
          return true;
        }

        if (customMatches.length > 0) {
          const lowerLabel = label.toLowerCase();
          return customMatches.some((custom) =>
            lowerLabel.includes(custom.toLowerCase()),
          );
        }

        return false;
      }),
    };

    const result = FeatureCollectionSchema.safeParse(candidate);
    return result.success ? result.data : null;
  }, [geojson, selectedLabels, availableLabels]);

  return {
    selectedLabels,
    setSelectedLabels,
    searchQuery,
    setSearchQuery,
    availableLabels,
    filteredLabels,
    filteredGeoJSON,
  };
}
