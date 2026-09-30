#!/usr/bin/env node
/**
 * harvest.mjs — nationwide food-business harvest for Argentina.
 *
 * Runs multiple Text Search queries across rubros + cities, filters out
 * businesses that have a REAL website, and writes a candidates JSON file
 * ready for Instagram discovery and contactar.txt generation.
 *
 * Usage:
 *   node --env-file=.env harvest.mjs [--want 40] [--out candidates.json]
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  search,
  normalize,
  processPlaces,
  FIELD_MASK,
  ENDPOINTS,
} from './leadgen.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Food rubros matching your GitHub landing pages + typical Argentine food scene
const RUBROS = [
  'restaurant',
  'pizzeria',
  'parrilla',
  'heladeria',
  'cafe',
  'bodegon',
  'empanadas',
  'hamburgueseria',
];

// Cities spread across Argentina for geographic diversity
const CIUDADES = [
  'Buenos Aires, Argentina',
  'Córdoba, Argentina',
  'Rosario, Santa Fe, Argentina',
  'Mendoza, Argentina',
  'Salta, Argentina',
  'Mar del Plata, Buenos Aires, Argentina',
  'La Plata, Buenos Aires, Argentina',
  'San Miguel de Tucumán, Argentina',
  'Neuquén, Argentina',
  'San Carlos de Bariloche, Argentina',
  'Santa Fe, Argentina',
  'Corrientes, Argentina',
  'Bahía Blanca, Buenos Aires, Argentina',
  'San Salvador de Jujuy, Argentina',
];

function parseArgs(argv) {
  const args = { want: 40, out: 'candidates.json' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--want': args.want = Number(next()); break;
      case '--out': args.out = next(); break;
      case '-h': case '--help':
        console.log(`
harvest.mjs — nationwide food business harvest for Argentina

Usage:
  node --env-file=.env harvest.mjs [--want 40] [--out candidates.json]

Options:
  --want <n>   Target number of no-real-web leads (default 40)
  --out <file> Output JSON file (default candidates.json)
  -h, --help   Show help
        `);
        process.exit(0);
    }
  }
  return args;
}

function buildQueries() {
  const queries = [];
  for (const ciudad of CIUDADES) {
    for (const rubro of RUBROS) {
      queries.push({
        textQuery: `${rubro} in ${ciudad}`,
        rubro,
        ciudad,
      });
    }
  }
  return queries;
}

async function searchAll(queries, maxPerQuery) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    console.error('Missing GOOGLE_PLACES_API_KEY. Set it in .env or env.');
    process.exit(1);
  }

  const all = [];
  const seen = new Set();
  let totalApiCalls = 0;

  for (const q of queries) {
    let pageToken;
    let pages = 0;

    while (totalApiCalls < 200 && (all.length < 500 || pages === 0)) {
      const body = {
        textQuery: q.textQuery,
        pageSize: 20,
      };
      if (pageToken) body.pageToken = pageToken;

      const res = await fetch(ENDPOINTS.text, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const status = data.error?.status || `HTTP ${res.status}`;
        console.error(`API error for "${q.textQuery}": ${status} - ${data.error?.message}`);
        break;
      }
      totalApiCalls++;
      pages++;

      for (const p of data.places ?? []) {
        const id = p.id || String(p.name || '').replace(/^places\//, '');
        if (!id || seen.has(id)) continue;
        seen.add(id);
        all.push(normalize(p, id));
      }

      pageToken = data.nextPageToken;
      if (!pageToken) break;
      await new Promise((r) => setTimeout(r, 250));
    }
    console.log(`  ${q.textQuery}: ${pages} page(s), ${seen.size} unique total`);
    if (all.length >= 500) break;
  }

  return all;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const queries = buildQueries();
  console.log(`Harvesting ${queries.length} queries across ${RUBROS.length} rubros × ${CIUDADES.length} cities...`);

  const places = await searchAll(queries);
  console.log(`\nTotal unique places: ${places.length}`);

  const report = {
    total: places.length,
    closed: places.filter((p) => p.status === 'PERMANENTLY_CLOSED').length,
    withRealWeb: places.filter((p) => p.webClass?.hasRealWeb).length,
    noRealWeb: places.filter((p) => !p.webClass?.hasRealWeb).length,
    withInstagramFromWeb: places.filter((p) => p.instagram).length,
  };
  console.log(report);

  // Filter: no real website, operational, has name
  let candidates = places
    .filter((p) => p.status === 'OPERATIONAL' && p.name && p.name !== '(unnamed)')
    .filter((p) => !p.webClass?.hasRealWeb)
    .sort((a, b) => (b.reviews || 0) - (a.reviews || 0)); // prioritize reviewed

  console.log(`\nNo-real-web operational: ${candidates.length}`);
  console.log(`  With Instagram in websiteUri: ${candidates.filter((p) => p.instagram).length}`);

  // Cap to desired amount (keep top reviewed)
  candidates = candidates.slice(0, args.want * 3); // buffer for Instagram discovery

  const outPath = join(__dirname, args.out);
  writeFileSync(outPath, JSON.stringify({ candidates, meta: { queries: queries.length, totalPlaces: places.length, report } }, null, 2), 'utf8');
  console.log(`\nWrote ${candidates.length} candidates to ${outPath}`);
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});