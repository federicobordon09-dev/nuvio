import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const data = JSON.parse(readFileSync(join(__dirname, 'bodegas-candidates.json'), 'utf8'));

const igUpdates = {
  'Bodega Los Toneles': 'https://www.instagram.com/bodegalostoneles/',
  'Casa Vinicola El Milagro': 'https://www.instagram.com/bodegaelmilagrosj/',
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