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
  })
  .passthrough();

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
