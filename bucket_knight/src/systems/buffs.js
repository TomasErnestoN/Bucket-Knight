// ─── BUFF SYSTEM ──────────────────────────────────────────────────────────────
const BUFF_DEFS = {
  // SWORD FAMILY
  sword_range:    { id:'sword_range',    family:'sword', next:'sword_damage',   name:'Espada de Aço',     icon:'🗡️',  desc:'O alcance da espada aumenta consideravelmente.' },
  sword_damage:   { id:'sword_damage',   family:'sword', next:'sword_push',     name:'Espada de Diamante',icon:'💎',  desc:'+1 de dano com a espada em cada golpe.', requires:'sword_range' },
  sword_push:     { id:'sword_push',     family:'sword', next:null,             name:'Espada de Platina', icon:'🌀',  desc:'A espada empurra muito os inimigos para longe.', requires:'sword_damage' },
  // BOW FAMILY
  bow_pierce:     { id:'bow_pierce',     family:'bow',   next:'bow_knockback',  name:'Arco Preciso',      icon:'🎯',  desc:'Aljavas dão 5 flechas ao invés de 2.' },
  bow_knockback:  { id:'bow_knockback',  family:'bow',   next:'bow_bigger',     name:'Flechas Blindadas', icon:'🛡️',  desc:'Barra carrega 2x mais rápido. Dano: 2 / 4 / 8. Flechas empurram inimigos.', requires:'bow_pierce' },
  bow_bigger:     { id:'bow_bigger',     family:'bow',   next:null,             name:'Arqueiro Supremo',  icon:'👑',  desc:'Flechas são bem maiores com enorme área de colisão.', requires:'bow_knockback' },
  // PISTOL FAMILY
  gun_ammo: {
    id:'gun_ammo',
    family:'pistol',
    next:'gun_damage',
    name:'Mais Pólvora',
    icon:'🔩',
    desc:'Munição da pistola sobe de 40 para 60 balas.'
  },
  gun_damage: {
    id:'gun_damage',
    family:'pistol',
    next:'gun_pierce',
    name:'Americano',
    icon:'🦅',
    desc:'Dano das balas aumenta de 0.5 para 0.75.',
    requires:'gun_ammo'
  },
  gun_pierce: {
    id:'gun_pierce',
    family:'pistol',
    next:null,
    name:'Patriotismo',
    icon:'🇺🇸',
    desc:'Cada bala tem 20% de chance de atravessar todos os inimigos.',
    requires:'gun_damage'
  },
  // AXE FAMILY
  axe_push: {
    id:'axe_push',
    family:'axe',
    next:'axe_duration',
    name:'Viking',
    icon:'🛡️',
    desc:'Machado empurra mais os inimigos.'
  },

  axe_duration: {
    id:'axe_duration',
    family:'axe',
    next:'axe_size',
    name:'Bárbaro de Elite',
    icon:'⚔️',
    desc:'Machado dura 7 segundos.',
    requires:'axe_push'
  },

  axe_size: {
    id:'axe_size',
    family:'axe',
    next:null,
    name:'Rei da Guerra',
    icon:'👑',
    desc:'Aumenta o tamanho do giro do machado.',
    requires:'axe_duration'
  },

  // SPEED POTION FAMILY
  speed_global: {
    id:'speed_global',
    family:'speed',
    next:'speed_dash',
    name:'Como o Vento',
    icon:'🌪️',
    desc:'Todos os inimigos da tela ficam lentos.'
  },

  speed_dash: {
    id:'speed_dash',
    family:'speed',
    next:'speed_strong',
    name:'Poção Concentrada',
    icon:'⏳',
    desc:'A poção dura 8 segundos ao invés de 5.',
    requires:'speed_global'
  },

  speed_strong: {
    id:'speed_strong',
    family:'speed',
    next:null,
    name:'Eu sou a VELOCIDADE',
    icon:'⚡',
    desc:'Inimigos ficam ainda mais lentos.',
    requires:'speed_dash'
  },



  
  // KATANA FAMILY
  bloodlust: {
    id:'bloodlust',
    family:'katana',
    next:'sashimi',
    name:'Sede de Sangue',
    icon:'🩸',
    desc:'Duração da Katana aumenta de 3 para 6 segundos.'
  },

  sashimi: {
    id:'sashimi',
    family:'katana',
    next:'samurai',
    name:'Sashimi',
    icon:'🍣',
    desc:'Cada inimigo morto pela Katana cura 1 de vida do player.',
    requires:'bloodlust'
  },

  samurai: {
    id:'samurai',
    family:'katana',
    next:null,
    name:'Samurai',
    icon:'⚔️',
    desc:'Durante o efeito da Katana o player fica imortal.',
    requires:'sashimi'
  },


  // BOMBINHAS FAMILY
  bomb_area: {
    id:'bomb_area',
    family:'bombinhas',
    next:'bomb_tech',
    name:'Área Perigosa',
    icon:'🔥',
    desc:'A explosão deixa fogo no chão por 2 segundos causando 1 de dano contínuo.'
  },

  bomb_tech: {
    id:'bomb_tech',
    family:'bombinhas',
    next:'bomb_bombastic',
    name:'Técnico em Explosões',
    icon:'💣',
    desc:'Munição das bombinhas aumenta de 5 para 8.',
    requires:'bomb_area'
  },

  bomb_bombastic: {
    id:'bomb_bombastic',
    family:'bombinhas',
    next:null,
    name:'BOMBÁSTICO',
    icon:'☢️',
    desc:'A bomba explode duas vezes. A segunda explosão é maior.',
    requires:'bomb_tech'
  },

  // DADO FAMILY
  cowhand: { id:'cowhand', family:'dado', next:'highbets', name:'Mão de Vaca', icon:'🐄', desc:'Dados agora custam 0 de mana.' },
  highbets: { id:'highbets', family:'dado', next:'jackpot', name:'Aposta Alta', icon:'💰', desc:'Todos os efeitos do dado são dobrados.', requires:'cowhand' },
  jackpot: { id:'jackpot', family:'dado', next:null, name:'JACKPOT', icon:'🎰', desc:'Dado 6 agora existe: Player fica imortal por 3s, recupera toda a mana e vida, e 100 moedas dropam no chão!', requires:'highbets' },

  // FOICE FAMILY
  vulture: { id:'vulture', family:'foice', next:'lord_of_dead', name:'Abutre', icon:'🦅', desc:'A cada 20 kills com a foice, cura 1 de vida.' },
  lord_of_dead: { id:'lord_of_dead', family:'foice', next:'soul_pierce', name:'Senhor dos Mortos', icon:'💀', desc:'A cada 10 kills com a foice, um esqueleto forte spawna (4 vida, 2 dano).', requires:'vulture' },
  soul_pierce: { id:'soul_pierce', family:'foice', next:null, name:'Direto na Alma', icon:'⚡', desc:'O 3° ataque dá crítico, causando 4 de dano.', requires:'lord_of_dead' },
  vida1:          { id:'vida1',          family:'vida',  next:'vida2',          name:'Vida I',            icon:'❤️',  desc:'+1 coração de vida máxima.' },
  vida2:          { id:'vida2',          family:'vida',  next:'vida3',          name:'Vida II',           icon:'💖',  desc:'+2 corações de vida máxima.', requires:'vida1' },
  vida3:          { id:'vida3',          family:'vida',  next:null,             name:'Vida III',          icon:'💗',  desc:'+3 corações de vida máxima.', requires:'vida2' },
  // ISOLATED
  blast_shield:   { id:'blast_shield',   family:'isolado', next:null,           name:'Explosão Protetora',icon:'🛡️',  desc:'A explosão concede 3s de invulnerabilidade.' },
  blast_damage:   { id:'blast_damage',   family:'isolado', next:null,           name:'Explosão Destruídora',icon:'💣',desc:'A explosão causa 2 de dano (antes causava 1).' },
  blast_midas:    { id:'blast_midas',    family:'isolado', next:null,           name:'Explosão de Midas', icon:'🪙',  desc:'Se matar inimigo com explosão, dobra o ouro dropado.' },
  // CARNE FAMILY
  cook:           { id:'cook',           family:'carne',   next:'cook2',        name:'Cozinheiro Aprendiz',     icon:'🍳',  desc:'Carne custa apenas 2 de mana e cura 2 de vida.' },
  cook2:          { id:'cook2',          family:'carne',   next:'cook3',        name:'Cozinheiro Especialista', icon:'👨‍🍳', desc:'Carne agora custa apenas 1 de mana.', requires:'cook' },
  cook3:          { id:'cook3',          family:'carne',   next:null,           name:'Master Chefe',            icon:'⭐',  desc:'Usar a carne tem 30% de chance de dar 2 de mana.', requires:'cook2' },
  // MANA FAMILY
  mage:           { id:'mage',           family:'mana',    next:'archmage',     name:'Mago',              icon:'🔮',  desc:'Mana recarrega 20% mais rápido.' },
  archmage:       { id:'archmage',       family:'mana',    next:'contemplate',  name:'Arquimago',         icon:'🧙',  desc:'Mana total aumenta de 6 para 10.', requires:'mage' },
  contemplate:    { id:'contemplate',    family:'mana',    next:null,           name:'Me Contemplem',     icon:'✨',  desc:'Taxa de carga da mana aumenta em 50% (acumula com Mago).', requires:'archmage' },

  necro_tank: {
    id:'necro_tank',
    family:'necro',
    next:'necro_money',
    name:'Esqueletos Unam-se',
    icon:'💀',
    desc:'Esqueletos agora possuem 3 de vida.',
  },

  necro_money: {
    id:'necro_money',
    family:'necro',
    next:'necro_more',
    name:'Sem Aposentadoria',
    icon:'🪙',
    desc:'Esqueletos mortos por inimigos dropam 3 moedas. Esqueletos causam 1 de dano (antes 0.5).',
    requires:'necro_tank'
  },

  necro_more: {
    id:'necro_more',
    family:'necro',
    next:null,
    name:'Esqueletástico',
    icon:'☠️',
    desc:'Munição do cajado aumenta de 4 para 6 cliques (8 → 12 esqueletos).',
    requires:'necro_money'
  },

  // FUTEBOL FAMILY
  camisa10: {
    id:'camisa10',
    family:'futebol',
    next:'dominada',
    name:'Camisa 10',
    icon:'👕',
    desc:'Bola de futebol agora dura 15 segundos na dungeon.',
  },
  dominada: {
    id:'dominada',
    family:'futebol',
    next:'craque',
    name:'Dominada',
    icon:'💥',
    desc:'Ao cair no chão, a bola solta uma onda que empurra inimigos e causa 0.5 de dano. Requer Camisa 10.',
    requires:'camisa10',
  },
  craque: {
    id:'craque',
    family:'futebol',
    next:null,
    name:'CRAQUE',
    icon:'⭐',
    desc:'A bola de futebol fica MUITO maior, com área de colisão enorme.',
    requires:'dominada',
  },

  // SNIPER NO SCOPE FAMILY
  sniper_pierce: {
    id:'sniper_pierce',
    family:'sniper',
    next:'sniper_infinite',
    name:'Não Vale Se Esconder',
    icon:'👁️',
    desc:'As balas da sniper atravessam todos os inimigos.',
  },
  sniper_infinite: {
    id:'sniper_infinite',
    family:'sniper',
    next:'sniper_trickshot',
    name:'Munição Sem Fim',
    icon:'♾️',
    desc:'Cada mira acertada dispara 2 balas teleguiadas.',
    requires:'sniper_pierce',
  },
  sniper_trickshot: {
    id:'sniper_trickshot',
    family:'sniper',
    next:null,
    name:'Trickshot',
    icon:'🌀',
    desc:'Balas maiores que ricocheteiam nas paredes 3 vezes.',
    requires:'sniper_infinite',
  },

};

