/**
 * The basemap under every map in this app.
 *
 * Until November 2026 this was CARTO's Positron raster tiles (`light_all`).
 * Since 25 September 2026 CARTO serves those without an API key only as a
 * blank tile reading "API KEY REQUIRED".
 *
 * Now it is the same Positron look from OpenFreeMap's public vector tiles,
 * drawn by MapLibre GL inside Leaflet (see components/basemap.tsx).
 * No key or account, commercial use is allowed, attribution is required; the
 * style carries the attribution and it is passed on to Leaflet's control.
 * https://openfreemap.org/
 *
 * If the browser has no WebGL, or the style cannot be fetched in time, the
 * map falls back to OneMap's raster tiles (Singapore Land Authority; keyless,
 * Singapore only, zoom 11 to 19). OneMap's terms require its logo and
 * attribution to stay visible: https://www.onemap.gov.sg/docs/maps/
 *
 * Both providers need the map's attribution control. Do not turn it off.
 *
 * maplibre-gl is pinned to 6.18.0 (4.7.1 had a critical advisory). Version 6
 * loads its worker from a separate file, so components/basemap.tsx has webpack
 * copy that file into the build and passes its URL to setWorkerUrl. Without
 * that the map fails with "Worker failed to load".
 */
export const BASEMAP_STYLE = 'https://tiles.openfreemap.org/styles/positron'

/** How long to wait for the style before switching to the fallback tiles. */
export const BASEMAP_STYLE_TIMEOUT_MS = 8000

/** The old raster layer stopped at 18; keep the same ceiling. */
export const MAP_MAX_ZOOM = 18

export const FALLBACK_TILES = 'https://www.onemap.gov.sg/maps/tiles/Grey/{z}/{x}/{y}.png'

/** OneMap's own snippet, with the logo kept inline. DO NOT REMOVE. */
export const FALLBACK_ATTRIBUTION =
  '<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" alt="" style="display:inline-block;vertical-align:middle;height:20px;width:20px;"/>&nbsp;' +
  '<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>&nbsp;&copy;&nbsp;contributors&nbsp;&#124;&nbsp;' +
  '<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>'

export const FALLBACK_MIN_ZOOM = 11
export const FALLBACK_MAX_ZOOM = 19
