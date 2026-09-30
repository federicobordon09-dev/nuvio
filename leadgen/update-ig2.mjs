import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const data = JSON.parse(readFileSync(join(__dirname, 'candidates.json'), 'utf8'));

const igUpdates = {
  'COLORES SANTOS - Resto & Bar': 'https://www.instagram.com/colores_santos_bar/', // Need to verify
  'Bellagamba Restorán Palermo': 'https://www.instagram.com/bellagambapalermo/',
  'Spiagge Di Napoli': 'https://www.instagram.com/spiaggedinapoli/',
  'Pizzería Don Luis': 'https://www.instagram.com/pizzeriadonluis/',
};

let updated = 0;
for (const c of data.candidates) {
  if (igUpdates[c.name]) {
    c.instagram = igUpdates[c.name];
    c.webClass = { ...c.webClass, instagram: igUpdates[c.name], social: 'instagram.com', hasRealWeb: false };
    updated++;
    console.log('Updated:', c.name, '->', igUpdates[c.name]);
  }
}
console.log('Total updated:', updated);
writeFileSync(join(__dirname, 'candidates.json'), JSON.stringify(data, null, 2));
console.log('Saved.');