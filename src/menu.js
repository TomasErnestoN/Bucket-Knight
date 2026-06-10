// ═══════════════════════════════════════════════════════════════
// PERSISTÊNCIA (localStorage)
// ═══════════════════════════════════════════════════════════════
const SAVE_KEY = 'dck_save_v1';

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(e) { return null; }
}

function writeSave() {
  const data = {
    gold: persistentGold,
    ownedCards: [...ownedCards],
    equippedDeck: [...equippedDeck],
    equippedSpecial: equippedSpecial,
    specialUpgradeLevel: specialUpgradeLevel,
    ownedArtifacts: typeof ownedArtifacts !== 'undefined' ? [...ownedArtifacts] : [],
    equippedArtifacts: typeof equippedArtifacts !== 'undefined' ? [...equippedArtifacts] : [],
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

// Estado persistente
let persistentGold = 0;
let ownedCards = ['sword','meat','pistol','speed_potion','scythe'];
let equippedDeck = ['sword','meat','pistol','speed_potion','scythe'];
let equippedSpecial = null;
let specialUpgradeLevel = 1;

function getSpecialUpgradeCost(currentLevel) { return currentLevel * 200; }
function getSpecialDurationForLevel(level) { return 5000 + (level - 1) * 1250; }

(function loadInitial(){
  const save = loadSave();
  if(save){
    persistentGold = save.gold || 0;
    ownedCards = save.ownedCards || ['sword','meat','pistol','speed_potion','scythe'];
    equippedDeck = save.equippedDeck || ['sword','meat','pistol','speed_potion','scythe'];
    equippedSpecial = save.equippedSpecial || null;
    specialUpgradeLevel = save.specialUpgradeLevel || 1;
    while(equippedDeck.length < 5) equippedDeck.push('');
  }
})();

const CARD_PRICES = { comum:200, raro:400, epico:600, lendario:1000, especial:2000 };

const CARD_DESCS = {
  sword: 'Equipa uma espada por 5 segundos. Clique para golpear em arco causando dano aos inimigos próximos.',
  meat:  'Consome carne para recuperar 1 ponto de vida. Necessário ter HP abaixo do máximo.',
  bow:   'Equipa um arco com 10 flechas. Clique para atirar — flechas atravessam a dungeon rapidamente.',
  blast: 'Lança uma onda explosiva ao redor do jogador, empurrando e danificando todos os inimigos próximos.',
  axe:   'Gira um machado ao redor do jogador causando dano contínuo e empurrando inimigos.',
  speed_potion: 'Cria uma aura que desacelera inimigos próximos temporariamente.',
  bombinhas: 'Marca um local e lança uma bomba por cima. A explosão causa 2 de dano em área e empurra inimigos.',
  katana: 'Desenhe cortes sobre os inimigos com o mouse. Cada corte causa 1 de dano.',
  necro_staff: 'Ativa o cajado com 4 munições. Clique para invocar 1 esqueleto por vez (custa 1 mana cada). Esqueletos perseguem inimigos automaticamente e têm 1 de vida.',
  pistol: 'Equipa uma pistola com 20 balas. Clique para atirar — segure para rafada automática com spread. Cada bala causa 0.5 de dano.',
  black_magic: 'CARTA ESPECIAL — Carrega matando inimigos (50 kills). Dura 5 segundos: o player sai da arena e voa acima. Mire e clique para disparar um laser negro gigante sobre a arena causando dano a todos os inimigos atingidos.',
  dice: 'Gira um dado e aplica um efeito aleatório: 1 = -15 moedas, 2 = -5 moedas, 3 = +1 vida, 4 = +30 moedas, 5 = +2 vida +2 mana +30 moedas. Com o buff JACKPOT, o lado 6 existe: imortal 3s + vida+mana completos + 100 moedas!',
  scythe: 'Equipa a foice por 6 segundos. Clique para atacar em sequência: ① Dash + corte (1 dano), ② Fatiada em arco (2 dano), ③ Giro 360° em volta do player (3 dano). Com buff Direto na Alma, o giro causa 6 de dano crítico!',
  soccerball: 'Clique em um lugar da dungeon para fazer cair uma bola de futebol. A bola possui física real — o player pode chutá-la ao tocá-la, ela ricocheta nas paredes e causa 1 de dano nos inimigos ao tocá-los. Atravessa inimigos. Dura 5 segundos.',
  sniper_noscope: 'Ativa um minigame de miras: clique nas miras antes que desapareçam! Cada mira acertada dispara imediatamente uma bala teleguiada ao inimigo mais próximo (10 de dano). A mira dura 3.5s — se errar, o efeito acaba.',
  glitch_fury: 'Colete 3 glitches durante as dungeons para carregar. Ao ativar, a tela escurece e Tricky aparece! Clique para invocá-lo. Por 9 segundos o tempo para, depois você ganha a PLACA — ataque com ela (5 dano), velocidade máxima e imortalidade durante toda a dungeon!',
};

const RARITIES_STATIC = {
  comum:    { label:'COMUM',    color:'#888899' },
  raro:     { label:'RARO',     color:'#4488ff' },
  epico:    { label:'ÉPICO',    color:'#bb66ff' },
  lendario: { label:'LENDÁRIO', color:'#ff8800' },
  especial: { label:'ESPECIAL', color:'#ff2288' },
};
const CARD_DEFS_STATIC = {
  sword:        { name:'ESPADA',       icon:'⚔️',  mana:2, rarity:'comum'   },
  meat:         { name:'CARNE',        icon:'🍖',  mana:3, rarity:'comum'   },
  bow:          { name:'ARCO',         icon:'🏹',  mana:5, rarity:'raro'    },
  blast:        { name:'EXPLOSÃO',     icon:'💥',  mana:1, rarity:'epico'   },
  axe:          { name:'MACHADO',      icon:'🪓',  mana:3, rarity:'raro'    },
  speed_potion: { name:'POÇÃO',        icon:'🧪',  mana:1, rarity:'raro'    },
  bombinhas:    { name:'BOMBINHAS',    icon:'🧨',  mana:2, rarity:'epico'   },
  katana:       { name:'KATANA',       icon:'🗡️', mana:6, rarity:'epico'   },
  necro_staff:  { name:'CAJADO NECRO', icon:'☠️',  mana:2, rarity:'lendario'},
  pistol:       { name:'PISTOLA',      icon:'🔫',  mana:3, rarity:'raro'   },
  black_magic:  { name:'MAGIA NEGRA',  icon:'🌑',  mana:0, rarity:'especial'},
  dice:         { name:'DADOS',        icon:'🎲',  mana:1, rarity:'raro'   },
  scythe:       { name:'FOICE',        icon:'🌙',  mana:4, rarity:'epico'  },
  soccerball:   { name:'BOA DE FUTEBOL', icon:'⚽', mana:3, rarity:'raro'  },
  sniper_noscope: { name:'SNIPER NO SCOPE', icon:'🎯', mana:4, rarity:'lendario' },
  glitch_fury:    { name:'GLITCH FURY',     icon:'📛', mana:0, rarity:'especial'  },
};

// ═══════════════════════════════════════════════════════════════
// MENU PRINCIPAL
// ═══════════════════════════════════════════════════════════════
let gameStarted = false;

function updateMenuGold() {
  document.getElementById('menu-gold-disp').textContent = '🪙 ' + persistentGold;
}

function _menuClick() {
  if(typeof Audio !== 'undefined' && Audio.menuClick) Audio.menuClick();
}

function startGame() {
  const filledCards = equippedDeck.filter(Boolean).length;
  if(filledCards < 5) {
    if(typeof Audio !== 'undefined' && Audio.menuError) Audio.menuError();
    const btn = document.querySelector('.menu-btn');
    const msg = document.getElementById('deck-warning-msg');
    if(msg) {
      msg.textContent = '⚠ Você precisa de 5 cartas no baralho!';
      msg.style.opacity = '1';
      clearTimeout(msg._t);
      msg._t = setTimeout(() => { msg.style.opacity = '0'; }, 2500);
    }
    return;
  }
  // Garante que o AudioContext existe antes de qualquer operação de áudio
  if(typeof Audio !== 'undefined' && Audio.init) Audio.init();
  if(typeof Audio !== 'undefined' && Audio.stopLobbyMusic) Audio.stopLobbyMusic();
  _menuClick();
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('ui').style.display = 'block';
  if(equippedSpecial){
    document.getElementById('special-card-slot').style.display = 'flex';
  }
  gameStarted = true;
  currentEquippedDeck = equippedDeck.filter(Boolean);
  init();
  Audio.playDungeonMusic('blue');
  if(!gameLoopStarted){ gameLoopStarted=true; requestAnimationFrame(gameLoop); }
}

function goToMenu() {
  document.getElementById('ui').style.display = 'none';
  document.getElementById('main-menu').style.display = 'flex';
  updateMenuGold();
  gameStarted = false;
  if(typeof Audio !== 'undefined') {
    if(Audio.stopTrickyMusic) Audio.stopTrickyMusic();
    if(Audio.playLobbyMusic) Audio.playLobbyMusic();
  }
}

// ═══════════════════════════════════════════════════════════════
// MODAL DE CARTA
// ═══════════════════════════════════════════════════════════════
let _modalCardId = null;
let _modalContext = null; // 'collection' | 'special' | 'slot'
let _modalSlotIndex = -1;

function openCardModal(id, context, slotIndex) {
  _menuClick();
  _modalCardId = id;
  _modalContext = context;
  _modalSlotIndex = slotIndex !== undefined ? slotIndex : -1;

  const def = CARD_DEFS_STATIC[id];
  const rarDef = RARITIES_STATIC[def.rarity];

  document.getElementById('modal-icon').textContent   = def.icon;
  document.getElementById('modal-name').textContent   = def.name;
  document.getElementById('modal-mana').textContent   = '💧 ' + def.mana + ' mana';
  document.getElementById('modal-desc').textContent   = CARD_DESCS[id] || '';
  document.getElementById('modal-rarity').innerHTML   = `<span style="color:${rarDef.color}">${rarDef.label}</span>`;

  // Estrelas / upgrade info (só para especial)
  const upgradeBlock = document.getElementById('modal-upgrade-block');
  if(def.rarity === 'especial'){
    const maxLevel = 5;
    const stars = '★'.repeat(specialUpgradeLevel) + '☆'.repeat(maxLevel - specialUpgradeLevel);
    upgradeBlock.style.display = 'block';
    document.getElementById('modal-stars').textContent = stars;
    if(id === 'glitch_fury'){
      const glitchChanceTable = [50, 60, 70, 80, 90];
      const glitchChancePct = glitchChanceTable[Math.min(specialUpgradeLevel - 1, 4)];
      document.getElementById('modal-upgrade-info').textContent =
        `Nível ${specialUpgradeLevel} / ${maxLevel}  ·  👻 ${glitchChancePct}% chance de glitch`;
    } else {
      const durationSec = (getSpecialDurationForLevel(specialUpgradeLevel)/1000).toFixed(2).replace(/\.?0+$/,'');
      document.getElementById('modal-upgrade-info').textContent =
        `Nível ${specialUpgradeLevel} / ${maxLevel}  ·  ⏱ ${durationSec}s`;
    }
  } else {
    upgradeBlock.style.display = 'none';
  }

  // Botões de ação
  const actions = document.getElementById('modal-actions');
  actions.innerHTML = '';

  if(context === 'collection'){
    // Carta da coleção: equipar (se tiver slot livre e não estiver maxed no deck)
    const deckCount = equippedDeck.filter(x=>x===id).length;
    const ownCount  = ownedCards.filter(x=>x===id).length;
    const alreadyMaxed = deckCount >= ownCount;
    const hasSlot = equippedDeck.indexOf('') !== -1;
    if(!alreadyMaxed && hasSlot){
      const btn = document.createElement('button');
      btn.className = 'modal-btn btn-equip';
      btn.textContent = '+ EQUIPAR';
      btn.onclick = () => { equipCard(id); closeCardModal(); };
      actions.appendChild(btn);
    }

  } else if(context === 'special'){
    // Carta especial: upgrade + desequipar
    const maxLevel = 5;
    const isMaxed  = specialUpgradeLevel >= maxLevel;
    const cost     = isMaxed ? 0 : getSpecialUpgradeCost(specialUpgradeLevel);
    const canAfford = persistentGold >= cost;
    const isEquipped = equippedSpecial === id;

    if(isMaxed){
      const btn = document.createElement('button');
      btn.className = 'modal-btn btn-maxed';
      btn.textContent = '✦ NÍVEL MÁXIMO';
      actions.appendChild(btn);
    } else {
      const btn = document.createElement('button');
      btn.className = 'modal-btn btn-upgrade' + (canAfford ? '' : ' cant-afford');
      btn.innerHTML = `▲ UPGRADE &nbsp;<span style="color:#ffd700;font-size:11px">🪙 ${cost}</span>`;
      if(canAfford) btn.onclick = () => { upgradeSpecialCard(id); renderCardModalUpgrade(); };
      actions.appendChild(btn);
    }

    if(isEquipped){
      // Sem botão de desequipar; usuário arrasta para desequipar
    } else {
      const btnE = document.createElement('button');
      btnE.className = 'modal-btn btn-equip';
      btnE.textContent = '+ EQUIPAR';
      btnE.onclick = () => { equippedSpecial = id; writeSave(); renderDeckScreen(); closeCardModal(); };
      actions.appendChild(btnE);
    }

  } else if(context === 'slot'){
    // Carta equipada num slot: botão de desequipar
    const btnUnequip = document.createElement('button');
    btnUnequip.className = 'modal-btn btn-unequip';
    btnUnequip.textContent = '✕ DESEQUIPAR';
    btnUnequip.onclick = () => { unequipCard(_modalSlotIndex); closeCardModal(); };
    actions.appendChild(btnUnequip);
  }

  // Botão de árvore de buffs (para cartas com família de buffs)
  const cardBuffFamily = getCardBuffFamily(id);
  if(cardBuffFamily){
    const btnBuffTree = document.createElement('button');
    btnBuffTree.className = 'modal-btn btn-buff-tree';
    btnBuffTree.textContent = '🌿 ÁRVORE DE BUFFS';
    btnBuffTree.onclick = () => { closeCardModal(); openBuffTreeModal(cardBuffFamily, id); };
    actions.appendChild(btnBuffTree);
  }

  // Botão fechar
  const btnClose = document.createElement('button');
  btnClose.className = 'modal-btn btn-close';
  btnClose.textContent = '← FECHAR';
  btnClose.onclick = closeCardModal;
  actions.appendChild(btnClose);

  document.getElementById('card-modal-overlay').classList.add('open');
}

function renderCardModalUpgrade() {
  // Atualiza estrelas e botão de upgrade sem fechar o modal
  const maxLevel  = 5;
  const stars     = '★'.repeat(specialUpgradeLevel) + '☆'.repeat(maxLevel - specialUpgradeLevel);
  document.getElementById('modal-stars').textContent = stars;
  if(_modalCardId === 'glitch_fury') {
    const glitchChanceTable = [50, 60, 70, 80, 90];
    const glitchChancePct = glitchChanceTable[Math.min(specialUpgradeLevel - 1, 4)];
    document.getElementById('modal-upgrade-info').textContent =
      `Nível ${specialUpgradeLevel} / ${maxLevel}  ·  👻 ${glitchChancePct}% chance de glitch`;
  } else {
    const durationSec = (getSpecialDurationForLevel(specialUpgradeLevel)/1000).toFixed(2).replace(/\.?0+$/,'');
    document.getElementById('modal-upgrade-info').textContent =
      `Nível ${specialUpgradeLevel} / ${maxLevel}  ·  ⏱ ${durationSec}s`;
  }

  // Re-renderiza os botões
  const id = _modalCardId;
  openCardModal(id, 'special');
}

function closeCardModal() {
  _menuClick();
  document.getElementById('card-modal-overlay').classList.remove('open');
  _modalCardId = null;
}

// Fechar clicando no overlay
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('card-modal-overlay').addEventListener('click', (e) => {
    if(e.target === document.getElementById('card-modal-overlay')) closeCardModal();
  });
  document.getElementById('buff-tree-overlay').addEventListener('click', (e) => {
    if(e.target === document.getElementById('buff-tree-overlay')) closeBuffTreeModal();
  });
  document.getElementById('player-buff-overlay').addEventListener('click', (e) => {
    if(e.target === document.getElementById('player-buff-overlay')) closePlayerBuffScreen();
  });
  document.getElementById('artifact-modal-overlay').addEventListener('click', (e) => {
    if(e.target === document.getElementById('artifact-modal-overlay')) closeArtifactModal();
  });

  // Toca a música do lobby no primeiro clique do usuário (necessário por política de autoplay)
  function startLobbyOnFirstClick() {
    document.removeEventListener('click', startLobbyOnFirstClick);
    if(typeof Audio !== 'undefined') {
      Audio.init();
      // Só toca a música do lobby se o jogo ainda não começou
      if(!gameStarted) Audio.playLobbyMusic();
    }
  }
  document.addEventListener('click', startLobbyOnFirstClick);

  // Sons de hover e click nos elementos clicáveis do menu
  const MENU_SELECTORS = [
    '.menu-btn', '.back-btn', '.options-toggle-btn', '.erase-btn',
    '.player-buff-btn', '.chest-card', '.card', '.artifact-card',
    '.modal-btn', '.buff-node', '.collection-card', '.shop-card'
  ].join(',');

  document.addEventListener('mouseover', (e) => {
    if(!gameStarted && typeof Audio !== 'undefined' && Audio.menuHover) {
      const el = e.target.closest(MENU_SELECTORS);
      if(el && el !== e.relatedTarget && !el.disabled) Audio.menuHover();
    }
  });

  document.addEventListener('mousedown', (e) => {
    // menuClick é chamado explicitamente em cada ação bem-sucedida
  });
});

