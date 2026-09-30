import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const data = JSON.parse(readFileSync(join(__dirname, 'bodegas-candidates.json'), 'utf8'));

const withIG = data.candidates.filter(c => 
  c.status === 'OPERATIONAL' && 
  c.instagram && 
  !c.webClass?.hasRealWeb
);

console.log('Bodegas con Instagram:', withIG.length);

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
  lines.push('¿Qué podría mejorar?: Web profesional para enoturismo, ventas online, reservas, catálogo de vinos, SEO local');
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

const output = data.candidates
  .filter(c => c.status === 'OPERATIONAL' && c.instagram && !c.webClass?.hasRealWeb)
  .sort((a,b) => (b.reviews || 0) - (a.reviews || 0))
  .map(c => {
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
    lines.push('¿Qué podría mejorar?: Web profesional para enoturismo, ventas online, reservas, catálogo de vinos, SEO local');
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

writeFileSync(join(__dirname, 'contactar-bodegas.txt'), output, 'utf8');
console.log('contactar-bodegas.txt generado con', data.candidates.filter(c => c.status === 'OPERATIONAL' && c.instagram && !c.webClass?.hasRealWeb).length, 'bodegas');