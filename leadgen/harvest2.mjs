#!/usr/bin/env node
/**
 * harvest2.mjs — additional harvest for other Argentine cities
 */

import { normalize } from './leadgen.mjs';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';
const FIELD_MASK = 'nextPageToken,places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.businessStatus,places.types,places.googleMapsLinks';

const SOCIAL_HOSTS = new Set([
  'instagram.com', 'www.instagram.com', 'facebook.com', 'm.facebook.com', 'fb.me',
  'linktr.ee', 'tiktok.com', 'www.tiktok.com', 'threads.net', 'www.threads.net',
  'twitter.com', 'www.twitter.com', 'x.com', 'www.x.com', 'wa.me', 'whatsapp.com',
  'youtube.com', 'www.youtube.com', 'youtu.be', 'mercadolibre.com.ar', 'mercadolibre.com',
]);

function classifyWebsite(url) {
  if (!url) return { hasRealWeb: false, social: null, instagram: null };
  let host;
  try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { return { hasRealWeb: false, social: null, instagram: null }; }
  const isInstagram = host === 'instagram.com' || host.endsWith('.instagram.com');
  const isSocial = isInstagram || SOCIAL_HOSTS.has(host);
  return { hasRealWeb: !isSocial, social: isSocial ? host : null, instagram: isInstagram ? url : null };
}

const otherCities = [
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

const rubros = ['restaurant', 'pizzeria', 'parrilla', 'heladeria', 'cafe', 'bodegon'];

async function searchAll() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const all = [];
  const seen = new Set();
  let totalCalls = 0;

  for (const ciudad of otherCities) {
    for (const rubro of ['restaurant', 'pizzeria', 'parrilla', 'heladeria', 'cafe']) {
      const q = `${rubro} in ${ciudad}`;
      let pageToken;
      for (let page = 0; page < 3; page++) {
        const body = { textQuery: `${rubro} in ${ciudad}`, pageSize: 20 };
        if (pageToken) body.pageToken = pageToken;
        const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
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
        if (!res.ok || !data.places) break;
        for (const p of data.places) {
          const id = p.id || String(p.name || '').replace(/^places\//, '');
          if (!id || seen.has(id)) continue;
          seen.add(id);
          all.push(normalize(p, id));
        }
        pageToken = data.nextPageToken;
        if (!pageToken) break;
        await new Promise(r => setTimeout(r, 250));
      }
    }
    console.log(`  ${ciudad}: ${seen.size} unique total`);
    if (seen.size > 600) break;
  }
  return all;
}

async function main() {
  const places = await searchAll();
  console.log(`Total unique new places: ${places.length}`);

  const report = {
    total: places.length,
    withRealWeb: places.filter(p => p.webClass?.hasRealWeb).length,
    noRealWeb: places.filter(p => !p.webClass?.hasRealWeb).length,
    withInstagramFromWeb: places.filter(p => p.instagram).length,
  };
  console.log(report);

  // Load existing candidates and merge
  const existing = JSON.parse(require('fs').readFileSync('candidates.json', 'utf8'));
  const existingIds = new Set(existing.candidates.map(c => c.id));
  const newCandidates = places.filter(p => !existingIds.has(p.id));
  console.log(`New unique candidates: ${newCandidates.length}`);

  const merged = [...existing.candidates, ...newCandidates];
  const candidates = merged
    .filter(p => p.status === 'OPERATIONAL' && p.name && p.name !== '(unnamed)')
    .filter(p => !p.webClass?.hasRealWeb)
    .sort((a, b) => (b.reviews || 0) - (a.reviews || 0));

  console.log(`\nTotal no-real-web: ${candidates.length}`);
  console.log(`  With Instagram in websiteUri: ${candidates.filter(c => c.instagram).length}`);

  const outPath = join(process.cwd(), 'candidates.json');
  require('fs').writeFileSync(outPath, JSON.stringify({ candidates, meta: existing.meta }, null, 2), 'utf8');
  console.log(`Wrote ${candidates.length} candidates to ${outPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });