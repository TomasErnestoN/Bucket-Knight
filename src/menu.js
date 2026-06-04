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
let equippedSpecial = 'black_magic';
let specialUpgradeLevel = 1;

function getSpecialUpgradeCost(currentLevel) { return currentLevel * 200; }
function getSpecialDurationForLevel(level) { return 5000 + (level - 1) * 1250; }

(function loadInitial(){
  const save = loadSave();
  if(save){
    persistentGold = save.gold || 0;
    ownedCards = save.ownedCards || ['sword','meat','pistol','speed_potion','scythe'];
    equippedDeck = save.equippedDeck || ['sword','meat','pistol','speed_potion','scythe'];
    equippedSpecial = save.equippedSpecial || 'black_magic';
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
  if(ownedCards.includes('black_magic') || ownedCards.includes('glitch_fury')){
    document.getElementById('special-card-slot').style.display = 'flex';
  }
  gameStarted = true;
  currentEquippedDeck = equippedDeck.filter(Boolean);
  init();
  Audio.playMusic();
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
        <div style="font-size:28px;margin-bottom:4px">${def.icon}</div>
        <div style="font-size:8px;text-align:center;color:#e0e0ff">${def.name}</div>
        <div style="font-size:9px;color:#88aaff;margin-top:2px">💧 ${def.mana}</div>
        <div style="font-size:7px;margin-top:2px" class="rarity-label-${def.rarity}">${rarDef.label}</div>
        <div style="font-size:7px;color:#555577;margin-top:3px">arraste ▸ coleção</div>`;
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
      div.innerHTML = `<div style="font-size:28px">+</div><div style="font-size:8px;margin-top:4px;color:#2a2a55">vazio</div>`;
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

  // ── Slot especial ──
  const specialArea = document.getElementById('deck-special-area');
  if(specialArea){
    specialArea.innerHTML = '';
    const specialOwned = ownedCards.filter(id => {
      const def = CARD_DEFS_STATIC[id]; return def && def.rarity === 'especial';
    });
    if(specialOwned.length === 0){
      specialArea.innerHTML = `<div style="width:80px;height:112px;border:2px dashed #661144;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#441133;font-size:10px;text-align:center;padding:4px">Compre na loja</div>`;
    } else {
      specialOwned.forEach(id => {
        const def = CARD_DEFS_STATIC[id];
        const isEquipped = equippedSpecial === id;
        const d = document.createElement('div');
        d.className = `coll-card rarity-especial${isEquipped?' in-deck':''}`;
        d.style.border = '2px solid #ff2288'; d.style.cursor = 'pointer';
        d.innerHTML = `
          <div style="font-size:28px;margin-bottom:4px">${def.icon}</div>
          <div style="font-size:8px;text-align:center;color:#ff88cc;font-weight:bold">${def.name}</div>
          <div style="font-size:7px;margin-top:2px;color:#ff2288">ESPECIAL</div>
          <div style="font-size:7px;color:${isEquipped?'#ff2288':'#555577'};margin-top:3px">${isEquipped?'✓ equipada':'desequipada'}</div>
          <div style="font-size:8px;color:#884466;margin-top:4px">clique ▸ detalhes</div>`;
        d.onclick = () => openCardModal(id, 'special');
        specialArea.appendChild(d);
      });
    }
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
    if(_dragFromSlot !== null && _dragId){
      equippedDeck[_dragFromSlot] = ''; _dragId = null; _dragFromSlot = null;
      renderDeckScreen(); writeSave();
    }
  });
  ownedCards.forEach(id => {
    const def = CARD_DEFS_STATIC[id];
    if(def && def.rarity === 'especial') return;
    const rarDef = RARITIES_STATIC[def.rarity];
    const deckCount = equippedDeck.filter(x=>x===id).length;
    const ownCount  = ownedCards.filter(x=>x===id).length;
    const alreadyMaxed = deckCount >= ownCount;
    const div = document.createElement('div');
    div.className = `coll-card rarity-${def.rarity}${alreadyMaxed?' in-deck':''}`;
    div.innerHTML = `
      <div style="font-size:28px;margin-bottom:4px">${def.icon}</div>
      <div style="font-size:8px;text-align:center;color:#e0e0ff">${def.name}</div>
      <div style="font-size:9px;color:#88aaff;margin-top:2px">💧 ${def.mana}</div>
      <div style="font-size:7px;margin-top:2px" class="rarity-label-${def.rarity}">${rarDef.label}</div>
      ${!alreadyMaxed
        ? '<div style="font-size:8px;color:#557755;margin-top:4px">arraste ▸ slot</div><div style="font-size:8px;color:#445566;margin-top:1px">clique ▸ detalhes</div>'
        : '<div style="font-size:7px;color:#444466;margin-top:5px">equipada</div>'}`;
    if(!alreadyMaxed){
      div.draggable = true;
      div.addEventListener('dragstart', () => {
        _dragId = id; _dragFromSlot = null; setTimeout(() => div.classList.add('dragging'), 0);
      });
      div.addEventListener('dragend', () => { div.classList.remove('dragging'); _dragId = null; });
    }
    div.onclick = () => openCardModal(id, 'collection');
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
}

function closeShopScreen() {
  _menuClick();
  document.getElementById('shop-screen').style.display = 'none';
  document.getElementById('main-menu').style.display = 'flex';
  updateMenuGold();
  writeSave();
}

function renderShopScreen() {
  document.getElementById('shop-gold').textContent = '🪙 ' + persistentGold;
  const grid = document.getElementById('shop-grid');
  grid.innerHTML = '';
  SHOP_CATALOG.forEach(entry => {
    const id = entry.id;
    const def = CARD_DEFS_STATIC[id];
    const rarDef = RARITIES_STATIC[def.rarity];
    const price = CARD_PRICES[def.rarity];
    const atMax = ownedCards.includes(id);
    const cantAfford = persistentGold < price;
    const div = document.createElement('div');
    let cls = `shop-card rarity-${def.rarity}`;
    if(atMax) cls += ' owned'; else if(cantAfford) cls += ' cant-afford';
    div.className = cls;
    div.innerHTML = `
      <div style="font-size:32px;margin-bottom:6px">${def.icon}</div>
      <div style="font-size:9px;text-align:center;color:#e0e0ff;font-weight:bold">${def.name}</div>
      <div style="font-size:8px;color:#88aaff;margin-top:3px">💧 ${def.mana}</div>
      <div style="font-size:8px;margin-top:2px" class="rarity-label-${def.rarity}">${rarDef.label}</div>
      <div class="shop-price">${atMax ? '✓ Possuída' : '🪙 '+price}</div>`;
    if(!atMax && !cantAfford) div.onclick = () => buyCard(id, price);
    else div.onclick = () => { if(typeof Audio !== 'undefined' && Audio.menuError) Audio.menuError(); };
    div.addEventListener('mouseenter', (e) => showTooltip(e, id));
    div.addEventListener('mousemove', moveTooltip);
    div.addEventListener('mouseleave', hideTooltip);
    grid.appendChild(div);
  });
}

function buyCard(id, price) {
  if(persistentGold < price || ownedCards.includes(id)) {
    if(typeof Audio !== 'undefined' && Audio.menuError) Audio.menuError();
    return;
  }
  persistentGold -= price;
  ownedCards.push(id);
  _menuClick();
  const def = CARD_DEFS_STATIC[id];
  if(def && def.rarity === 'especial') equippedSpecial = id;
  writeSave();
  renderShopScreen();
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
  equippedSpecial = 'black_magic';
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
  // Sincroniza com tela de pause se estiver aberta
  if(typeof updatePauseSoundLabel === 'function') updatePauseSoundLabel();
}

function updateOptionsFullscreenLabel() {
  const btn = document.getElementById('options-fullscreen-btn');
  if(!btn) return;
  const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
  btn.textContent = isFS ? '✕ Sair da Tela Cheia' : '⛶ Tela Cheia';
}

// Atualiza o label ao mudar fullscreen por qualquer meio (ex: tecla Esc)
document.addEventListener('fullscreenchange', updateOptionsFullscreenLabel);
document.addEventListener('webkitfullscreenchange', updateOptionsFullscreenLabel);

// ═══════════════════════════════════════════════════════════════
// CHEATS
// ═══════════════════════════════════════════════════════════════
let cheatBuffer = '';
document.addEventListener('keydown', (e) => {
  const shopOpen = document.getElementById('shop-screen').style.display === 'flex';
  const isPaused = typeof paused !== 'undefined' && paused && gameStarted;
  if(!shopOpen && !isPaused) return;
  cheatBuffer += e.key.toLowerCase();
  if(cheatBuffer.length > 20) cheatBuffer = cheatBuffer.slice(-20);
  if(shopOpen && cheatBuffer.includes('dinheiro')){
    persistentGold += 10000; updateMenuGold(); renderShopScreen(); writeSave();
    alert('💰 +10.000 moedas'); cheatBuffer = '';
  }
  if(isPaused && cheatBuffer.includes('super')){
    if(ownedCards.includes('glitch_fury')){
      glitchFuryCharge = 3; glitchFuryReady = true;
      if(typeof updateGlitchFuryUI === 'function') updateGlitchFuryUI();
    } else {
      specialChargeKills = SPECIAL_CHARGE_GOAL; specialReady = true;
      updateSpecialCardUI();
    }
    cheatBuffer = '';
  }
});

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
}

function closeArtifactScreen() {
  _menuClick();
  document.getElementById('artifact-screen').style.display = 'none';
  document.getElementById('main-menu').style.display = 'flex';
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
  grid.innerHTML = '';

  // Álbum completo: mostra TODOS os artefatos definidos, obtidos ou não
  const counts = {};
  ownedArtifacts.forEach(id => { counts[id] = (counts[id]||0)+1; });

  Object.entries(ARTIFACT_DEFS).forEach(([id, def]) => {
    const owned = counts[id] || 0;
    const isOwned = owned > 0;
    const isEquipped = equippedArtifacts.includes(id);
    const hasUpgrades = ARTIFACT_UPGRADE_TABLES[id] !== undefined;
    const level = isOwned && hasUpgrades ? getArtifactLevel(id) : null;
    const dupes = Math.max(0, owned - 1);

    let levelHtml = '';
    if(isOwned && hasUpgrades) {
      const stars = '★'.repeat(level) + '☆'.repeat(5 - level);
      const upgradeLabel = ARTIFACT_UPGRADE_LABELS[id] ? ARTIFACT_UPGRADE_LABELS[id](level) : '';
      levelHtml = `<div style="font-size:9px;color:#ffcc44;letter-spacing:1px;margin:2px 0">${stars}</div>`;
      levelHtml += `<div style="font-size:8px;color:#aaddff;margin-bottom:2px">${upgradeLabel}</div>`;
      if(level < 5) {
        const spent = getDupesSpentForLevel(level);
        const dupesInLevel = Math.max(0, dupes - spent);
        const needed = ARTIFACT_LEVEL_THRESHOLDS[level - 1];
        const pct = Math.min(100, Math.round(dupesInLevel / needed * 100));
        levelHtml += `<div style="font-size:7px;color:#778;margin-bottom:2px">Nv${level+1}: ${dupesInLevel}/${needed} dupl.</div>`;
        levelHtml += `<div style="background:#223;border-radius:3px;height:4px;width:100%;overflow:hidden"><div style="background:#44aaff;height:100%;width:${pct}%"></div></div>`;
      } else {
        levelHtml += `<div style="font-size:7px;color:#ffcc44">✦ MÁXIMO ✦</div>`;
      }
    }

    const div = document.createElement('div');
    div.className = `artifact-card rarity-${def.rarity}`;
    if(!isOwned) {
      // Não obtido: silhueta/bloqueado
      div.style.filter = 'grayscale(1) brightness(0.35)';
      div.style.opacity = '0.5';
      div.innerHTML = `
        <div class="art-icon">❓</div>
        <div class="art-name">${def.name}</div>
        <div class="art-rarity" style="color:${ARTIFACT_RARITY_COLORS[def.rarity]}">${ARTIFACT_RARITY_LABELS[def.rarity]}</div>
        <div class="art-desc" style="font-size:8px;color:#555566">Não obtido</div>`;
    } else {
      div.style.opacity = isEquipped ? '0.6' : '1';
      div.innerHTML = `
        <div class="art-icon">${def.icon}</div>
        <div class="art-name">${def.name}</div>
        <div class="art-rarity" style="color:${ARTIFACT_RARITY_COLORS[def.rarity]}">${ARTIFACT_RARITY_LABELS[def.rarity]}</div>
        ${levelHtml}
        <div class="art-desc" style="font-size:8px;color:#889">${def.desc}</div>
        ${dupes > 0 ? `<div style="font-size:8px;color:#778;margin-top:2px">${dupes} duplicata${dupes>1?'s':''}</div>` : ''}
        ${isEquipped ? '<div style="font-size:7px;color:#88ffaa;margin-top:3px">✓ equipado no deck</div>' : ''}`;
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
