import L from 'leaflet';

if (typeof window !== 'undefined' && !(window as unknown as { L?: typeof L }).L) {
  (window as unknown as { L: typeof L }).L = L;
}

import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';

export { L };