// Active buffs state
// (declared in state.js / constants.js)
// Which family members have been taken (to enforce next-required)
// (declared in state.js / constants.js)

// (declared in state.js / constants.js)

function getAvailableBuffs() {
  const taken = activeBuffs;
  const allIds = Object.keys(BUFF_DEFS);
  const equippedCards = new Set(currentEquippedDeck.filter(Boolean));

  // Filter: not already taken, prereqs met
  const eligible = allIds.filter(id => {
    if(taken.has(id)) return false;
    const def = BUFF_DEFS[id];
    if(def.requires && !taken.has(def.requires)) return false;
    // Card-family buffs only available if that card is equipped
    if(def.family === 'sword' && !equippedCards.has('sword')) return false;
    if(def.family === 'bow'   && !equippedCards.has('bow'))   return false;
    if(def.family === 'axe' && !equippedCards.has('axe')) return false;
    if(def.family === 'speed' && !equippedCards.has('speed_potion')) return false;
    if(def.family === 'bombinhas' && !equippedCards.has('bombinhas')) return false;
    if(def.family === 'katana' && !equippedCards.has('katana')) return false;
    if(def.family === 'pistol' && !equippedCards.has('pistol')) return false;
    if(def.family === 'necro' && !equippedCards.has('necro_staff')) return false;
    if(def.family === 'carne' && !equippedCards.has('meat')) return false;
    if(def.family === 'dado' && !equippedCards.has('dice')) return false;
    if(def.family === 'foice' && !equippedCards.has('scythe')) return false;
    if(def.family === 'futebol' && !equippedCards.has('soccerball')) return false;
    if(def.family === 'sniper' && !equippedCards.has('sniper_noscope')) return false;
    if(def.family === 'blast_shield' || id === 'blast_shield' || id === 'blast_damage' || id === 'blast_midas'){
      if(!equippedCards.has('blast')) return false;
    }
    return true;
  });
  return eligible;
}