// ═══════════════════════════════════════════════════════════════
// TELA DE BARALHO
// ═══════════════════════════════════════════════════════════════
function openDeckScreen() {
  _menuClick();
  document.getElementById('main-menu').style.display = 'none';
  renderDeckScreen();
  document.getElementById('deck-screen').style.display = 'flex';
}

function closeDeckScreen() {
  _menuClick();
  document.getElementById('deck-screen').style.display = 'none';
  document.getElementById('main-menu').style.display = 'flex';
  writeSave();
}

function upgradeSpecialCard(id) {
  const maxLevel = 5;
  if(specialUpgradeLevel >= maxLevel) {
    if(typeof Audio !== 'undefined' && Audio.menuError) Audio.menuError();
    return;
  }
  const cost = getSpecialUpgradeCost(specialUpgradeLevel);
  if(persistentGold < cost) {
    if(typeof Audio !== 'undefined' && Audio.menuError) Audio.menuError();
    return;
  }
  persistentGold -= cost;
  specialUpgradeLevel++;
  _menuClick();
  writeSave();
  updateMenuGold();
  renderDeckScreen();
}

// Estado do drag — cartas
let _dragId = null;
let _dragFromSlot = null; // índice do slot de origem, ou null se veio da coleção
// Estado do drag — artefatos
let _artDragId = null;
let _artDragFromSlot = null; // índice do slot de artefato de origem, ou null se veio da coleção

function renderDeckScreen() {
  // ── Slots equipados (cartas) ──
  const slotArea = document.getElementById('deck-slot-area');
  slotArea.innerHTML = '';
  for(let i = 0; i < 5; i++){
    const id = equippedDeck[i] || '';
    const div = document.createElement('div');
    div.className = 'deck-slot ' + (id ? 'filled rarity-'+CARD_DEFS_STATIC[id].rarity : 'empty-slot');

    if(id){
      const def = CARD_DEFS_STATIC[id];
      const rarDef = RARITIES_STATIC[def.rarity];
      div.innerHTML = `
        <div class="ds-card-icon">${def.icon}</div>
        <div class="ds-card-name">${def.name}</div>
        <div class="ds-card-mana">💧 ${def.mana}</div>
        <div class="ds-card-rarity rarity-label-${def.rarity}">${rarDef.label}</div>
        <div class="ds-card-hint">clique / arraste</div>`;
      div.style.cursor = 'pointer';
      div.onclick = () => openCardModal(id, 'slot', i);
      div.draggable = true;
      div.addEventListener('dragstart', () => {
        _dragId = id; _dragFromSlot = i;
        setTimeout(() => div.classList.add('dragging'), 0);
      });
      div.addEventListener('dragend', () => {
        div.classList.remove('dragging'); _dragId = null; _dragFromSlot = null;
      });
    } else {
      div.innerHTML = `<div class="ds-slot-empty-icon">+</div><div class="ds-slot-empty-label">vazio</div>`;
    }

    div.addEventListener('dragover', (e) => { e.preventDefault(); div.classList.add('drag-over'); });
    div.addEventListener('dragleave', () => div.classList.remove('drag-over'));
    div.addEventListener('drop', (e) => {
      e.preventDefault(); div.classList.remove('drag-over');
      if(!_dragId) return;
      const incoming = _dragId; const fromSlot = _dragFromSlot;
      const currentInSlot = equippedDeck[i] || '';
      if(fromSlot !== null){ equippedDeck[i] = incoming; equippedDeck[fromSlot] = currentInSlot; }
      else { equippedDeck[i] = incoming; }
      _dragId = null; _dragFromSlot = null;
      renderDeckScreen(); writeSave();
    });
    slotArea.appendChild(div);
  }

  // ── Slot especial (drop target) ──
  const specialArea = document.getElementById('deck-special-area');
  if(specialArea){
    specialArea.innerHTML = '';
    const slotDiv = document.createElement('div');
    if(equippedSpecial){
      const def = CARD_DEFS_STATIC[equippedSpecial];
      slotDiv.className = 'deck-slot filled rarity-especial';
      slotDiv.innerHTML = `
        <div class="ds-card-icon">${def.icon}</div>
        <div class="ds-card-name" style="color:#ff88cc">${def.name}</div>
        <div class="ds-card-rarity" style="color:#ff2288;font-size:7px;margin-top:2px">ESPECIAL</div>
        <div class="ds-card-hint">clique / arraste</div>`;
      slotDiv.style.cursor = 'pointer';
      slotDiv.onclick = () => openCardModal(equippedSpecial, 'special');
      slotDiv.draggable = true;
      slotDiv.addEventListener('dragstart', () => {
        _dragId = equippedSpecial; _dragFromSlot = 'special';
        setTimeout(() => slotDiv.classList.add('dragging'), 0);
      });
      slotDiv.addEventListener('dragend', () => {
        slotDiv.classList.remove('dragging'); _dragId = null; _dragFromSlot = null;
      });
    } else {
      slotDiv.className = 'deck-slot empty-slot';
      slotDiv.innerHTML = `<div class="ds-slot-empty-icon" style="font-size:22px;color:#441133">✦</div><div class="ds-slot-empty-label" style="color:#441133">especial</div>`;
    }
    slotDiv.addEventListener('dragover', (e) => { e.preventDefault(); slotDiv.classList.add('drag-over'); });
    slotDiv.addEventListener('dragleave', () => slotDiv.classList.remove('drag-over'));
    slotDiv.addEventListener('drop', (e) => {
      e.preventDefault(); slotDiv.classList.remove('drag-over');
      if(!_dragId) return;
      const defIncoming = CARD_DEFS_STATIC[_dragId];
      if(!defIncoming || defIncoming.rarity !== 'especial') return;
      equippedSpecial = _dragId;
      _dragId = null; _dragFromSlot = null;
      renderDeckScreen(); writeSave();
    });
    specialArea.appendChild(slotDiv);
  }

  // ── Coleção de cartas ──
  const collArea = document.getElementById('collection-area');
  collArea.innerHTML = '';
  collArea.addEventListener('dragover', (e) => { e.preventDefault(); collArea.classList.add('drag-over-coll'); });
  collArea.addEventListener('dragleave', (e) => {
    if(!collArea.contains(e.relatedTarget)) collArea.classList.remove('drag-over-coll');
  });
  collArea.addEventListener('drop', (e) => {
    e.preventDefault(); collArea.classList.remove('drag-over-coll');
    if(_dragId){
      if(_dragFromSlot === 'special'){
        equippedSpecial = null; _dragId = null; _dragFromSlot = null;
        renderDeckScreen(); writeSave();
      } else if(_dragFromSlot !== null){
        equippedDeck[_dragFromSlot] = ''; _dragId = null; _dragFromSlot = null;
        renderDeckScreen(); writeSave();
      }
    }
  });
  ownedCards.forEach(id => {
    const def = CARD_DEFS_STATIC[id];
    const rarDef = RARITIES_STATIC[def.rarity];
    const isSpecial = def.rarity === 'especial';
    // Para especiais: "equipada" = equippedSpecial === id. Para normais: contagem no deck.
    const alreadyMaxed = isSpecial
      ? equippedSpecial === id
      : equippedDeck.filter(x=>x===id).length >= ownedCards.filter(x=>x===id).length;
    const canDrag = !alreadyMaxed;
    const div = document.createElement('div');
    div.className = `coll-card rarity-${def.rarity}${alreadyMaxed?' in-deck':''}`;
    div.innerHTML = `
      <div class="ds-card-icon">${def.icon}</div>
      <div class="ds-card-name" style="${isSpecial?'color:#ff88cc':''}">${def.name}</div>
      <div class="ds-card-mana">${isSpecial?'<span style="color:#ff2288;font-size:7px">ESPECIAL</span>':'💧 '+def.mana}</div>
      <div class="ds-card-rarity rarity-label-${def.rarity}">${rarDef.label}</div>
      ${alreadyMaxed
        ? '<div class="ds-card-hint" style="color:#334433">equipada</div>'
        : `<div class="ds-card-hint" style="color:#3a5a3a">arraste ▸ slot</div>`}`;
    if(canDrag){
      div.draggable = true;
      div.addEventListener('dragstart', () => {
        _dragId = id; _dragFromSlot = null; setTimeout(() => div.classList.add('dragging'), 0);
      });
      div.addEventListener('dragend', () => { div.classList.remove('dragging'); _dragId = null; });
    }
    div.onclick = () => openCardModal(id, isSpecial ? 'special' : 'collection');
    collArea.appendChild(div);
  });

  // ── Slots de artefatos (com drag-and-drop) ──
  _renderDeckArtifactSlots();

  // ── Coleção de artefatos (com drag) ──
  _renderDeckArtifactCollection();
}

function _renderDeckArtifactSlots() {
  const area = document.getElementById('deck-artifact-slots');
  if(!area) return;
  area.innerHTML = '';
  for(let i = 0; i < ARTIFACT_MAX_SLOTS; i++) {
    const id = equippedArtifacts[i];
    const div = document.createElement('div');
    if(id) {
      const def = ARTIFACT_DEFS[id];
      if(!def) { equippedArtifacts[i] = null; continue; }
      div.className = `artifact-slot filled rarity-${def.rarity}`;
      const slotLevel = ARTIFACT_UPGRADE_TABLES[id] ? getArtifactLevel(id) : null;
      const slotStars = slotLevel ? '★'.repeat(slotLevel)+'☆'.repeat(5-slotLevel) : '';
      const slotUpgrLabel = slotLevel && ARTIFACT_UPGRADE_LABELS[id] ? ARTIFACT_UPGRADE_LABELS[id](slotLevel) : def.desc;
      div.innerHTML = `
        <span class="slot-icon">${def.icon}</span>
        <div class="slot-info">
          <div class="slot-name">${def.name} ${slotLevel ? `<span style="color:#ffcc44;font-size:9px">${slotStars}</span>` : ''}</div>
          <div class="slot-eff">${slotUpgrLabel}</div>
        </div>
        <div class="slot-unequip" onclick="event.stopPropagation();_deckUnequipArtifact(${i})">✕</div>`;
      div.style.cursor = 'pointer';
      div.addEventListener('click', () => openArtifactModal(id, 'slot'));
      // Draggable para desequipar
      div.draggable = true;
      div.addEventListener('dragstart', () => {
        _artDragId = id; _artDragFromSlot = i; setTimeout(() => div.style.opacity='0.4', 0);
      });
      div.addEventListener('dragend', () => { div.style.opacity=''; _artDragId = null; _artDragFromSlot = null; });
    } else {
      div.className = 'artifact-slot';
      div.innerHTML = `<span style="color:#2a2a55;font-size:11px">Slot ${i+1} — vazio</span>`;
    }
    // Drop: recebe artefato da coleção ou de outro slot
    div.addEventListener('dragover', (e) => { e.preventDefault(); div.classList.add('drag-over-art'); });
    div.addEventListener('dragleave', () => div.classList.remove('drag-over-art'));
    div.addEventListener('drop', (e) => {
      e.preventDefault(); div.classList.remove('drag-over-art');
      if(!_artDragId) return;
      const incoming = _artDragId; const fromSlot = _artDragFromSlot;
      // Não duplicar artefato
      if(equippedArtifacts[i] === incoming) return;
      // Verifica se já está equipado em outro slot (só pode ter 1 de cada)
      const alreadyInSlot = equippedArtifacts.indexOf(incoming);
      if(fromSlot !== null) {
        // Veio de outro slot: troca
        const cur = equippedArtifacts[i];
        equippedArtifacts[i] = incoming;
        equippedArtifacts[fromSlot] = cur;
      } else {
        // Veio da coleção
        if(alreadyInSlot !== -1) return; // já equipado
        if(equippedArtifacts[i] !== null) {
          // slot ocupado: desequipa o atual
          equippedArtifacts[i] = incoming;
        } else {
          equippedArtifacts[i] = incoming;
        }
      }
      _artDragId = null; _artDragFromSlot = null;
      writeSave(); _renderDeckArtifactSlots(); _renderDeckArtifactCollection();
    });
    area.appendChild(div);
  }
  // Drop na área geral (fora de slots): desequipa
  area.addEventListener('dragover', (e) => e.preventDefault());
}

