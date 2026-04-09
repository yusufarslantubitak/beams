import { useState, useEffect } from 'react';
import type { FeatureCollection } from 'geojson';
import { z } from 'zod';
import { validateGeoJSON } from '../lib/geoJSONSchema';

export function useGeoJSON(geojsonUrl: string) {
  const [localGeoJSON, setLocalGeoJSON] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(geojsonUrl);
        if (!response.ok) {
          throw new Error(`Veri alınamadı: ${response.statusText} (URL: ${geojsonUrl})`);
        }
        const data = await response.json();
        
        // Use Zod to validate the fetched data
        const collection = validateGeoJSON(data);
        
        if (isMounted) {
          setLocalGeoJSON(collection);
          setError(''); // Clear any previous errors
        }
      } catch (err) {
        if (!isMounted) return;
        
        console.error('Validation or Fetch error:', err);
        if (err instanceof z.ZodError) {
          // Provide a more readable summary of validation errors
          const validationError = err as z.ZodError<unknown>;
          const details = validationError.issues
            .map(e => `${e.path.join('.') || 'root'}: ${e.message}`)
            .slice(0, 3) // Only show first 3 errors to avoid overwhelming the screen
            .join(', ');
          
          setError(`Geçersiz GeoJSON formatı: ${details}${validationError.issues.length > 3 ? '...' : ''}`);
        } else {
          setError(err instanceof Error ? err.message : 'Veri yüklenirken bilinmeyen bir hata oluştu');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [geojsonUrl]);

  return { localGeoJSON, error, isLoading };
}
