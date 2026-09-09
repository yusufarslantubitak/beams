import { z } from 'zod';

const PositionSchema = z.array(z.number()).min(2);

const PointSchema = z.object({
  type: z.literal('Point'),
  coordinates: PositionSchema,
});

export const MarkerPropertiesSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional().default(''),
    color: z.string().optional().default('#3b82f6'),
    icon: z.string().optional().default('MapPin'),
    'background-color': z.string().optional(),
    'remote-site': z.string().optional(),
    remote_site: z.string().optional(),
  })
  .loose();

export const DEFAULT_MARKER_BG_COLOR = 'rgba(15, 23, 42, 0.92)';

export function getMarkerBackgroundColor(properties?: Record<string, unknown> | null): string {
  if (!properties) return DEFAULT_MARKER_BG_COLOR;
  return (properties['background-color'] as string) || DEFAULT_MARKER_BG_COLOR;
}

export function getMarkerRemoteSite(properties?: Record<string, unknown> | null): string | undefined {
  if (!properties) return undefined;
  return (properties['remote-site'] as string) || (properties['remote_site'] as string) || undefined;
}

export const MarkerFeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: PointSchema,
  properties: MarkerPropertiesSchema,
});

export const MarkerFeatureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(MarkerFeatureSchema),
});

export type MarkerProperties = z.infer<typeof MarkerPropertiesSchema>;
export type MarkerFeature = z.infer<typeof MarkerFeatureSchema>;
export type MarkerFeatureCollection = z.infer<typeof MarkerFeatureCollectionSchema>;

export function validateMarkerGeoJSON(input: unknown): MarkerFeatureCollection {
  if (Array.isArray(input)) {
    const collection = {
      type: 'FeatureCollection' as const,
      features: input,
    };
    return MarkerFeatureCollectionSchema.parse(collection);
  }

  return MarkerFeatureCollectionSchema.parse(input);
}