function _deckUnequipArtifact(slotIndex) {
  _menuClick();
  equippedArtifacts[slotIndex] = null;
  writeSave(); _renderDeckArtifactSlots(); _renderDeckArtifactCollection();
}

function _renderDeckArtifactCollection() {
  const grid = document.getElementById('deck-artifact-collection');
  if(!grid) return;
  grid.innerHTML = '';
  if(ownedArtifacts.length === 0) {
    grid.innerHTML = '<div style="color:#555577;font-size:10px;padding:8px;text-align:center">Abra baús na tela<br>de Artefatos!</div>';
    return;
  }
  const counts = {};
  ownedArtifacts.forEach(id => { counts[id] = (counts[id]||0)+1; });
  Object.entries(counts).forEach(([id, count]) => {
    const def = ARTIFACT_DEFS[id]; if(!def) return;
    const isEquipped = equippedArtifacts.includes(id);
    const hasUpgrades = ARTIFACT_UPGRADE_TABLES[id] !== undefined;
    const level = hasUpgrades ? getArtifactLevel(id) : null;
    const upgradeLabel = hasUpgrades && ARTIFACT_UPGRADE_LABELS[id] ? ARTIFACT_UPGRADE_LABELS[id](level) : '';
    let levelHtml = '';
    if(hasUpgrades && level) {
      const stars = '★'.repeat(level)+'☆'.repeat(5-level);
      levelHtml = `<div style="font-size:8px;color:#ffcc44;letter-spacing:1px">${stars}</div>
        <div style="font-size:7px;color:#aaddff">${upgradeLabel}</div>`;
    }
    const div = document.createElement('div');
    div.className = `artifact-card rarity-${def.rarity}${isEquipped?' equipped-art':''}`;
    div.innerHTML = `
      <div class="art-icon">${def.icon}</div>
      <div class="art-name">${def.name}</div>
      <div class="art-rarity" style="color:${ARTIFACT_RARITY_COLORS[def.rarity]}">${ARTIFACT_RARITY_LABELS[def.rarity]}</div>
      ${levelHtml}
      ${count > 1 ? `<div style="font-size:7px;color:#778;margin-top:2px">${count-1} dupl.</div>` : ''}
      ${isEquipped ? '<div style="font-size:7px;color:#88ffaa;margin-top:2px">✓ equipado</div>'
        : '<div style="font-size:7px;color:#557744;margin-top:2px">arraste ▸ slot</div>'}`;
    if(!isEquipped) {
      div.draggable = true;
      div.addEventListener('dragstart', () => {
        _artDragId = id; _artDragFromSlot = null; setTimeout(() => div.classList.add('dragging-art'), 0);
      });
      div.addEventListener('dragend', () => { div.classList.remove('dragging-art'); _artDragId = null; _artDragFromSlot = null; });
    }
    div.style.cursor = 'pointer';
    div.addEventListener('click', (e) => { if(!div.classList.contains('dragging-art')) openArtifactModal(id, isEquipped ? 'slot' : 'collection'); });
    grid.appendChild(div);
  });
  // Drop na coleção de artefatos: desequipa artefato arrastado de um slot
  grid.addEventListener('dragover', (e) => e.preventDefault());
  grid.addEventListener('drop', (e) => {
    e.preventDefault();
    if(_artDragFromSlot !== null && _artDragId) {
      equippedArtifacts[_artDragFromSlot] = null;
      _artDragId = null; _artDragFromSlot = null;
      writeSave(); _renderDeckArtifactSlots(); _renderDeckArtifactCollection();
    }
  });
}

function equipCard(id) {
  _menuClick();
  const emptySlot = equippedDeck.indexOf('');
  if(emptySlot === -1) return;
  equippedDeck[emptySlot] = id;
  renderDeckScreen();
  writeSave();
}

function unequipCard(slotIndex) {
  _menuClick();
  equippedDeck[slotIndex] = '';
  renderDeckScreen();
  writeSave();
}

// ═══════════════════════════════════════════════════════════════
// LOJA
// ═══════════════════════════════════════════════════════════════
const SHOP_CATALOG = [
  { id:'sword' },{ id:'meat' },{ id:'bow' },{ id:'axe' },
  { id:'speed_potion' },{ id:'blast' },{ id:'bombinhas' },
  { id:'katana' },{ id:'necro_staff' },{ id:'pistol' },{ id:'black_magic' },
  { id:'dice' },
  { id:'scythe' },
  { id:'soccerball' },
  { id:'sniper_noscope' },
  { id:'glitch_fury' },
];

function openShopScreen() {
  _menuClick();
  document.getElementById('main-menu').style.display = 'none';
  renderShopScreen();
  document.getElementById('shop-screen').style.display = 'flex';
  if(typeof Audio !== 'undefined') {
    if(Audio.stopLobbyMusic) Audio.stopLobbyMusic();
    if(Audio.playShopMusic) Audio.playShopMusic();
  }
}

function closeShopScreen() {
  _menuClick();
  document.getElementById('shop-screen').style.display = 'none';
  document.getElementById('main-menu').style.display = 'flex';
  if(typeof Audio !== 'undefined') {
    if(Audio.stopShopMusic) Audio.stopShopMusic();
    if(Audio.playLobbyMusic) Audio.playLobbyMusic();
  }
  updateMenuGold();
  writeSave();
}

// ── Estado dos filtros da loja ──
let _shopFilter = 'all';
let _shopSort = 'default';
let _shopSearch = '';

function setShopFilter(f, btn) {
  _shopFilter = f;
  document.querySelectorAll('.shop-filter-btn').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderShopGrid();
}

function clearShopSearch() {
  _shopSearch = '';
  _shopFilter = 'all';
  document.querySelectorAll('.shop-filter-btn').forEach(b => b.classList.remove('active'));
  const allBtn = document.querySelector('.shop-filter-btn[data-filter="all"]');
  if(allBtn) allBtn.classList.add('active');
  const inp = document.getElementById('shop-search');
  if(inp) inp.value = '';
  const clr = document.getElementById('shop-search-clear');
  if(clr) clr.style.display = 'none';
  renderShopGrid();
}

function filterShop() {
  const inp = document.getElementById('shop-search');
  const sort = document.getElementById('shop-sort');
  _shopSearch = inp ? inp.value.trim().toLowerCase() : '';
  _shopSort = sort ? sort.value : 'default';
  const clr = document.getElementById('shop-search-clear');
  if(clr) clr.style.display = _shopSearch ? 'block' : 'none';
  renderShopGrid();
}

function _buildShopCard(id, animIdx) {
  const def = CARD_DEFS_STATIC[id];
  const rarDef = RARITIES_STATIC[def.rarity];
  const price = CARD_PRICES[def.rarity];
  const atMax = ownedCards.includes(id);
  const cantAfford = persistentGold < price;
  const div = document.createElement('div');
  let cls = `shop-card rarity-${def.rarity}`;
  if(atMax) cls += ' owned'; else if(cantAfford) cls += ' cant-afford';
  div.className = cls;
  div.style.animationDelay = (animIdx * 0.04) + 's';
  div.innerHTML = `
    <div style="font-size:36px;margin-bottom:6px;line-height:1">${def.icon}</div>
    <div style="font-size:9px;text-align:center;color:#e0e0ff;font-weight:bold;letter-spacing:1px;font-family:'Courier New',monospace;margin-bottom:2px">${def.name}</div>
    <div style="font-size:8px;color:#6688cc;margin-top:2px;letter-spacing:0.5px">💧 ${def.mana} mana</div>
    <div style="font-size:8px;margin-top:3px;letter-spacing:1px" class="rarity-label-${def.rarity}">${rarDef.label}</div>
    <div class="shop-price${atMax?' owned-price':''}">${atMax ? '✓ Possuída' : '🪙 '+price}</div>`;
  if(!atMax && !cantAfford) div.onclick = () => buyCard(id, price);
  else div.onclick = () => { if(typeof Audio !== 'undefined' && Audio.menuError) Audio.menuError(); };
  div.addEventListener('mouseenter', (e) => showTooltip(e, id));
  div.addEventListener('mousemove', moveTooltip);
  div.addEventListener('mouseleave', hideTooltip);
  return div;
}

function _sortEntries(entries) {
  const arr = [...entries];
  const rarOrder = { comum:0, raro:1, epico:2, lendario:3, especial:4 };
  switch(_shopSort) {
    case 'price-asc':  return arr.sort((a,b) => CARD_PRICES[CARD_DEFS_STATIC[a.id].rarity] - CARD_PRICES[CARD_DEFS_STATIC[b.id].rarity]);
    case 'price-desc': return arr.sort((a,b) => CARD_PRICES[CARD_DEFS_STATIC[b.id].rarity] - CARD_PRICES[CARD_DEFS_STATIC[a.id].rarity]);
    case 'mana-asc':   return arr.sort((a,b) => CARD_DEFS_STATIC[a.id].mana - CARD_DEFS_STATIC[b.id].mana);
    case 'mana-desc':  return arr.sort((a,b) => CARD_DEFS_STATIC[b.id].mana - CARD_DEFS_STATIC[a.id].mana);
    case 'name':       return arr.sort((a,b) => CARD_DEFS_STATIC[a.id].name.localeCompare(CARD_DEFS_STATIC[b.id].name));
    default: return arr;
  }
}

function _updateShopCounts() {
  const rarities = ['comum','raro','epico','lendario','especial'];
  let all = SHOP_CATALOG.length;
  let owned = ownedCards.filter(id => SHOP_CATALOG.find(e=>e.id===id)).length;
  document.getElementById('sc-all').textContent = all;
  document.getElementById('sc-owned').textContent = owned;
  rarities.forEach(r => {
    const el = document.getElementById('sc-'+r);
    if(el) el.textContent = SHOP_CATALOG.filter(e => CARD_DEFS_STATIC[e.id].rarity===r).length;
  });
  // Stats pill
  const statsEl = document.getElementById('shop-stats');
  if(statsEl) {
    const canAfford = SHOP_CATALOG.filter(e => {
      const d = CARD_DEFS_STATIC[e.id];
      return !ownedCards.includes(e.id) && persistentGold >= CARD_PRICES[d.rarity];
    }).length;
    const total = SHOP_CATALOG.length;
    statsEl.innerHTML = `
      <div class="shop-stat-pill"><span>${owned}</span>/${total} possuídas</div>
      <div class="shop-stat-pill"><span>${canAfford}</span> compráveis agora</div>`;
  }
}

function renderShopGrid() {
  const secWrap = document.getElementById('shop-sections-wrap');
  const flatGrid = document.getElementById('shop-grid');
  const emptyMsg = document.getElementById('shop-empty-msg');
  secWrap.innerHTML = '';
  flatGrid.innerHTML = '';

  // Filtrar entradas
  let entries = SHOP_CATALOG.filter(e => {
    const def = CARD_DEFS_STATIC[e.id];
    if(_shopSearch && !def.name.toLowerCase().includes(_shopSearch) && !e.id.includes(_shopSearch)) return false;
    if(_shopFilter === 'owned') return ownedCards.includes(e.id);
    if(_shopFilter !== 'all') return def.rarity === _shopFilter;
    return true;
  });

  const sorted = _sortEntries(entries);
  const useFlat = _shopSearch || _shopFilter !== 'all' || _shopSort !== 'default';

  if(sorted.length === 0) {
    emptyMsg.style.display = 'block';
    secWrap.style.display = 'none';
    flatGrid.style.display = 'none';
    return;
  }
  emptyMsg.style.display = 'none';

  if(useFlat) {
    secWrap.style.display = 'none';
    flatGrid.style.display = 'flex';
    sorted.forEach((e, i) => flatGrid.appendChild(_buildShopCard(e.id, i)));
  } else {
    flatGrid.style.display = 'none';
    secWrap.style.display = 'block';
    const rarOrder = ['comum','raro','epico','lendario','especial'];
    const rarLabels = { comum:'COMUM', raro:'RARO', epico:'ÉPICO', lendario:'LENDÁRIO', especial:'ESPECIAL' };
    let animIdx = 0;
    rarOrder.forEach(r => {
      const group = sorted.filter(e => CARD_DEFS_STATIC[e.id].rarity === r);
      if(!group.length) return;
      const sec = document.createElement('div');
      sec.className = `shop-section section-${r}`;
      const header = document.createElement('div');
      header.className = 'shop-section-header';
      const ownedInGroup = group.filter(e => ownedCards.includes(e.id)).length;
      header.innerHTML = `
        <div class="shop-section-label">${rarLabels[r]}</div>
        <div class="shop-section-bar"></div>
        <div class="shop-section-count">${ownedInGroup}/${group.length} possuídas</div>`;
      const grid = document.createElement('div');
      grid.className = 'shop-grid';
      group.forEach(e => { grid.appendChild(_buildShopCard(e.id, animIdx)); animIdx++; });
      sec.appendChild(header);
      sec.appendChild(grid);
      secWrap.appendChild(sec);
    });
  }
}

function renderShopScreen() {
  document.getElementById('shop-gold').textContent = '🪙 ' + persistentGold;
  _updateShopCounts();
  // Resetar estado dos filtros ao abrir
  _shopFilter = 'all';
  _shopSort = 'default';
  _shopSearch = '';
  const inp = document.getElementById('shop-search');
  if(inp) inp.value = '';
  const sortEl = document.getElementById('shop-sort');
  if(sortEl) sortEl.value = 'default';
  document.querySelectorAll('.shop-filter-btn').forEach(b => b.classList.remove('active'));
  const allBtn = document.querySelector('.shop-filter-btn[data-filter="all"]');
  if(allBtn) allBtn.classList.add('active');
  renderShopGrid();
}


function buyCard(id, price) {
  if(persistentGold < price || ownedCards.includes(id)) {
    if(typeof Audio !== 'undefined' && Audio.menuError) Audio.menuError();
    return;
  }
  persistentGold -= price;
  ownedCards.push(id);
  _menuClick();
  writeSave();
  // Atualiza ouro, contadores e grid sem resetar filtros
  document.getElementById('shop-gold').textContent = '🪙 ' + persistentGold;
  _updateShopCounts();
  renderShopGrid();
}

