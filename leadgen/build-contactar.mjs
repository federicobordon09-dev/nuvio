#!/usr/bin/env node
/**
 * build-contactar.mjs — generates contactar.txt in the exact format requested
 * from candidates.json (no-real-web food businesses with Instagram).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Exact template format per user request
function formatEntry(c) {
  const lines = [];
  lines.push(`NEGOCIO:${c.name}`);
  lines.push(`Ciudad/localidad: ${c.address}`);
  lines.push(`Google Maps:${c.mapsUrl}`);
  lines.push(`Instagram:${c.instagram || 'NO ENCONTRADO'}`);
  lines.push(`Web: NO TIENEN`);
  lines.push(`Seguidores IG: -`);
  lines.push(`Reseñas Google: ${c.reviews || 0}`);
  lines.push(`¿Instagram activo?: -`);
  lines.push(`¿Tiene web?: no tienen web`);
  lines.push(`¿La web es buena?:`);
  lines.push(`¿Qué podría mejorar?:`);
  lines.push(`Canal de contacto: ${formatContact(c.phone)}`);
  return lines.join('\n');
}

function formatContact(phone) {
  if (!phone) return '-';
  // Normalize: remove all non-digits
  const digits = phone.replace(/\D/g, '');
  // Argentine mobile detection: starts with 549 (country code + mobile prefix)
  // or national format with 15 (older mobile format)
  // Also handle formats like "0261 15 123-4567" -> mobile
  const clean = phone.replace(/\s/g, '');
  // Check if it's a mobile number (contains 15 or starts with 549 or +549)
  const isMobile = /549|^\+?54\s*9|^0?\d{2,4}\s*15/.test(clean);
  if (isMobile) {
    // Normalize to 549XXXXXXXXX format
    let num = digits;
    if (num.startsWith('54')) num = num.slice(2);
    if (num.startsWith('9')) num = '549' + num.slice(1);
    else if (num.startsWith('54')) num = '549' + num.slice(2);
    else if (!num.startsWith('549')) num = '549' + num;
    return `whatsapp (${num})`;
  }
  return `tel (${phone})`;
}

function extractProvince(address) {
  // Extract province from Argentine address
  // Format: "Street, PostalCode CityName, Province, Argentina"
  const parts = address.split(',').map(s => s.trim());
  if (parts.length < 2) return 'Desconocida';
  // Province is typically the second-to-last part
  const provincePart = parts[parts.length - 2];
  // Clean postal code prefixes (C1043, X5000, M5500, C1414DCW, etc.)
  let clean = provincePart.replace(/^[A-Z]\d+[A-Z]*\s+/, '').trim();
  // Normalize common variations
  if (clean.includes('Buenos Aires') || clean.includes('Cdad. Autónoma')) return 'Buenos Aires';
  if (clean.includes('Córdoba')) return 'Córdoba';
  if (clean.includes('Mendoza')) return 'Mendoza';
  if (clean.includes('Santa Fe') || clean.includes('Rosario')) return 'Santa Fe';
  if (clean.includes('Salta')) return 'Salta';
  if (clean.includes('Mendoza')) return 'Mendoza';
  if (clean.includes('Tucumán')) return 'Tucumán';
  if (clean.includes('Neuquén')) return 'Neuquén';
  if (clean.includes('Río Negro') || clean.includes('Bariloche')) return 'Río Negro';
  if (clean.includes('Chubut')) return 'Chubut';
  if (clean.includes('Salta')) return 'Salta';
  if (clean.includes('Jujuy')) return 'Jujuy';
  if (clean.includes('Corrientes')) return 'Corrientes';
  if (clean.includes('Entre Ríos')) return 'Entre Ríos';
  if (clean.includes('Misiones')) return 'Misiones';
  if (clean.includes('La Pampa')) return 'La Pampa';
  if (clean.includes('San Luis')) return 'San Luis';
  if (clean.includes('San Juan')) return 'San Juan';
  if (clean.includes('La Rioja')) return 'La Rioja';
  if (clean.includes('Catamarca')) return 'Catamarca';
  if (clean.includes('Formosa')) return 'Formosa';
  if (clean.includes('Chaco')) return 'Chaco';
  if (clean.includes('Santiago del Estero')) return 'Santiago del Estero';
  if (clean.includes('Tierra del Fuego')) return 'Tierra del Fuego';
  return clean;
}

function extractCity(address) {
  // For display in the "Ciudad/localidad" field, use the full address
  return address;
}

function main() {
  const data = JSON.parse(readFileSync(join(__dirname, 'candidates.json'), 'utf8'));
  
  // Filter: has Instagram, operational, no real web
  const withIG = data.candidates.filter(c => 
    c.status === 'OPERATIONAL' && 
    c.instagram && 
    !c.webClass?.hasRealWeb
  );
  
  console.log(`Total with Instagram: ${withIG.length}`);
  
  // Geographic diversification: group by province
  const byProvince = {};
  for (const c of withIG) {
    const province = extractProvince(c.address);
    if (!byProvince[province]) byProvince[province] = [];
    byProvince[province].push(c);
  }
  
  console.log(`Provinces with Instagram leads: ${Object.keys(byProvince).length}`);
  
  // Diversify: take up to 20 per province, sorted by reviews within province
  const diversified = [];
  for (const [province, leads] of Object.entries(byProvince)) {
    leads.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    for (const lead of leads.slice(0, 20)) {
      diversified.push(lead);
    }
  }
  
  // Sort globally by reviews, take top 40
  diversified.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
  const final40 = diversified.slice(0, 40);
  
  console.log(`Selected ${final40.length} leads across ${new Set(final40.map(c => extractProvince(c.address))).size} provinces`);
  
  // Build output
  const output = final40.map(formatEntry).join('\n\n');
  writeFileSync(join(__dirname, 'contactar.txt'), output, 'utf8');
  console.log('\nWrote contactar.txt');
  
  // Print summary by province
  const summary = {};
  for (const c of final40) {
    const province = extractProvince(c.address);
    summary[province] = (summary[province] || 0) + 1;
  }
  console.log('\nDistribution by province:');
  for (const [province, count] of Object.entries(summary).sort((a,b) => b[1]-a[1])) {
    console.log(`  ${province}: ${count}`);
  }
}

main();