// ═══════════════════════════════════════════════════════════════
// CONSTANTES GLOBAIS DO JOGO
// ═══════════════════════════════════════════════════════════════

const ROLL_SPEED=11, ROLL_DURATION=280, ROLL_COOLDOWN=2000;
const SLIME_CHARGE_SPEED=4.5, SLIME_CHARGE_DURATION=350, SLIME_CHARGE_COOLDOWN=3000;
const HAND_SIZE=3;

// ─── BLUE SLIME CONSTANTS ─────────────────────────────────────────────────────
const BLUE_SLIME_DASH_SPEED = 6.5;
const BLUE_SLIME_DASH_DURATION = 400;
const BLUE_SLIME_DASH_COOLDOWN = 1200;

// ─── RED SLIME CONSTANTS ──────────────────────────────────────────────────────
const RED_SLIME_HP = 4;
const RED_SLIME_CONTACT_DAMAGE = 1;
const RED_SLIME_MINI_HP = 2;
const RED_SLIME_MINI_SIZE = 9;

// ─── TRANSIÇÃO ────────────────────────────────────────────────────────────────
const TRANSITION_DURATION = 2200;
const PHASE_TRANSITION_DUNGEONS = new Set([3, 7]);

// ─── ARCO ─────────────────────────────────────────────────────────────────────
const BOW_CHARGE_HALF = 700;
const BOW_CHARGE_FULL = 1400;

// ─── BOMBA ────────────────────────────────────────────────────────────────────
const BOMB_SPEED = 3.2, BOMB_JUMP_WARN = 900, BOMB_FALL_TIME = 700, BOMB_RADIUS = 75;

// ─── GHOST ────────────────────────────────────────────────────────────────────
const GHOST_SPEED       = 1.6;
const GHOST_SLOW_RADIUS = 100;
const GHOST_SLOW_MULT   = 0.45;
const GHOST_INVIS_CYCLE = 2000;

// ─── GOLEM ────────────────────────────────────────────────────────────────────
const GOLEM_SPEED = 0.55;
const GOLEM_SLEEP_CYCLE = 4000;
const GOLEM_SLEEP_DURATION = 3000;
const GOLEM_DAMAGE = 2;

// ─── ROBÔ COMPANHEIRO ─────────────────────────────────────────────────────────
const ROBOT_SPEED = 3.5;

// ─── FOICE ────────────────────────────────────────────────────────────────────
const SCYTHE_MAX_AMMO = 4;

// ─── CARTAS ───────────────────────────────────────────────────────────────────
const MAX_DISCARDS_PER_DUNGEON = 5;
const WEAPON_CARDS = new Set(['sword','bow','axe','katana','pistol','scythe','sniper_noscope','glitch_fury']);
const SUPPORT_CARDS = new Set(['speed_potion','bombinhas']);
const SPECIAL_CHARGE_GOAL = 50;

// ─── RARIDADES ────────────────────────────────────────────────────────────────
const RARITIES = {
  comum:    { label:'COMUM',    color:'#888899', weight:60 },
  raro:     { label:'RARO',     color:'#4488ff', weight:25 },
  epico:    { label:'ÉPICO',    color:'#bb66ff', weight:10 },
  lendario: { label:'LENDÁRIO', color:'#ff8800', weight:4  },
  especial: { label:'ESPECIAL', color:'#ff2288', weight:1  },
};

