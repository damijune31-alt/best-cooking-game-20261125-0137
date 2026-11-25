// Ramen Rush — every tuning number and colour in one place. The kitchen is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below
// depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** A full shift lasts this long; when it ends the day is scored. */
export const DAY_SECONDS = 150;

export const CHEF = {
  width: 62,
  height: 92,
  speed: 540,
  /** x range the chef can walk, along the counter. */
  minX: 90,
  maxX: 1190,
};

export const LIVES = 3;

/** The counter runs across the kitchen; each bin sits on it. */
export const COUNTER = { y: 470, height: 118 };

/** Where the work bowl sits (its centre) and the serve tray. */
export const BOWL = { x: 640, y: 618, radius: 58 };
export const TRAY = { x: 1120, y: 618, radius: 52 };

/** Ingredient stations, left to right across the counter. */
export const STATIONS = [
  { id: 'noodle', label: 'Noodle', key: '1', kind: 'base', color: '#f2c94c' },
  { id: 'shoyu', label: 'Shoyu', key: '2', kind: 'broth', color: '#8b5a2b' },
  { id: 'miso', label: 'Miso', key: '3', kind: 'broth', color: '#c98a3d' },
  { id: 'tonkotsu', label: 'Tonkotsu', key: '4', kind: 'broth', color: '#e8dcc8' },
  { id: 'egg', label: 'Egg', key: '5', kind: 'topping', color: '#fff3d6' },
  { id: 'chashu', label: 'Chashu', key: '6', kind: 'topping', color: '#e58aa0' },
  { id: 'nori', label: 'Nori', key: '7', kind: 'topping', color: '#2f6b3a' },
  { id: 'corn', label: 'Corn', key: '8', kind: 'topping', color: '#ffd23f' },
  { id: 'scallion', label: 'Scallion', key: '9', kind: 'topping', color: '#58b368' },
];

export const TOPPINGS = ['egg', 'chashu', 'nori', 'corn', 'scallion'];
export const BROTHS = ['shoyu', 'miso', 'tonkotsu'];

/** Seconds of patience a ticket starts with, by level; a ticket that runs out walks away. */
export const PATIENCE = { 1: 48, 2: 40, 3: 34 };
/** Toppings a ticket asks for, by level (plus one noodle base and one broth always). */
export const TOPPING_COUNT = { 1: 2, 2: 3, 3: 3 };
/** Seconds a level lasts before the kitchen gets busier. */
export const LEVEL_SECONDS = 45;
/** How often a free ticket slot gets a new order. */
export const ORDER_INTERVAL = 6;

export const SCORE = {
  ingredient: 10,
  serve: 100,
  tipMax: 50,
  comboBonus: 10,
};

export const PALETTE = {
  wall: '#f6e3c5',
  wallTile: '#efd6ae',
  floor: '#b98a5a',
  counter: '#8a5a33',
  counterTop: '#a9743f',
  board: '#5d3a1e',
  boardPaper: '#fff8e7',
  ticket: '#fffdf5',
  ticketEdge: '#d8c49a',
  text: '#2b2118',
  muted: '#7a6a55',
  hud: '#2b2118',
  accent: '#d94f30',
  gold: '#f2c94c',
  green: '#3f9e4d',
  red: '#d93a2b',
  chefHat: '#ffffff',
  chefCoat: '#f4f6f8',
  chefSkin: '#f2c89b',
  bowl: '#274b8f',
  bowlRim: '#e8eef7',
  steam: 'rgba(255,255,255,0.55)',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'ramen-rush.best';
