#!/usr/bin/env node
/**
 * leadgen - Google Places (New) prospecting tool (zero dependencies).
 *
 * Finds local businesses via the Places API (New), flags those without a
 * registered website, scores them for outreach priority, and writes a
 * contact document in Markdown + CSV.
 *
 * Modes:
 *   Text search:   --q "pizzerias in Mendoza"
 *                  --type pizzeria --near "La Consulta, Mendoza"
 *   Nearby search: --type restaurant --lat -32.9 --lng -68.8 [--radius 3000]
 *   Offline demo:  --mock  (built-in fixtures, no API key required)
 *
 * API key: GOOGLE_PLACES_API_KEY env var, or run:
 *   node --env-file=.env leadgen.mjs ...
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Pro SKU fields: displayName/address/phone/rating/website are billed at the
// Pro search rate. First ~5k searches/month are free (see Google's price list).
// NOTE: nextPageToken must be requested explicitly — without it in the mask the
// API silently omits it and pagination stops after the first 20 results.
export const FIELD_MASK = [
  'nextPageToken',
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.businessStatus',
  'places.types',
  'places.googleMapsLinks',
].join(',');

export const SOCIAL_HOSTS = new Set([
  'instagram.com', 'www.instagram.com',
  'facebook.com', 'm.facebook.com', 'fb.me',
  'linktr.ee',
  'tiktok.com', 'www.tiktok.com',
  'threads.net', 'www.threads.net',
  'twitter.com', 'www.twitter.com', 'x.com', 'www.x.com',
  'wa.me',
  'whatsapp.com',
  'youtube.com', 'www.youtube.com', 'youtu.be',
  'mercadolibre.com.ar', 'mercadolibre.com',
]);

export function classifyWebsite(url) {
  if (!url) return { hasRealWeb: false, social: null, instagram: null };
  let host;
  try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { return { hasRealWeb: false, social: null, instagram: null }; }
  const isInstagram = host === 'instagram.com' || host.endsWith('.instagram.com');
  const isSocial = isInstagram || SOCIAL_HOSTS.has(host);
  return { hasRealWeb: !isSocial, social: isSocial ? host : null, instagram: isInstagram ? url : null };
}

export const ENDPOINTS = {
  text: 'https://places.googleapis.com/v1/places:searchText',
  nearby: 'https://places.googleapis.com/v1/places:searchNearby',
};

// ---------------------------------------------------------------------------
// Offline fixtures (raw API shape) so the full pipeline can be tested without
// a key. ids are fake, so map links do not resolve in mock mode.
// ---------------------------------------------------------------------------
const MOCK_PLACES = [
  { id: 'mock_001', displayName: { text: 'Pizzeria El Horno' }, formattedAddress: 'San Martin 124, La Consulta, Mendoza, Argentina', nationalPhoneNumber: '+54 261 555-0101', rating: 4.8, userRatingCount: 302, businessStatus: 'OPERATIONAL', types: ['pizza_restaurant', 'restaurant'] },
  { id: 'mock_002', displayName: { text: "Nona's Pizza" }, formattedAddress: 'Av. Principal 45, La Consulta, Mendoza, Argentina', nationalPhoneNumber: '+54 261 555-0102', rating: 4.6, userRatingCount: 128, businessStatus: 'OPERATIONAL', types: ['pizza_restaurant', 'restaurant'] },
  { id: 'mock_003', displayName: { text: 'Cafe del Sol' }, formattedAddress: 'Belgrano 88, La Consulta, Mendoza, Argentina', websiteUri: 'https://cafesoldel.example.com', nationalPhoneNumber: '+54 261 555-0103', rating: 4.4, userRatingCount: 89, businessStatus: 'OPERATIONAL', types: ['cafe', 'restaurant'] },
  { id: 'mock_004', displayName: { text: 'La Vieja Estacion' }, formattedAddress: 'Mitre 210, La Consulta, Mendoza, Argentina', nationalPhoneNumber: '+54 261 555-0104', rating: 4.2, userRatingCount: 41, businessStatus: 'OPERATIONAL', types: ['restaurant'] },
  { id: 'mock_005', displayName: { text: 'Trattoria Bianca' }, formattedAddress: 'San Martin 560, La Consulta, Mendoza, Argentina', rating: 3.9, userRatingCount: 12, businessStatus: 'OPERATIONAL', types: ['italian_restaurant', 'restaurant'] },
  { id: 'mock_006', displayName: { text: 'Mercado Norte Burger' }, formattedAddress: 'Pellegrini 33, La Consulta, Mendoza, Argentina', websiteUri: 'https://instagram.com/mercadonorte', rating: 4.7, userRatingCount: 210, businessStatus: 'OPERATIONAL', types: ['hamburger_restaurant', 'restaurant'] },
  { id: 'mock_007', displayName: { text: 'Kiosco La Esquina' }, formattedAddress: 'Rivadavia 1, La Consulta, Mendoza, Argentina', nationalPhoneNumber: '+54 261 555-0107', rating: 3.2, userRatingCount: 3, businessStatus: 'OPERATIONAL', types: ['store'] },
  { id: 'mock_008', displayName: { text: 'Sushi Kai' }, formattedAddress: 'Independencia 120, La Consulta, Mendoza, Argentina', websiteUri: 'https://sushikai.example.com', internationalPhoneNumber: '+54 261 555-0108', rating: 4.5, userRatingCount: 77, businessStatus: 'OPERATIONAL', types: ['sushi_restaurant', 'restaurant'] },
  { id: 'mock_009', displayName: { text: 'Heladeria Artisan' }, formattedAddress: 'Alsina 77, La Consulta, Mendoza, Argentina', nationalPhoneNumber: '+54 261 555-0109', rating: 4.1, userRatingCount: 24, businessStatus: 'OPERATIONAL', types: ['ice_cream_shop'] },
  { id: 'mock_010', displayName: { text: 'Bar Cerrito' }, formattedAddress: 'Colón 400, La Consulta, Mendoza, Argentina', businessStatus: 'PERMANENTLY_CLOSED', types: ['bar', 'restaurant'] },
  { id: 'mock_011', displayName: { text: 'Panaderia La Espiga' }, formattedAddress: 'Mitre 5, La Consulta, Mendoza, Argentina', nationalPhoneNumber: '+54 261 555-0111', rating: 4.4, userRatingCount: 56, businessStatus: 'OPERATIONAL', types: ['bakery'] },
  { id: 'mock_012', displayName: { text: 'Dona Rosa Comidas' }, formattedAddress: '9 de Julio 200, La Consulta, Mendoza, Argentina', internationalPhoneNumber: '+54 261 555-0112', businessStatus: 'OPERATIONAL', types: ['restaurant'] },
];

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
export function usage() {
  console.log(`
leadgen - prospect local businesses and find those without a website

Usage:
  node leadgen.mjs --q "<text search>"                      Text Search mode
  node leadgen.mjs --type <type> --near "<place>"           Text Search mode
  node leadgen.mjs --type <type> --lat <n> --lng <n>        Nearby Search mode
                                                             [--radius <meters>]

Options:
  --all              Keep businesses that DO have a website too
  --min-rating <n>   Drop leads below this rating
  --min-reviews <n>  Drop leads below this review count
  --max <n>          Max results to fetch (default 60, 20 per API page)
  --out <dir>        Output directory (default ./leads)
  --mock             Run offline with built-in fixtures (no key needed)
  -h, --help         Show this help

Environment:
  GOOGLE_PLACES_API_KEY   Google Cloud API key with Places API (New) enabled
  (or run: node --env-file=.env leadgen.mjs ...)

Examples:
  node leadgen.mjs --mock --type pizzeria --near "La Consulta, Mendoza"
  node leadgen.mjs --type restaurant --near "Godoy Cruz, Mendoza" --min-rating 4
  node leadgen.mjs --q "cafes in Mendoza, Argentina" --all --max 40
`);
}

export function parseArgs(argv) {
  const args = { radius: 3000, max: 60, all: false, mock: false };
  const next = (i) => {
    if (i + 1 >= argv.length) {
      console.error(`Missing value for ${argv[i]}`);
      process.exit(1);
    }
    return argv[i + 1];
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--q': args.q = next(i); i++; break;
      case '--type': args.type = next(i); i++; break;
      case '--near': args.near = next(i); i++; break;
      case '--lat': args.lat = Number(next(i)); i++; break;
      case '--lng': args.lng = Number(next(i)); i++; break;
      case '--radius': args.radius = Number(next(i)); i++; break;
      case '--max': args.max = Number(next(i)); i++; break;
      case '--min-rating': args.minRating = Number(next(i)); i++; break;
      case '--min-reviews': args.minReviews = Number(next(i)); i++; break;
      case '--out': args.out = next(i); i++; break;
      case '--all': args.all = true; break;
      case '--mock': args.mock = true; break;
      case '-h': case '--help': args.help = true; break;
      default:
        console.error(`Unknown option: ${a} (use --help)`);
        process.exit(1);
    }
  }
  return args;
}

/** Resolve the search mode and a human/file-safe label. Exits on bad input. */
export function resolveSearch(args) {
  const modes = [args.q ? 'q' : null, args.type && args.near ? 'type-near' : null,
    args.type && args.lat !== undefined && args.lng !== undefined ? 'nearby' : null]
    .filter(Boolean);

  if (modes.length === 0) {
    console.error('Nothing to search. Provide --q, or --type with --near, or --type with --lat/--lng.');
    usage();
    process.exit(1);
  }
  if (modes.length > 1) {
    console.error('Pick a single search mode: --q, or --type+--near, or --type+--lat/--lng.');
    process.exit(1);
  }

  const mode = modes[0];
  if (mode === 'q') {
    return { mode, textQuery: args.q, label: args.q };
  }
  if (mode === 'type-near') {
    return { mode, textQuery: `${args.type} in ${args.near}`, label: `${args.type} in ${args.near}` };
  }
  return { mode, includedType: args.type, label: `${args.type} near ${args.lat},${args.lng} r${args.radius}m` };
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
async function requestPage(url, body, key) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const status = data.error?.status || `HTTP ${res.status}`;
    const msg = data.error?.message || 'no message';
    if (status === 'REQUEST_DENIED') {
      throw new Error(
        `REQUEST_DENIED: ${msg}\n` +
        '  Hint: enable "Places API (New)" in the Google Cloud project and check the key restrictions.'
      );
    }
    throw new Error(`${status}: ${msg}`);
  }
  return data;
}

