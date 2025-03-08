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
  selectionMode?: 'browse' | 'start' | 'end';
  setSelectionMode?: (mode: 'browse' | 'start' | 'end') => void;
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
  selectionMode: initialSelectionMode,
  setSelectionMode: externalSetSelectionMode
}: MrtMapProps) {
  // Initialize with initialSelectionMode or default to 'browse'
  const [internalSelectionMode, setInternalSelectionMode] = useState<'browse' | 'start' | 'end'>(initialSelectionMode || 'browse');
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // Keep track of the previous initialSelectionMode value
  const prevInitialSelectionModeRef = useRef(initialSelectionMode);

  // Use the external setSelectionMode if provided, otherwise use the internal one
  const handleSelectionModeChange = (mode: 'browse' | 'start' | 'end') => {
    if (externalSetSelectionMode) {
      externalSetSelectionMode(mode);
    } else {
      setInternalSelectionMode(mode);
    }
  };

  // Get the current selection mode (either from props or internal state)
  const currentSelectionMode = initialSelectionMode || internalSelectionMode;

  // Update internal state when props change
  useEffect(() => {
    if (initialSelectionMode !== prevInitialSelectionModeRef.current) {
      setInternalSelectionMode(initialSelectionMode || 'browse');
      prevInitialSelectionModeRef.current = initialSelectionMode;
    }
  }, [initialSelectionMode]);

  // Handle station selection
  const handleStationSelect = (station: Station) => {
    if (!onStationSelect) return;
    
    if (currentSelectionMode === 'start') {
      onStationSelect(station, 'start');
    } else if (currentSelectionMode === 'end') {
      onStationSelect(station, 'end');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-center gap-2 mb-4">
        <Button
          variant={currentSelectionMode === 'start' ? "default" : "outline"}
          onClick={() => handleSelectionModeChange('start')}
          className={currentSelectionMode === 'start' ? "bg-green-600 hover:bg-green-700" : ""}
        >
          {selectedStartStation ? "Change Start" : "Select Start"}
        </Button>
        <Button
          variant={currentSelectionMode === 'end' ? "default" : "outline"}
          onClick={() => handleSelectionModeChange('end')}
          className={currentSelectionMode === 'end' ? "bg-red-600 hover:bg-red-700" : ""}
        >
          {selectedEndStation ? "Change Destination" : "Select Destination"}
        </Button>
        <Button
          variant={currentSelectionMode === 'browse' ? "default" : "outline"}
          onClick={() => handleSelectionModeChange('browse')}
        >
          Browse Map
        </Button>
      </div>
      
      <div className="flex-1 relative">
        <MapComponent 
          stations={stations} 
          lines={lines}
          selectedStartStation={selectedStartStation}
          selectedEndStation={selectedEndStation}
          onStationSelect={handleStationSelect}
          selectionMode={currentSelectionMode}
        />
      </div>
    </div>
  );
}

// Make sure the export is named for dynamic import
// export { MrtMap }; // Remove this line as it's causing a redeclaration error 