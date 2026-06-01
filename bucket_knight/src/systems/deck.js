// (declared in state.js)
// (declared in state.js)
// (declared in state.js)
// (declared in state.js)
// (declared in state.js)
// (declared in state.js)
// (declared in state.js)
// (declared in state.js)
// (declared in state.js)
// (declared in state.js)
// (declared in state.js)
// (declared in state.js)
// (declared in state.js)
// (declared in state.js)
// (declared in state.js)
// (declared in state.js)
// (declared in state.js)
// (declared in state.js)
// (declared in state.js)
// (declared in state.js)
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)

// ── FOICE ──
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)
// Sistema de munição da foice (estilo Brawl Stars)
// (declared in state.js / constants.js)
const SCYTHE_AMMO_RECHARGE_MS = 1200; // ms por barra
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)

// ── PISTOLA ──
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)
const PISTOL_FIRE_RATE = 120;  // ms entre tiros ao segurar

// ── ARMADURA DE COURO ──
// (declared in state.js / constants.js)

// ── PROTOROBÔ-9500 ──
// (declared in state.js / constants.js)
const ROBOT_FIRE_RATE = 150;   // ms entre tiros do robô
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)

// Luva de Técnico: +1s em armas com duração
function getDurationBonus(){
  if(typeof hasArtifactEffect === 'function' && hasArtifactEffect('duration_plus_1')){
    return (typeof getArtifactUpgradeValue === 'function') ? (getArtifactUpgradeValue('tech_glove') || 1000) : 1000;
  }
  return 0;
}

// ── CARTA ESPECIAL ──
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)
// SPECIAL_DURATION is now dynamic — use getSpecialDuration() instead
function getSpecialDuration() {
  // specialUpgradeLevel is defined in the first script block
  const level = (typeof specialUpgradeLevel !== 'undefined') ? specialUpgradeLevel : 1;
  return 5000 + (level - 1) * 1250;
}
// (declared in state.js / constants.js)
let laserAngle = 0;                // angle from left-side position toward arena
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)