// ═══════════════════════════════════════════════════════════════
// TOOLTIP (usado na loja)
// ═══════════════════════════════════════════════════════════════
function showTooltip(e, id) {
  const def = CARD_DEFS_STATIC[id];
  const rarDef = RARITIES_STATIC[def.rarity];
  const tt = document.getElementById('card-tooltip');
  document.getElementById('tt-name').textContent = def.icon + ' ' + def.name;
  document.getElementById('tt-rarity').innerHTML = `<span style="color:${rarDef.color}">${rarDef.label}</span> · 💧 ${def.mana} mana`;
  document.getElementById('tt-desc').textContent = CARD_DESCS[id] || '';
  tt.style.display = 'block';
  moveTooltip(e);
}
function moveTooltip(e) {
  const tt = document.getElementById('card-tooltip');
  let x = e.clientX + 16, y = e.clientY + 10;
  if(x + 220 > window.innerWidth) x = e.clientX - 230;
  if(y + 120 > window.innerHeight) y = e.clientY - 130;
  tt.style.left = x + 'px'; tt.style.top = y + 'px';
}
function hideTooltip() { document.getElementById('card-tooltip').style.display = 'none'; }

// ═══════════════════════════════════════════════════════════════
// ÁRVORE DE BUFFS
// ═══════════════════════════════════════════════════════════════

const CARD_TO_BUFF_FAMILY = {
  sword: 'sword',
  bow: 'bow',
  axe: 'axe',
  speed_potion: 'speed',
  katana: 'katana',
  bombinhas: 'bombinhas',
  meat: 'carne',
  necro_staff: 'necro',
  blast: 'isolado',
  pistol: 'pistol',
  dice: 'dado',
  scythe: 'foice',
  soccerball: 'futebol',
  sniper_noscope: 'sniper',
};

const PLAYER_BUFF_FAMILIES = ['vida', 'mana'];

function getCardBuffFamily(cardId) {
  return CARD_TO_BUFF_FAMILY[cardId] !== undefined ? CARD_TO_BUFF_FAMILY[cardId] : null;
}

function getBuffChain(family) {
  if(!window.BUFF_DEFS && typeof BUFF_DEFS === 'undefined') return [];
  const defs = typeof BUFF_DEFS !== 'undefined' ? BUFF_DEFS : window.BUFF_DEFS;
  const all = Object.values(defs).filter(b => b.family === family);
  const chain = [];
  let current = all.find(b => !b.requires);
  while(current) {
    chain.push(current);
    const next = all.find(b => b.requires === current.id);
    current = next;
  }
  all.forEach(b => { if(!chain.includes(b)) chain.push(b); });
  return chain;
}

function openBuffTreeModal(family, sourceCardId) {
  const overlay = document.getElementById('buff-tree-overlay');
  const container = document.getElementById('buff-tree-container');
  const title = document.getElementById('buff-tree-title');

  const chain = getBuffChain(family);
  if(!chain.length) return;

  const def = CARD_DEFS_STATIC[sourceCardId] || {};
  title.textContent = (def.icon || '') + ' BUFFS: ' + (def.name || family.toUpperCase());

  container.innerHTML = '';
  chain.forEach((buff, idx) => {
    const isActive = typeof activeBuffs !== 'undefined' && activeBuffs.has(buff.id);
    const node = document.createElement('div');
    node.className = 'buff-tree-node' + (isActive ? ' buff-tree-active' : ' buff-tree-locked');
    node.innerHTML = `
      <div class="btn-icon">${buff.icon}</div>
      <div class="btn-name">${buff.name}</div>
      <div class="btn-desc">${buff.desc}</div>
      ${isActive ? '<div class="btn-status active-tag">✓ ATIVO</div>' : '<div class="btn-status locked-tag">🔒 bloqueado</div>'}
    `;
    container.appendChild(node);
    if(idx < chain.length - 1){
      const arrow = document.createElement('div');
      arrow.className = 'buff-tree-arrow';
      arrow.textContent = '▼';
      container.appendChild(arrow);
    }
  });

  overlay.classList.add('open');
}

function closeBuffTreeModal() {
  _menuClick();
  document.getElementById('buff-tree-overlay').classList.remove('open');
}

// ═══════════════════════════════════════════════════════════════
// TELA DE BUFFS DO PLAYER (vida, mana)
// ═══════════════════════════════════════════════════════════════

function openPlayerBuffScreen() {
  _menuClick();
  renderPlayerBuffScreen();
  document.getElementById('player-buff-overlay').classList.add('open');
}

function closePlayerBuffScreen() {
  _menuClick();
  document.getElementById('player-buff-overlay').classList.remove('open');
}

function renderPlayerBuffScreen() {
  const container = document.getElementById('player-buff-content');
  container.innerHTML = '';

  const families = [
    { key: 'vida', label: '❤️ VIDA', color: '#ff4488' },
    { key: 'mana', label: '💧 MANA', color: '#44ddff' },
  ];

  families.forEach(fam => {
    const chain = getBuffChain(fam.key);
    if(!chain.length) return;

    const section = document.createElement('div');
    section.className = 'pbuff-section';
    section.innerHTML = `<div class="pbuff-family-title" style="color:${fam.color}">${fam.label}</div>`;

    const chainEl = document.createElement('div');
    chainEl.className = 'pbuff-chain';

    chain.forEach((buff, idx) => {
      const isActive = typeof activeBuffs !== 'undefined' && activeBuffs.has(buff.id);
      const node = document.createElement('div');
      node.className = 'pbuff-node' + (isActive ? ' pbuff-active' : ' pbuff-locked');
      node.style.borderColor = isActive ? fam.color : '#2a2a55';
      node.innerHTML = `
        <span class="pbuff-icon">${buff.icon}</span>
        <span class="pbuff-name">${buff.name}</span>
        <span class="pbuff-desc">${buff.desc}</span>
        ${isActive ? `<span class="pbuff-status" style="color:${fam.color}">✓ ATIVO</span>` : '<span class="pbuff-status locked-tag">🔒</span>'}
      `;
      chainEl.appendChild(node);
      if(idx < chain.length - 1){
        const arrow = document.createElement('div');
        arrow.className = 'pbuff-arrow';
        arrow.textContent = '▼';
        chainEl.appendChild(arrow);
      }
    });

    section.appendChild(chainEl);
    container.appendChild(section);
  });

  if(!gameStarted){
    const note = document.createElement('div');
    note.style.cssText = 'color:#333366;font-size:11px;text-align:center;margin-top:16px;line-height:1.6;';
    note.textContent = 'Buffs são desbloqueados ao completar dungeons durante o jogo.';
    container.appendChild(note);
  }
}

// ═══════════════════════════════════════════════════════════════
// TELA DE OPÇÕES
// ═══════════════════════════════════════════════════════════════

function openOptionsScreen() {
  _menuClick();
  document.getElementById('main-menu').style.display = 'none';
  updateOptionsSoundLabel();
  updateOptionsFullscreenLabel();
  updateOptionsEffectsLabel();
  updateOptionsVolumeSlider();
  document.getElementById('options-screen').style.display = 'flex';
}

function closeOptionsScreen() {
  _menuClick();
  document.getElementById('options-screen').style.display = 'none';
  document.getElementById('main-menu').style.display = 'flex';
}

function openEraseConfirm() {
  _menuClick();
  document.getElementById('erase-confirm-overlay').classList.add('open');
}

function closeEraseConfirm() {
  _menuClick();
  document.getElementById('erase-confirm-overlay').classList.remove('open');
}

function eraseData() {
  _menuClick();
  const DEFAULT_CARDS = ['sword', 'meat', 'pistol', 'speed_potion', 'scythe'];

  // Resetar todas as variáveis de estado para o padrão inicial
  persistentGold = 0;
  ownedCards = [...DEFAULT_CARDS];
  equippedDeck = [...DEFAULT_CARDS];
  equippedSpecial = null;
  specialUpgradeLevel = 1;
  ownedArtifacts = [];
  equippedArtifacts = [];
  normalizeArtifactSlots();

  // Limpar localStorage e salvar o estado zerado
  localStorage.removeItem(SAVE_KEY);
  writeSave();

  // Fechar modais e atualizar UI
  closeEraseConfirm();
  closeOptionsScreen();
  updateMenuGold();
}


function updateOptionsSoundLabel() {
  const btn = document.getElementById('options-sound-btn');
  if(!btn) return;
  const muted = typeof Audio !== 'undefined' && Audio.isMuted ? Audio.isMuted() : false;
  btn.textContent = muted ? '🔇 Som: DESLIGADO' : '🔊 Som: LIGADO';
  btn.style.borderColor = muted ? '#444466' : '#4444aa';
  btn.style.color = muted ? '#444466' : '#aaaaff';
}

function toggleOptionsSound() {
  if(typeof Audio !== 'undefined' && Audio.toggleMute) Audio.toggleMute();
  updateOptionsSoundLabel();
  updateOptionsVolumeSlider();
  // Sincroniza com tela de pause se estiver aberta
  if(typeof updatePauseSoundLabel === 'function') updatePauseSoundLabel();
}

function updateOptionsFullscreenLabel() {
  const btn = document.getElementById('options-fullscreen-btn');
  if(!btn) return;
  const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
  btn.textContent = isFS ? '✕ Sair da Tela Cheia' : '⛶ Tela Cheia';
}

function updateOptionsEffectsLabel() {
  const btn = document.getElementById('options-effects-btn');
  if(!btn) return;
  const on = typeof fancyEffects !== 'undefined' ? fancyEffects : true;
  btn.textContent = on ? '✦ Efeitos: LIGADO' : '✧ Efeitos: DESLIGADO';
  btn.style.borderColor = on ? '#4444aa' : '#444466';
  btn.style.color = on ? '#aaaaff' : '#444466';
  btn.style.opacity = on ? '1' : '0.55';
}

function toggleOptionsEffects() {
  if(typeof toggleFancyEffects === 'function') toggleFancyEffects();
  updateOptionsEffectsLabel();
}

// Atualiza o label ao mudar fullscreen por qualquer meio (ex: tecla Esc)
document.addEventListener('fullscreenchange', updateOptionsFullscreenLabel);
document.addEventListener('webkitfullscreenchange', updateOptionsFullscreenLabel);

function updateOptionsVolumeSlider() {
  const slider = document.getElementById('options-volume-slider');
  const pct = document.getElementById('options-vol-pct');
  const icon = document.getElementById('options-vol-icon');
  if (!slider) return;
  const vol = (typeof Audio !== 'undefined' && Audio.getVolume) ? Audio.getVolume() : 0.5;
  const val = Math.round(vol * 100);
  slider.value = val;
  if (pct) pct.textContent = val + '%';
  if (icon) icon.textContent = val === 0 ? '🔇' : val < 50 ? '🔉' : '🔊';
  slider.style.setProperty('--vol-pct', val + '%');
  // Atualiza o fill do slider via CSS custom property
  slider.style.background = `linear-gradient(90deg, #4444cc ${val}%, #1a1a44 ${val}%)`;
}

function onOptionsVolumeChange(val) {
  const v = parseInt(val) / 100;
  if (typeof Audio !== 'undefined' && Audio.setVolume) Audio.setVolume(v);
  updateOptionsVolumeSlider();
  updateOptionsSoundLabel();
  if (typeof updatePauseSoundLabel === 'function') updatePauseSoundLabel();
}

// ═══════════════════════════════════════════════════════════════
// CHEATS (teclado — apenas "super" no pause permanece)
// ═══════════════════════════════════════════════════════════════
let cheatBuffer = '';
document.addEventListener('keydown', (e) => {
  const isPaused = typeof paused !== 'undefined' && paused && gameStarted;
  if(!isPaused) return;
  cheatBuffer += e.key.toLowerCase();
  if(cheatBuffer.length > 20) cheatBuffer = cheatBuffer.slice(-20);
  if(isPaused && cheatBuffer.includes('super')){
    if(equippedSpecial === 'glitch_fury'){
      glitchFuryCharge = 3; glitchFuryReady = true;
      if(typeof updateGlitchFuryUI === 'function') updateGlitchFuryUI();
    } else if(equippedSpecial === 'black_magic'){
      specialChargeKills = SPECIAL_CHARGE_GOAL; specialReady = true;
      updateSpecialCardUI();
    }
    cheatBuffer = '';
  }
});

// ═══════════════════════════════════════════════════════════════
// ÁREA DE CÓDIGOS (tela de opções)
// ═══════════════════════════════════════════════════════════════
const OPTION_CODES = {
  'dinheiro': () => {
    persistentGold += 10000; updateMenuGold(); writeSave();
    return '💰 +10.000 moedas';
  },
  'allart': () => {
    const ids = Object.keys(ARTIFACT_DEFS);
    ids.forEach(id => { if(!ownedArtifacts.includes(id)) ownedArtifacts.push(id); });
    writeSave();
    if(typeof renderArtifactCollectionGrid === 'function') renderArtifactCollectionGrid();
    return `🏺 ${ids.length} artefatos desbloqueados!`;
  },
  'maxart': () => {
    const ids = Object.keys(ARTIFACT_DEFS);
    ids.forEach(id => {
      if(!ownedArtifacts.includes(id)) ownedArtifacts.push(id);
      if(ARTIFACT_UPGRADE_TABLES[id] !== undefined) {
        const needed = 1 + 5 + 10 + 20 + 30;
        const current = ownedArtifacts.filter(x => x === id).length;
        for(let i = 0; i < needed - current; i++) ownedArtifacts.push(id);
      }
    });
    writeSave();
    if(typeof renderArtifactCollectionGrid === 'function') renderArtifactCollectionGrid();
    return `🏺 ${ids.length} artefatos no nível máximo!`;
  },
  'allcard': () => {
    const ids = ['sword','meat','bow','axe','speed_potion','blast','bombinhas',
      'katana','necro_staff','pistol','black_magic','dice','scythe','soccerball',
      'sniper_noscope','glitch_fury'];
    ids.forEach(id => { if(!ownedCards.includes(id)) ownedCards.push(id); });
    writeSave();
    if(typeof renderShopScreen === 'function') renderShopScreen();
    return `🃏 ${ids.length} cartas desbloqueadas!`;
  },
  'debugger': () => {
    const v = typeof setDebuggerActive === 'function';
    if(!v) return '⚠ Reinicie o jogo para aplicar';
    const nowActive = !(typeof debuggerActive !== 'undefined' && debuggerActive);
    setDebuggerActive(nowActive);
    return nowActive ? '🛠 Modo debug ATIVADO' : '🛠 Modo debug DESATIVADO';
  },
};

function submitOptionsCode() {
  const input = document.getElementById('options-code-input');
  const feedback = document.getElementById('options-code-feedback');
  if(!input || !feedback) return;
  const code = input.value.trim().toLowerCase();
  input.value = '';
  if(OPTION_CODES[code]) {
    const msg = OPTION_CODES[code]();
    feedback.textContent = msg;
    feedback.className = 'options-code-feedback success';
  } else {
    feedback.textContent = '✗ Código inválido';
    feedback.className = 'options-code-feedback error';
  }
  clearTimeout(feedback._timer);
  feedback._timer = setTimeout(() => {
    feedback.textContent = '';
    feedback.className = 'options-code-feedback';
  }, 2500);
}

