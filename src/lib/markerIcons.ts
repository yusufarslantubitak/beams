import L from 'leaflet';
import { icons, MapPin } from 'lucide-react';

type IconNodeChild = [string, Record<string, string | number>];

/**
 * Resolves a Lucide icon component by name, supporting PascalCase,
 * kebab-case, snake_case, or falling back to MapPin.
 */
export function getLucideIcon(iconName?: string) {
  if (!iconName) return icons.MapPin || MapPin;

  if (icons[iconName as keyof typeof icons]) {
    return icons[iconName as keyof typeof icons];
  }

  const pascal = iconName
    .split(/[-_ ]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');

  if (icons[pascal as keyof typeof icons]) {
    return icons[pascal as keyof typeof icons];
  }

  return icons.MapPin || MapPin;
}

/**
 * Extracts SVG element nodes from a Lucide icon component without react-dom/server.
 */
export function getIconNode(iconComponent: unknown): IconNodeChild[] {
  try {
    const Comp = iconComponent as {
      render?: (
        props: Record<string, unknown>,
        ref: null,
      ) => { props?: { iconNode?: IconNodeChild[] } };
    };
    if (typeof Comp?.render === 'function') {
      const res = Comp.render({ size: 20 }, null);
      if (Array.isArray(res?.props?.iconNode)) {
        return res.props.iconNode;
      }
    }
  } catch {
    /* fallback below */
  }

  try {
    const fallbackRes = (
      icons.MapPin as {
        render?: (
          props: Record<string, unknown>,
          ref: null,
        ) => { props?: { iconNode?: IconNodeChild[] } };
      }
    )?.render?.({ size: 20 }, null);
    if (Array.isArray(fallbackRes?.props?.iconNode)) {
      return fallbackRes.props.iconNode;
    }
  } catch {
    /* ignore */
  }

  return [
    [
      'path',
      {
        d: 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0',
      },
    ],
    ['circle', { cx: '12', cy: '10', r: '3' }],
  ];
}

/**
 * Converts iconNode definition into an SVG string for Leaflet DivIcon.
 */
export function iconNodeToSvg(
  iconNode: IconNodeChild[],
  color: string,
  size = 20,
): string {
  const children = iconNode
    .map(([tag, attrs]) => {
      const attrStr = Object.entries(attrs)
        .filter(([k]) => k !== 'key')
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      return `<${tag} ${attrStr} />`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">${children}</svg>`;
}

/**
 * Creates a Leaflet DivIcon that renders ONLY the Lucide icon,
 * styled with the feature's accent color.
 */
export function createMarkerIcon(
  iconName?: string,
  color: string = '#3b82f6',
): L.DivIcon {
  const IconComponent = getLucideIcon(iconName);
  const iconNode = getIconNode(IconComponent);
  const iconSvg = iconNodeToSvg(iconNode, color, 15);

  return L.divIcon({
    className: 'custom-lucide-marker',
    html: `
      <div class="marker-icon-wrapper" style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 9999px;
        background: rgba(15, 23, 42, 0.92);
        border: 1.5px solid ${color};
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        cursor: pointer;
      ">
        ${iconSvg}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}