function shuffle(arr) {
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

// ── SISTEMA CLASH ROYALE ─────────────────────────────────────────────────────
// O deck é uma fila cíclica: 1 cópia de cada carta equipada, embaralhada.
// Quando o deck acaba, recomeça com nova ordem aleatória.
// Sem peso por raridade — todas as cartas têm a mesma frequência.

function buildCycleDeck() {
  const equipped = currentEquippedDeck.filter(Boolean);
  const pool = equipped.length > 0 ? [...equipped] : ['sword','meat'];
  deck = shuffle(pool);
}

function drawFromDeck() {
  if(deck.length === 0) buildCycleDeck();
  if(deck.length === 0) return null;

  // Evita repetição: pula cartas que já estão na mão (como no Clash Royale)
  const inHand = new Set((hand || []).filter(Boolean));
  // Tenta encontrar uma carta que não está na mão
  let idx = deck.findIndex(id => !inHand.has(id));
  if(idx === -1) {
    // Todas as cartas do deck estão na mão — recicla sem restrição
    idx = 0;
  }
  const [drawn] = deck.splice(idx, 1);
  return drawn;
}

// Retorna array com as próximas N cartas da fila sem remover
function peekNextCards(n) {
  const result = [];
  for(let i = 0; i < n && i < deck.length; i++) result.push(deck[i]);
  return result;
}

function buildHand() {
  hand=[];
  for(let i=0;i<HAND_SIZE;i++) hand.push(drawFromDeck());
  renderHand();
}

function replaceCard(slotIndex) {
  const drawn=drawFromDeck();
  hand[slotIndex]=drawn;
  renderHand(slotIndex);
  updateDeckDisplay();
}

function renderHand(animSlot=-1) {
  const area=document.getElementById('cards-area');
  area.innerHTML='';
  hand.forEach((id,i)=>{
    const def=id?CARD_DEFS[id]:null;
    const div=document.createElement('div');
    const rar=def?def.rarity:'comum';
    div.className='card rarity-'+rar+(i===animSlot?' drawing':'');
    div.id='hand-slot-'+i;
    if(!def){ div.style.opacity='0.15'; div.style.cursor='default'; div.innerHTML='<div style="font-size:22px">🂠</div><div class="card-name">vazio</div>'; area.appendChild(div); return; }
    const canUse=mana>=(id==='meat'&&(activeBuffs.has('cook2')?1:activeBuffs.has('cook')?2:def.mana));
    if(!canUse) div.classList.add('disabled');
    const rarDef=RARITIES[rar];
    const displayMana = (id==='meat') ? (activeBuffs.has('cook2') ? 1 : activeBuffs.has('cook') ? 2 : def.mana) : (id==='dice' && activeBuffs.has('cowhand')) ? 0 : def.mana;
    div.innerHTML=`<span class="card-key">${i+1}</span><div class="card-icon">${def.icon}</div><div class="card-name">${def.name}</div><div class="card-mana">💧 ${displayMana}</div><div class="card-rarity rarity-label-${rar}">${rarDef.label}</div><div class="card-discard-hint">▶ dir: descartar</div>`;
    div.onclick=()=>useCardSlot(i);
    div.addEventListener('contextmenu', (e)=>{ e.preventDefault(); discardCard(i); });
    area.appendChild(div);
  });
  updateDeckDisplay();
}

function discardCard(slotIndex) {
  const id = hand[slotIndex];
  if(!id || gameOver) return;
  // Limite de descartes por dungeon
  if(discardCount >= MAX_DISCARDS_PER_DUNGEON) {
    // Feedback visual: faz o card tremer
    const el = document.getElementById('hand-slot-'+slotIndex);
    if(el){ el.style.animation='none'; el.offsetHeight; el.style.animation='shake 0.3s ease'; }
    return;
  }
  discardCount++;
  updateDiscardDisplay();
  // Se essa carta for o efeito ativo (arma em uso), cancela o efeito também
  if(id === activeEffect && slotIndex === activeEffectSlot){
    activeEffect=null; activeEffectSlot=-1; effectTimer=0;
    arrows=0; quivers=[]; quiverCount=0; quiverSpawnTimer=0;
    document.getElementById('arrows-display').textContent='';
    document.querySelectorAll('.card').forEach(c=>c.classList.remove('active-card'));
    updateEffectDisplay();
  }
  // Mostra partículas de descarte
  addParticles(player.x, player.y, '#aa4444', 6);
  replaceCard(slotIndex);
}

function updateDiscardDisplay(){
  const el = document.getElementById('discard-count-display');
  if(!el) return;
  const remaining = MAX_DISCARDS_PER_DUNGEON - discardCount;
  // Ícones preenchidos e vazios para mostrar usos restantes
  const pips = '🗑️ ' + '◆'.repeat(remaining) + '◇'.repeat(MAX_DISCARDS_PER_DUNGEON - remaining);
  el.textContent = pips;
  if(remaining === 0){
    el.style.color = '#ff4444';
    el.style.borderColor = '#aa2222';
    el.style.background = 'rgba(80,0,0,0.55)';
    el.style.textShadow = '0 0 8px #ff2222';
  } else if(remaining <= 2){
    el.style.color = '#ffaa00';
    el.style.borderColor = '#886600';
    el.style.background = 'rgba(60,40,0,0.55)';
    el.style.textShadow = '0 0 6px #ffaa00';
  } else {
    el.style.color = '#aaddaa';
    el.style.borderColor = '#445544';
    el.style.background = 'rgba(0,0,0,0.5)';
    el.style.textShadow = '';
  }
}

function updateDeckDisplay(){
  // Atualiza o painel "A SEGUIR" com as próximas 3 cartas da fila
  const list = document.getElementById('next-cards-list');
  if(!list) return;
  const next = peekNextCards(3);
  list.innerHTML = next.map((id, i) => {
    const def = CARD_DEFS[id];
    if(!def) return '';
    const rar = def.rarity || 'comum';
    const shortName = def.name.length > 7 ? def.name.slice(0,6)+'…' : def.name;
    return `<div class="next-card-mini rarity-${rar}">
      <div class="next-card-mini-icon">${def.icon}</div>
      <div class="next-card-mini-name">${shortName}</div>
    </div>`;
  }).join('');
}

function updateCardStates(){
  hand.forEach((id,i)=>{
    const el=document.getElementById('hand-slot-'+i);
    if(!el||!id) return;
    const def=CARD_DEFS[id];
    const actualCost = (id==='meat') ? (activeBuffs.has('cook2') ? 1 : activeBuffs.has('cook') ? 2 : def.mana) : (id==='dice' && activeBuffs.has('cowhand')) ? 0 : def.mana;
    // Weapon blocked by another active weapon
    const weaponBlocked = WEAPON_CARDS.has(id) && activeEffect && WEAPON_CARDS.has(activeEffect) && id!==activeEffect;
    // Support blocked if same support already active
    const supportBlocked = (id==='speed_potion' && potionActive) || (id==='bombinhas' && bombinhasActive) || (id==='necro_staff' && necroStaffActive);
    el.classList.toggle('disabled', mana<actualCost || weaponBlocked || supportBlocked);
    if(activeEffect && id===activeEffect && i===activeEffectSlot) el.classList.add('active-card');
    else if((id==='speed_potion' && potionActive) || (id==='bombinhas' && bombinhasActive) || (id==='necro_staff' && necroStaffActive && i===necroStaffSlot)) el.classList.add('active-card');
    else el.classList.remove('active-card');
  });
}

// (declared in state.js / constants.js)

// Weapon cards (can't swap while another weapon is active)
// (declared in state.js / constants.js)
// Support cards: can be used alongside weapons (two independent slots)
// (declared in state.js / constants.js)

// Slot independente para poção
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)