function pickBuffChoices(n = 4) {
  const eligible = getAvailableBuffs();
  if(eligible.length === 0) return [];

  let choices = [];
  // If there's a pending family next, it MUST be one of the options
  if(pendingFamilyNext && eligible.includes(pendingFamilyNext)) {
    choices.push(pendingFamilyNext);
    pendingFamilyNext = null;
  }

  // Fill remaining slots randomly (no duplicates, not already chosen)
  const pool = shuffle(eligible.filter(id => !choices.includes(id)));
  while(choices.length < n && pool.length > 0) {
    choices.push(pool.shift());
  }

  return shuffle(choices);
}

// Dungeons de transição de fase (última dungeon de cada tema)
// blue→green: dungeon 3 | green→red: dungeon 7
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)

function showBuffScreen(dungeonNum) {
  buffScreenActive = true;
  paused = true;

  // Determina quantos picks o jogador tem
  const isPhaseTransition = PHASE_TRANSITION_DUNGEONS.has(dungeonNum);
  buffPicksRemaining = isPhaseTransition ? 2 : 1;

  _renderBuffScreen(dungeonNum, isPhaseTransition);
}

function _renderBuffScreen(dungeonNum, isPhaseTransition) {
  const numOptions = 4;
  const choices = pickBuffChoices(numOptions);

  if(choices.length === 0) {
    // Sem buffs disponíveis
    buffPicksRemaining = 0;
    buffScreenActive = false;
    paused = false;
    finishDungeonTransition();
    return;
  }

  // Título
  const label = document.getElementById('buff-dungeon-label');
  if(isPhaseTransition && buffPicksRemaining === 2) {
    label.innerHTML = `⚡ TRANSIÇÃO DE FASE — Dungeon ${dungeonNum} — Escolha <strong>2 buffs!</strong> (${buffPicksRemaining} restantes)`;
    label.style.color = '#ffcc44';
  } else if(isPhaseTransition && buffPicksRemaining === 1) {
    label.innerHTML = `⚡ TRANSIÇÃO DE FASE — Dungeon ${dungeonNum} — Escolha mais <strong>1 buff!</strong>`;
    label.style.color = '#ffaa22';
  } else {
    label.innerHTML = `Dungeon ${dungeonNum} completada — escolha sua melhoria:`;
    label.style.color = '';
  }

  // Header da tela
  const h2 = document.querySelector('#buff-screen h2');
  if(h2) {
    h2.textContent = isPhaseTransition ? '⚡ BÔNUS DE FASE' : '✨ ESCOLHA UM BUFF';
    h2.style.color = isPhaseTransition ? '#ffcc44' : '';
  }

  const choicesEl = document.getElementById('buff-choices');
  choicesEl.innerHTML = '';
  // Layout de 4 cartas em grade 2x2
  choicesEl.style.gridTemplateColumns = 'repeat(2, 1fr)';

  choices.forEach(id => {
    const def = BUFF_DEFS[id];
    const card = document.createElement('div');
    card.className = `buff-card family-${def.family}`;
    card.innerHTML = `<div class="buff-icon">${def.icon}</div><div class="buff-name">${def.name}</div><div class="buff-desc">${def.desc}</div><div class="buff-family">${def.family.toUpperCase()}</div>`;
    card.onclick = () => applyBuff(id, dungeonNum, isPhaseTransition);
    choicesEl.appendChild(card);
  });

  document.getElementById('buff-screen').style.display = 'flex';
}