function onOptionsCodeKeydown(e) {
  if(e.key === 'Enter') { e.preventDefault(); submitOptionsCode(); }
}

// currentEquippedDeck declared in state.js
updateMenuGold();

// ═══════════════════════════════════════════════════════════════
// SISTEMA DE ARTEFATOS
// ═══════════════════════════════════════════════════════════════

const ARTIFACT_DEFS = {
  leather_boots: {
    id: 'leather_boots',
    name: 'Bota de Couro',
    icon: '🥾',
    rarity: 'comum',
    desc: '+10% de velocidade de movimento.',
    effect: 'speed_10',
  },
  coxinha: {
    id: 'coxinha',
    name: 'Coxinha',
    icon: '🍗',
    rarity: 'raro',
    desc: 'Cura 1 de vida por dungeon completada.',
    effect: 'heal_per_dungeon',
  },
  blood_skull: {
    id: 'blood_skull',
    name: 'Caveira de Sangue',
    icon: '💀',
    rarity: 'epico',
    desc: 'A cada 30 kills, recupera 1 de vida.',
    effect: 'heal_per_30kills',
  },
  leather_armor: {
    id: 'leather_armor',
    name: 'Armadura de Couro',
    icon: '🛡️',
    rarity: 'comum',
    desc: 'Concede 1 coração de armadura por partida. Absorve o primeiro dano recebido.',
    effect: 'leather_armor',
  },
  tech_glove: {
    id: 'tech_glove',
    name: 'Luva de Técnico',
    icon: '🧤',
    rarity: 'raro',
    desc: 'Aumenta a duração de armas com duração em 1 segundo.',
    effect: 'duration_plus_1',
  },
  aureola: {
    id: 'aureola',
    name: 'Areóla',
    icon: '😇',
    rarity: 'epico',
    desc: 'Concede mais 1 revive por partida.',
    effect: 'extra_revive',
  },
  protorobo_9500: {
    id: 'protorobo_9500',
    name: 'Protorobô-9500',
    icon: '🤖',
    rarity: 'lendario',
    desc: 'Invoca um robô imortal que te segue e atira na pistola nos inimigos. A cada 10s dorme por 5s.',
    effect: 'companion_robot',
  },
  magnet: {
    id: 'magnet',
    name: 'Imã',
    icon: '🧲',
    rarity: 'comum',
    desc: 'Cria uma pequena área de atração de moedas ao redor do player.',
    effect: 'coin_magnet',
  },
};

// ═══════════════════════════════════════════════════════════════
// SISTEMA DE NÍVEIS DE ARTEFATOS
// ═══════════════════════════════════════════════════════════════
// Duplicatas necessárias POR NÍVEL (incremental, não acumulado):
// nv1→2: 5 dupes | nv2→3: 10 dupes | nv3→4: 20 dupes | nv4→5: 30 dupes
const ARTIFACT_LEVEL_THRESHOLDS = [5, 10, 20, 30]; // custo incremental de cada upgrade

// Retorna o nível (1-5) com base nas duplicatas consumidas (salvas separado)
function getArtifactLevel(id) {
  const total = ownedArtifacts.filter(x => x === id).length;
  // 1 cópia = nível 1; extras são duplicatas disponíveis
  const dupes = Math.max(0, total - 1);
  // Calcula nível consumindo duplicatas incrementalmente
  let level = 1;
  let remaining = dupes;
  for(let i = 0; i < ARTIFACT_LEVEL_THRESHOLDS.length; i++) {
    if(remaining >= ARTIFACT_LEVEL_THRESHOLDS[i]) {
      remaining -= ARTIFACT_LEVEL_THRESHOLDS[i];
      level++;
    } else {
      break;
    }
  }
  return Math.min(5, level);
}

// Duplicatas gastas até o nível atual (para calcular as disponíveis restantes)
function getDupesSpentForLevel(level) {
  let spent = 0;
  for(let i = 0; i < Math.min(level - 1, ARTIFACT_LEVEL_THRESHOLDS.length); i++) {
    spent += ARTIFACT_LEVEL_THRESHOLDS[i];
  }
  return spent;
}

// Duplicatas necessárias para próximo nível
function getDupesForNextLevel(id) {
  const total = ownedArtifacts.filter(x => x === id).length;
  const dupes = Math.max(0, total - 1);
  const level = getArtifactLevel(id);
  if(level >= 5) return null;
  // Quanto já foi consumido até o nível atual
  const spent = getDupesSpentForLevel(level);
  const remaining = dupes - spent;
  return ARTIFACT_LEVEL_THRESHOLDS[level - 1] - remaining;
}

// Tabelas de upgrades por artefato por nível (índice 0 = nível 1)
const ARTIFACT_UPGRADE_TABLES = {
  leather_boots:   [0.10, 0.12, 0.14, 0.16, 0.20],  // bônus de velocidade
  tech_glove:      [1000, 1500, 2000, 2500, 3000],    // ms de bônus de duração
  coxinha:         [1, 1, 2, 2, 3],                   // vida curada por dungeon
  blood_skull:     [30, 25, 20, 15, 10],              // kills para curar
  aureola:         [1, 1, 1, 1, 2],                   // revives extras
  protorobo_9500:  [5000, 4000, 3000, 2000, 1000],    // ms de sono do robô
  magnet:          [50, 70, 90, 100, 120],             // raio do imã (px)
  leather_armor:   [1, 2, 2, 2, 3],                   // corações de armadura
};

function getArtifactUpgradeValue(id) {
  const table = ARTIFACT_UPGRADE_TABLES[id];
  if(!table) return null;
  const level = getArtifactLevel(id);
  return table[level - 1];
}

// Labels de descrição por nível para exibir no card
const ARTIFACT_UPGRADE_LABELS = {
  leather_boots:  lv => `+${Math.round(ARTIFACT_UPGRADE_TABLES.leather_boots[lv-1]*100)}% velocidade`,
  tech_glove:     lv => `+${ARTIFACT_UPGRADE_TABLES.tech_glove[lv-1]/1000}s duração`,
  coxinha:        lv => `Cura ${ARTIFACT_UPGRADE_TABLES.coxinha[lv-1]}❤ por dungeon`,
  blood_skull:    lv => `Cura a cada ${ARTIFACT_UPGRADE_TABLES.blood_skull[lv-1]} kills`,
  aureola:        lv => `+${ARTIFACT_UPGRADE_TABLES.aureola[lv-1]} revive(s)`,
  protorobo_9500: lv => `Robô dorme ${ARTIFACT_UPGRADE_TABLES.protorobo_9500[lv-1]/1000}s`,
  magnet:         lv => `Raio ${ARTIFACT_UPGRADE_TABLES.magnet[lv-1]}px`,
  leather_armor:  lv => `${ARTIFACT_UPGRADE_TABLES.leather_armor[lv-1]} coração(s) de armadura`,
};

// Pesos para rolar raridade de baús
const ARTIFACT_RARITY_WEIGHTS = {
  comum:    60,
  raro:     25,
  epico:    10,
  lendario: 4,
};

const ARTIFACT_RARITY_COLORS = {
  comum:    '#888899',
  raro:     '#4488ff',
  epico:    '#bb66ff',
  lendario: '#ff8800',
};

const ARTIFACT_RARITY_LABELS = {
  comum:    'COMUM',
  raro:     'RARO',
  epico:    'ÉPICO',
  lendario: 'LENDÁRIO',
};

const ARTIFACT_MAX_SLOTS = 5;
const CHEST_COST = 200;

// Estado persistente dos artefatos
let ownedArtifacts = [];      // array de ids (com repetição se múltiplos)
let equippedArtifacts = [];   // array de ids, máximo ARTIFACT_MAX_SLOTS (null = vazio)

// Garante que equippedArtifacts sempre tem ARTIFACT_MAX_SLOTS entradas
function normalizeArtifactSlots() {
  while (equippedArtifacts.length < ARTIFACT_MAX_SLOTS) equippedArtifacts.push(null);
  equippedArtifacts = equippedArtifacts.slice(0, ARTIFACT_MAX_SLOTS);
}
normalizeArtifactSlots();

// Integra com loadSave — carrega artefatos do save
(function patchLoadArtifacts(){
  const save = loadSave();
  if(save){
    ownedArtifacts = save.ownedArtifacts || [];
    equippedArtifacts = save.equippedArtifacts || [];
    normalizeArtifactSlots();
  }
})();

// ── Rolagem de raridade ──────────────────────────────────────────
function rollArtifactRarity() {
  const pool = [];
  Object.entries(ARTIFACT_RARITY_WEIGHTS).forEach(([rar, w]) => {
    for(let i = 0; i < w; i++) pool.push(rar);
  });
  return pool[Math.floor(Math.random() * pool.length)];
}

// Retorna um artifact id aleatório com base na raridade dada
// (Filtra artefatos da raridade pedida e exclui os que já estão no nível máximo)
function rollArtifactOfRarity(rarity) {
  const isMaxLevel = id => {
    const hasUpgrades = ARTIFACT_UPGRADE_TABLES[id] !== undefined;
    return hasUpgrades && getArtifactLevel(id) >= 5;
  };

  const candidates = Object.values(ARTIFACT_DEFS).filter(a =>
    a.rarity === rarity && !isMaxLevel(a.id)
  );

  if(candidates.length === 0) {
    // Fallback: qualquer artefato que não seja nível máximo
    const all = Object.values(ARTIFACT_DEFS).filter(a => !isMaxLevel(a.id));
    if(all.length === 0) {
      // Todos os artefatos no máximo — retorna o primeiro (não vai adicionar dupes)
      return Object.values(ARTIFACT_DEFS)[0].id;
    }
    return all[Math.floor(Math.random() * all.length)].id;
  }
  return candidates[Math.floor(Math.random() * candidates.length)].id;
}

// ── Abertura de baú com animação ─────────────────────────────────
let _chestPendingResult = null;
let _chestClickCount = 0;
const CHEST_CLICKS_NEEDED = 5;

function buyChest() {
  if(persistentGold < CHEST_COST) {
    if(typeof Audio !== 'undefined' && Audio.menuError) Audio.menuError();
    showChestResultMsg('❌ Moedas insuficientes!', '#ff4444');
    return;
  }
  persistentGold -= CHEST_COST;
  _menuClick();
  const rarity = rollArtifactRarity();
  const artifactId = rollArtifactOfRarity(rarity);

  const isDuplicate = ownedArtifacts.includes(artifactId);
  const hasUpgrades = ARTIFACT_UPGRADE_TABLES[artifactId] !== undefined;
  const alreadyMaxLevel = hasUpgrades && getArtifactLevel(artifactId) >= 5;
  let dupeCount = 0;
  if(isDuplicate && !alreadyMaxLevel) {
    dupeCount = Math.floor(Math.random() * 16) + 5;
    for(let i = 0; i < dupeCount; i++) ownedArtifacts.push(artifactId);
  } else if(!isDuplicate) {
    ownedArtifacts.push(artifactId);
  }

  writeSave();
  updateArtifactShopGold();
  renderArtifactCollectionGrid();

  _chestPendingResult = { artifactId, rarity, isDuplicate, dupeCount };
  _chestClickCount = 0;
  openChestOverlay();
}

function openChestOverlay() {
  const overlay = document.getElementById('chest-open-overlay');
  const clickZone = document.getElementById('chest-click-zone');
  const reveal = document.getElementById('chest-reveal');
  const emoji = document.getElementById('chest-emoji');
  const label = document.getElementById('chest-click-label');
  const clicksLeft = document.getElementById('chest-clicks-left');

  overlay.style.display = 'flex';
  clickZone.style.display = 'flex';
  reveal.style.display = 'none';
  emoji.textContent = '📦';
  emoji.style.filter = 'drop-shadow(0 0 24px #aa44ff88)';
  emoji.style.transform = 'scale(1)';
  label.textContent = 'CLIQUE PARA ABRIR';
  clicksLeft.textContent = '';

  // Fade in
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.25s';
  overlay.style.cursor = 'pointer';
  requestAnimationFrame(() => { overlay.style.opacity = '1'; });

  // Clique em qualquer lugar do overlay conta como click no bau
  overlay._chestHandler = function(e) {
    // Nao contar cliques no botao de fechar apos a revelacao
    if(e.target.closest && e.target.closest('button')) return;
    chestClick();
  };
  overlay.addEventListener('click', overlay._chestHandler);
}

function chestClick() {
  if(!_chestPendingResult) return;
  _chestClickCount++;

  const emoji = document.getElementById('chest-emoji');
  const clicksLeft = document.getElementById('chest-clicks-left');
  const remaining = CHEST_CLICKS_NEEDED - _chestClickCount;

  // Animação de tremida
  emoji.style.transition = 'none';
  const shakeAmt = 8 + _chestClickCount * 3;
  const angle = (Math.random() - 0.5) * (10 + _chestClickCount * 4);
  emoji.style.transform = `translateX(${(Math.random()-0.5)*shakeAmt*2}px) rotate(${angle}deg) scale(${1 + _chestClickCount*0.03})`;
  emoji.style.filter = `drop-shadow(0 0 ${20 + _chestClickCount*10}px #cc66ff) brightness(${1 + _chestClickCount*0.12})`;

  setTimeout(() => {
    if(emoji) {
      emoji.style.transition = 'transform 0.15s ease-out, filter 0.15s';
      emoji.style.transform = 'scale(1)';
    }
  }, 120);

  if(remaining > 0) {
    clicksLeft.textContent = `${remaining} clique${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`;
  }

  if(_chestClickCount >= CHEST_CLICKS_NEEDED) {
    doOpenChestReveal();
  }
}

