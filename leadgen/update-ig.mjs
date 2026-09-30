import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const data = JSON.parse(readFileSync(join(__dirname, 'candidates.json'), 'utf8'));

const igUpdates = {
  'Las cuartetas': 'https://www.instagram.com/lascuartetaspizza/',
  'El Antojo': 'https://www.instagram.com/el_antojook/',
  'Banchero "La Verdadera Pizza"': 'https://www.instagram.com/pizzeriabanchero/',
  'Los Bohemios': 'https://www.instagram.com/losbohemios.bodegon/',
  'Pizza San Antonio': 'https://www.instagram.com/pizzeriasanantoniook/',
};

let updated = 0;
for (const c of data.candidates) {
  if (igUpdates[c.name]) {
    c.instagram = igUpdates[c.name];
    c.webClass = { ...c.webClass, instagram: igUpdates[c.name], social: 'instagram.com', hasRealWeb: false };
    console.log('Updated:', c.name);
    updated++;
  }
}
console.log('Total updated:', updated);
writeFileSync(join(__dirname, 'candidates.json'), JSON.stringify(data, null, 2));
console.log('Saved.');