// ─── DUNGEONS ─────────────────────────────────────────────────────────────────
const DUNGEON_DEFS = [
  { num:1,  name:'DUNGEON I',   theme:'blue',  color:'#4488ff', floorColor:'#0a0a1f', tileColor:'#111128', wallColor:'#3355aa', glowColor:'#2244cc',
    killGoal:12, spawnRates:{slime:3000,bomb:99999,rat:99999,golem:99999}, maxSlimes:5, maxBombs:0, maxRats:0, maxGolems:0, hasBombs:false, hasRats:false, hasGolems:false },
  { num:2,  name:'DUNGEON II',  theme:'blue',  color:'#55aaff', floorColor:'#0a0f1f', tileColor:'#111530', wallColor:'#3366bb', glowColor:'#2255dd',
    killGoal:18, spawnRates:{slime:2800,bomb:99999,rat:99999,golem:99999}, maxSlimes:6, maxBombs:0, maxRats:0, maxGolems:0, hasBombs:false, hasRats:false, hasGolems:false },
  { num:3,  name:'DUNGEON III', theme:'blue',  color:'#66bbff', floorColor:'#080f20', tileColor:'#101428', wallColor:'#2255aa', glowColor:'#1144bb',
    killGoal:22, spawnRates:{slime:2500,bomb:99999,rat:99999,golem:99999}, maxSlimes:7, maxBombs:0, maxRats:0, maxGolems:0, hasBombs:false, hasRats:false, hasGolems:false },
  { num:4,  name:'DUNGEON IV',  theme:'green', color:'#44dd88', floorColor:'#051508', tileColor:'#0a1f0c', wallColor:'#226633', glowColor:'#117722',
    killGoal:26, spawnRates:{slime:2500,bomb:9000,rat:99999,golem:99999}, maxSlimes:7, maxBombs:2, maxRats:0, maxGolems:0, hasBombs:true,  hasRats:false, hasGolems:false },
  { num:5,  name:'DUNGEON V',   theme:'green', color:'#55ee99', floorColor:'#061808', tileColor:'#0b220d', wallColor:'#228844', glowColor:'#118833',
    killGoal:30, spawnRates:{slime:2300,bomb:8000,rat:99999,golem:14000}, maxSlimes:8, maxBombs:2, maxRats:0, maxGolems:1, hasBombs:true,  hasRats:false, hasGolems:true  },
  { num:6,  name:'DUNGEON VI',  theme:'green', color:'#66ffaa', floorColor:'#071a09', tileColor:'#0c240f', wallColor:'#33aa55', glowColor:'#22aa44',
    killGoal:35, spawnRates:{slime:2200,bomb:7000,rat:99999,golem:12000}, maxSlimes:8, maxBombs:3, maxRats:0, maxGolems:1, hasBombs:true,  hasRats:false, hasGolems:true  },
  { num:7,  name:'DUNGEON VII', theme:'green', color:'#77ffbb', floorColor:'#08200a', tileColor:'#0e2810', wallColor:'#44bb66', glowColor:'#33bb55',
    killGoal:40, spawnRates:{slime:2000,bomb:6500,rat:99999,golem:11000}, maxSlimes:9, maxBombs:3, maxRats:0, maxGolems:2, hasBombs:true,  hasRats:false, hasGolems:true  },
  { num:8,  name:'DUNGEON VIII',theme:'red',   color:'#ff4444', floorColor:'#1a0505', tileColor:'#220808', wallColor:'#881111', glowColor:'#aa1111',
    killGoal:45, spawnRates:{slime:1800,bomb:6000, rat:12000,golem:10000}, maxSlimes:8, maxBombs:3, maxRats:1, maxGolems:2, hasBombs:true,  hasRats:true,  hasGolems:true  },
  { num:9,  name:'DUNGEON IX',  theme:'red',   color:'#ff6666', floorColor:'#1e0606', tileColor:'#260a0a', wallColor:'#aa1122', glowColor:'#cc1122',
    killGoal:55, spawnRates:{slime:1600,bomb:5500, rat:10000,golem:9000},  maxSlimes:9, maxBombs:3, maxRats:2, maxGolems:2, hasBombs:true,  hasRats:true,  hasGolems:true  },
  { num:10, name:'DUNGEON X',   theme:'black', color:'#aa44ff', floorColor:'#020202', tileColor:'#070707', wallColor:'#330055', glowColor:'#6600cc',
    killGoal:99999, spawnRates:{slime:1400,bomb:4500, rat:8000,golem:8000}, maxSlimes:10,maxBombs:4, maxRats:3, maxGolems:3, hasBombs:true,  hasRats:true,  hasGolems:true  },
];

// ─── CARTAS ───────────────────────────────────────────────────────────────────
const CARD_DEFS = {
  sword: { name:'ESPADA',  icon:'⚔️',  mana:2, duration:5000, rarity:'comum'  },
  meat:  { name:'CARNE',   icon:'🍖',  mana:3, duration:0,    rarity:'comum'  },
  bow:   { name:'ARCO',    icon:'🏹',  mana:5, duration:0,    rarity:'raro', ammo:true },
  blast: { name:'EXPLOSÃO',icon:'💥',  mana:1, duration:0,    rarity:'epico'  },
  axe: { name:'MACHADO', icon:'🪓', mana:3, duration:4000, rarity:'raro' },
  speed_potion: { name:'POÇÃO', icon:'🧪', mana:1, duration:5000, rarity:'raro' },
  bombinhas: { name:'BOMBINHAS', icon:'🧨', mana:2, duration:0, rarity:'epico' },
  katana: { name:'KATANA', icon:'🗡️', mana:6, duration:3000, rarity:'epico' },
  necro_staff: { name:'CAJADO NECRO', icon:'☠️', mana:2, duration:0, rarity:'lendario' },
  pistol: { name:'PISTOLA', icon:'🔫', mana:3, duration:0, rarity:'raro', ammo:true },
  black_magic:  { name:'MAGIA NEGRA',  icon:'🌑', mana:0, duration:5000, rarity:'especial' },
  dice:         { name:'DADOS',        icon:'🎲', mana:1, duration:0,    rarity:'raro' },
  scythe:       { name:'FOICE',        icon:'🌙', mana:4, duration:6000, rarity:'epico' },
  soccerball:   { name:'BOA DE FUTEBOL', icon:'⚽', mana:3, duration:0, rarity:'raro' },
  sniper_noscope: { name:'SNIPER NO SCOPE', icon:'🎯', mana:4, duration:0, rarity:'lendario', ammo:true },
  glitch_fury:    { name:'GLITCH FURY',     icon:'📛', mana:0, duration:0, rarity:'especial' },
};

const FULL_DECK = [
  'sword','sword','sword','sword',
  'meat','meat','meat',
  'bow','bow',
  'blast','blast','blast'
];
