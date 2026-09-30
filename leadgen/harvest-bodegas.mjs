import { readFileSync, writeFileSync } from 'node:fs';
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

function normalize(place, id) {
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
    mapsUrl: 'https://www.google.com/maps/place/?q=place_id:' + id,
  };
}

// Provincias vitivinícolas principales + otras con bodegas
const provincias = [
  'Mendoza, Argentina',
  'San Juan, Argentina',
  'Salta, Argentina',
  'La Rioja, Argentina',
  'San Luis, Argentina',
  'Catamarca, Argentina',
  'Neuquén, Argentina',
  'Río Negro, Argentina',
  'Córdoba, Argentina',
  'Buenos Aires, Argentina',
];

const queries = [
  'bodega in Mendoza, Argentina',
  'winery in Mendoza, Argentina',
  'bodega en San Juan, Argentina',
  'winery in San Juan, Argentina',
  'bodega en Salta, Argentina',
  'bodega en Cafayate, Salta, Argentina',
  'bodega en La Rioja, Argentina',
  'bodega en Chilecito, La Rioja, Argentina',
  'bodega en San Luis, Argentina',
  'bodega en Catamarca, Argentina',
  'bodega en Neuquén, Argentina',
  'bodega en Río Negro, Argentina',
  'bodega en Córdoba, Argentina',
  'bodega en Buenos Aires, Argentina',
];

async function searchAll() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const all = [];
  const seen = new Set();
  let totalCalls = 0;

  for (const q of queries) {
    let pageToken;
    for (let page = 0; page < 3; page++) {
      const body = { textQuery: q, pageSize: 20 };
      if (pageToken) body.pageToken = pageToken;
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'nextPageToken,places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.businessStatus,places.types,places.googleMapsLinks',
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
    console.log(`  ${q}: ${seen.size} únicos totales`);
    if (seen.size > 400) break;
  }
  return all;
}

async function main() {
  const places = await searchAll();
  console.log(`\nTotal bodegas únicas: ${places.length}`);

  const report = {
    total: places.length,
    withRealWeb: places.filter(p => p.webClass?.hasRealWeb).length,
    noRealWeb: places.filter(p => !p.webClass?.hasRealWeb).length,
    withInstagramFromWeb: places.filter(p => p.instagram).length,
  };
  console.log(report);

  // Filtrar: operativas, sin web real, con nombre
  let candidates = places
    .filter(p => p.status === 'OPERATIONAL' && p.name && p.name !== '(unnamed)')
    .filter(p => !p.webClass?.hasRealWeb)
    .sort((a, b) => (b.reviews || 0) - (a.reviews || 0));

  console.log(`\nBodegas sin web real operativas: ${candidates.length}`);
  console.log(`  Con Instagram en websiteUri: ${candidates.filter(c => c.instagram).length}`);

  // Guardar
  writeFileSync(join(__dirname, 'bodegas-candidates.json'), JSON.stringify({ candidates, meta: { queries: queries.length } }, null, 2), 'utf8');
  console.log(`\nGuardado en bodegas-candidates.json`);
}

main().catch(err => { console.error(err); process.exit(1); });