function doOpenChestReveal() {
  const clickZone = document.getElementById('chest-click-zone');
  const reveal = document.getElementById('chest-reveal');
  const emoji = document.getElementById('chest-emoji');

  // Flash de luz
  emoji.style.transition = 'transform 0.3s ease-out, filter 0.3s, font-size 0.3s';
  emoji.style.transform = 'scale(2.2)';
  emoji.style.filter = 'brightness(5) drop-shadow(0 0 60px #ffffff) drop-shadow(0 0 40px #cc99ff)';
  emoji.style.fontSize = '96px';

  setTimeout(() => {
    clickZone.style.display = 'none';
    reveal.style.display = 'flex';
    reveal.style.opacity = '0';
    reveal.style.transition = 'opacity 0.3s';
    requestAnimationFrame(() => { reveal.style.opacity = '1'; });
    document.getElementById('chest-open-overlay').style.cursor = 'default';

    const { artifactId, rarity, isDuplicate, dupeCount } = _chestPendingResult;
    const def = ARTIFACT_DEFS[artifactId];
    const color = ARTIFACT_RARITY_COLORS[rarity];
    const label = ARTIFACT_RARITY_LABELS[rarity];

    // Glow de raridade
    const glowMap = {
      comum:    '0 0 20px #888899aa',
      raro:     '0 0 30px #4488ffcc, 0 0 60px #4488ff55',
      epico:    '0 0 40px #bb66ffcc, 0 0 80px #bb66ff55',
      lendario: '0 0 50px #ff8800cc, 0 0 100px #ff880055, 0 0 20px #ffcc00',
    };

    const iconEl = document.getElementById('chest-reveal-icon');
    iconEl.textContent = def.icon;
    iconEl.style.filter = 'none';
    iconEl.style.textShadow = glowMap[rarity] || '';
    iconEl.style.animation = 'chestRevealPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both';

    document.getElementById('chest-reveal-name').textContent = def.name;
    const rarityEl = document.getElementById('chest-reveal-rarity');
    rarityEl.textContent = label;
    rarityEl.style.color = color;
    rarityEl.style.textShadow = `0 0 12px ${color}`;

    const newBadge = document.getElementById('chest-reveal-new-badge');
    const dupeBlock = document.getElementById('chest-reveal-dupe-block');

    if(!isDuplicate) {
      // Nova carta! Mostrar badge
      newBadge.style.display = 'block';
      newBadge.style.animation = 'chestRevealPop 0.5s 0.2s cubic-bezier(0.34,1.56,0.64,1) both';
      dupeBlock.style.display = 'none';
    } else {
      // Duplicata — mostrar barra de progresso
      newBadge.style.display = 'none';
      dupeBlock.style.display = 'flex';

      const total = ownedArtifacts.filter(x => x === artifactId).length;
      const dupes = Math.max(0, total - 1);
      const level = getArtifactLevel(artifactId);
      // Duplicatas já gastas até o nível atual
      const spent = getDupesSpentForLevel(level);
      // Duplicatas restantes dentro do nível atual (progresso para o próximo)
      const dupesInLevel = dupes - spent;
      const nextThresh = level < 5 ? ARTIFACT_LEVEL_THRESHOLDS[level - 1] : null;
      const pct = level >= 5 ? 100 : Math.min(100, Math.round(dupesInLevel / nextThresh * 100));

      // pct antes de ganhar os dupes (para animar a diferença)
      const dupesBeforeGain = Math.max(0, dupes - dupeCount);
      const levelBefore = (() => {
        let lv = 1, rem = Math.max(0, dupesBeforeGain);
        for(let i = 0; i < ARTIFACT_LEVEL_THRESHOLDS.length; i++) {
          if(rem >= ARTIFACT_LEVEL_THRESHOLDS[i]) { rem -= ARTIFACT_LEVEL_THRESHOLDS[i]; lv++; } else break;
        }
        return Math.min(5, lv);
      })();
      const spentBefore = getDupesSpentForLevel(levelBefore);
      const dupesInLevelBefore = Math.max(0, dupesBeforeGain - spentBefore);
      const threshBefore = levelBefore < 5 ? ARTIFACT_LEVEL_THRESHOLDS[levelBefore - 1] : null;
      const pctBefore = levelBefore >= 5 ? 100 : Math.min(100, Math.round(dupesInLevelBefore / threshBefore * 100));

      const dupeLabel = document.getElementById('chest-reveal-dupe-label');
      const barFill = document.getElementById('chest-reveal-bar-fill');
      const barLabel = document.getElementById('chest-reveal-bar-label');

      const didLevelUp = level > levelBefore;

      dupeLabel.textContent = `DUPLICATA ×${dupeCount} — NÍVEL ${level}${level>=5?' (MÁX)':''}`;
      barFill.style.background = level >= 5 ? '#ffcc44' : color;
      barFill.style.boxShadow = `0 0 8px ${color}`;
      barLabel.textContent = level < 5 ? `${dupesInLevel} / ${nextThresh} para nível ${level+1}` : '✦ NÍVEL MÁXIMO ✦';

      if(didLevelUp) {
        // 1) Mostra barra no estado ANTES do level up
        barFill.style.transition = 'none';
        barFill.style.width = pctBefore + '%';
        barFill.style.background = color;
        // Label do nivel anterior
        dupeLabel.textContent = `DUPLICATA ×${dupeCount} — NÍVEL ${levelBefore}`;
        const threshBeforeNext = ARTIFACT_LEVEL_THRESHOLDS[levelBefore - 1];
        barLabel.textContent = `${dupesInLevelBefore} / ${threshBeforeNext} para nível ${levelBefore+1}`;

        // 2) Barra enche até 100% rapidamente
        setTimeout(() => {
          barFill.style.transition = 'width 0.7s cubic-bezier(0.25,0.46,0.45,0.94)';
          barFill.style.width = '100%';
        }, 350);

        // 3) Barra pisca + dispara animacao de level up
        setTimeout(() => {
          barFill.style.animation = 'levelUpBarFlash 0.25s ease-in-out 3';
          playLevelUpAnimation(level, color);
        }, 1150);

        // 4) Após animação, atualiza barra para o novo nivel
        setTimeout(() => {
          barFill.style.animation = '';
          barFill.style.transition = 'none';
          barFill.style.width = pct + '%';
          barFill.style.background = level >= 5 ? '#ffcc44' : color;
          dupeLabel.textContent = `DUPLICATA ×${dupeCount} — NÍVEL ${level}${level>=5?' (MÁX)':''}`;
          barLabel.textContent = level < 5 ? `${dupesInLevel} / ${nextThresh} para nível ${level+1}` : '✦ NÍVEL MÁXIMO ✦';
        }, 2800);

      } else {
        // Sem level up: animacao normal da barra
        barFill.style.transition = 'none';
        barFill.style.width = pctBefore + '%';
        setTimeout(() => {
          barFill.style.transition = 'width 1.1s cubic-bezier(0.25,0.46,0.45,0.94)';
          barFill.style.width = pct + '%';
        }, 350);
      }
    }
  }, 350);
}

function playLevelUpAnimation(newLevel, color) {
  const overlay = document.getElementById('levelup-overlay');
  const banner = document.getElementById('levelup-banner');
  const starsEl = document.getElementById('levelup-stars-text');
  const subEl = document.getElementById('levelup-sub');

  const stars = '★'.repeat(newLevel) + '☆'.repeat(5 - newLevel);
  const isMax = newLevel >= 5;

  banner.textContent = isMax ? '✦ NÍVEL MÁXIMO! ✦' : `✦ NÍVEL ${newLevel}! ✦`;
  banner.style.color = isMax ? '#ffcc44' : (color || '#ffcc44');
  banner.style.textShadow = `0 0 20px ${isMax ? '#ffcc44' : color}, 0 0 40px ${isMax ? '#ff8800' : color}`;
  starsEl.textContent = stars;
  starsEl.style.color = isMax ? '#ffcc44' : (color || '#ffcc44');
  subEl.textContent = isMax ? 'ARTEFATO NO PODER MÁXIMO!' : `Bonús de nível ${newLevel} desbloqueado!`;

  // Reset animations
  banner.style.animation = 'none';
  starsEl.style.animation = 'none';
  subEl.style.animation = 'none';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      banner.style.animation = 'levelUpBanner 0.6s cubic-bezier(0.34,1.56,0.64,1) both, levelUpGlow 1s 0.6s ease-in-out infinite alternate';
      starsEl.style.animation = 'levelUpBanner 0.6s 0.12s cubic-bezier(0.34,1.56,0.64,1) both';
      subEl.style.animation = 'levelUpBanner 0.5s 0.28s ease both';
    });
  });

  // Spawna particulas em volta
  overlay.querySelectorAll('.levelup-particle').forEach(p => p.remove());
  const emojis = ['✨', '💫', '⭐', '🔥', '💥', '🌟'];
  for(let i = 0; i < 14; i++) {
    const p = document.createElement('div');
    p.className = 'levelup-particle';
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const angle = (i / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const dist = 90 + Math.random() * 80;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    p.style.setProperty('--tx', tx + 'px');
    p.style.setProperty('--ty', ty + 'px');
    p.style.animationDelay = (Math.random() * 0.2) + 's';
    p.style.animationDuration = (0.8 + Math.random() * 0.5) + 's';
    p.style.left = '50%';
    p.style.top = '50%';
    p.style.marginLeft = '-11px';
    p.style.marginTop = '-11px';
    overlay.appendChild(p);
  }

  // Shake no chest-reveal
  const reveal = document.getElementById('chest-reveal');
  if(reveal) {
    reveal.style.animation = 'levelUpShake 0.5s ease';
    setTimeout(() => { reveal.style.animation = ''; }, 500);
  }

  overlay.style.display = 'flex';

  // Esconde apos 1.6s
  setTimeout(() => {
    overlay.style.transition = 'opacity 0.4s';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
      overlay.style.opacity = '1';
      overlay.style.transition = '';
      overlay.querySelectorAll('.levelup-particle').forEach(p => p.remove());
    }, 400);
  }, 1600);
}

function closeChestOverlay() {
  _menuClick();
  const overlay = document.getElementById('chest-open-overlay');
  if(overlay._chestHandler) {
    overlay.removeEventListener('click', overlay._chestHandler);
    overlay._chestHandler = null;
  }
  overlay.style.transition = 'opacity 0.2s';
  overlay.style.opacity = '0';
  setTimeout(() => { overlay.style.display = 'none'; }, 220);
  _chestPendingResult = null;
  _chestClickCount = 0;
}

function showChestResultMsg(html, color) {
  const el = document.getElementById('chest-result-msg');
  if(!el) return;
  el.innerHTML = html;
  el.style.color = color || '#aaddaa';
  el.style.opacity = '1';
  clearTimeout(el._fadeTimer);
  el._fadeTimer = setTimeout(() => { el.style.opacity = '0.5'; }, 3000);
}

function updateArtifactShopGold() {
  const el = document.getElementById('artifact-shop-gold');
  if(el) el.textContent = '🪙 ' + persistentGold;
}

// ── Render tela de artefatos ─────────────────────────────────────
function openArtifactScreen() {
  _menuClick();
  document.getElementById('main-menu').style.display = 'none';
  updateArtifactShopGold();
  renderArtifactCollectionGrid();
  document.getElementById('artifact-screen').style.display = 'flex';
  if(typeof Audio !== 'undefined') {
    if(Audio.stopLobbyMusic) Audio.stopLobbyMusic();
    if(Audio.playShopMusic) Audio.playShopMusic();
  }
}

function closeArtifactScreen() {
  _menuClick();
  document.getElementById('artifact-screen').style.display = 'none';
  document.getElementById('main-menu').style.display = 'flex';
  if(typeof Audio !== 'undefined') {
    if(Audio.stopShopMusic) Audio.stopShopMusic();
    if(Audio.playLobbyMusic) Audio.playLobbyMusic();
  }
  updateMenuGold();
  writeSave();
}

