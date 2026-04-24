import type { Feature, FeatureCollection } from '@/lib/geoJSONSchema';

export function getGroupColorMapping(
  geojson: FeatureCollection | null | undefined,
): Map<string, string> {
  const groupColorMap = new Map<string, string>();

  if (!geojson?.features) {
    return groupColorMap;
  }

  for (const feature of geojson.features) {
    const { group, color } = feature.properties;
    if (group && !groupColorMap.has(group)) {
      groupColorMap.set(group, color);
    }
  }

  return groupColorMap;
}

export function getFeatureColor(
  feature: Feature | undefined,
  groupColorMap: Map<string, string>,
  defaultColor: string,
): string {
  if (!feature?.properties) {
    return defaultColor;
  }

  const { group, color } = feature.properties;

  if (group) {
    return groupColorMap.get(group) ?? defaultColor;
  }

  return color;
}
