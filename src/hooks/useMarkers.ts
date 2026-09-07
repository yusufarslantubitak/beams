import { useState, useEffect } from 'react';
import { z } from 'zod';
import type { MarkerFeatureCollection } from '@/lib/markerSchema';
import { validateMarkerGeoJSON } from '@/lib/markerSchema';

interface UseMarkersReturn {
  markersGeoJSON: MarkerFeatureCollection | null;
  error: string;
  isLoading: boolean;
}

const getErrorMessage = (err: unknown): string => {
  if (err instanceof z.ZodError) {
    const details = err.issues
      .slice(0, 3)
      .map((e) => `${e.path.join('.') || 'root'}: ${e.message}`)
      .join(', ');

    return `Invalid Markers GeoJSON format: ${details}${err.issues.length > 3 ? '...' : ''}`;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return 'An unknown error occurred while loading markers';
};

export function useMarkers(markersUrl: string): UseMarkersReturn {
  const [markersGeoJSON, setMarkersGeoJSON] = useState<MarkerFeatureCollection | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchMarkers = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(markersUrl);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch markers: ${response.statusText} (URL: ${markersUrl})`,
          );
        }

        const data: unknown = await response.json();
        const collection = validateMarkerGeoJSON(data);

        if (isMounted) {
          setMarkersGeoJSON(collection);
        }
      } catch (err: unknown) {
        if (!isMounted) return;

        console.error('Markers validation or fetch error:', err);
        setError(getErrorMessage(err));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMarkers();

    return () => {
      isMounted = false;
    };
  }, [markersUrl]);

  return { markersGeoJSON, error, isLoading };
}
