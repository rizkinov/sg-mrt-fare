"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from 'next/dynamic';
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

type MrtMapProps = {
  stations: Station[];
  lines: MrtLine[];
  selectedStartStation?: Station | null;
  selectedEndStation?: Station | null;
  onStationSelect?: (station: Station, selectionType: 'start' | 'end') => void;
  selectionMode?: 'start' | 'end' | null;
};

// Dynamically import Leaflet components with SSR disabled
const MapComponent = dynamic(
  () => import('./map-component').then((mod) => mod.MapComponent),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[500px] bg-muted/30 rounded-lg">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading map...</p>
        </div>
      </div>
    ),
  }
);

export function MrtMap({
  stations,
  lines,
  selectedStartStation,
  selectedEndStation,
  onStationSelect,
  selectionMode: initialSelectionMode
}: MrtMapProps) {
  // Initialize with initialSelectionMode or default to 'start'
  const [selectionMode, setSelectionMode] = useState<'start' | 'end' | null>(initialSelectionMode || 'start');
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // Use a ref to track the previous initialSelectionMode value
  const prevInitialSelectionModeRef = useRef(initialSelectionMode);

  useEffect(() => {
    // Initialize the map
    setMapInitialized(true);
  }, []);

  // Always ensure we have a selection mode active (default to 'start' if null)
  useEffect(() => {
    if (selectionMode === null) {
      setSelectionMode('start');
    }
  }, [selectionMode]);
  
  // Sync with parent component's selection mode
  useEffect(() => {
    // Only update if initialSelectionMode has changed and is different from current selectionMode
    if (
      initialSelectionMode !== undefined && 
      initialSelectionMode !== null && 
      initialSelectionMode !== prevInitialSelectionModeRef.current
    ) {
      setSelectionMode(initialSelectionMode);
      // Update the ref to the new value
      prevInitialSelectionModeRef.current = initialSelectionMode;
    }
  }, [initialSelectionMode]);

  return (
    <div className="flex flex-col h-[60vh] space-y-4">
      <div className="flex space-x-2">
        <Button
          variant={selectionMode === 'start' ? "default" : "outline"}
          onClick={() => setSelectionMode('start')}
          className={selectionMode === 'start' ? "bg-green-600 hover:bg-green-700" : ""}
        >
          {selectedStartStation ? `Change Start (${selectedStartStation.code})` : "Select Start"}
        </Button>
        <Button
          variant={selectionMode === 'end' ? "default" : "outline"}
          onClick={() => setSelectionMode('end')}
          className={selectionMode === 'end' ? "bg-red-600 hover:bg-red-700" : ""}
        >
          {selectedEndStation ? `Change Destination (${selectedEndStation.code})` : "Select Destination"}
        </Button>
      </div>
      
      {/* Selection mode indicator */}
      {selectionMode && (
        <div className="bg-white dark:bg-gray-800 p-2 rounded-md shadow-sm border text-sm">
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
        </div>
      )}
      
      {/* Map container */}
      <div className="flex-1 rounded-lg overflow-hidden border">
        <MapComponent
          stations={stations}
          lines={lines}
          selectedStartStation={selectedStartStation}
          selectedEndStation={selectedEndStation}
          onStationSelect={onStationSelect}
          selectionMode={selectionMode}
          initialZoom={12}
        />
      </div>
    </div>
  );
}

// Make sure the export is named for dynamic import
// export { MrtMap }; // Remove this line as it's causing a redeclaration error 