import type { Feature, FeatureCollection } from '@/lib/geoJSONSchema';

export function getGroupColorMapping(
  geojson: FeatureCollection | null | undefined,
): Map<string, string> {
  const groupColorMap = new Map<string, string>();

  if (!geojson?.features) {
    return groupColorMap;
  }

  for (const feature of geojson.features) {
    const { machine_no, color } = feature.properties;
    if (machine_no && !groupColorMap.has(machine_no)) {
      groupColorMap.set(machine_no, color);
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

  const { machine_no, color } = feature.properties;

  if (machine_no) {
    return groupColorMap.get(machine_no) ?? defaultColor;
  }

  return color;
}
