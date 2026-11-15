// Prices a few journeys in both fare periods and compares them with the official tables.
//
// Expected fares are typed from Annex B of PTC's Fare Review Exercise 2026
// (https://www.ptc.gov.sg/media-centre/newsroom/fare-review-exercise-2026/), "Train fares
// (w.e.f. 26 December 2026)": the "Current" columns (which match data.gov.sg dataset
// d_2ca29f673b89e0cfddbb7c74516fa4d3, effective 27 Dec 2025) and the "Approved" columns.
// Station codes and the 26 Dec 2026 opening are from LTA's news release of 4 Nov 2026.
//
// Run from the repo root: npx tsx scripts/check-fares.ts

import fs from "node:fs";
import path from "node:path";
import {
  DEC_2026_START,
  fareForDistance,
  isOpenIn,
  periodAt,
  shortestDistance,
  type FareTable,
  type FareType,
  type Period,
  type StationDistances,
  type TimeOfDay,
} from "../lib/fares";

const DATA = path.join(__dirname, "..", "public", "data");
const read = <T>(file: string): T => JSON.parse(fs.readFileSync(path.join(DATA, file), "utf8"));

const graph = read<StationDistances>("station_distances.json");
const stations = read<Record<string, { name: string; opens?: string }>>("mrt_stations.json");
const tables: Record<Period, FareTable> = {
  current: read<FareTable>("lta_fare_data.json"),
  dec2026: read<FareTable>("lta_fare_data_2026-12-26.json"),
};

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}${detail ? `  (${detail})` : ""}`);
}

const openIn = (period: Period) => (code: string) => !!stations[code] && isOpenIn(stations[code], period);

// --- The date switch: 00:00 on 26 Dec 2026, Singapore time ---------------------------
check("23:59:59.999 SGT on 25 Dec 2026 is still the current period",
  periodAt(Date.UTC(2026, 11, 25, 15, 59, 59, 999)) === "current");
check("00:00 SGT on 26 Dec 2026 is the new period", periodAt(Date.UTC(2026, 11, 25, 16)) === "dec2026");
check("15 Nov 2026 is the current period", periodAt(Date.UTC(2026, 10, 15, 4)) === "current");
check("DEC_2026_START is 2026-12-25T16:00:00Z", new Date(DEC_2026_START).toISOString() === "2026-12-25T16:00:00.000Z");

// --- The new stations ----------------------------------------------------------------
for (const code of ["TE30", "TE31", "DT36", "DT37"]) {
  check(`${code} ${stations[code]?.name} is closed until 25 Dec and open from 26 Dec`,
    !openIn("current")(code) && openIn("dec2026")(code));
}
check("Bayshore (TE29) is open in both periods", openIn("current")("TE29") && openIn("dec2026")("TE29"));

// --- Every band of the new table moves by PTC's announced amount ----------------------
// Adults +12 cents up to 3.2 km and +13 cents beyond; students and seniors +5 cents.
for (const fareType of ["adult", "senior", "student"] as FareType[]) {
  for (const time of ["peak", "offPeak"] as TimeOfDay[]) {
    const now = tables.current[fareType].card[time];
    const next = tables.dec2026[fareType].card[time];
    const bad = Object.keys(now).filter((band) => {
      const expected = fareType === "adult" ? (band === "3.2" ? 12 : 13) : 5;
      return Math.round((next[band] - now[band]) * 100) !== expected;
    });
    check(`${fareType} ${time}: every band changes by the announced amount`,
      bad.length === 0 && Object.keys(now).length === Object.keys(next).length,
      bad.length ? `bands ${bad.join(", ")}` : "");
  }
}

// --- Journeys -------------------------------------------------------------------------
// Fares in cents: [adult peak, adult before 7.45am, senior peak, senior before 7.45am,
//                  student peak, student before 7.45am], from the Annex B rows named.
type Expect = { km: [number, number]; band: string; cents: number[] } | null;
const journeys: { from: string; to: string; current: Expect; dec2026: Expect }[] = [
  {
    // Short trip, same route in both periods
    from: "EW12", to: "EW13",
    current: { km: [0, 3.2], band: "Up to 3.2 km", cents: [128, 78, 69, 19, 52, 2] },
    dec2026: { km: [0, 3.2], band: "Up to 3.2 km", cents: [140, 90, 74, 24, 57, 7] },
  },
  {
    // Long trip, the whole TEL as far as Bayshore
    from: "TE1", to: "TE29",
    current: { km: [40.2, 999], band: "Over 40.2 km / over 7.2 km", cents: [257, 207, 107, 57, 78, 28] },
    dec2026: { km: [40.2, 999], band: "Over 40.2 km / over 7.2 km", cents: [270, 220, 112, 62, 83, 33] },
  },
  {
    // To Xilin, which only exists from 26 Dec
    from: "DT32", to: "DT36",
    current: null,
    dec2026: { km: [4.2, 5.2], band: "4.3 km - 5.2 km", cents: [162, 112, 92, 42, 71, 21] },
  },
  {
    // Bayshore to Expo: today the long way round (through Tanah Merah and the Changi
    // Airport branch), from 26 Dec via Sungei Bedok
    from: "TE29", to: "DT35",
    current: { km: [29.2, 30.2], band: "29.3 km - 30.2 km / over 7.2 km", cents: [246, 196, 107, 57, 78, 28] },
    dec2026: { km: [4.2, 5.2], band: "4.3 km - 5.2 km", cents: [162, 112, 92, 42, 71, 21] },
  },
  {
    // Changi Airport branch (added 15 Nov 2026)
    from: "CG2", to: "EW13",
    current: { km: [19.2, 20.2], band: "19.3 km - 20.2 km / over 7.2 km", cents: [227, 177, 107, 57, 78, 28] },
    dec2026: { km: [19.2, 20.2], band: "19.3 km - 20.2 km / over 7.2 km", cents: [240, 190, 112, 62, 83, 33] },
  },
  {
    // West end of the East-West Line (added 15 Nov 2026)
    from: "EW27", to: "EW24",
    current: { km: [5.2, 6.2], band: "5.3 km - 6.2 km", cents: [159, 109, 94, 44, 71, 21] },
    dec2026: { km: [5.2, 6.2], band: "5.3 km - 6.2 km", cents: [172, 122, 99, 49, 76, 26] },
  },
  {
    // Punggol Coast (added 15 Nov 2026)
    from: "NE18", to: "NE6",
    current: { km: [17.2, 18.2], band: "17.3 km - 18.2 km / over 7.2 km", cents: [220, 170, 107, 57, 78, 28] },
    dec2026: { km: [17.2, 18.2], band: "17.3 km - 18.2 km / over 7.2 km", cents: [233, 183, 112, 62, 83, 33] },
  },
  {
    // Bedok to Xilin from 26 Dec goes through Tanah Merah and Expo
    from: "EW5", to: "DT36",
    current: null,
    dec2026: { km: [4.2, 5.2], band: "4.3 km - 5.2 km", cents: [162, 112, 92, 42, 71, 21] },
  },
];

const PRICES: [FareType, TimeOfDay][] = [
  ["adult", "peak"], ["adult", "offPeak"],
  ["senior", "peak"], ["senior", "offPeak"],
  ["student", "peak"], ["student", "offPeak"],
];

for (const j of journeys) {
  for (const period of ["current", "dec2026"] as Period[]) {
    const expected = j[period];
    const name = `${stations[j.from].name} (${j.from}) to ${stations[j.to].name} (${j.to}), ${period}`;
    const km = shortestDistance(graph, j.from, j.to, openIn(period));

    if (expected === null) {
      check(`${name}: not available`, km === null, `got ${km}`);
      continue;
    }
    if (km === null) {
      check(`${name}: has a route`, false);
      continue;
    }

    check(`${name}: ${km.toFixed(2)} km is in band ${expected.band}`, km > expected.km[0] && km <= expected.km[1]);
    const got = PRICES.map(([t, time]) => Math.round(fareForDistance(tables[period], t, time, km) * 100));
    check(`${name}: fares match the official table`,
      got.every((c, i) => c === expected.cents[i]),
      `got ${got.join("/")}, expected ${expected.cents.join("/")}`);
  }
}

// From 26 Dec, Bayshore to Expo really goes through Sungei Bedok
const viaSungeiBedok = shortestDistance(graph, "TE29", "DT35", openIn("dec2026"))!;
const withoutSungeiBedok = shortestDistance(graph, "TE29", "DT35",
  (c) => openIn("dec2026")(c) && c !== "TE31" && c !== "DT37");
check("Bayshore to Expo from 26 Dec runs via Sungei Bedok",
  withoutSungeiBedok === null || viaSungeiBedok < withoutSungeiBedok,
  `${viaSungeiBedok.toFixed(2)} km via Sungei Bedok, ${withoutSungeiBedok?.toFixed(2)} km without`);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exitCode = failures === 0 ? 0 : 1;
