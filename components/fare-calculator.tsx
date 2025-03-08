"use client";

import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
// Dynamically import MrtMap with SSR disabled
const MrtMap = dynamic(() => import('@/components/mrt-map').then(mod => mod.MrtMap), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8 bg-gray-100 rounded-lg">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    </div>
  )
});
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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

type FareData = {
  [category: string]: {
    [paymentMethod: string]: Record<string, number>;
  };
};

type StationDistances = Record<string, Record<string, number>>;

export default function FareCalculator() {
  const [stations, setStations] = useState<Station[]>([]);
  const [lines, setLines] = useState<MrtLine[]>([]);
  const [fareData, setFareData] = useState<FareData | null>(null);
  const [stationDistances, setStationDistances] = useState<StationDistances | null>(null);
  const [selectedStartStation, setSelectedStartStation] = useState<Station | null>(null);
  const [selectedEndStation, setSelectedEndStation] = useState<Station | null>(null);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [selectedDestLine, setSelectedDestLine] = useState<string | null>(null);
  const [fareType, setFareType] = useState<"adult" | "student" | "senior">("adult");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [fare, setFare] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<'start' | 'end' | null>(null);
  const [showMapDialog, setShowMapDialog] = useState(false);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stations
        const stationsRes = await fetch('/data/mrt_stations.json');
        if (!stationsRes.ok) throw new Error('Failed to load station data');
        const stationsData = await stationsRes.json();
        // Convert object to array if needed
        const stationsArray = Array.isArray(stationsData) 
          ? stationsData 
          : Object.values(stationsData);
        setStations(stationsArray);

        // Fetch lines
        const linesRes = await fetch('/data/mrt_lines.json');
        if (!linesRes.ok) throw new Error('Failed to load line data');
        const linesData = await linesRes.json();
        // Convert object to array if needed
        const linesArray = Array.isArray(linesData) 
          ? linesData 
          : Object.values(linesData);
        setLines(linesArray);

        // Fetch fare data
        const fareRes = await fetch('/data/fare_data.json');
        if (!fareRes.ok) throw new Error('Failed to load fare data');
        const fareData = await fareRes.json();
        setFareData(fareData);

        // Fetch station distances
        const distancesRes = await fetch('/data/station_distances.json');
        if (!distancesRes.ok) throw new Error('Failed to load distance data');
        const distancesData = await distancesRes.json();
        setStationDistances(distancesData);

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fix the getStationsByLine function to properly filter stations by line
  const getStationsByLine = (lineId: string | null) => {
    if (!stations || !Array.isArray(stations)) return [];
    if (!lineId || lineId === 'all') return stations;
    
    const line = lines.find(l => l.name === lineId);
    if (!line) return stations;
    
    // Filter stations that belong to the selected line
    return stations.filter(station => {
      // Extract the line code from the station code (e.g., "NS" from "NS1")
      const stationLineCode = station.code.match(/^[A-Z]+/)?.[0];
      // Check if this line code matches any of our lines
      const matchingLine = lines.find(l => l.stations.includes(station.code));
      return matchingLine && matchingLine.name === lineId;
    });
  };

  // Get filtered stations for starting and destination
  const filteredStartStations = getStationsByLine(selectedLine);
  const filteredDestStations = getStationsByLine(selectedDestLine);

  // Calculate distance between stations
  const calculateDistance = () => {
    if (!selectedStartStation || !selectedEndStation) {
      return null;
    }

    const [lon1, lat1] = selectedStartStation.coordinates;
    const [lon2, lat2] = selectedEndStation.coordinates;
    
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    // Calculate the direct distance
    const directDistance = R * c;
    
    // Apply a small adjustment factor to better match LTA's official distance calculations
    // This accounts for the actual train route which is not always a straight line
    const adjustmentFactor = 1.05; // 5% adjustment
    const distance = directDistance * adjustmentFactor;
    
    return distance;
  };

  // Calculate fare based on distance
  const calculateFare = () => {
    if (!selectedStartStation || !selectedEndStation || !fareData) {
      return null;
    }

    const distance = calculateDistance();
    if (distance === null) return null;

    setDistance(distance);

    // Find the appropriate fare tier based on distance
    const fareTiers = fareData[fareType][paymentMethod];
    let fare = 0;

    // Sort the distance tiers and find the appropriate one
    const tiers = fareTiers ? Object.keys(fareTiers).map(Number).sort((a, b) => a - b) : [];
    
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      if (distance <= tier) {
        fare = fareTiers[tier.toString()];
        break;
      }
    }

    // If no tier matched (distance is greater than all tiers), use the highest tier
    if (fare === 0 && tiers.length > 0) {
      const highestTier = tiers[tiers.length - 1];
      fare = fareTiers[highestTier.toString()];
    }

    return fare;
  };

  // Handle station selection from map
  const handleStationSelect = (station: Station, type: 'start' | 'end') => {
    if (type === 'start') {
      setSelectedStartStation(station);
      // Automatically switch to destination selection mode after selecting start
      setSelectionMode('end');
    } else {
      setSelectedEndStation(station);
      // Return to start selection mode after selecting destination
      setSelectionMode('start');
    }
    
    // Don't close the map dialog
    // setShowMapDialog(false); - removed this line
  };

  // Handle calculate fare button click
  const handleCalculateFare = () => {
    const fare = calculateFare();
    setFare(fare);
  };

  const getStationName = (station: Station | null) => {
    if (!station) return "Select a station";
    return `${station.name} (${station.code})`;
  };

  // Debug information
  console.log('Stations:', stations);
  console.log('Lines:', lines);
  console.log('Filtered Stations:', filteredStartStations);

  // Fix the getStationColor function to correctly match station codes to line colors
  const getStationColor = (station: Station): string => {
    // Extract the line code from the station code (e.g., "NS" from "NS1")
    const stationLineCode = station.code.match(/^[A-Z]+/)?.[0];
    
    // Find the line that contains this station code
    const line = lines.find(l => l.stations.includes(station.code));
    
    // Return the color of the matching line, or a default color if no match
    return line ? line.color : '#888';
  };

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="text-center p-6 bg-muted/30 rounded-lg">
          <div className="animate-pulse">Loading fare data...</div>
        </div>
      ) : error ? (
        <div className="text-destructive p-6 border border-destructive/30 bg-destructive/10 rounded-lg">
          <p className="font-medium">Error loading data</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : null}
      
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="md:h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-green-600"></span>
              Starting Station
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="line-filter" className="text-sm font-medium mb-2 block">
                Filter by Line
              </Label>
              <Select
                value={selectedLine || "all"}
                onValueChange={(value) => setSelectedLine(value === "all" ? null : value)}
              >
                <SelectTrigger id="line-filter" className="w-full">
                  <SelectValue placeholder="All Lines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lines</SelectItem>
                  {Array.isArray(lines) ? lines.map((line) => (
                    <SelectItem key={line.name} value={line.name}>
                      <div className="flex items-center gap-2">
                        <span 
                          className="inline-block w-3 h-3 rounded-full" 
                          style={{ backgroundColor: line.color }}
                        ></span>
                        {line.name}
                      </div>
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
            </div>
            
            <div className="mt-4">
              <Label htmlFor="start-station" className="text-sm font-medium mb-2 block">
                Select Station
              </Label>
              <Select
                value={selectedStartStation?.code || ""}
                onValueChange={(value) => {
                  const station = stations.find(s => s.code === value);
                  if (station) setSelectedStartStation(station);
                }}
              >
                <SelectTrigger id="start-station" className="w-full">
                  <SelectValue placeholder="Select starting station" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(filteredStartStations) ? filteredStartStations.map((station) => (
                    <SelectItem key={station.code} value={station.code}>
                      <div className="flex items-center gap-2">
                        <span 
                          className="inline-block w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getStationColor(station) }}
                        ></span>
                        {station.name} ({station.code})
                      </div>
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="md:h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-destructive"></span>
              Destination Station
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="dest-line-filter" className="text-sm font-medium mb-2 block">
                Filter by Line
              </Label>
              <Select
                value={selectedDestLine || "all"}
                onValueChange={(value) => setSelectedDestLine(value === "all" ? null : value)}
              >
                <SelectTrigger id="dest-line-filter" className="w-full">
                  <SelectValue placeholder="All Lines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lines</SelectItem>
                  {Array.isArray(lines) ? lines.map((line) => (
                    <SelectItem key={line.name} value={line.name}>
                      <div className="flex items-center gap-2">
                        <span 
                          className="inline-block w-3 h-3 rounded-full" 
                          style={{ backgroundColor: line.color }}
                        ></span>
                        {line.name}
                      </div>
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4">
              <Label htmlFor="end-station" className="text-sm font-medium mb-2 block">
                Select Station
              </Label>
              <Select
                value={selectedEndStation?.code || ""}
                onValueChange={(value) => {
                  const station = stations.find(s => s.code === value);
                  if (station) setSelectedEndStation(station);
                }}
              >
                <SelectTrigger id="end-station" className="w-full">
                  <SelectValue placeholder="Select destination station" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(filteredDestStations) ? filteredDestStations.map((station) => (
                    <SelectItem key={station.code} value={station.code}>
                      <div className="flex items-center gap-2">
                        <span 
                          className="inline-block w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getStationColor(station) }}
                        ></span>
                        {station.name} ({station.code})
                      </div>
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Fare Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fare-type" className="text-sm font-medium mb-2 block">
                    Passenger Type
                  </Label>
                  <Select
                    value={fareType}
                    onValueChange={(value) => setFareType(value as "adult" | "student" | "senior")}
                  >
                    <SelectTrigger id="fare-type" className="w-full">
                      <SelectValue placeholder="Select passenger type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adult">Adult</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="senior">Senior Citizen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="payment-method" className="text-sm font-medium mb-2 block">
                    Payment Method
                  </Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as "card" | "cash")}
                  >
                    <SelectTrigger id="payment-method" className="w-full">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex flex-col justify-center">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleCalculateFare}
                  disabled={!selectedStartStation || !selectedEndStation}
                >
                  Calculate Fare
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4" 
                  onClick={() => setShowMapDialog(true)}
                >
                  Browse MRT Map
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {fare !== null && (
        <div className="mt-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Fare Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">From</h3>
                    <p className="text-base font-medium">{selectedStartStation?.name} ({selectedStartStation?.code})</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">To</h3>
                    <p className="text-base font-medium">{selectedEndStation?.name} ({selectedEndStation?.code})</p>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Distance</h3>
                    <p className="text-base font-medium">{distance?.toFixed(1)} km</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Passenger</h3>
                    <p className="text-base font-medium capitalize">{fareType}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Payment</h3>
                    <p className="text-base font-medium">{paymentMethod === 'card' ? 'Card' : 'Cash'}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-medium">Total Fare</h3>
                    <p className="text-2xl font-bold">${fare.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-center mt-6">
        <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="px-6">
              View MRT Map
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Singapore MRT Map</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-[500px] overflow-hidden">
              <MrtMap 
                stations={stations} 
                lines={lines}
                selectedStartStation={selectedStartStation}
                selectedEndStation={selectedEndStation}
                onStationSelect={handleStationSelect}
                selectionMode={selectionMode}
              />
            </div>
            <div className="p-4 border-t mt-2 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Starting Station:</p>
                  <p className="text-base">{selectedStartStation ? selectedStartStation.name : 'Not selected'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Destination Station:</p>
                  <p className="text-base">{selectedEndStation ? selectedEndStation.name : 'Not selected'}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowMapDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    setShowMapDialog(false);
                    if (selectedStartStation && selectedEndStation) {
                      handleCalculateFare();
                    }
                  }}
                  disabled={!selectedStartStation || !selectedEndStation}
                >
                  Calculate Fare
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 