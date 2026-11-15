// Fare and network rules for the two fare periods.
//
// On 26 Dec 2026 the fares from PTC's Fare Review Exercise 2026 take effect and
// TE30 Bedok South, TE31/DT37 Sungei Bedok and DT36 Xilin open. Which period is in
// force is decided in the browser at run time, never at build time, because the
// page is prerendered.

export type Period = "current" | "dec2026";

export type FareType = "adult" | "student" | "senior";
export type TimeOfDay = "peak" | "offPeak";

export type FareTable = {
  [fareType: string]: {
    [paymentMethod: string]: {
      [timeOfDay: string]: Record<string, number>;
    };
  };
};

export type StationDistances = Record<string, Record<string, number>>;

// 00:00 on 26 Dec 2026 in Singapore (UTC+8) is 16:00 UTC on 25 Dec 2026.
export const DEC_2026_START = Date.UTC(2026, 11, 25, 16, 0, 0);

export const PERIODS: { id: Period; label: string; summary: string }[] = [
  { id: "current", label: "Until 25 Dec", summary: "Fares until 25 Dec 2026" },
  { id: "dec2026", label: "From 26 Dec", summary: "Fares from 26 Dec 2026" },
];

export const FARE_FILES: Record<Period, string> = {
  current: "/data/lta_fare_data.json",
  dec2026: "/data/lta_fare_data_2026-12-26.json",
};

export function periodAt(timeMs: number): Period {
  return timeMs >= DEC_2026_START ? "dec2026" : "current";
}

// When a period's fares and network start, in ms since the epoch.
const PERIOD_START: Record<Period, number> = {
  current: -Infinity,
  dec2026: DEC_2026_START,
};

// "2026-12-26" -> 00:00 that day in Singapore, in ms since the epoch.
function sgtMidnight(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Date.UTC(y, m - 1, d) - 8 * 60 * 60 * 1000;
}

// A station with no "opens" date is already open.
export function isOpenIn(station: { opens?: string }, period: Period): boolean {
  return !station.opens || sgtMidnight(station.opens) <= PERIOD_START[period];
}

// Shortest distance along the rail graph, using only the stations allowed.
export function shortestDistance(
  graph: StationDistances,
  start: string,
  end: string,
  allowed: (code: string) => boolean = () => true
): number | null {
  if (!allowed(start) || !allowed(end)) return null;
  if (start === end) return 0;

  const dist: Record<string, number> = { [start]: 0 };
  const visited = new Set<string>();
  const pq: [number, string][] = [[0, start]];

  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift()!;

    if (visited.has(u)) continue;
    visited.add(u);

    if (u === end) break;

    const neighbors = graph[u];
    if (!neighbors) continue;

    for (const [v, w] of Object.entries(neighbors)) {
      if (!allowed(v)) continue;
      const newDist = d + w;
      if (dist[v] === undefined || newDist < dist[v]) {
        dist[v] = newDist;
        pq.push([newDist, v]);
      }
    }
  }

  return dist[end] ?? null;
}

// Fare in dollars for a distance in km: the first band whose upper bound covers it.
export function fareForDistance(
  table: FareTable,
  fareType: FareType,
  timeOfDay: TimeOfDay,
  distanceKm: number
): number {
  const fareTiers = table[fareType]["card"][timeOfDay];
  const tiers = Object.keys(fareTiers).map(Number).sort((a, b) => a - b);

  for (const tier of tiers) {
    if (distanceKm <= tier) return fareTiers[tier.toString()];
  }

  // Beyond every band: use the highest one
  return tiers.length > 0 ? fareTiers[tiers[tiers.length - 1].toString()] : 0;
}
