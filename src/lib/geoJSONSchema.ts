import { z } from 'zod';
import type { FeatureCollection } from 'geojson';

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

export const FeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: GeometrySchema,
  properties: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const FeatureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(FeatureSchema),
});

/** Validates input as a FeatureCollection using Zod */
export function validateGeoJSON(input: unknown): FeatureCollection {
  // If input is an array of features, wrap it
  if (Array.isArray(input)) {
    const collection = { type: 'FeatureCollection', features: input };
    return FeatureCollectionSchema.parse(collection) as FeatureCollection;
  }
  
  return FeatureCollectionSchema.parse(input) as FeatureCollection;
}
