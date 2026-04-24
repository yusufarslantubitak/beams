import { z } from 'zod';

const EnvSchema = z.object({
  VITE_MAP_TILE_URL: z.string().min(1, 'VITE_MAP_TILE_URL is required'),
  VITE_GEOJSON_URL: z.string().url('VITE_GEOJSON_URL must be a valid URL'),
  VITE_MIN_ZOOM: z.coerce.number().int().min(0).max(22).default(2),
  VITE_MAX_ZOOM: z.coerce.number().int().min(0).max(22).default(18),
  VITE_DEFAULT_ZOOM: z.coerce.number().int().min(0).max(22).default(4),
});

export type Env = z.infer<typeof EnvSchema>;

function parseEnv(): Env {
  const result = EnvSchema.safeParse(import.meta.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `Invalid environment configuration:\n${formatted}\n\nCheck your .env file.`,
    );
  }

  return result.data;
}

export const env = parseEnv();
