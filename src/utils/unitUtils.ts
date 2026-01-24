export type Unit =
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'cup'
  | 'tbsp'
  | 'tsp'
  | 'piece'
  | 'slice'
  | 'clove'
  | 'bunch'
  | 'can'
  | 'package';

export const UNIT_OPTIONS: Array<{ value: Unit; label: string }> = [
  { value: 'g', label: 'grams (g)' },
  { value: 'kg', label: 'kilograms (kg)' },
  { value: 'ml', label: 'milliliters (ml)' },
  { value: 'l', label: 'liters (l)' },
  { value: 'cup', label: 'cups' },
  { value: 'tbsp', label: 'tablespoons' },
  { value: 'tsp', label: 'teaspoons' },
  { value: 'piece', label: 'pieces' },
  { value: 'slice', label: 'slices' },
  { value: 'clove', label: 'cloves' },
  { value: 'bunch', label: 'bunches' },
  { value: 'can', label: 'cans' },
  { value: 'package', label: 'packages' },
];

const UNIT_SET = new Set<Unit>(UNIT_OPTIONS.map((o) => o.value));

// Note: Unicode keys use \uXXXX escapes to keep this file ASCII-only.
const UNIT_ALIASES: Record<string, Unit> = {
  // Mass
  g: 'g',
  gram: 'g',
  grams: 'g',
  gr: 'g',
  gm: 'g',
  gms: 'g',
  '\u0433': 'g',
  '\u0433\u0440': 'g',
  '\u0433\u0440\u0430\u043c': 'g',
  '\u0433\u0440\u0430\u043c\u043c': 'g',

  kg: 'kg',
  kilo: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  '\u043a\u0433': 'kg',
  '\u043a\u0456\u043b\u043e\u0433\u0440\u0430\u043c': 'kg',
  '\u043a\u0438\u043b\u043e\u0433\u0440\u0430\u043c\u043c': 'kg',

  // Volume
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  '\u043c\u043b': 'ml',

  l: 'l',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',
  '\u043b': 'l',
  '\u043b\u0456\u0442\u0440': 'l',
  '\u043b\u0438\u0442\u0440': 'l',

  // Spoon/cup
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  tbs: 'tbsp',
  tbl: 'tbsp',
  tbls: 'tbsp',
  stl: 'tbsp',
  '\u0441\u0442\u043b': 'tbsp',
  '\u0441\u0442\u043e\u043b\u043e\u0432\u0430\u043b\u043e\u0436\u043a\u0430': 'tbsp',
  cda: 'tbsp',
  cucharada: 'tbsp',
  cucharadas: 'tbsp',

  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tspn: 'tsp',
  chl: 'tsp',
  '\u0447\u043b': 'tsp',
  '\u0447\u0430\u0439\u043d\u0430\u043b\u043e\u0436\u043a\u0430': 'tsp',
  cdta: 'tsp',
  cucharadita: 'tsp',
  cucharaditas: 'tsp',

  cup: 'cup',
  cups: 'cup',
  '\u0441\u0442\u0430\u043a\u0430\u043d': 'cup',
  '\u0441\u0442\u0430\u043a\u0430\u043d\u0430': 'cup',
  '\u0441\u043a\u043b\u044f\u043d\u043a\u0430': 'cup',
  taza: 'cup',
  tazas: 'cup',

  // Count
  piece: 'piece',
  pieces: 'piece',
  pc: 'piece',
  pcs: 'piece',
  unit: 'piece',
  units: 'piece',
  '\u0448\u0442': 'piece',
  '\u0448\u0442\u0443\u043a': 'piece',
  '\u0448\u0442\u0443\u043a\u0430': 'piece',
  pieza: 'piece',
  piezas: 'piece',

  slice: 'slice',
  slices: 'slice',
  '\u043b\u043e\u043c\u0442\u0438\u043a': 'slice',
  '\u0441\u043a\u0438\u0431\u043a\u0430': 'slice',
  rebanada: 'slice',
  rebanadas: 'slice',

  clove: 'clove',
  cloves: 'clove',
  '\u0437\u0443\u0431\u0447\u0438\u043a': 'clove',
  diente: 'clove',
  dientes: 'clove',

  bunch: 'bunch',
  bunches: 'bunch',
  '\u043f\u0443\u0447\u043e\u043a': 'bunch',
  ramo: 'bunch',
  ramos: 'bunch',
  manojo: 'bunch',
  manojos: 'bunch',

  can: 'can',
  cans: 'can',
  '\u0431\u0430\u043d\u043a\u0430': 'can',
  lata: 'can',
  latas: 'can',

  package: 'package',
  packages: 'package',
  pack: 'package',
  packs: 'package',
  pkg: 'package',
  pkgs: 'package',
  '\u043f\u0430\u0447\u043a\u0430': 'package',
  '\u0443\u043f\u0430\u043a\u043e\u0432\u043a\u0430': 'package',
  paquete: 'package',
  paquetes: 'package',
};

const foldText = (value: string): string => {
  // Remove accents/diacritics (matches backend behavior).
  return value.normalize('NFKD').replace(/[\u0300-\u036f]+/g, '');
};

const normalizeUnitToken = (value: string): string => {
  let cleaned = value.trim().toLowerCase();
  cleaned = cleaned.replace(/[\u2018\u2019`']/g, '');
  // Keep Latin + Cyrillic letters/numbers, strip punctuation.
  cleaned = cleaned.replace(/[^a-z0-9\u0400-\u04FF\s]+/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
};

export const normalizeUnit = (value: unknown): Unit | null => {
  if (value === null || value === undefined) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  const direct = raw.toLowerCase() as Unit;
  if (UNIT_SET.has(direct)) return direct;

  const normalized = normalizeUnitToken(raw);
  if (!normalized) return null;

  const folded = foldText(normalized);
  const candidates = [
    normalized,
    normalized.replace(/\s+/g, ''),
    folded,
    folded.replace(/\s+/g, ''),
  ];

  for (const candidate of candidates) {
    const mapped = UNIT_ALIASES[candidate];
    if (mapped) return mapped;
  }

  return null;
};

export const coerceUnit = (value: unknown, fallback: Unit = 'piece'): Unit => {
  return normalizeUnit(value) ?? fallback;
};
