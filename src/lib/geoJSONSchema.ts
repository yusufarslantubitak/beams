import { z } from 'zod';

const PositionSchema = z.array(z.number()).min(2);

const PointSchema = z.object({
  type: z.literal('Point'),
  coordinates: PositionSchema,
});

const LineStringSchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(PositionSchema),
});

const PolygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(PositionSchema)),
});

const MultiPointSchema = z.object({
  type: z.literal('MultiPoint'),
  coordinates: z.array(PositionSchema),
});

const MultiLineStringSchema = z.object({
  type: z.literal('MultiLineString'),
  coordinates: z.array(z.array(PositionSchema)),
});

const MultiPolygonSchema = z.object({
  type: z.literal('MultiPolygon'),
  coordinates: z.array(z.array(z.array(PositionSchema))),
});

const GeometrySchema = z.union([
  PointSchema,
  LineStringSchema,
  PolygonSchema,
  MultiPointSchema,
  MultiLineStringSchema,
  MultiPolygonSchema,
]);

export const FeaturePropertiesSchema = z.object({
  id: z.string().optional(),
  sat_id: z.string().optional(),
  color: z.string().optional().default('#3388ff'),
  machine_no: z.string().optional(),
  spot_beam: z.string().optional(),
  arfcn: z.string().optional(),
});

export const FeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: GeometrySchema,
  properties: FeaturePropertiesSchema,
});

export const FeatureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(FeatureSchema),
});

export type FeatureProperties = z.infer<typeof FeaturePropertiesSchema>;
export type Geometry = z.infer<typeof GeometrySchema>;
export type Feature = z.infer<typeof FeatureSchema>;
export type FeatureCollection = z.infer<typeof FeatureCollectionSchema>;

export function validateGeoJSON(input: unknown): FeatureCollection {
  if (Array.isArray(input)) {
    const collection = { type: 'FeatureCollection' as const, features: input };
    return FeatureCollectionSchema.parse(collection);
  }

  return FeatureCollectionSchema.parse(input);
}
