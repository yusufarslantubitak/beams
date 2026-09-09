# GeoJSON Schemas

## 1. Hexagons (`hexagons.geojson`)

### Schema

| Property     | Type     | Required | Default     | Description                            |
| :----------- | :------- | :------- | :---------- | :------------------------------------- |
| `id`         | `string` | No       | —           | Feature identifier                     |
| `sat_id`     | `string` | No       | —           | Subtitle on map label                  |
| `machine_no` | `string` | No       | —           | Main title on map label & filter group |
| `color`      | `string` | No       | `"#3388ff"` | Hex color code for polygon and legend  |
| `spot_beam`  | `string` | No       | —           | Beam identifier                        |
| `arfcn`      | `string` | No       | —           | Channel number                         |

### Example

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [10.0, 50.0],
            [11.0, 51.0],
            [10.0, 52.0],
            [9.0, 52.0],
            [8.0, 51.0],
            [9.0, 50.0],
            [10.0, 50.0]
          ]
        ]
      },
      "properties": {
        "id": "hex-01",
        "sat_id": "SAT-01",
        "machine_no": "GROUP-A",
        "color": "#3b82f6",
        "spot_beam": "BEAM-1",
        "arfcn": "100"
      }
    }
  ]
}
```

---

## 2. Markers (`markers.geojson`)

### Schema

| Property           | Type     | Required | Default                    | Description                                     |
| :----------------- | :------- | :------- | :------------------------- | :---------------------------------------------- |
| `title`            | `string` | **Yes**  | —                          | Title displayed in popup                        |
| `id`               | `string` | No       | —                          | Identifier displayed in popup                   |
| `remote-site`      | `string` | No       | —                          | Remote site code displayed next to ID in popup  |
| `description`      | `string` | No       | `""`                       | Text description displayed in popup body        |
| `color`            | `string`  | No       | `"#3b82f6"`                | Hex or CSS color for marker icon and border     |
| `background-color` | `string`  | No       | `"rgba(15, 23, 42, 0.92)"` | Hex, RGB, or CSS color for marker background    |
| `icon`             | `string`  | No       | `"MapPin"`                 | Lucide icon name in PascalCase (see note below) |
| `no-cluster`       | `boolean` | No       | `false`                    | When `true`, disables clustering for this marker and renders it as an independent standalone pin |

> **Icon Reference**: Choose icons from [lucide.dev/icons](https://lucide.dev/icons). Convert the icon name from **kebab-case** to **PascalCase** (e.g., `tower-control` → `TowerControl`, `radio-tower` → `RadioTower`, `cpu` → `Cpu`, `server` → `Server`).

### Example

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [10.0, 50.0]
      },
      "properties": {
        "id": "BER-01",
        "title": "Facility Name",
        "remote-site": "RS-301",
        "description": "Description text displayed inside popup.",
        "color": "#10b981",
        "background-color": "#064e3b",
        "icon": "Radio"
      }
    }
  ]
}
```
