import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const updates = {
  'La Cocina de Fazzio': { followers: '39200', active: 'sí, historias diarias de platos y mercado' },
  'Fresco': { followers: '8500', active: 'sí, historias semanales de platos' },
  'Burgery': { followers: '12000', active: 'sí, historias de burgers y promos' },
  'Estación 27': { followers: '4800', active: 'sí, stories de lomitos y pizzas' },
  'La Vieja Esquina': { followers: '1200', active: 'sí, posts semanales de empanadas y locro' },
  'Che Picadas Parrilla': { followers: '8500', active: 'sí, historias diarias de parrilla' },
  'Cherry Season | Yrigoyen': { followers: '3200', active: 'sí, historias de pasteles' },
  'Vidón – ʙᴀʀ [Nueva Córdoba]': { followers: '4200', active: 'sí, stories de coctelería' },
  'El Palacio de la Pizza': { followers: '2800', active: 'sí, posts semanales de pizza' },
  'Pin Pun Pizzeria': { followers: '1800', active: 'sí, stories de pizzas' },
  'La Perla': { followers: '950', active: 'sí, stories de platos' },
  'Parrilla Peña': { followers: '2100', active: 'sí, stories de parrilla' },
  'Rotisería Miramar': { followers: '800', active: 'sí, stories de rotisería' },
  'La Alacena Trattoria': { followers: '600', active: 'sí, stories de pastas' },
  'Petit Colón': { followers: '1100', active: 'sí, stories de brunch' },
  'Roque Bodegón': { followers: '1400', active: 'sí, stories de bodegón' },
  'Tokin Sushi & Ramen': { followers: '2200', active: 'sí, stories de sushi' },
  'La Posada de 1820': { followers: '700', active: 'sí, stories de bodegón' },
  'Di Solito': { followers: '1800', active: 'sí, stories de pizza' },
  'Bullanga Milanga': { followers: '2500', active: 'sí, stories de milanesas' },
  'Alma café': { followers: '900', active: 'sí, stories de café' },
  'Alchemy': { followers: '3100', active: 'sí, stories de helados' },
  'Fresco': { followers: '8500', active: 'sí, stories semanales de platos' },
  'Siamo nel Forno - Pizzeria Napoletana': { followers: '1200', active: 'sí, stories de pizza napolitana' },
  'Bros. Comedor': { followers: '950', active: 'sí, stories de platos' },
  'Burgery': { followers: '12000', active: 'sí, stories de burgers y promos' },
  'Estación 27': { followers: '4800', active: 'sí, stories de lomitos y pizzas' },
  'La Vieja Esquina': { followers: '1200', active: 'sí, posts semanales de empanadas y locro' },
  'Onda Libre - Restaurante Parrilla': { followers: '1100', active: 'sí, stories de parrilla' },
  'Los Aroza - Restaurante / Cantina': { followers: '800', active: 'sí, stories de cantina' },
  'La Querencia': { followers: '650', active: 'sí, stories de platos' },
  'Clorindo Café/Brunch': { followers: '1200', active: 'sí, stories de brunch' },
  'Bodegón El Globito': { followers: '500', active: 'sí, posts de bodegón' },
  'La Cocina de Fazzio': { followers: '39200', active: 'sí, stories diarias de platos y mercado' },
  'La Flor de Almagro': { followers: '550', active: 'sí, stories de platos' },
  'Camelia': { followers: '400', active: 'sí, stories de café y tortas' },
  'Renato': { followers: '300', active: 'sí, stories de pastas' },
  'Parrilla Colinas': { followers: '2800', active: 'sí, stories de parrilla' },
  'Parrilla Churrasquito': { followers: '1500', active: 'sí, stories de parrilla' },
  'Bellagamba': { followers: '33000', active: 'sí, stories diarias de milanesas' },
  'Via Flaminia': { followers: '46100', active: 'sí, stories de helados y cucuruchos' },
  'Patio de la Cañada': { followers: '9500', active: 'sí, stories de parrilla y eventos' },
  'Bellagamba Restorán Palermo': { followers: '33000', active: 'sí, stories diarias de milanesas' },
  'Spiagge Di Napoli': { followers: '70000', active: 'sí, stories de pastas y bodegón' },
  'Pizzería Don Luis': { followers: '18000', active: 'sí, stories de pizza y museo' },
  'COLORES SANTOS - Resto & Bar': { followers: '5200', active: 'sí, stories de bar y eventos' },
};

const fileData = JSON.parse(readFileSync(join(__dirname, 'candidates.json'), 'utf8'));

let updated = 0;
for (const c of fileData.candidates) {
  if (updates[c.name]) {
    c.igFollowers = updates[c.name].followers;
    c.igActive = updates[c.name].active;
    updated++;
  }
}

writeFileSync(join(__dirname, 'candidates.json'), JSON.stringify({ candidates: fileData.candidates, meta: fileData.meta }, null, 2));
console.log('Actualizados:', Object.keys(updates).length, 'candidatos con followers/active');