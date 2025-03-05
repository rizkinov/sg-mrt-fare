"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";

// Define types
type Station = {
  name: string;
  code: string;
  line: string;
  coordinates: [number, number];
};

type MrtLine = {
  name: string;
  color: string;
  stations: string[];
};

// Update the MapComponentProps interface to include initialZoom
interface MapComponentProps {
  stations: Station[];
  lines: MrtLine[];
  selectedStartStation?: Station | null;
  selectedEndStation?: Station | null;
  onStationSelect?: (station: Station, selectionType: 'start' | 'end') => void;
  selectionMode: 'start' | 'end' | null;
  initialZoom?: number; // Add initialZoom prop
}

// Component to update map view when props change
function SetViewOnChange({ center, zoom, stations, selectedStartStation, selectedEndStation }: any) {
  const map = useMap();
  
  // Use a ref to track if we've already set the view
  const viewSetRef = useRef(false);
  
  useEffect(() => {
    // Only set the view once when the component mounts
    if (!viewSetRef.current && center && zoom) {
      map.setView(center, zoom);
      viewSetRef.current = true;
    }
    
    // Remove all the station label code below
    /* 
    // Add station name labels
    stations.forEach((station: any) => {
      const isStart = selectedStartStation?.code === station.code;
      const isEnd = selectedEndStation?.code === station.code;
      
      // Create a custom div for the station label
      const labelIcon = L.divIcon({
        className: 'station-label',
        html: `<div class="text-xs font-medium px-1 py-0.5 bg-white bg-opacity-80 rounded shadow-sm whitespace-nowrap">${station.name}</div>`,
        iconSize: [100, 20],
        iconAnchor: [50, 0], // Position above the station marker
      });
      
      // Add the label marker to the map instance
      L.marker([station.coordinates[1], station.coordinates[0]], { 
        icon: labelIcon,
        interactive: false, // Make labels non-interactive
        zIndexOffset: -1000 // Place behind station markers
      }).addTo(map);
    });
    */
    
  }, [center, zoom, map, stations, selectedStartStation, selectedEndStation]);
  
  return null;
}

export function MapComponent({
  stations,
  lines,
  selectedStartStation,
  selectedEndStation,
  onStationSelect,
  selectionMode,
  initialZoom
}: MapComponentProps) {
  const [popupInfo, setPopupInfo] = useState<Station | null>(null);
  const [mapInitialized, setMapInitialized] = useState<boolean>(false);
  const mapCenter: [number, number] = [1.3521, 103.8198]; // Singapore coordinates

  // Add a ref to store the map instance
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Fix for Leaflet marker icons in Next.js
    // This is needed to fix the marker icon issue with Leaflet in Next.js
    const L2 = L as any;
    delete L2.Icon.Default.prototype._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
    
    // Set a small delay to ensure the map container is fully rendered
    const timer = setTimeout(() => {
      setMapInitialized(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Get station coordinates
  const getStationCoordinates = (station: Station): [number, number] => {
    // Leaflet uses [lat, lng] format while our data is [lng, lat]
    return [station.coordinates[1], station.coordinates[0]];
  };

  // Get station color based on selection
  const getStationColor = (station: Station): string => {
    if (selectedStartStation && station.code === selectedStartStation.code) {
      return '#10b981'; // Green for start station
    }
    if (selectedEndStation && station.code === selectedEndStation.code) {
      return '#ef4444'; // Red for end station
    }
    
    // Get the line color
    const line = lines.find(l => l.stations.includes(station.code));
    return line ? line.color : '#888888';
  };

  // Update the useEffect to prevent auto-centering and store the map instance
  useEffect(() => {
    // This will run after component mount
    const timer = setTimeout(() => {
      const mapContainer = document.querySelector('.leaflet-container');
      if (mapContainer) {
        const map = (mapContainer as any)._leaflet_map;
        if (map) {
          // Store the map instance in the ref
          mapRef.current = map;
          
          // Disable auto-panning for all popups
          map.on('popupopen', (e: any) => {
            e.popup.options.autoPan = false;
          });
        }
      }
    }, 1000); // Give the map time to initialize
    
    return () => clearTimeout(timer);
  }, []);

  // Update the handleStationClick function to always select a station
  const handleStationClick = (station: Station) => {
    // Always select the station based on the current selection mode
    if (onStationSelect && selectionMode) {
      onStationSelect(station, selectionMode);
      return;
    }
    
    // If no selection mode (shouldn't happen now), just show the popup
    setPopupInfo(station);
  };

  // Create custom marker icons
  const createMarkerIcon = (station: Station) => {
    const isStart = selectedStartStation?.code === station.code;
    const isEnd = selectedEndStation?.code === station.code;
    
    // Determine marker size and color based on selection state
    const size = isStart || isEnd ? 12 : 8;
    let color = getStationColor(station);
    
    if (isStart) color = '#10b981'; // Green for start
    if (isEnd) color = '#ef4444';   // Red for end
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: ${size}px; 
          height: ${size}px; 
          background-color: ${color}; 
          border-radius: 50%; 
          border: 2px solid white;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.2);
        "></div>
        <div style="
          position: absolute;
          top: ${size + 2}px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          font-size: 8px;
          background-color: rgba(255,255,255,0.7);
          padding: 1px 3px;
          border-radius: 2px;
          font-weight: 500;
          text-align: center;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
        ">${station.code} ${station.name}</div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  return (
    <div className="relative h-full">
      {mapInitialized && (
        <MapContainer
          center={mapCenter}
          zoom={initialZoom || 12}
          style={{ width: '100%', height: '100%', minHeight: '350px' }}
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          dragging={true}
          trackResize={true}
          touchZoom={true}
        >
          <ZoomControl position="topright" />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <SetViewOnChange center={mapCenter} zoom={initialZoom || 12} stations={stations} selectedStartStation={selectedStartStation} selectedEndStation={selectedEndStation} />
          
          {/* Station markers */}
          {stations.map((station) => (
            <Marker
              key={station.code}
              position={getStationCoordinates(station)}
              icon={createMarkerIcon(station)}
              eventHandlers={{
                click: () => handleStationClick(station)
              }}
            >
              {popupInfo && popupInfo.code === station.code && (
                <Popup>
                  <div className="p-2">
                    <h3 className="font-medium text-sm">{station.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{station.code}</p>
                    <div className="text-xs text-muted-foreground">
                      Click on the station marker to select it as {selectionMode === 'start' ? 'starting point' : 'destination'}.
                    </div>
                  </div>
                </Popup>
              )}
            </Marker>
          ))}
          
          {/* Selection mode indicator */}
          {selectionMode && (
            <div className="absolute bottom-4 left-4 z-[1000] bg-white dark:bg-gray-800 p-3 rounded-md shadow-md">
              <p className="text-sm font-medium">
                {selectionMode === 'start' ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                    Select a starting station
                  </>
                ) : (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
                    Select a destination station
                  </>
                )}
              </p>
            </div>
          )}
        </MapContainer>
      )}
    </div>
  );
} 