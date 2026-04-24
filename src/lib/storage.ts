import { z } from 'zod';

const SelectedLabelsSchema = z.array(z.string());
const SearchQuerySchema = z.string();
const BooleanFlagSchema = z.boolean();

const KEYS = {
  selectedLabels: 'geojson-viewer-selected-labels',
  searchQuery: 'geojson-viewer-search-query',
  labelFilterExpanded: 'label-filter-expanded',
  legendExpanded: 'geojson-viewer-legend-expanded',
} as const;

function readStorage<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return schema.parse(JSON.parse(raw));
  } catch {
    // Corrupt or invalid data — clear it and return fallback
    try {
      localStorage.removeItem(key);
    } catch {
      // localStorage unavailable
    }
    return fallback;
  }
}

function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail if localStorage is not available
  }
}

export const storage = {
  getSelectedLabels: (): string[] =>
    readStorage(KEYS.selectedLabels, SelectedLabelsSchema, []),

  setSelectedLabels: (labels: string[]): void =>
    writeStorage(KEYS.selectedLabels, labels),

  getSearchQuery: (): string =>
    readStorage(KEYS.searchQuery, SearchQuerySchema, ''),

  setSearchQuery: (query: string): void =>
    writeStorage(KEYS.searchQuery, query),

  getLabelFilterExpanded: (): boolean =>
    readStorage(KEYS.labelFilterExpanded, BooleanFlagSchema, true),

  setLabelFilterExpanded: (expanded: boolean): void =>
    writeStorage(KEYS.labelFilterExpanded, expanded),

  getLegendExpanded: (): boolean =>
    readStorage(KEYS.legendExpanded, BooleanFlagSchema, true),

  setLegendExpanded: (expanded: boolean): void =>
    writeStorage(KEYS.legendExpanded, expanded),
} as const;
