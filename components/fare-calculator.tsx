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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    [paymentMethod: string]: {
      [timeOfDay: string]: Record<string, number>;
    };
  };
};

type FareType = "adult" | "student" | "senior";
type PaymentMethod = "card" | "cash";
type TimeOfDay = "peak" | "offPeak";
type SelectionMode = 'browse' | 'start' | 'end';

export default function FareCalculator() {
  const [stations, setStations] = useState<Station[]>([]);
  const [lines, setLines] = useState<MrtLine[]>([]);
  const [fareData, setFareData] = useState<FareData | null>(null);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [selectedDestLine, setSelectedDestLine] = useState<string | null>(null);
  const [selectedStartStation, setSelectedStartStation] = useState<Station | null>(null);
  const [selectedEndStation, setSelectedEndStation] = useState<Station | null>(null);
  const [fareType, setFareType] = useState<FareType>("adult");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("peak");
  const [fare, setFare] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [mapSelectionMode, setMapSelectionMode] = useState<SelectionMode>('browse');

  // Get stations by line
  const getStationsByLine = (lineId: string | null) => {
    if (!stations || !Array.isArray(stations)) {
      return [];
    }

    if (!lineId || lineId === 'all') {
      return stations;
    }

    const line = lines.find(l => l.name === lineId);
    if (!line) {
      return stations;
    }

    return stations.filter(station => line.stations.includes(station.code));
  };

  // Filter stations based on selected line
  const filteredStartStations = getStationsByLine(selectedLine);
  const filteredDestStations = getStationsByLine(selectedDestLine);

  useEffect(() => {
    // Fetch MRT stations data
    const fetchData = async () => {
      try {
        const [stationsResponse, linesResponse, fareResponse] = await Promise.all([
          fetch('/data/mrt_stations.json'),
          fetch('/data/mrt_lines.json'),
          fetch('/data/lta_fare_data.json')
        ]);

        if (!stationsResponse.ok || !linesResponse.ok || !fareResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const stationsData = await stationsResponse.json();
        const linesData = await linesResponse.json();
        const fareData = await fareResponse.json();

        // Convert stations object to array and ensure it's an array
        const stationsArray = Object.values(stationsData);
        setStations(Array.isArray(stationsArray) ? stationsArray as Station[] : []);
        
        // Ensure lines is an array
        setLines(Array.isArray(linesData) ? linesData : []);
        setFareData(fareData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

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
    
    // Apply a larger adjustment factor to better match LTA's official distance calculations
    // This accounts for the actual train route which is not always a straight line
    const adjustmentFactor = 1.15; // 15% adjustment
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
    const fareTiers = fareData[fareType][paymentMethod][timeOfDay];
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
      // Automatically switch to end selection mode after selecting start
      setMapSelectionMode('end');
    } else {
      setSelectedEndStation(station);
      // Return to browse mode after selecting end station
      setMapSelectionMode('browse');
    }
  };

  // Handle calculate fare button click
  const handleCalculateFare = () => {
    const calculatedFare = calculateFare();
    if (calculatedFare !== null) {
      setFare(calculatedFare);
    }
  };

  // Get station name with code
  const getStationName = (station: Station | null) => {
    if (!station) return "Not selected";
    return `${station.name} (${station.code})`;
  };

  // Get station color based on line
  const getStationColor = (station: Station): string => {
    if (!lines || !Array.isArray(lines)) {
      return "#888888"; // Default color if lines is not available or not an array
    }
    
    // Extract the line code from the station code (e.g., "NS" from "NS1")
    const stationLineCode = station.code.match(/^[A-Z]+/)?.[0];
    
    if (!stationLineCode) {
      return "#888888";
    }
    
    // Find the line that contains this station code
    const line = lines.find(l => l.name === stationLineCode);
    
    return line ? line.color : "#888888";
  };

  return (
    <div className="container mx-auto">
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
                    onValueChange={(value) => setFareType(value as FareType)}
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
                    onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
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

                <div>
                  <div className="flex items-center gap-1">
                    <Label htmlFor="time-of-day" className="text-sm font-medium mb-2 block">
                      Time of Travel
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p><strong>Off-Peak:</strong> Before 7:45am on weekdays (excluding public holidays)</p>
                          <p><strong>Peak:</strong> All other times</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={timeOfDay}
                    onValueChange={(value) => setTimeOfDay(value as TimeOfDay)}
                  >
                    <SelectTrigger id="time-of-day" className="w-full">
                      <SelectValue placeholder="Select time of travel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="peak">Peak Hours</SelectItem>
                      <SelectItem value="offPeak">Off-Peak Hours</SelectItem>
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
                  onClick={() => {
                    setShowMapDialog(true);
                    setMapSelectionMode('browse');
                  }}
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

                <div className="text-xs text-muted-foreground mt-4">
                  <p>Disclaimer: Fare calculations are based on data from the Land Transport Authority (LTA) and data.gov.sg. 
                  Actual fares may vary slightly from the calculated amounts. Distance calculations are approximate.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Singapore MRT Map</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden relative">
            <MrtMap 
              stations={stations} 
              lines={lines} 
              selectedStartStation={selectedStartStation}
              selectedEndStation={selectedEndStation}
              onStationSelect={handleStationSelect}
              selectionMode={mapSelectionMode}
              setSelectionMode={setMapSelectionMode}
            />
            
            {mapSelectionMode !== 'browse' && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-background/90 px-4 py-2 rounded-full shadow-md border">
                <p className="text-sm font-medium flex items-center gap-2">
                  {mapSelectionMode === 'start' ? (
                    <>
                      <span className="inline-block w-3 h-3 rounded-full bg-green-600"></span>
                      Select starting station
                    </>
                  ) : (
                    <>
                      <span className="inline-block w-3 h-3 rounded-full bg-destructive"></span>
                      Select destination station
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-4 border-t pt-4 flex justify-between items-center">
            <div className="flex-1">
              {selectedStartStation && (
                <p className="text-sm">
                  <span className="text-muted-foreground">From:</span> {selectedStartStation.name} ({selectedStartStation.code})
                </p>
              )}
              {selectedEndStation && (
                <p className="text-sm">
                  <span className="text-muted-foreground">To:</span> {selectedEndStation.name} ({selectedEndStation.code})
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowMapDialog(false)}>
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
  );
} 