// ── Modal de artefato ────────────────────────────────────────────
function openArtifactModal(id, context) {
  const def = ARTIFACT_DEFS[id];
  if(!def) return;

  document.getElementById('art-modal-icon').textContent = def.icon;
  document.getElementById('art-modal-name').textContent = def.name;
  document.getElementById('art-modal-rarity').innerHTML =
    `<span style="color:${ARTIFACT_RARITY_COLORS[def.rarity]}">${ARTIFACT_RARITY_LABELS[def.rarity]}</span>`;
  document.getElementById('art-modal-desc').textContent = def.desc;

  const upgradeBlock = document.getElementById('art-modal-upgrade-block');
  const hasUpgrades = ARTIFACT_UPGRADE_TABLES[id] !== undefined;
  const isOwned = ownedArtifacts.includes(id);

  if(hasUpgrades && isOwned) {
    upgradeBlock.style.display = 'block';
    const level = getArtifactLevel(id);
    const owned = ownedArtifacts.filter(x => x === id).length;
    const dupes = Math.max(0, owned - 1);
    const stars = '★'.repeat(level) + '☆'.repeat(5 - level);
    const upgradeLabel = ARTIFACT_UPGRADE_LABELS[id] ? ARTIFACT_UPGRADE_LABELS[id](level) : '';

    document.getElementById('art-modal-stars').textContent = stars;
    document.getElementById('art-modal-upgrade-label').textContent =
      `Nível ${level} / 5  ·  ${upgradeLabel}`;

    // Barra de progresso para próximo nível
    const progressEl = document.getElementById('art-modal-progress');
    if(level < 5) {
      const spent = getDupesSpentForLevel(level);
      const dupesInLevel = dupes - spent;
      const nextThresh = ARTIFACT_LEVEL_THRESHOLDS[level - 1];
      const pct = Math.min(100, Math.round(dupesInLevel / nextThresh * 100));
      progressEl.innerHTML = `
        <div style="font-size:8px;color:#667;margin-bottom:3px">Próximo nível: ${dupesInLevel}/${nextThresh} duplicatas (${pct}%)</div>
        <div class="art-progress-bar"><div class="art-progress-fill" style="width:${pct}%"></div></div>`;
    } else {
      progressEl.innerHTML = `<div style="font-size:9px;color:#ffcc44;margin:4px 0">✦ NÍVEL MÁXIMO ✦</div>`;
    }

    // Tabela de todos os níveis
    const table = ARTIFACT_UPGRADE_TABLES[id];
    const labelFn = ARTIFACT_UPGRADE_LABELS[id];
    let tableHtml = '<table class="art-level-table">';
    tableHtml += `<tr><td style="color:#445566;font-size:8px">NÍV</td><td style="color:#445566;font-size:8px">EFEITO</td><td style="color:#445566;font-size:8px">TOTAL</td></tr>`;
    for(let lv = 1; lv <= 5; lv++) {
      const isCur = lv === level;
      const isLocked = lv > level;
      const cls = isCur ? 'lv-cur' : (isLocked ? 'lv-locked' : '');
      const dupNeeded = lv >= 2 ? ARTIFACT_LEVEL_THRESHOLDS[lv-2] : 0;
      const effectStr = labelFn ? labelFn(lv) : String(table[lv-1]);
      tableHtml += `<tr class="${cls}">
        <td>${isCur ? '▶' : ''} Nv${lv}</td>
        <td>${effectStr}</td>
        <td>${dupNeeded === 0 ? '—' : dupNeeded + ' dupl.'}</td>
      </tr>`;
    }
    tableHtml += '</table>';
    document.getElementById('art-modal-level-table').innerHTML = tableHtml;

  } else if(hasUpgrades && !isOwned) {
    upgradeBlock.style.display = 'block';
    document.getElementById('art-modal-stars').textContent = '☆☆☆☆☆';
    document.getElementById('art-modal-upgrade-label').textContent = 'Não obtido ainda';
    document.getElementById('art-modal-progress').innerHTML = '';
    // Tabela de níveis mesmo sem ter
    const table = ARTIFACT_UPGRADE_TABLES[id];
    const labelFn = ARTIFACT_UPGRADE_LABELS[id];
    let tableHtml = '<table class="art-level-table">';
    tableHtml += `<tr><td style="color:#445566;font-size:8px">NÍV</td><td style="color:#445566;font-size:8px">EFEITO</td><td style="color:#445566;font-size:8px">TOTAL</td></tr>`;
    for(let lv = 1; lv <= 5; lv++) {
      const dupNeeded = lv >= 2 ? ARTIFACT_LEVEL_THRESHOLDS[lv-2] : 0;
      const effectStr = labelFn ? labelFn(lv) : String(table[lv-1]);
      tableHtml += `<tr class="lv-locked"><td>Nv${lv}</td><td>${effectStr}</td><td>${dupNeeded === 0 ? '—' : dupNeeded + ' dupl.'}</td></tr>`;
    }
    tableHtml += '</table>';
    document.getElementById('art-modal-level-table').innerHTML = tableHtml;
  } else {
    upgradeBlock.style.display = 'none';
  }

  // Botões de ação
  const actions = document.getElementById('art-modal-actions');
  actions.innerHTML = '';

  // Botão equipar (se veio da coleção e ainda tem slot livre e não está equipado)
  if((context === 'collection' || context === 'album') && isOwned) {
    const alreadyEquipped = equippedArtifacts.includes(id);
    if(alreadyEquipped) {
      // Mostrar que está equipado, com opção de desequipar
      const slotIdx = equippedArtifacts.indexOf(id);
      const btn = document.createElement('button');
      btn.className = 'modal-btn btn-unequip';
      btn.textContent = '✕ DESEQUIPAR';
      btn.onclick = () => { _deckUnequipArtifact(slotIdx); closeArtifactModal(); };
      actions.appendChild(btn);
    } else {
      const freeSlot = equippedArtifacts.indexOf(null);
      const btn = document.createElement('button');
      btn.className = 'modal-btn btn-equip';
      if(freeSlot !== -1) {
        btn.textContent = '+ EQUIPAR';
        btn.onclick = () => {
          _menuClick();
          equippedArtifacts[freeSlot] = id;
          writeSave(); _renderDeckArtifactSlots(); _renderDeckArtifactCollection();
          closeArtifactModal();
        };
      } else {
        btn.textContent = '+ EQUIPAR';
        btn.title = 'Escolha um slot para substituir';
        // Abre um submenu inline para escolher qual slot substituir
        btn.onclick = () => {
          actions.innerHTML = '<div style="font-size:10px;color:#aaa;margin-bottom:6px;letter-spacing:1px">SUBSTITUIR SLOT:</div>';
          equippedArtifacts.forEach((slotId, i) => {
            const slotDef = slotId ? ARTIFACT_DEFS[slotId] : null;
            const slotBtn = document.createElement('button');
            slotBtn.className = 'modal-btn btn-unequip';
            slotBtn.style.fontSize = '10px';
            slotBtn.style.padding = '5px 10px';
            slotBtn.textContent = slotDef ? `${slotDef.icon} ${slotDef.name}` : `Slot ${i+1} (vazio)`;
            slotBtn.onclick = () => {
              _menuClick();
              equippedArtifacts[i] = id;
              writeSave(); _renderDeckArtifactSlots(); _renderDeckArtifactCollection();
              closeArtifactModal();
            };
            actions.appendChild(slotBtn);
          });
          const cancelBtn = document.createElement('button');
          cancelBtn.className = 'modal-btn btn-close';
          cancelBtn.textContent = '← CANCELAR';
          cancelBtn.onclick = closeArtifactModal;
          actions.appendChild(cancelBtn);
        };
      }
      actions.appendChild(btn);
    }
  }

  // Botão desequipar (se estiver equipado e chamado de um slot)
  if(context === 'slot') {
    const slotIdx = equippedArtifacts.indexOf(id);
    if(slotIdx !== -1) {
      const btn = document.createElement('button');
      btn.className = 'modal-btn btn-unequip';
      btn.textContent = '✕ DESEQUIPAR';
      btn.onclick = () => { _deckUnequipArtifact(slotIdx); closeArtifactModal(); };
      actions.appendChild(btn);
    }
  }

  const btnClose = document.createElement('button');
  btnClose.className = 'modal-btn btn-close';
  btnClose.textContent = '← FECHAR';
  btnClose.onclick = closeArtifactModal;
  actions.appendChild(btnClose);

  document.getElementById('artifact-modal-overlay').classList.add('open');
}

function closeArtifactModal() {
  document.getElementById('artifact-modal-overlay').classList.remove('open');
}

function renderArtifactCollectionGrid() {
  const grid = document.getElementById('artifact-collection-grid');
  if(!grid) return;

  // ── Estatísticas por raridade ──
  const counts = {};
  ownedArtifacts.forEach(id => { counts[id] = (counts[id]||0)+1; });
  const statsEl = document.getElementById('as-collection-stats');
  if(statsEl) {
    const rarities = ['comum','raro','epico','lendario'];
    const rarLabels = { comum:'COMUM', raro:'RARO', epico:'ÉPICO', lendario:'LENDÁRIO' };
    statsEl.innerHTML = rarities.map(r => {
      const total = Object.values(ARTIFACT_DEFS).filter(d => d.rarity === r).length;
      const owned  = Object.keys(counts).filter(id => ARTIFACT_DEFS[id] && ARTIFACT_DEFS[id].rarity === r).length;
      return `<div class="as-stat-row rarity-${r}">
        <span class="as-stat-label">${rarLabels[r]}</span>
        <span class="as-stat-value">${owned} / ${total}</span>
      </div>`;
    }).join('');
  }

  // ── Contador do álbum ──
  const countEl = document.getElementById('as-album-count');
  const totalDefs = Object.keys(ARTIFACT_DEFS).length;
  const totalOwned = Object.keys(counts).length;
  if(countEl) countEl.textContent = `${totalOwned} / ${totalDefs} obtidos`;

  // ── Filtro ativo ──
  let activeRarity = 'all';
  const filterBtns = document.querySelectorAll('.as-filter-btn');
  filterBtns.forEach(btn => {
    btn.onclick = () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeRarity = btn.dataset.rarity;
      _renderAlbumCards(grid, counts, activeRarity);
      if(typeof Audio !== 'undefined' && Audio.menuClick) Audio.menuClick();
    };
  });

  _renderAlbumCards(grid, counts, activeRarity);
}

function _renderAlbumCards(grid, counts, filterRarity) {
  grid.innerHTML = '';

  Object.entries(ARTIFACT_DEFS).forEach(([id, def]) => {
    if(filterRarity !== 'all' && def.rarity !== filterRarity) return;

    const owned = counts[id] || 0;
    const isOwned = owned > 0;
    const isEquipped = equippedArtifacts.includes(id);
    const hasUpgrades = ARTIFACT_UPGRADE_TABLES[id] !== undefined;
    const level = isOwned && hasUpgrades ? getArtifactLevel(id) : null;
    const dupes = Math.max(0, owned - 1);

    const div = document.createElement('div');
    div.className = `artifact-card rarity-${def.rarity}${!isOwned ? ' not-owned' : ''}${isEquipped ? ' is-equipped' : ''}`;

    if(!isOwned) {
      div.innerHTML = `
        <div class="art-icon">❓</div>
        <div class="art-name">${def.name}</div>
        <div class="art-rarity" style="color:${ARTIFACT_RARITY_COLORS[def.rarity]}">${ARTIFACT_RARITY_LABELS[def.rarity]}</div>`;
    } else {
      let starsHtml = '';
      let barHtml = '';
      if(hasUpgrades && level !== null) {
        const stars = '★'.repeat(level) + '☆'.repeat(5 - level);
        const upgradeLabel = ARTIFACT_UPGRADE_LABELS[id] ? ARTIFACT_UPGRADE_LABELS[id](level) : '';
        starsHtml = `<div class="art-stars">${stars}</div>
          <div class="art-effect">${upgradeLabel}</div>`;
        if(level < 5) {
          const spent = getDupesSpentForLevel(level);
          const dupesInLevel = Math.max(0, dupes - spent);
          const needed = ARTIFACT_LEVEL_THRESHOLDS[level - 1];
          const pct = Math.min(100, Math.round(dupesInLevel / needed * 100));
          barHtml = `<div class="art-bar-wrap">
            <div class="art-bar-bg"><div class="art-bar-fill" style="width:${pct}%"></div></div>
          </div>`;
        } else {
          barHtml = `<div class="art-effect" style="color:#ffcc44;font-size:7px">✦ MÁXIMO ✦</div>`;
        }
      }
      const dupesHtml = dupes > 0 ? `<div class="art-dupes">${dupes}x dupl.</div>` : '';

      div.innerHTML = `
        <div class="art-icon">${def.icon}</div>
        <div class="art-name">${def.name}</div>
        <div class="art-rarity" style="color:${ARTIFACT_RARITY_COLORS[def.rarity]}">${ARTIFACT_RARITY_LABELS[def.rarity]}</div>
        ${starsHtml}
        ${barHtml}
        ${dupesHtml}`;
    }

    div.style.cursor = isOwned ? 'pointer' : 'default';
    if(isOwned) div.addEventListener('click', () => openArtifactModal(id, 'album'));
    grid.appendChild(div);
  });
}

function renderArtifactSlots() {
  const area = document.getElementById('artifact-slot-area');
  if(!area) return;
  area.innerHTML = '';

  for(let i = 0; i < ARTIFACT_MAX_SLOTS; i++) {
    const id = equippedArtifacts[i];
    const div = document.createElement('div');

    if(id) {
      const def = ARTIFACT_DEFS[id];
      if(!def) { equippedArtifacts[i] = null; continue; }
      div.className = `artifact-slot filled rarity-${def.rarity}`;
      const slotLevel = ARTIFACT_UPGRADE_TABLES[id] ? getArtifactLevel(id) : null;
      const slotStars = slotLevel ? '★'.repeat(slotLevel)+'☆'.repeat(5-slotLevel) : '';
      const slotUpgrLabel = slotLevel && ARTIFACT_UPGRADE_LABELS[id] ? ARTIFACT_UPGRADE_LABELS[id](slotLevel) : def.desc;
      div.innerHTML = `
        <span class="slot-icon">${def.icon}</span>
        <div class="slot-info">
          <div class="slot-name">${def.name} ${slotLevel ? `<span style="color:#ffcc44;font-size:9px">${slotStars}</span>` : ''}</div>
          <div class="slot-eff">${slotUpgrLabel}</div>
        </div>
        <div class="slot-unequip" onclick="unequipArtifact(${i})">✕</div>
      `;
    } else {
      div.className = 'artifact-slot';
      div.textContent = `Slot ${i+1} — vazio`;
    }
    area.appendChild(div);
  }
}

function equipArtifact(id) {
  const slot = equippedArtifacts.indexOf(null);
  if(slot === -1) return; // sem slots livres
  // Não permite repetir artefato equipado
  if(equippedArtifacts.includes(id)) return;
  // Verifica disponibilidade
  const totalOwned = ownedArtifacts.filter(e => e === id).length;
  if(totalOwned === 0) return;
  equippedArtifacts[slot] = id;
  writeSave();
  renderArtifactCollectionGrid();
  _renderDeckArtifactSlots(); _renderDeckArtifactCollection();
}

function unequipArtifact(slotIndex) {
  equippedArtifacts[slotIndex] = null;
  writeSave();
  renderArtifactCollectionGrid();
  _renderDeckArtifactSlots(); _renderDeckArtifactCollection();
}

// ── HUD de artefatos no jogo ─────────────────────────────────────
function buildArtifactHUD() {
  let el = document.getElementById('artifact-hud');
  if(!el) {
    el = document.createElement('div');
    el.id = 'artifact-hud';
    document.getElementById('ui').appendChild(el);
  }
  el.innerHTML = '';

  const active = equippedArtifacts.filter(Boolean);
  active.forEach(id => {
    const def = ARTIFACT_DEFS[id];
    if(!def) return;
    const item = document.createElement('div');
    item.className = 'artifact-hud-item';
    item.style.borderColor = ARTIFACT_RARITY_COLORS[def.rarity];
    item.innerHTML = `<span class="ah-icon">${def.icon}</span><span class="ah-name">${def.name}</span>`;
    el.appendChild(item);
  });
}

// Expõe funções que main.js pode chamar
function getActiveArtifactEffects() {
  return equippedArtifacts.filter(Boolean).map(id => ARTIFACT_DEFS[id]).filter(Boolean);
}

function hasArtifactEffect(effectId) {
  return getActiveArtifactEffects().some(a => a.effect === effectId);
}

// Contador de kills para caveira de sangue (reseta a cada 30)
window.artifactKillCounter = 0;

function onArtifactKill() {
  if(!hasArtifactEffect('heal_per_30kills')) return;
  window.artifactKillCounter++;
  const killThreshold = (typeof getArtifactUpgradeValue === 'function') ? (getArtifactUpgradeValue('blood_skull') || 30) : 30;
  if(window.artifactKillCounter >= killThreshold) {
    window.artifactKillCounter = 0;
    // Cura o player (acessa o player do main.js)
    if(typeof player !== 'undefined') {
      player.hp = Math.min(player.maxHp, player.hp + 1);
      if(typeof updateHPDisplay === 'function') updateHPDisplay();
      if(typeof addParticles === 'function') addParticles(player.x, player.y, '#ff6688', 10);
      if(typeof showDiceResultText === 'function') showDiceResultText('+1❤️ (Caveira)', '#ff6688');
    }
  }
}

function onArtifactDungeonComplete() {
  if(!hasArtifactEffect('heal_per_dungeon')) return;
  if(typeof player !== 'undefined') {
    const healAmt = (typeof getArtifactUpgradeValue === 'function') ? (getArtifactUpgradeValue('coxinha') || 1) : 1;
    player.hp = Math.min(player.maxHp, player.hp + healAmt);
    if(typeof updateHPDisplay === 'function') updateHPDisplay();
    if(typeof addParticles === 'function') addParticles(player.x, player.y, '#ff6688', 12);
    if(typeof showDiceResultText === 'function') showDiceResultText(`+${healAmt}❤️ (Coxinha)`, '#aaddaa');
  }
}

// Compra de baú pela loja principal
function buyChestFromShop() {
  if(persistentGold < CHEST_COST) {
    if(typeof Audio !== 'undefined' && Audio.menuError) Audio.menuError();
    const el = document.getElementById('shop-chest-result');
    if(el) { el.textContent = '❌ Moedas insuficientes!'; el.style.color='#ff4444'; }
    return;
  }
  persistentGold -= CHEST_COST;
  _menuClick();
  const rarity = rollArtifactRarity();
  const artifactId = rollArtifactOfRarity(rarity);

  const isDuplicate2 = ownedArtifacts.includes(artifactId);
  let dupeCount2 = 0;
  if(isDuplicate2) {
    dupeCount2 = Math.floor(Math.random() * 16) + 5;
    for(let i = 0; i < dupeCount2; i++) ownedArtifacts.push(artifactId);
  } else {
    ownedArtifacts.push(artifactId);
  }

  writeSave();
  renderShopScreen();

  _chestPendingResult = { artifactId, rarity, isDuplicate: isDuplicate2, dupeCount: dupeCount2 };
  _chestClickCount = 0;
  openChestOverlay();
}