// Slot independente para bombinhas
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)

// Slot independente para bola de futebol
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)
// (declared in state.js / constants.js)

function useCardSlot(slotIndex) {
  const id=hand[slotIndex];
  if(!id||gameOver) return;
  const def=CARD_DEFS[id];
  if(mana<def.mana) return;

  // Block weapon swap: if a weapon is active and this card is also a weapon, deny
  if(WEAPON_CARDS.has(id) && activeEffect && WEAPON_CARDS.has(activeEffect)) return;
  if(id==='meat'){
    if(player.hp>=player.maxHp) return;
    const meatCost = activeBuffs.has('cook2') ? 1 : activeBuffs.has('cook') ? 2 : def.mana;
    const meatHeal = activeBuffs.has('cook') ? 2 : 1;
    if(mana<meatCost) return;
    mana-=meatCost;
    player.hp=Math.min(player.maxHp,player.hp+meatHeal);
    updateHPDisplay(); updateManaDisplay();
    Audio.heal();
    addParticles(player.x,player.y,'#ff6688',12);
    // cook3: 30% de chance de dar 2 de mana
    if(activeBuffs.has('cook3')){
      if(Math.random() < 0.30){
        mana = Math.min(maxMana, mana + 2);
        updateManaDisplay();
        showDiceResultText('+2🔮 (Master Chefe)', '#aa88ff');
        addParticles(player.x, player.y, '#aa88ff', 10);
      }
    }
    replaceCard(slotIndex);
    return;
  }

  if(id==='blast'){
    mana-=def.mana; updateManaDisplay();
    blastWave={x:player.x,y:player.y,r:0,maxR:200,life:1};
    Audio.blast();
    const blastDmg = activeBuffs.has('blast_damage') ? 2 : 1;
    const blastShield = activeBuffs.has('blast_shield');
    const blastMidas = activeBuffs.has('blast_midas');
    if(blastShield){ player.invincible=Math.max(player.invincible, 3000); addParticles(player.x,player.y,'#88ffff',16); }
    slimes.forEach(sl=>{
      const dx=sl.x-player.x,dy=sl.y-player.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<200&&dist>0){
        const force=(1-(dist/200))*1.8;
        sl.x+=(dx/dist)*220*force; sl.y+=(dy/dist)*220*force; clampToDungeon(sl);
        sl.hp-=blastDmg; sl.killedByPlayer=true; sl.hitFlash=300; spawnDamageNumber(sl.x, sl.y, blastDmg, false);
        if(blastMidas) sl.goldDouble=true;
        addParticles(sl.x,sl.y,'#ff8833',8);
      }
    });
    blueSlimes.forEach(sl=>{
      const dx=sl.x-player.x,dy=sl.y-player.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<200&&dist>0){
        const force=(1-(dist/200))*1.8;
        sl.x+=(dx/dist)*220*force; sl.y+=(dy/dist)*220*force; clampToDungeon(sl);
        sl.hp-=blastDmg; sl.killedByPlayer=true; sl.hitFlash=300; spawnDamageNumber(sl.x, sl.y, blastDmg, false);
        if(blastMidas) sl.goldDouble=true;
        addParticles(sl.x,sl.y,'#4488ff',8);
      }
    });
    redSlimes.forEach(sl=>{
      const dx=sl.x-player.x,dy=sl.y-player.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<200&&dist>0){
        const force=(1-(dist/200))*1.8;
        sl.x+=(dx/dist)*220*force; sl.y+=(dy/dist)*220*force; clampToDungeon(sl);
        sl.hp-=blastDmg; sl.killedByPlayer=true; sl.hitFlash=300; spawnDamageNumber(sl.x, sl.y, blastDmg, false);
        if(blastMidas) sl.goldDouble=true;
        addParticles(sl.x,sl.y,'#ff4422',8);
      }
    });
    bombHeads.forEach(b=>{
      if(b.state==='air') return;
      const dx=b.x-player.x,dy=b.y-player.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<200&&dist>0){
        const force=(1-(dist/200))*1.8;
        b.x+=(dx/dist)*180*force; b.y+=(dy/dist)*180*force; clampToDungeon(b);
        b.hp-=blastDmg; b.killedByPlayer=true; b.hitFlash=300; spawnDamageNumber(b.x, b.y, blastDmg, false);
        if(blastMidas) b.goldDouble=true;
        addParticles(b.x,b.y,'#ff8833',6);
      }
    });
    assassinRats.forEach(r=>{
      const dx=r.x-player.x,dy=r.y-player.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<200&&dist>0){
        const force=(1-(dist/200))*1.8;
        r.x+=(dx/dist)*200*force; r.y+=(dy/dist)*200*force; clampToDungeon(r);
        r.hp-=blastDmg; r.killedByPlayer=true; r.hitFlash=300; spawnDamageNumber(r.x, r.y, blastDmg, false);
        if(blastMidas) r.goldDouble=true;
        if(r.state==='dash'||r.state==='windup') r.state='chase';
        addParticles(r.x,r.y,'#ff8833',6);
      }
    });
    ghosts.forEach(g=>{
      const dx=g.x-player.x,dy=g.y-player.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<200&&dist>0){
        const force=(1-(dist/200))*1.8;
        g.x+=(dx/dist)*160*force; g.y+=(dy/dist)*160*force; clampToDungeon(g);
        g.hp-=blastDmg; g.killedByPlayer=true; g.hitFlash=300;
        addParticles(g.x,g.y,'#aaddff',6); spawnDamageNumber(g.x, g.y, blastDmg, false);
      }
    });
    golems.forEach(g=>{
      if(g.state==='sleeping') return; // imortal
      const dx=g.x-player.x,dy=g.y-player.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<200&&dist>0){
        const force=(1-(dist/200))*0.8; // golem pesado, empurra menos
        g.x+=(dx/dist)*80*force; g.y+=(dy/dist)*80*force; clampToDungeon(g);
        g.hp-=blastDmg; g.killedByPlayer=true; g.hitFlash=300;
        if(blastMidas) g.goldDouble=true;
        addParticles(g.x,g.y,'#888888',6); spawnDamageNumber(g.x, g.y, blastDmg, false);
      }
    });
    addParticles(player.x,player.y,'#ff8833',24);
    replaceCard(slotIndex);
    return;
  }

  if(id==='bow'){
    if(activeEffect==='bow') return; // já ativo
    mana-=def.mana; updateManaDisplay();
    activeEffect='bow'; activeEffectSlot=slotIndex; effectTimer=9999999; // sem timer, dura enquanto tiver flechas
    arrows= 5;
    quivers=[]; quiverCount=0; quiverSpawnTimer=0;
    document.getElementById('arrows-display').textContent=`🏹 x${arrows}`;
    updateEffectDisplay(); updateCardStates();
    addParticles(player.x,player.y,'#88ccff',12);
    return;
  }

  if(id==='pistol'){
    if(activeEffect==='pistol') return; // já ativo
    mana -= def.mana; updateManaDisplay();
    activeEffect = 'pistol'; activeEffectSlot = slotIndex; effectTimer = 9999999;
    pistolActive = true;
    pistolAmmo = activeBuffs.has('gun_ammo') ? 60 : 40;
    pistolSlot = slotIndex;
    pistolFireTimer = 0;
    document.getElementById('arrows-display').textContent = `🔫 x${pistolAmmo}`;
    updateEffectDisplay(); updateCardStates();
    addParticles(player.x, player.y, '#ffcc44', 12);
    return;
  }


  if(id==='speed_potion'){
    // Support card: runs independently, stacks with active weapon
    mana -= def.mana;
    potionActive = true;
    potionTimer = activeBuffs.has('speed_dash') ? 8000 : 5000;
    updateManaDisplay();
    updateSecondaryEffectDisplay();
    updateCardStates();
    addParticles(player.x, player.y, '#88ffff', 14);
    replaceCard(slotIndex);
    return;
  }

  if(id==='bombinhas'){
    // Support card: gives bomb ammo, runs independently
    mana -= def.mana;
    const maxAmmo = activeBuffs.has('bomb_tech') ? 8 : 5;
    bombAmmo = maxAmmo;
    bombinhasActive = true;
    updateManaDisplay();
    updateSecondaryEffectDisplay();
    updateCardStates();
    addParticles(player.x, player.y, '#ff8844', 14);
    replaceCard(slotIndex);
    return;
  }

  if(id==='axe'){
    mana -= def.mana;

    activeEffect = 'axe';
    activeEffectSlot = slotIndex;

    effectTimer = (activeBuffs.has('axe_duration') ? 7000 : 4000) + getDurationBonus();

    updateManaDisplay();
    updateEffectDisplay();
    updateCardStates();

    addParticles(player.x, player.y, '#cccccc', 12);
    return;
  }


  if(id==='necro_staff'){
    mana -= def.mana; // custa 2 de mana para ativar
    const amount = activeBuffs.has('necro_more') ? 6 : 4;
    // Ativa o cajado com munição — cada esqueleto invocado custa 1 mana
    necroStaffActive = true;
    necroStaffAmmo = amount;
    necroStaffSlot = slotIndex;
    updateManaDisplay();
    updateNecroDisplay();
    updateCardStates();
    addParticles(player.x, player.y, '#ddddff', 14);
    return;
  }

  if(id==='katana'){
    mana -= def.mana;
    activeEffect = 'katana';
    activeEffectSlot = slotIndex;
    effectTimer = (activeBuffs.has('bloodlust') ? 6000 : 3000) + getDurationBonus();
    if(activeBuffs.has('samurai')) player.invincible = effectTimer + 500;
    katanaSlashes = [];
    katanaDrawing = false;
    updateManaDisplay();
    updateEffectDisplay();
    updateCardStates();
    addParticles(player.x, player.y, '#cc44ff', 16);
    return;
  }

  if(id==='dice'){
    const diceCost = activeBuffs.has('cowhand') ? 0 : def.mana;
    if(mana < diceCost) return;
    mana -= diceCost;
    updateManaDisplay();
    useDiceCard(slotIndex);
    return;
  }

  if(id==='soccerball'){
    // Se já há uma bola ativa ou pending, ignorar
    if(soccerBall || soccerBallPending) return;
    mana -= def.mana; updateManaDisplay();
    soccerBallPending = true;
    soccerBallPendingSlot = slotIndex;
    updateCardStates();
    addParticles(player.x, player.y, '#ffffff', 10);
    return;
  }

  if(id==='sniper_noscope'){
    if(activeEffect==='sniper_noscope') return; // já ativo
    mana -= def.mana; updateManaDisplay();
    activeEffect = 'sniper_noscope'; activeEffectSlot = slotIndex;
    effectTimer = 9999999;
    sniperActive = false; // fica ativo só após minigame
    sniperAmmo = 0;
    sniperSlot = slotIndex;
    sniperFireTimer = 0;
    sniperMinigameActive = true;
    sniperMinigameHits = 0;
    sniperMinigameDone = false;
    sniperCurrentTargetDuration = 2000; // 2s na primeira mira
    sniperMinigameTargets = [];
    sniperSpinAngle = 0;
    sniperEquipAnim = 800; // 800ms de animação girando
    // Spawn primeira mira após animação
    setTimeout(() => {
      if(sniperMinigameActive && !sniperMinigameDone) spawnSniperTarget();
    }, 900);
    document.getElementById('arrows-display').textContent = `🎯 mirando...`;
    updateEffectDisplay(); updateCardStates();
    addParticles(player.x, player.y, '#ff8800', 14);
    return;
  }

  if(id==='scythe'){
    mana -= def.mana;
    activeEffect = 'scythe';
    activeEffectSlot = slotIndex;
    effectTimer = def.duration + getDurationBonus();
    scytheCombo = 0;
    scytheAmmo = SCYTHE_MAX_AMMO;
    scytheAmmoTimer = 0;
    updateManaDisplay(); updateEffectDisplay(); updateCardStates();
    addParticles(player.x, player.y, '#aa55ff', 14);
    return;
  }

  // Timed effects (sword)
  mana-=def.mana;
  activeEffect=id; activeEffectSlot=slotIndex; effectTimer=def.duration + getDurationBonus();
  updateManaDisplay(); updateEffectDisplay(); updateCardStates();
  addParticles(player.x,player.y,'#ffdd44',12);
}