function applyBuff(id, dungeonNum, isPhaseTransition) {
  const def = BUFF_DEFS[id];
  activeBuffs.add(id);
  Audio.buffPick();

  if(def.next) pendingFamilyNext = def.next;

  switch(id) {
    case 'vida1': player.maxHp += 1; player.hp += 1; updateHPDisplay(); break;
    case 'vida2': player.maxHp += 2; player.hp += 2; updateHPDisplay(); break;
    case 'vida3': player.maxHp += 3; player.hp += 3; updateHPDisplay(); break;
    case 'mage':
      manaChargeRate *= 0.8;
      break;
    case 'archmage':
      maxMana = 10;
      updateManaDisplay();
      break;
    case 'contemplate':
      manaChargeRate *= (1 / 1.5);
      break;
  }

  updateBuffListDisplay();
  buffPicksRemaining--;

  if(buffPicksRemaining > 0) {
    // Ainda tem picks — re-renderiza a tela com novas opções
    _renderBuffScreen(dungeonNum, isPhaseTransition);
  } else {
    // Acabou os picks
    document.getElementById('buff-screen').style.display = 'none';
    buffScreenActive = false;
    paused = false;
    // Reset header style
    const h2 = document.querySelector('#buff-screen h2');
    if(h2) { h2.textContent = '✨ ESCOLHA UM BUFF'; h2.style.color = ''; }
    finishDungeonTransition();
  }
}

function updateBuffListDisplay() {
  const el = document.getElementById('buff-active-list');
  if(activeBuffs.size === 0){ el.innerHTML=''; return; }
  let html = '';
  activeBuffs.forEach(id => {
    const def = BUFF_DEFS[id];
    const family = def.family || 'isolado';
    html += `<div class="buff-mini-card family-${family}" title="${def.name}">
      <span class="buff-mini-icon">${def.icon}</span>
      <div class="buff-mini-tooltip">
        <div class="buff-mini-tooltip-name">${def.icon} ${def.name}</div>
        <div class="buff-mini-tooltip-desc">${def.desc}</div>
      </div>
    </div>`;
  });
  el.innerHTML = html;
}

// (declared in state.js / constants.js)
