const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Haversine distance in miles
function distanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Try multiple Overpass endpoints in order
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

async function queryOverpass(lat, lon, radiusMeters) {
  // Simple, broad query — just look for anything named like a salvage/junkyard
  const query = `[out:json][timeout:20];
(
  node["shop"="car_parts"](around:${radiusMeters},${lat},${lon});
  node["name"~"salvage|junkyard|pull.a.part|pick.n.pull|lkq|u-pull|upull|wreck|auto parts|auto wrecking",i](around:${radiusMeters},${lat},${lon});
  way["name"~"salvage|junkyard|pull.a.part|pick.n.pull|lkq|u-pull|auto wrecking",i](around:${radiusMeters},${lat},${lon});
);
out center 30;`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: AbortSignal.timeout(15000),
      });
      const text = await res.text();
      if (!text.startsWith('{') && !text.startsWith('[')) continue; // got HTML error page
      const data = JSON.parse(text);
      return data.elements || [];
    } catch {
      // try next endpoint
    }
  }
  return []; // all endpoints failed — return empty, chains still show
}

router.get('/', authenticate, async (req, res) => {
  const { zip } = req.query;
  if (!zip || !/^\d{5}$/.test(zip)) {
    return res.status(400).json({ error: 'Valid 5-digit US zip code required' });
  }

  try {
    // Step 1: Geocode zip
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=US&format=json&limit=1`,
      {
        headers: { 'User-Agent': 'GlitchGarage/1.0 (contact@glitchgarage.app)' },
        signal: AbortSignal.timeout(8000),
      }
    );
    const geoData = await geoRes.json();
    if (!geoData?.length) {
      return res.status(404).json({ error: `ZIP code ${zip} not found` });
    }

    const { lat, lon, display_name } = geoData[0];
    const latF = parseFloat(lat);
    const lonF = parseFloat(lon);
    const location = display_name.split(',').slice(0, 3).join(',').trim();

    // Step 2: Query Overpass (160km radius = ~100 miles)
    const elements = await queryOverpass(lat, lon, 160000);

    const junkyards = elements
      .filter(el => el.tags?.name)
      .map(el => {
        const elLat = el.lat ?? el.center?.lat;
        const elLon = el.lon ?? el.center?.lon;
        const dist = (elLat && elLon) ? distanceMiles(latF, lonF, elLat, elLon) : null;
        return {
          name: el.tags.name,
          address: [
            el.tags['addr:housenumber'],
            el.tags['addr:street'],
            el.tags['addr:city'],
            el.tags['addr:state'],
          ].filter(Boolean).join(' ') || null,
          phone: el.tags.phone || el.tags['contact:phone'] || null,
          website: el.tags.website || el.tags['contact:website'] || null,
          lat: elLat,
          lon: elLon,
          distance: dist ? Math.round(dist * 10) / 10 : null,
        };
      })
      .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
      .slice(0, 20);

    // Step 3: Chain links — always useful regardless of OSM data
    const chains = [
      {
        name: 'LKQ Pick Your Part',
        url: `https://www.lkqpickyourpart.com/locations/?zip=${zip}`,
      },
      {
        name: 'Pull-A-Part',
        url: `https://www.pullapart.com/locations/`,
      },
      {
        name: 'PicknPull',
        url: `https://www.picknpull.com/check-inventory/vehicle?zip=${zip}`,
      },
      {
        name: 'Car-Part.com',
        url: `https://www.car-part.com/cgi-bin/search.cgi?action=c&zip=${zip}`,
      },
      {
        name: 'iPickParts',
        url: `https://www.ipickparts.com/locations?zip=${zip}`,
      },
      {
        name: 'Row52 (U-Pull)',
        url: `https://row52.com/Search/?YardId=&zip=${zip}&miles=50`,
      },
    ];

    res.json({
      zip,
      location,
      coordinates: { lat: latF, lon: lonF },
      junkyards,
      chains,
      googleSearchUrl: `https://www.google.com/maps/search/auto+salvage+junkyard/@${lat},${lon},11z`,
    });
  } catch (err) {
    console.error('Junkyard error:', err.message);
    res.status(500).json({ error: 'Failed to find junkyards. Please try again.' });
  }
});

module.exports = router;