export async function search(searchSpec, args, key) {
  const isText = searchSpec.mode !== 'nearby';
  const url = isText ? ENDPOINTS.text : ENDPOINTS.nearby;
  const results = [];
  const seen = new Set();
  let pageToken;
  let pages = 0;

  while (results.length < args.max) {
    const remaining = Math.max(1, Math.min(20, args.max - results.length));
    let body;
    if (isText) {
      body = { textQuery: searchSpec.textQuery, pageSize: remaining };
    } else {
      body = {
        maxResultCount: remaining,
        locationRestriction: {
          circle: { center: { latitude: args.lat, longitude: args.lng }, radius: args.radius },
        },
        rankPreference: 'POPULARITY',
        includedType: searchSpec.includedType,
      };
    }
    if (pageToken) body.pageToken = pageToken;

    const data = await requestPage(url, body, key);
    pages++;
    for (const p of data.places ?? []) {
      const id = p.id || String(p.name || '').replace(/^places\//, '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      results.push(normalize(p, id));
    }
    pageToken = data.nextPageToken;
    if (!pageToken) break;
    await new Promise((r) => setTimeout(r, 250)); // brief pause before reusing a page token
  }
  return { results, pages };
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------
export function normalize(place, id) {
  const rawWebsite = place.websiteUri || '';
  const webClass = classifyWebsite(rawWebsite);
  return {
    id,
    name: place.displayName?.text ?? '(unnamed)',
    address: place.formattedAddress ?? '',
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber || '',
    website: rawWebsite,
    webClass,
    instagram: webClass.instagram,
    rating: typeof place.rating === 'number' ? place.rating : null,
    reviews: place.userRatingCount ?? 0,
    status: place.businessStatus || 'OPERATIONAL',
    types: place.types ?? [],
    mapsUrl: `https://www.google.com/maps/place/?q=place_id:${id}`,
  };
}

/** Outreach score: no real website +50, rating>=4 +20, reviews>=20 +15 (>=5 +8), phone +10, open +5. */
export function scoreOf(p) {
  let s = 0;
  if (!p.webClass?.hasRealWeb) s += 50;
  if (p.rating !== null && p.rating >= 4) s += 20;
  if (p.reviews >= 20) s += 15;
  else if (p.reviews >= 5) s += 8;
  if (p.phone) s += 10;
  if (p.status === 'OPERATIONAL') s += 5;
  return s;
}

export function tierOf(score) {
  if (score >= 75) return 'Hot';
  if (score >= 50) return 'Warm';
  return 'Low';
}

export function processPlaces(places, args) {
  const total = places.length;
  const closed = places.filter((p) => p.status === 'PERMANENTLY_CLOSED');
  const active = places.filter((p) => p.status !== 'PERMANENTLY_CLOSED');
  const withRealWeb = active.filter((p) => p.webClass?.hasRealWeb);
  const noRealWeb = active.filter((p) => !p.webClass?.hasRealWeb);

  let keep = args.all ? active.slice() : noRealWeb.slice();
  if (args.minRating) keep = keep.filter((p) => (p.rating ?? 0) >= args.minRating);
  if (args.minReviews) keep = keep.filter((p) => p.reviews >= args.minReviews);

  for (const p of keep) {
    p.score = scoreOf(p);
    p.tier = tierOf(p.score);
  }
  keep.sort((a, b) => b.score - a.score || b.reviews - a.reviews);

  return { total, closed, withRealWeb, noRealWeb, keep };
}

// ---------------------------------------------------------------------------
// Output writers
// ---------------------------------------------------------------------------
const mdEscape = (v) => String(v ?? '').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
export const slugify = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'search';

export function buildMarkdown(label, report, meta) {
  const showWebsite = report.keep.some((p) => p.website);
  const lines = [];
  lines.push(`# Leads - ${label}`);
  lines.push('');
  lines.push(`Generated: ${meta.generated} | Mode: ${meta.mode} | API pages: ${meta.pages}`);
  lines.push('');
  lines.push(`Found: **${report.total}** | Permanently closed (dropped): ${report.closed.length} | ` +
    `With website: ${report.withWeb.length} | Without website: **${report.noWeb.length}** | ` +
    `Kept after filters: **${report.keep.length}**`);
  lines.push('');
  if (!meta.all) {
    lines.push('_Default mode: only businesses with NO registered website are kept. Use `--all` to include the rest._');
  }
  lines.push('');
  if (report.keep.length === 0) {
    lines.push('_No leads matched the filters._');
    lines.push('');
    return lines.join('\n');
  }
  const header = ['Tier', 'Score', 'Business', 'Phone', 'Rating', 'Reviews'];
  if (showWebsite) header.push('Website');
  header.push('Address', 'Map');
  lines.push(`| # | ${header.join(' | ')} |`);
  lines.push(`|---|${header.map(() => '---').join('|')}|`);
  report.keep.forEach((p, i) => {
    const cells = [
      String(i + 1),
      `**${p.tier}**`,
      String(p.score),
      mdEscape(p.name),
      mdEscape(p.phone || '-'),
      p.rating !== null ? p.rating.toFixed(1) : '-',
      String(p.reviews),
    ];
    if (showWebsite) cells.push(p.website ? `[link](${p.website})` : '_none_');
    cells.push(mdEscape(p.address), '[maps](' + p.mapsUrl + ')');
    lines.push(`| ${cells.join(' | ')} |`);
  });
  lines.push('');
  lines.push('Priority: **Hot** >=75, **Warm** >=50, else Low. '
    + 'Score = no website (50) + rating 4+ (20) + reviews 20+ (15) / 5+ (8) + phone (10) + open (5).');
  lines.push('');
  lines.push('_"Website" reflects what Google has registered. An Instagram-only link still counts as a website '
    + 'here - open the links and confirm manually before discarding a lead._');
  lines.push('');
  return lines.join('\n');
}

export function buildCsv(report) {
  const rows = [['tier', 'score', 'name', 'phone', 'rating', 'reviews', 'website', 'address', 'maps_url']];
  for (const p of report.keep) {
    rows.push([p.tier, p.score, p.name, p.phone, p.rating ?? '', p.reviews, p.website, p.address, p.mapsUrl]);
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const searchSpec = resolveSearch(args);

  let key = process.env.GOOGLE_PLACES_API_KEY;
  if (!args.mock && !key) {
    console.error('Missing GOOGLE_PLACES_API_KEY. Set it in the environment or run with --env-file=.env.');
    console.error('Tip: try "node leadgen.mjs --mock --type pizzeria --near "La Consulta, Mendoza"" first.');
    return 1;
  }
  if (!args.mock) key = key.trim();

  console.log(`Search: ${searchSpec.label}`);
  console.log(`Mode:   ${args.mock ? 'MOCK (offline fixtures)' : 'LIVE (Places API New)'}`);

  let results, pages;
  if (args.mock) {
    results = MOCK_PLACES.map((p) => normalize(p, p.id));
    pages = 0;
  } else {
    ({ results, pages } = await search(searchSpec, args, key));
  }

  const report = processPlaces(results, args);
  console.log(`Found: ${report.total} | closed dropped: ${report.closed.length} | `
    + `with web: ${report.withWeb.length} | without web: ${report.noWeb.length} | kept: ${report.keep.length}`);

  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const base = `${slugify(searchSpec.label)}_${stamp}`;
  const outDir = args.out ? args.out : join(__dirname, 'leads');
  mkdirSync(outDir, { recursive: true });

  const meta = {
    generated: new Date().toISOString().slice(0, 16).replace('T', ' '),
    mode: args.mock ? 'mock' : 'live',
    pages,
    all: args.all,
  };
  const mdPath = join(outDir, `${base}.md`);
  const csvPath = join(outDir, `${base}.csv`);
  writeFileSync(mdPath, buildMarkdown(searchSpec.label, report, meta), 'utf8');
  writeFileSync(csvPath, buildCsv(report), 'utf8');

  console.log(`Wrote: ${mdPath}`);
  console.log(`Wrote: ${csvPath}`);
  if (report.keep.length > 0) {
    const hot = report.keep.filter((p) => p.tier === 'Hot').length;
    console.log(`Next: start with the ${hot} "Hot" lead(s) - phone numbers are in the doc.`);
  }
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error(`Error: ${err.message}`);
      process.exit(2);
    }
  );
}
