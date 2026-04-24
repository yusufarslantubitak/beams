import { useState, useEffect } from 'react';
import { z } from 'zod';
import type { FeatureCollection } from '@/lib/geoJSONSchema';
import { validateGeoJSON } from '@/lib/geoJSONSchema';

interface UseGeoJSONReturn {
  localGeoJSON: FeatureCollection | null;
  error: string;
  isLoading: boolean;
}

// Extracted error formatter to keep the main hook logic clean
const getErrorMessage = (err: unknown): string => {
  if (err instanceof z.ZodError) {
    const details = err.issues
      .slice(0, 3) // Only show the first 3 errors to avoid overwhelming the screen
      .map((e) => `${e.path.join('.') || 'root'}: ${e.message}`)
      .join(', ');

    return `Invalid GeoJSON format: ${details}${err.issues.length > 3 ? '...' : ''}`;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return 'An unknown error occurred while loading data';
};

export function useGeoJSON(geojsonUrl: string): UseGeoJSONReturn {
  const [localGeoJSON, setLocalGeoJSON] = useState<FeatureCollection | null>(
    null,
  );
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchGeoJSON = async () => {
      setIsLoading(true);
      setError(''); // Clear previous errors at the start of a new fetch

      try {
        const response = await fetch(geojsonUrl);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch data: ${response.statusText} (URL: ${geojsonUrl})`,
          );
        }

        const data: unknown = await response.json();
        const collection = validateGeoJSON(data);

        if (isMounted) {
          setLocalGeoJSON(collection);
        }
      } catch (err: unknown) {
        if (!isMounted) return;

        console.error('Validation or Fetch error:', err);
        setError(getErrorMessage(err));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchGeoJSON();

    return () => {
      isMounted = false;
    };
  }, [geojsonUrl]);

  return { localGeoJSON, error, isLoading };
}