// ─── NAVEGAÇÃO POR TECLADO NO MENU PRINCIPAL ───────────────────────────────
(function() {
  // Ordem dos botões do menu principal
  const MENU_ACTIONS = [
    { label: 'JOGAR',     fn: () => startGame() },
    { label: 'BARALHO',   fn: () => openDeckScreen() },
    { label: 'LOJA',      fn: () => openShopScreen() },
    { label: 'ARTEFATOS', fn: () => openArtifactScreen() },
    { label: 'OPÇÕES',    fn: () => openOptionsScreen() },
  ];

  let _menuIndex = -1; // -1 = nenhum selecionado ainda

  function _isMainMenuVisible() {
    const m = document.getElementById('main-menu');
    return m && m.style.display !== 'none' && !gameStarted;
  }

  function _isOnlyMainMenuOpen() {
    // Retorna true se só o menu principal está visível (sem submenus abertos)
    const subScreens = [
      'deck-screen', 'shop-screen', 'artifact-screen',
      'options-screen', 'card-modal', 'buff-tree-modal', 'chest-overlay'
    ];
    for (const id of subScreens) {
      const el = document.getElementById(id);
      if (el && el.style.display !== 'none' && el.style.display !== '') return false;
    }
    return true;
  }

  function _getMenuBtns() {
    return Array.from(document.querySelectorAll('#main-menu .menu-btn'));
  }

  function _highlight(index) {
    const btns = _getMenuBtns();
    btns.forEach((b, i) => {
      if (i === index) {
        b.classList.add('kb-selected');
        b.focus();
        if (typeof Audio !== 'undefined' && Audio.menuHover) Audio.menuHover();
      } else {
        b.classList.remove('kb-selected');
      }
    });
    _menuIndex = index;
  }

  function _clearHighlight() {
    _getMenuBtns().forEach(b => b.classList.remove('kb-selected'));
    _menuIndex = -1;
  }

  document.addEventListener('keydown', function(e) {
    if (!_isMainMenuVisible() || !_isOnlyMainMenuOpen()) {
      // Limpa seleção ao sair do menu
      if (_menuIndex !== -1) _clearHighlight();
      return;
    }

    const btns = _getMenuBtns();
    if (!btns.length) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = _menuIndex < btns.length - 1 ? _menuIndex + 1 : 0;
      _highlight(next);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = _menuIndex > 0 ? _menuIndex - 1 : btns.length - 1;
      _highlight(prev);
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (_menuIndex >= 0 && _menuIndex < btns.length) {
        e.preventDefault();
        btns[_menuIndex].click();
      } else {
        // Enter sem nada selecionado → seleciona o primeiro
        e.preventDefault();
        _highlight(0);
      }
    } else if (e.key === 'Escape') {
      _clearHighlight();
    }
  });

  // Remove destaque ao usar o mouse
  document.addEventListener('mousemove', function() {
    if (_menuIndex !== -1 && _isMainMenuVisible()) {
      _clearHighlight();
    }
  });
})();

// ═══════════════════════════════════════════════════════════════
// NAVEGAÇÃO POR TECLADO — BARALHO / LOJA / ARTEFATOS
// ═══════════════════════════════════════════════════════════════
(function() {
  const SCREENS = [
    {
      id: 'shop-screen',
      itemSel: '.shop-card',
      close: () => closeShopScreen(),
      isModalOpen: () => document.getElementById('card-modal-overlay').classList.contains('open'),
      closeModal: () => closeCardModal(),
    },
    {
      id: 'deck-screen',
      itemSel: '.coll-card, .deck-slot.filled',
      close: () => closeDeckScreen(),
      isModalOpen: () => document.getElementById('card-modal-overlay').classList.contains('open'),
      closeModal: () => closeCardModal(),
    },
    {
      id: 'artifact-screen',
      itemSel: '.artifact-card:not(.not-owned)',
      close: () => closeArtifactScreen(),
      isModalOpen: () => document.getElementById('artifact-modal-overlay').classList.contains('open'),
      closeModal: () => closeArtifactModal(),
    },
  ];

  // Modal de carta (dentro de qualquer tela)
  const CARD_MODAL_SCREENS = [
    {
      id: 'card-modal-overlay',
      btnSel: '#modal-actions .modal-btn',
      close: () => closeCardModal(),
    },
    {
      id: 'artifact-modal-overlay',
      btnSel: '#art-modal-actions .modal-btn',
      close: () => closeArtifactModal(),
    },
  ];

  let _idx    = -1;
  let _screen = null;
  let _modalIdx = -1;
  let _modalScreen = null;

  // ─── helpers ─────────────────────────────────────────────────
  function _isOpen(s) {
    const el = document.getElementById(s.id);
    if (!el) return false;
    if (el.classList.contains('open')) return true;
    return el.style.display !== 'none' && el.style.display !== '';
  }

  function _activeScreen() { return SCREENS.find(_isOpen) || null; }
  function _activeModal()  { return CARD_MODAL_SCREENS.find(_isOpen) || null; }

  function _getItems(s) {
    const el = document.getElementById(s.id);
    if (!el) return [];
    return Array.from(el.querySelectorAll(s.itemSel)).filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
  }

  function _getModalBtns(m) {
    return Array.from(document.querySelectorAll(m.btnSel));
  }

  // Calcula quantas colunas tem a grade medindo as posições X dos itens
  function _getCols(items) {
    if (!items.length) return 1;
    const firstX = Math.round(items[0].getBoundingClientRect().left);
    let cols = 1;
    for (let i = 1; i < items.length; i++) {
      const x = Math.round(items[i].getBoundingClientRect().left);
      if (x <= firstX + 4) break; // voltou para a coluna inicial = nova linha
      cols++;
    }
    return cols;
  }

  // ─── highlight de grade ──────────────────────────────────────
  function _highlight(items, idx) {
    items.forEach((el, i) => {
      if (i === idx) {
        el.classList.add('kb-selected');
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        if (typeof Audio !== 'undefined' && Audio.menuHover) Audio.menuHover();
      } else {
        el.classList.remove('kb-selected');
      }
    });
    _idx = idx;
  }

  function _clearHighlight(s) {
    if (!s) return;
    _getItems(s).forEach(el => el.classList.remove('kb-selected'));
    _idx = -1;
  }

  // ─── highlight do modal ──────────────────────────────────────
  function _highlightModal(btns, idx) {
    btns.forEach((b, i) => {
      if (i === idx) { b.classList.add('kb-selected'); b.focus(); }
      else           { b.classList.remove('kb-selected'); }
    });
    _modalIdx = idx;
  }

  function _clearModalHighlight(m) {
    if (!m) return;
    _getModalBtns(m).forEach(b => b.classList.remove('kb-selected'));
    _modalIdx = -1;
  }

  // ─── navegação 2D ────────────────────────────────────────────
  function _move(items, key) {
    const n    = items.length;
    const cols = _getCols(items);
    const cur  = _idx;

    if (key === 'ArrowRight') {
      const next = cur < n - 1 ? cur + 1 : 0;
      _highlight(items, next);
    } else if (key === 'ArrowLeft') {
      const prev = cur > 0 ? cur - 1 : n - 1;
      _highlight(items, prev);
    } else if (key === 'ArrowDown') {
      if (cur === -1) { _highlight(items, 0); return; }
      const next = cur + cols;
      _highlight(items, next < n ? next : cur % cols); // wraps to first row
    } else if (key === 'ArrowUp') {
      if (cur === -1) { _highlight(items, 0); return; }
      const prev = cur - cols;
      if (prev >= 0) {
        _highlight(items, prev);
      } else {
        // sobe para a última linha na mesma coluna
        const col       = cur % cols;
        const lastRowStart = Math.floor((n - 1) / cols) * cols;
        const target    = lastRowStart + col;
        _highlight(items, target < n ? target : lastRowStart);
      }
    }
  }

  // ─── keydown ─────────────────────────────────────────────────
  document.addEventListener('keydown', function(e) {
    const s = _activeScreen();
    const m = _activeModal();

    // Modal de carta/artefato aberto — navega nos botões de ação
    if (m) {
      const btns = _getModalBtns(m);
      const KEYS = ['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Enter',' ','Escape'];
      if (!KEYS.includes(e.key)) return;
      e.preventDefault();

      if (e.key === 'Escape') {
        _clearModalHighlight(m); _modalScreen = null;
        m.close();
        return;
      }
      if (!btns.length) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        const next = _modalIdx < btns.length - 1 ? _modalIdx + 1 : 0;
        _highlightModal(btns, next);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        const prev = _modalIdx > 0 ? _modalIdx - 1 : btns.length - 1;
        _highlightModal(btns, prev);
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (_modalIdx >= 0 && _modalIdx < btns.length) {
          btns[_modalIdx].click();
        } else {
          _highlightModal(btns, 0);
        }
      }
      return;
    }

    if (!s) {
      if (_idx !== -1 && _screen) { _clearHighlight(_screen); _screen = null; }
      return;
    }

    // Trocou de tela — reseta
    if (_screen !== s) {
      if (_screen) _clearHighlight(_screen);
      _screen = s;
      _idx = -1;
    }

    const items = _getItems(s);
    const KEYS2 = ['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Enter',' ','Escape'];
    if (!KEYS2.includes(e.key)) return;
    e.preventDefault();

    if (!items.length) return;

    if (['ArrowDown','ArrowRight','ArrowUp','ArrowLeft'].includes(e.key)) {
      if (_idx === -1) { _highlight(items, 0); return; }
      _move(items, e.key);
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (_idx >= 0 && _idx < items.length) {
        items[_idx].click();
        // Prepara o modal para navegação com teclado
        setTimeout(() => {
          const mOpened = _activeModal();
          if (mOpened) {
            const btns = _getModalBtns(mOpened);
            if (btns.length) _highlightModal(btns, 0);
          }
        }, 60);
      } else {
        _highlight(items, 0);
      }
    } else if (e.key === 'Escape') {
      _clearHighlight(s);
      _screen = null;
      s.close();
    }
  });

  // Remove destaque ao usar o mouse
  document.addEventListener('mousemove', function() {
    if (_idx !== -1 && _screen && _isOpen(_screen)) _clearHighlight(_screen);
    if (_modalIdx !== -1 && _modalScreen && _isOpen(_modalScreen)) _clearModalHighlight(_modalScreen);
  });
})();

// ═══════════════════════════════════════════════════════════════
// NAVEGAÇÃO POR TECLADO — TELA DE OPÇÕES
// ═══════════════════════════════════════════════════════════════
(function() {
  let _optIndex = -1;

  function _isOptionsOpen() {
    const el = document.getElementById('options-screen');
    return el && el.style.display !== 'none' && el.style.display !== '';
  }

  function _isEraseConfirmOpen() {
    const el = document.getElementById('erase-confirm-overlay');
    return el && el.classList.contains('open');
  }

  function _getOptionsBtns() {
    return Array.from(document.querySelectorAll(
      '#options-screen .options-toggle-btn, #options-screen .back-btn'
    ));
  }

  function _highlight(index) {
    const btns = _getOptionsBtns();
    btns.forEach((b, i) => {
      if (i === index) {
        b.classList.add('kb-selected');
        b.focus();
        if (typeof Audio !== 'undefined' && Audio.menuHover) Audio.menuHover();
      } else {
        b.classList.remove('kb-selected');
      }
    });
    _optIndex = index;
  }

  function _clearHighlight() {
    _getOptionsBtns().forEach(b => b.classList.remove('kb-selected'));
    _optIndex = -1;
  }

  // Quando a tela de opções abre, seleciona o primeiro botão automaticamente
  const _origOpen = window.openOptionsScreen;
  window.openOptionsScreen = function() {
    _origOpen && _origOpen();
    setTimeout(() => { if (_isOptionsOpen()) _highlight(0); }, 30);
  };

  // Quando fecha, limpa seleção
  const _origClose = window.closeOptionsScreen;
  window.closeOptionsScreen = function() {
    _clearHighlight();
    _origClose && _origClose();
  };

  let _eraseIndex = -1;

  function _getEraseBtns() {
    return Array.from(document.querySelectorAll('#erase-confirm-modal .erase-btn'));
  }

  function _highlightErase(index) {
    const btns = _getEraseBtns();
    btns.forEach((b, i) => {
      if (i === index) {
        b.classList.add('kb-selected');
        b.focus();
        if (typeof Audio !== 'undefined' && Audio.menuHover) Audio.menuHover();
      } else {
        b.classList.remove('kb-selected');
      }
    });
    _eraseIndex = index;
  }

  function _clearEraseHighlight() {
    _getEraseBtns().forEach(b => b.classList.remove('kb-selected'));
    _eraseIndex = -1;
  }

  // Ao abrir o confirm, seleciona CANCELAR (índice 1) por segurança
  const _origOpenErase = window.openEraseConfirm;
  window.openEraseConfirm = function() {
    _origOpenErase && _origOpenErase();
    setTimeout(() => { if (_isEraseConfirmOpen()) _highlightErase(1); }, 30);
  };

  const _origCloseErase = window.closeEraseConfirm;
  window.closeEraseConfirm = function() {
    _clearEraseHighlight();
    _origCloseErase && _origCloseErase();
  };

  document.addEventListener('keydown', function(e) {
    if (_isEraseConfirmOpen()) {
      const KEYS = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' ','Escape'];
      if (!KEYS.includes(e.key)) return;
      e.preventDefault();
      const btns = _getEraseBtns();
      if (e.key === 'Escape') {
        closeEraseConfirm();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        _highlightErase(_eraseIndex > 0 ? _eraseIndex - 1 : btns.length - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        _highlightErase(_eraseIndex < btns.length - 1 ? _eraseIndex + 1 : 0);
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (_eraseIndex >= 0) btns[_eraseIndex].click();
      }
      return;
    }

    if (!_isOptionsOpen()) {
      if (_optIndex !== -1) _clearHighlight();
      return;
    }

    const btns = _getOptionsBtns();
    if (!btns.length) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = _optIndex < btns.length - 1 ? _optIndex + 1 : 0;
      _highlight(next);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = _optIndex > 0 ? _optIndex - 1 : btns.length - 1;
      _highlight(prev);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (_optIndex >= 0 && _optIndex < btns.length) {
        btns[_optIndex].click();
      } else {
        _highlight(0);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeOptionsScreen();
    }
  });

  // Remove destaque ao usar o mouse
  document.addEventListener('mousemove', function() {
    if (_optIndex !== -1 && _isOptionsOpen()) _clearHighlight();
  });
})();
