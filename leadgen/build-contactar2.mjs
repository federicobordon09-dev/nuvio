import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const data = JSON.parse(readFileSync(join(__dirname, 'candidates.json'), 'utf8'));

const accessible = data.candidates.filter(c => 
  c.status === 'OPERATIONAL' && 
  c.instagram && 
  !c.webClass?.hasRealWeb &&
  (c.igFollowers ? parseInt(c.igFollowers) < 5000 : true) &&
  c.reviews && c.reviews >= 50 && c.reviews <= 3000 &&
  c.phone && c.phone.trim() !== '' &&
  !c.instagram.includes('linktr.ee') &&
  !c.instagram.includes('whatsapp.com') &&
  !c.instagram.includes('wa.me')
);

console.log('Leads accesibles (menos 5k seg, 50-3000 reseñas, sin linktr.ee):', accessible.length);

const byProvince = {};
for (const c of accessible) {
  const parts = c.address.split(',').map(s => s.trim());
  const province = parts.length >= 2 ? parts[parts.length - 2].replace(/^[A-Z]\d+[A-Z]*\s+/, '').trim() : 'Otro';
  if (!byProvince[province]) byProvince[province] = [];
  byProvince[province].push(c);
}

const diversified = [];
for (const [prov, leads] of Object.entries(byProvince)) {
  leads.sort((a,b) => (b.reviews || 0) - (a.reviews || 0));
  for (const lead of leads.slice(0, 5)) diversified.push(lead);
}

diversified.sort((a,b) => (b.reviews || 0) - (a.reviews || 0));
const final = diversified.slice(0, 30);

console.log('Leads accesibles totales:', accessible.length);
console.log('Leads para contactar2.txt:', final.length);

function isMobile(phone) {
  if (!phone) return false;
  const clean = phone.replace(/\s/g, '');
  return /549|^\+?54\s*9|^0?\d{2,4}\s*15/.test(clean);
}

function formatEntry(c) {
  const lines = [];
  lines.push('NEGOCIO:' + c.name);
  lines.push('Ciudad/localidad: ' + c.address);
  lines.push('Google Maps:' + c.mapsUrl);
  lines.push('Instagram:' + (c.instagram || 'NO ENCONTRADO'));
  lines.push('Web: NO TIENEN');
  lines.push('Seguidores IG: ' + (c.igFollowers || '-'));
  lines.push('Reseñas Google: ' + (c.reviews || 0));
  lines.push('¿Instagram activo?: ' + (c.igActive || '-'));
  lines.push('¿Tiene web?: no tienen web');
  lines.push('¿La web es buena?: No aplica (no tienen web)');
  lines.push('¿Qué podría mejorar?: Web profesional para pedidos online, menú digital, reservas, SEO local');
  if (!c.phone) {
    lines.push('Canal de contacto: -');
  } else if (/549|^\+?54\s*9|^0?\d{2,4}\s*15/.test(c.phone.replace(/\s/g, ''))) {
    let num = c.phone.replace(/\D/g, '');
    if (num.startsWith('54')) num = num.slice(2);
    if (num.startsWith('9')) num = '549' + num.slice(1);
    else if (num.startsWith('54')) num = '549' + num.slice(2);
    else if (!num.startsWith('549')) num = '549' + num;
    lines.push('Canal de contacto: whatsapp (' + num + ')');
  } else {
    lines.push('Canal de contacto: tel (' + c.phone + ')');
  }
  return lines.join('\n');
}

const output = final.map(c => {
  const lines = [];
  lines.push('NEGOCIO:' + c.name);
  lines.push('Ciudad/localidad: ' + c.address);
  lines.push('Google Maps:' + c.mapsUrl);
  lines.push('Instagram:' + (c.instagram || 'NO ENCONTRADO'));
  lines.push('Web: NO TIENEN');
  lines.push('Seguidores IG: ' + (c.igFollowers || '-'));
  lines.push('Reseñas Google: ' + (c.reviews || 0));
  lines.push('¿Instagram activo?: ' + (c.igActive || '-'));
  lines.push('¿Tiene web?: no tienen web');
  lines.push('¿La web es buena?: No aplica (no tienen web)');
  lines.push('¿Qué podría mejorar?: Web profesional para pedidos online, menú digital, reservas, SEO local');
  if (!c.phone) {
    lines.push('Canal de contacto: -');
  } else if (/549|^\+?54\s*9|^0?\d{2,4}\s*15/.test(c.phone.replace(/\s/g, ''))) {
    let num = c.phone.replace(/\D/g, '');
    if (num.startsWith('54')) num = num.slice(2);
    if (num.startsWith('9')) num = '549' + num.slice(1);
    else if (num.startsWith('54')) num = '549' + num.slice(2);
    else if (!num.startsWith('549')) num = '549' + num;
    lines.push('Canal de contacto: whatsapp (' + num + ')');
  } else {
    lines.push('Canal de contacto: tel (' + c.phone + ')');
  }
  return lines.join('\n');
}).join('\n\n');

writeFileSync(join(__dirname, 'contactar2.txt'), output, 'utf8');

console.log('\ncontactar2.txt generado con', final.length, 'leads accesibles');
for (const c of final) {
  const parts = c.address.split(',').map(s => s.trim());
  const prov = parts.length >= 2 ? parts[parts.length - 2].replace(/^[A-Z]\d+[A-Z]*\s+/, '').trim() : 'Otro';
  console.log(c.name + ' | ' + c.igFollowers + ' seg | ' + c.reviews + ' reviews | ' + c.phone);
}