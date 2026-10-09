"""Build static Masjid Finder tiles from an Overture Maps Places release.

Usage:
  python scripts/masjids/build_overture_tiles.py --out .masjid-tiles [--release 2026-09-23.1] [--bbox west,south,east,north]

Writes <out>/manifest.json plus <out>/tiles/<lat>_<lon>.json, one file per 1-degree cell
(floor of latitude/longitude). The app reads only the few cells around a search point.
Overture Places licensing (CDLA-Permissive-2.0, Apache-2.0, CC0) requires attribution; see docs/DATA-SOURCES.md.
"""
import argparse, json, math, os, shutil, urllib.request
from datetime import datetime, timezone

import duckdb

SCHEMA_VERSION = 1
TILE_DEGREES = 1
# Places Overture already classifies as mosques. Very low confidence rows are usually stale or duplicates.
CATEGORY_MIN_CONFIDENCE = 0.3
# Places only recognised by name must sit in a non-commercial category and be well corroborated.
NAME_MIN_CONFIDENCE = 0.6
NAME_PATTERN = r"\b(masjid|masjed|mosque|musall?a|mushall?a|islamic cent(er|re))\b"
NAME_CATEGORIES = ["place_of_worship", "religious_organization", "community_center", "community_and_government", "social_or_community_service", "cultural_center"]


def latest_release():
    with urllib.request.urlopen("https://stac.overturemaps.org/catalog.json", timeout=30) as response:
        return json.load(response)["latest"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True)
    parser.add_argument("--release")
    parser.add_argument("--bbox", help="west,south,east,north for a regional test build")
    args = parser.parse_args()
    release = args.release or latest_release()

    bbox_filter = ""
    if args.bbox:
        west, south, east, north = (float(value) for value in args.bbox.split(","))
        bbox_filter = f"and bbox.xmin between {west} and {east} and bbox.ymin between {south} and {north}"

    name_categories = ", ".join(f"'{category}'" for category in NAME_CATEGORIES)
    con = duckdb.connect()
    con.sql("INSTALL httpfs; LOAD httpfs; SET s3_region='us-west-2';")
    rows = con.sql(f"""
      select id, names.primary as name, bbox.ymin as lat, bbox.xmin as lon,
        addresses[1].freeform as street, addresses[1].locality as locality, addresses[1].region as region,
        addresses[1].postcode as postcode, phones[1] as phone, websites[1] as website
      from read_parquet('s3://overturemaps-us-west-2/release/{release}/theme=places/type=place/*', hive_partitioning=1)
      where names.primary is not null
        and coalesce(operating_status, 'open') = 'open'
        {bbox_filter}
        and (
          (list_contains(taxonomy.hierarchy, 'muslim_place_of_worship') and confidence >= {CATEGORY_MIN_CONFIDENCE})
          or (confidence >= {NAME_MIN_CONFIDENCE}
            and regexp_matches(lower(names.primary), '{NAME_PATTERN}')
            and (taxonomy.primary is null or list_has_any(taxonomy.hierarchy, [{name_categories}])))
        )
    """).fetchall()

    tiles = {}
    for id_, name, lat, lon, street, locality, region, postcode, phone, website in rows:
        address = ", ".join(part for part in [street, locality, region, postcode] if part) or None
        key = f"{math.floor(lat / TILE_DEGREES) * TILE_DEGREES}_{math.floor(lon / TILE_DEGREES) * TILE_DEGREES}"
        tiles.setdefault(key, []).append([id_, name.strip(), round(lat, 6), round(lon, 6), address, phone, website])

    tile_dir = os.path.join(args.out, "tiles")
    shutil.rmtree(tile_dir, ignore_errors=True)
    os.makedirs(tile_dir)
    for key, items in tiles.items():
        with open(os.path.join(tile_dir, f"{key}.json"), "w", encoding="utf-8") as file:
            json.dump({"v": SCHEMA_VERSION, "release": release, "items": items}, file, ensure_ascii=False, separators=(",", ":"))

    manifest = {"v": SCHEMA_VERSION, "release": release, "generatedAt": datetime.now(timezone.utc).isoformat(), "tileDegrees": TILE_DEGREES,
                "fields": ["id", "name", "latitude", "longitude", "address", "phone", "website"], "count": len(rows),
                "tiles": {key: len(items) for key, items in sorted(tiles.items())}}
    with open(os.path.join(args.out, "manifest.json"), "w", encoding="utf-8") as file:
        json.dump(manifest, file, separators=(",", ":"))
    print(f"Overture {release}: {len(rows)} masjids in {len(tiles)} tiles -> {args.out}")


if __name__ == "__main__":
    main()
