import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const data = JSON.parse(readFileSync(join(__dirname, 'bodegas-candidates.json'), 'utf8'));

const igUpdates = {
  'Bodega Las Marianas': 'https://www.instagram.com/bodega_las_marianas_allaj/',
  'LA CASA DEL VINO SAN JUAN': 'https://www.instagram.com/lacasadelvinosanjuan/',
  'Güemes Drinks Up - Vinoteca en San Juan - Futbol - Día del Padre - Día de la Madre': 'https://www.instagram.com/guemesdrinksup/',
  'Santiago Graffigna Wine Museum': 'https://www.instagram.com/graffigna/',
  'Museo Santiago Graffigna': 'https://www.instagram.com/graffigna/',
  'Bodega Graffigna Yanzon': 'https://www.instagram.com/graffignayanzon/',
};

let updated = 0;
for (const c of data.candidates) {
  if (igUpdates[c.name]) {
    c.instagram = igUpdates[c.name];
    c.webClass = { ...c.webClass, instagram: igUpdates[c.name], social: 'instagram.com', hasRealWeb: false };
    updated++;
    console.log('Updated:', c.name);
  }
}
console.log('Total updated:', updated);
writeFileSync(join(__dirname, 'bodegas-candidates.json'), JSON.stringify(data, null, 2));
console.log('Saved.');