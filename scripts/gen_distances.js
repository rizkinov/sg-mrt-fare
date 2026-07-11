// Generate station_distances.json:
// - Haversine distance between adjacent stations × 1.15 calibration factor
//   (validated against known line lengths)
// - Interchange connections (same physical station) use distance 0
//
// Network reflects stations open for passenger service as of 12 July 2026:
// NS12 Canberra, DT4 Hume, full TEL through Stage 4 (TE29 Bayshore, with
// TE21/TE22A not yet open), and Circle Line Stage 6 (CC30-CC32) which closes
// the loop into Marina Bay/Bayfront.

const fs = require('fs');
const stations = require('../public/data/mrt_stations.json');

function haversine(lon1, lat1, lon2, lat2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function dist(code1, code2) {
  const s1 = stations[code1];
  const s2 = stations[code2];
  if (!s1 || !s2) {
    console.error('Missing station:', code1, code2);
    return 0;
  }
  return Math.round(haversine(s1.coordinates[0], s1.coordinates[1], s2.coordinates[0], s2.coordinates[1]) * 1.15 * 100) / 100;
}

const railConnections = [
  // North-South Line
  ['NS1', 'NS2'], ['NS2', 'NS3'], ['NS3', 'NS4'], ['NS4', 'NS5'],
  ['NS5', 'NS7'], // NS6 Sungei Kadut not yet open
  ['NS7', 'NS8'], ['NS8', 'NS9'], ['NS9', 'NS10'], ['NS10', 'NS11'],
  ['NS11', 'NS12'], ['NS12', 'NS13'],
  ['NS13', 'NS14'], ['NS14', 'NS15'], ['NS15', 'NS16'], ['NS16', 'NS17'],
  ['NS17', 'NS18'], ['NS18', 'NS19'], ['NS19', 'NS20'], ['NS20', 'NS21'],
  ['NS21', 'NS22'], ['NS22', 'NS23'], ['NS23', 'NS24'], ['NS24', 'NS25'],
  ['NS25', 'NS26'], ['NS26', 'NS27'], ['NS27', 'NS28'],

  // East-West Line
  ['EW1', 'EW2'], ['EW2', 'EW3'], ['EW3', 'EW4'], ['EW4', 'EW5'],
  ['EW5', 'EW6'], ['EW6', 'EW7'], ['EW7', 'EW8'], ['EW8', 'EW9'],
  ['EW9', 'EW10'], ['EW10', 'EW11'], ['EW11', 'EW12'], ['EW12', 'EW13'],
  ['EW13', 'EW14'], ['EW14', 'EW15'], ['EW15', 'EW16'], ['EW16', 'EW17'],
  ['EW17', 'EW18'], ['EW18', 'EW19'], ['EW19', 'EW20'], ['EW20', 'EW21'],
  ['EW21', 'EW22'], ['EW22', 'EW23'], ['EW23', 'EW24'],

  // North-East Line
  ['NE1', 'NE3'], // NE2 not built
  ['NE3', 'NE4'], ['NE4', 'NE5'], ['NE5', 'NE6'], ['NE6', 'NE7'],
  ['NE7', 'NE8'], ['NE8', 'NE9'], ['NE9', 'NE10'], ['NE10', 'NE11'],
  ['NE11', 'NE12'], ['NE12', 'NE13'], ['NE13', 'NE14'], ['NE14', 'NE15'],
  ['NE15', 'NE16'], ['NE16', 'NE17'],

  // Circle Line (Stage 6 closes the loop from 12 Jul 2026)
  ['CC1', 'CC2'], ['CC2', 'CC3'], ['CC3', 'CC4'], ['CC4', 'CC5'],
  ['CC5', 'CC6'], ['CC6', 'CC7'], ['CC7', 'CC8'], ['CC8', 'CC9'],
  ['CC9', 'CC10'], ['CC10', 'CC11'], ['CC11', 'CC12'], ['CC12', 'CC13'],
  ['CC13', 'CC14'], ['CC14', 'CC15'], ['CC15', 'CC16'], ['CC16', 'CC17'],
  ['CC17', 'CC19'], // CC18 Bukit Brown not built
  ['CC19', 'CC20'], ['CC20', 'CC21'], ['CC21', 'CC22'],
  ['CC22', 'CC23'], ['CC23', 'CC24'], ['CC24', 'CC25'], ['CC25', 'CC26'],
  ['CC26', 'CC27'], ['CC27', 'CC28'], ['CC28', 'CC29'],
  ['CC29', 'CC30'], ['CC30', 'CC31'], ['CC31', 'CC32'],
  ['CC32', 'NS27'], // CC32 Prince Edward Road -> CC33 Marina Bay (NS27 in our data)
  ['NS27', 'DT16'], // CC33 Marina Bay -> CC34 Bayfront (DT16 in our data)

  // Downtown Line
  ['DT1', 'DT2'], ['DT2', 'DT3'], ['DT3', 'DT4'], ['DT4', 'DT5'],
  ['DT5', 'DT6'], ['DT6', 'DT7'], ['DT7', 'DT8'], ['DT8', 'DT9'],
  ['DT9', 'DT10'], ['DT10', 'DT11'], ['DT11', 'DT12'], ['DT12', 'DT13'],
  ['DT13', 'DT14'], ['DT14', 'DT15'], ['DT15', 'DT16'], ['DT16', 'DT17'],
  ['DT17', 'DT18'], ['DT18', 'DT19'],
  ['DT19', 'DT20'], ['DT20', 'DT21'], ['DT21', 'DT22'], ['DT22', 'DT23'],
  ['DT23', 'DT24'], ['DT24', 'DT25'], ['DT25', 'DT26'], ['DT26', 'DT27'],
  ['DT27', 'DT28'], ['DT28', 'DT29'], ['DT29', 'DT30'], ['DT30', 'DT31'],
  ['DT31', 'DT32'], ['DT32', 'DT33'], ['DT33', 'DT34'], ['DT34', 'DT35'],

  // Thomson-East Coast Line (through Stage 4)
  ['TE1', 'TE2'], ['TE2', 'TE3'], ['TE3', 'TE4'], ['TE4', 'TE5'],
  ['TE5', 'TE6'], ['TE6', 'TE7'], ['TE7', 'TE8'], ['TE8', 'TE9'],
  ['TE9', 'TE10'], ['TE10', 'TE11'], ['TE11', 'TE12'], ['TE12', 'TE13'],
  ['TE13', 'TE14'], ['TE14', 'TE15'], ['TE15', 'TE16'], ['TE16', 'TE17'],
  ['TE17', 'TE18'], ['TE18', 'TE19'], ['TE19', 'TE20'],
  ['TE20', 'TE22'], // TE21 Marina South not yet open
  ['TE22', 'TE23'], // TE22A Founders' Memorial not yet open
  ['TE23', 'TE24'], ['TE24', 'TE25'], ['TE25', 'TE26'], ['TE26', 'TE27'],
  ['TE27', 'TE28'], ['TE28', 'TE29'],
];

// Interchange connections (distance = 0, same physical station)
const verifiedInterchanges = [
  ['NS1', 'EW24'],   // Jurong East
  ['NS25', 'EW13'],  // City Hall
  ['NS26', 'EW14'],  // Raffles Place
  ['NS24', 'NE6'],   // Dhoby Ghaut
  ['NS24', 'CC1'],
  ['NE6', 'CC1'],
  ['NS17', 'CC15'],  // Bishan
  ['NS21', 'DT11'],  // Newton
  ['NS9', 'TE2'],    // Woodlands
  ['NS22', 'TE14'],  // Orchard
  ['NS27', 'TE20'],  // Marina Bay (also CC33 from 12 Jul 2026)
  ['EW16', 'NE3'],   // Outram Park
  ['EW16', 'TE17'],
  ['NE3', 'TE17'],
  ['EW8', 'CC9'],    // Paya Lebar
  ['EW21', 'CC22'],  // Buona Vista
  ['EW12', 'DT14'],  // Bugis
  ['NE12', 'CC13'],  // Serangoon
  ['NE4', 'DT19'],   // Chinatown
  ['NE7', 'DT12'],   // Little India
  ['NE1', 'CC29'],   // HarbourFront
  ['CC19', 'DT9'],   // Botanic Gardens
  ['CC4', 'DT15'],   // Promenade
  ['CC17', 'TE9'],   // Caldecott
  ['CC10', 'DT26'],  // MacPherson
  ['EW2', 'DT32'],   // Tampines
  ['DT10', 'TE11'],  // Stevens
  // Bayfront (DT16) doubles as CC34; Marina Bay (NS27/TE20) doubles as CC33 —
  // modelled via the rail edges above rather than duplicate station entries.
  // Expo: DT35 <-> CG1 (CG branch not in our data, skip)
];

const graph = {};

function addEdge(a, b, d) {
  if (!graph[a]) graph[a] = {};
  if (!graph[b]) graph[b] = {};
  graph[a][b] = d;
  graph[b][a] = d;
}

for (const [a, b] of railConnections) {
  const d = dist(a, b);
  if (d === 0) {
    console.error('Zero distance for rail connection:', a, b);
    continue;
  }
  addEdge(a, b, d);
}

for (const [a, b] of verifiedInterchanges) {
  if (!stations[a] || !stations[b]) {
    console.error('Missing station for interchange:', a, b);
    continue;
  }
  addEdge(a, b, 0);
}

// Sort keys for readability
const sorted = {};
const sortedKeys = Object.keys(graph).sort((a, b) => {
  const lineA = a.match(/^[A-Z]+/)[0];
  const lineB = b.match(/^[A-Z]+/)[0];
  const lineOrder = ['NS', 'EW', 'NE', 'CC', 'DT', 'TE'];
  const orderA = lineOrder.indexOf(lineA);
  const orderB = lineOrder.indexOf(lineB);
  if (orderA !== orderB) return orderA - orderB;
  const numA = parseInt(a.match(/\d+/)[0]);
  const numB = parseInt(b.match(/\d+/)[0]);
  return numA - numB;
});

for (const key of sortedKeys) {
  sorted[key] = graph[key];
}

fs.writeFileSync('./public/data/station_distances.json', JSON.stringify(sorted, null, 2));
console.log('Generated station_distances.json with', Object.keys(sorted).length, 'stations');

let edgeCount = 0;
for (const [k, v] of Object.entries(sorted)) {
  edgeCount += Object.keys(v).length;
}
console.log('Total edges (bidirectional):', edgeCount);
