// ═══════════════════════════════════════════════════════════════
// CANVAS E LIMITES DA DUNGEON
// ═══════════════════════════════════════════════════════════════

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const W = canvas.width, H = canvas.height;

// Espaço reservado para o HUD de cartas no fundo da tela
const HUD_RESERVE = 150;

let DUNGEON_SIZE = Math.min(W, H - HUD_RESERVE) * 0.55;
let DX = W/2 - DUNGEON_SIZE/2;
let DY = (H - HUD_RESERVE)/2 - DUNGEON_SIZE/2 - 30;

function getDungeonSizeForIndex(idx){
  const def = DUNGEON_DEFS[idx];
  // Limita a base pelo eixo mais curto, descontando o HUD do eixo vertical
  const base = Math.min(W, H - HUD_RESERVE);
  if(!def) return base * 0.55;
  if(def.theme==='blue')  return base * 0.55;
  if(def.theme==='green') return base * 0.68;
  if(def.theme==='red')   return base * 0.80;
  if(def.theme==='black') return base * 0.88;
  return base * 0.55;
}

function updateDungeonBounds(){
  DUNGEON_SIZE = getDungeonSizeForIndex(currentDungeon);
  DX = W/2 - DUNGEON_SIZE/2;
  // Centraliza verticalmente no espaço acima do HUD
  DY = (H - HUD_RESERVE)/2 - DUNGEON_SIZE/2 - 30;
}
