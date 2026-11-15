// Generate the fare tables the app reads from the per-distance CSVs in public/data.
//
//   lta_fare_data.json            <- FaresforMRTandLRTCentsEffectivefrom27December2025.csv
//     data.gov.sg dataset d_2ca29f673b89e0cfddbb7c74516fa4d3 (published by PTC)
//
//   lta_fare_data_2026-12-26.json <- FaresforMRTandLRTCentsEffectivefrom26December2026-PTC-AnnexB.csv
//     The "Approved" train card fares in Annex B of PTC's Fare Review Exercise 2026
//     (https://www.ptc.gov.sg/media-centre/newsroom/fare-review-exercise-2026/), typed
//     into the data.gov.sg column layout. data.gov.sg had not published the 26 Dec 2026
//     table yet on 15 Nov 2026 (collection 1550 still held only the 2025 dataset); when
//     it does, put that CSV here instead and rerun. The annex lists senior and student
//     fares as "Over 7.2 km", which fills every band above 7.2 km.
//
// The JSON shape is { adult|senior|student: { card: { peak|offPeak: { "<upper km>": dollars } } } },
// where "peak" is "All other timings", "offPeak" is tap-in before 7.45am on weekdays,
// and "999" is the over-40.2 km band.
//
// Usage (from the repo root): node scripts/gen_fares.js

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'public', 'data');

const TABLES = [
  ['FaresforMRTandLRTCentsEffectivefrom27December2025.csv', 'lta_fare_data.json'],
  ['FaresforMRTandLRTCentsEffectivefrom26December2026-PTC-AnnexB.csv', 'lta_fare_data_2026-12-26.json'],
];

const FARE_TYPES = {
  'Adult card fare': 'adult',
  'Senior citizen card fare': 'senior',
  'Student card fare': 'student',
};

const TIMES = {
  'All other timings': 'peak',
  'Before 7.45am  (Weekdays excluding public holidays)': 'offPeak',
};

const TOP_BAND = 999; // "Over 40.2 km"

function parseDistance(label) {
  let m = label.match(/^Up to ([\d.]+) km$/);
  if (m) return { upper: Number(m[1]) };
  m = label.match(/^[\d.]+ km - ([\d.]+) km$/);
  if (m) return { upper: Number(m[1]) };
  m = label.match(/^Over ([\d.]+) km$/);
  if (m) return { over: Number(m[1]) };
  throw new Error('Unknown distance band: ' + label);
}

function build(csvFile) {
  const lines = fs.readFileSync(path.join(DATA, csvFile), 'utf8').trim().split(/\r?\n/);
  const header = lines.shift();
  if (header !== 'fare_type,applicable_time,distance,fare_per_ride') {
    throw new Error('Unexpected header in ' + csvFile + ': ' + header);
  }

  const rows = lines.map((line) => {
    const [fareType, time, distance, cents] = line.split(',');
    const type = FARE_TYPES[fareType];
    const timeOfDay = TIMES[time];
    if (!type || !timeOfDay) throw new Error('Unknown row in ' + csvFile + ': ' + line);
    return { type, timeOfDay, band: parseDistance(distance), fare: Number(cents) / 100 };
  });

  // Every band upper bound named anywhere in the file, plus the top band.
  const uppers = [...new Set(rows.filter((r) => r.band.upper).map((r) => r.band.upper))];
  uppers.push(TOP_BAND);
  uppers.sort((a, b) => a - b);

  const out = {};
  for (const type of Object.values(FARE_TYPES)) {
    out[type] = { card: {} };
    for (const timeOfDay of ['peak', 'offPeak']) {
      const mine = rows.filter((r) => r.type === type && r.timeOfDay === timeOfDay);
      const table = {};
      for (const upper of uppers) {
        const exact = mine.find((r) => r.band.upper === upper);
        const over = mine.find((r) => r.band.over !== undefined && upper > r.band.over);
        const row = exact || over;
        if (!row) throw new Error(`No ${type} ${timeOfDay} fare for the band up to ${upper} km in ${csvFile}`);
        table[String(upper)] = row.fare;
      }
      out[type].card[timeOfDay] = table;
    }
  }
  return out;
}

for (const [csvFile, jsonFile] of TABLES) {
  const table = build(csvFile);
  fs.writeFileSync(path.join(DATA, jsonFile), JSON.stringify(table, null, 2));
  console.log('Wrote', jsonFile, 'from', csvFile);
}
