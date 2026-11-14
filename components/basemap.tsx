'use client'

import { useEffect, useState } from 'react'
import { TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'maplibre-gl/dist/maplibre-gl.css'
import '@maplibre/maplibre-gl-leaflet'
import {
  BASEMAP_STYLE,
  BASEMAP_STYLE_TIMEOUT_MS,
  FALLBACK_ATTRIBUTION,
  FALLBACK_MAX_ZOOM,
  FALLBACK_MIN_ZOOM,
  FALLBACK_TILES,
} from '@/lib/basemap'

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * Draws the basemap under a react-leaflet map. Put it inside <MapContainer>
 * where a <TileLayer> would go, and leave the map's attribution control on.
 * Why there are two providers is explained in lib/basemap.ts.
 */
export function Basemap() {
  const map = useMap()
  // This component only ever renders in the browser (the maps are loaded with ssr: false).
  const [useFallback, setUseFallback] = useState(() => !hasWebGL())

  useEffect(() => {
    if (useFallback) return

    const layer = L.maplibreGL({ style: BASEMAP_STYLE })
    layer.addTo(map)

    const gl = layer.getMaplibreMap()
    let styleLoaded = false
    const giveUp = () => {
      if (!styleLoaded) setUseFallback(true)
    }
    const timer = window.setTimeout(giveUp, BASEMAP_STYLE_TIMEOUT_MS)
    gl.once('styledata', () => {
      styleLoaded = true
      window.clearTimeout(timer)
    })
    // Nothing but the style request can fail before the style is in.
    gl.on('error', giveUp)

    return () => {
      window.clearTimeout(timer)
      layer.remove()
    }
  }, [map, useFallback])

  if (!useFallback) return null

  return (
    <TileLayer
      url={FALLBACK_TILES}
      attribution={FALLBACK_ATTRIBUTION}
      minZoom={FALLBACK_MIN_ZOOM}
      maxZoom={FALLBACK_MAX_ZOOM}
    />
  )
}
