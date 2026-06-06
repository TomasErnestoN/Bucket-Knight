// ─── DAMAGE NUMBERS ─────────────────────────────────────────────────────
// (declared in state.js)

function spawnDamageNumber(x, y, amount, isPlayer) {
  if(!amount || amount <= 0) return;
  const amt = Math.round(amount * 10) / 10;

  let text, color, shadowColor, fontSize, isHeart;

  if(isPlayer) {
    // Dano no player: coração vermelho + número
    isHeart = true;
    text = `💔 -${amt}`;
    color = '#ff3333';
    shadowColor = '#aa0000';
    fontSize = amt >= 3 ? 22 : 17;
  } else {
    // Dano em inimigos — 3 tiers
    isHeart = false;
    if(amt >= 8) {
      // CRÍTICO — vermelho grande
      text = `-${amt}`;
      color = '#ff2222';
      shadowColor = '#ff0000';
      fontSize = 30;
    } else if(amt >= 2) {
      // Médio — laranja
      text = `-${amt}`;
      color = '#ff8800';
      shadowColor = '#cc4400';
      fontSize = 20;
    } else {
      // Leve — branco pequeno
      text = `-${amt}`;
      color = '#ffffff';
      shadowColor = '#888888';
      fontSize = 14;
    }
  }

  // Spread horizontal leve para não empilhar
  const ox = (Math.random() - 0.5) * 20;
  const oy = -30 - Math.random() * 15;
  const life = isPlayer ? 1.8 : (amt >= 8 ? 1.6 : 1.2);

  damageNumbers.push({
    text, color, shadowColor, fontSize,
    x: x + ox, y: y + oy,
    vy: -0.045 - (amt >= 8 ? 0.02 : 0),
    life, maxLife: life,
    scale: amt >= 8 ? 1.0 : 1.0, // começa normal, cresce no impacto
    punch: amt >= 8 ? 0.3 : 0.15, // timer do "punch" de escala
  });
}

function updateDamageNumbers(dt) {
  damageNumbers.forEach(d => {
    d.life -= dt / 1000;
    d.y += d.vy * dt;
    if(d.punch > 0) {
      d.punch -= dt / 1000;
      const t = 1 - d.punch / 0.3;
      d.scale = 1 + Math.sin(t * Math.PI) * (d.fontSize >= 28 ? 0.5 : 0.3);
    } else {
      d.scale = 1;
    }
  });
  damageNumbers = damageNumbers.filter(d => d.life > 0);
}

function drawDamageNumbers() {
  damageNumbers.forEach(d => {
    const alpha = Math.min(1, d.life / d.maxLife * 2.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(d.x, d.y);
    ctx.scale(d.scale, d.scale);
    ctx.font = `900 ${d.fontSize}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Sombra/outline para legibilidade
    ctx.strokeStyle = d.shadowColor;
    ctx.lineWidth = d.fontSize >= 24 ? 5 : 3;
    ctx.lineJoin = 'round';
    ctx.strokeText(d.text, 0, 0);
    ctx.fillStyle = d.color;
    ctx.fillText(d.text, 0, 0);
    ctx.restore();
  });
}
// ─── END DAMAGE NUMBERS ─────────────────────────────────────────────────

function spawnCoins(x,y,count){
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2;
    const spd=2.5+Math.random()*3.5;
    const ox=Math.cos(a)*spd*4, oy=Math.sin(a)*spd*4; // burst offset
    coins.push({
      x:x+Math.cos(a)*10, y:y+Math.sin(a)*10,
      vx:Math.cos(a)*spd, vy:Math.sin(a)*spd-3,
      bob:Math.random()*Math.PI*2,
      life:1, collected:false,
      // settle position after burst
      tx:x+ox, ty:y+oy,
      settling:true, settleTimer:0
    });
  }
}

// Get the gold counter DOM position in canvas coords
function getGoldCounterPos(){
  const el=document.getElementById('gold-display-hud')||document.getElementById('gold-display');
  const r=el.getBoundingClientRect();
  return {x: r.left+r.width/2, y: r.top+r.height/2};
}

function collectCoin(coin){
  coin.collected=true;
  Audio.coinReal();
  const target=getGoldCounterPos();
  flyingCoins.push({
    x:coin.x, y:coin.y,
    tx:target.x, ty:target.y,
    progress:0, speed:0.04+Math.random()*0.02,
    // bezier control point (arc up)
    cx:(coin.x+target.x)/2+(Math.random()-0.5)*120,
    cy:Math.min(coin.y,target.y)-80-Math.random()*60,
  });
}

function updateGoldDisplay(){
  const txt=`🪙 ${gold}`;
  document.getElementById('gold-display').textContent=txt;
  const hud=document.getElementById('gold-display-hud');
  if(hud){
    hud.textContent=txt;
    hud.style.transform='scale(1.35)';
    hud.style.transition='transform 0.1s';
    setTimeout(()=>{hud.style.transform='scale(1)';hud.style.transition='transform 0.2s';},100);
  }
}

function triggerGameOver(){
  gameOver=true;
  Audio.gameOver();
  // Acumula o ouro ganho nessa run no ouro persistente e salva
  persistentGold += gold;
  writeSave();
  document.getElementById('gameover-gold').textContent='🪙 '+gold+' moedas coletadas (total: '+persistentGold+')';
  document.getElementById('gameover').style.display='flex';
}

function updateHPDisplay(){
  let s='';
  // Armadura de couro: mostra escudo antes dos corações
  for(let i=0;i<playerArmorHp;i++) s+='🛡️';
  for(let i=0;i<player.maxHp;i++)s+=i<player.hp?'❤':'🖤';
  const el=document.getElementById('hp-display-new');
  if(el) el.textContent=s;
  // legacy (hidden)
  const old=document.getElementById('hp-display');
  if(old) old.textContent=s;
}

// Wrapper para dano ao player — absorve com armadura de couro se disponível
function damagePlayer(amount){
  if(playerArmorHp > 0){
    playerArmorHp = Math.max(0, playerArmorHp - amount);
    addParticles(player.x, player.y, '#aa8833', 10);
    if(typeof showDiceResultText === 'function') showDiceResultText('🛡️ Armadura!', '#aa8833');
    updateHPDisplay();
    return; // dano absorvido
  }
  player.hp -= amount;
  updateHPDisplay();
}

function updateManaDisplay(){
  const bar=document.getElementById('mana-pips');
  if(bar){
    bar.innerHTML='';
    for(let i=0;i<maxMana;i++){const p=document.createElement('div');p.className='mana-pip'+(i<mana?' full':'');bar.appendChild(p);}
  }
  // legacy hidden bar
  const old=document.getElementById('mana-bar');
  if(old){old.innerHTML='';for(let i=maxMana-1;i>=0;i--){const p=document.createElement('div');p.className='mana-pip'+(i<mana?' full':'');old.appendChild(p);}}
  updateCardStates();
}

function updateEffectDisplay(){
  const el=document.getElementById('effect-display');
  if(activeEffect==='sword') el.textContent=`⚔ ESPADA ATIVA: ${Math.ceil(effectTimer/1000)}s`;
  else if(activeEffect==='bow') el.textContent=`🏹 ARCO ATIVO — segure p/ carregar, solte p/ atirar`;
  else if(activeEffect==='pistol') el.textContent=`🔫 PISTOLA — clique p/ atirar`;
  else if(activeEffect==='sniper_noscope'){
    if(sniperMinigameActive) el.textContent=`🎯 CLIQUE NAS MIRAS! — ${sniperMinigameHits} acertos`;
    else if(sniperActive) el.textContent=`🔫 SNIPER — segure p/ atirar (x${sniperAmmo})`;
    else el.textContent=`🎯 SNIPER — equipando...`;
  }
  else if(activeEffect==='katana') el.textContent=`🗡️ KATANA: ${Math.ceil(effectTimer/1000)}s — arraste p/ cortar`;
  else if(activeEffect==='axe') el.textContent=`🪓 MACHADO ATIVO: ${Math.ceil(effectTimer/1000)}s`;
  else el.textContent='';
}

// (declared in state.js)
function updateNecroDisplay(){
  if(!secondaryEffectEl){
    secondaryEffectEl = document.createElement('div');
    secondaryEffectEl.id = 'secondary-effect-display';
    secondaryEffectEl.style.cssText = 'position:absolute;top:58px;left:50%;transform:translateX(-50%);color:#44ffdd;font-size:12px;text-align:center;font-family:Courier New,monospace;pointer-events:none;line-height:1.6;';
    document.getElementById('ui').appendChild(secondaryEffectEl);
  }
  let lines = [];
  if(potionActive) lines.push(`🧪 POÇÃO: ${Math.ceil(potionTimer/1000)}s`);
  if(bombinhasActive) lines.push(`🧨 BOMBINHAS x${bombAmmo} — clique direito p/ lançar`);
  if(necroStaffActive) lines.push(`☠️ CAJADO x${necroStaffAmmo} — clique p/ invocar`);
  secondaryEffectEl.innerHTML = lines.join('<br>');
}
function updateSecondaryEffectDisplay(){ updateNecroDisplay(); }

function updateSpecialCardUI(){
  const slot = document.getElementById('special-card-slot');
  if(!slot) return;
  // Sync icon and name to equippedSpecial
  const iconEl = document.getElementById('special-card-icon');
  const nameEl = document.getElementById('special-card-name');
  if(iconEl && nameEl){
    if(equippedSpecial === 'glitch_fury'){ iconEl.textContent = '📛'; nameEl.textContent = 'GLITCH FURY'; }
    else if(equippedSpecial === 'black_magic'){ iconEl.textContent = '🌑'; nameEl.textContent = 'MAGIA NEGRA'; }
  }
  const card = document.getElementById('special-card');
  const fill = document.getElementById('special-charge-bar-fill');
  const label = document.getElementById('special-charge-label');
  const sub = document.getElementById('special-card-sub');
  const pct = equippedSpecial === 'black_magic' ? Math.min(1, specialChargeKills / SPECIAL_CHARGE_GOAL) * 100 : 0;
  fill.style.width = pct + '%';
  label.textContent = specialActive
    ? `⚡ ${Math.ceil(specialTimer/1000)}s`
    : equippedSpecial === 'black_magic' ? `${specialChargeKills} / ${SPECIAL_CHARGE_GOAL}` : '';
  // Update duration label dynamically
  if(sub){
    if(equippedSpecial === 'black_magic'){
      const durSec = (getSpecialDuration()/1000).toFixed(2).replace(/\.?0+$/,'');
      const lvl = (typeof specialUpgradeLevel !== 'undefined') ? specialUpgradeLevel : 1;
      const stars = '★'.repeat(lvl);
      sub.textContent = `${durSec}s · laser · ${stars}`;
    }
  }
  if(specialActive){
    card.className = 'active-special';
  } else if(specialReady){
    card.className = '';
  } else {
    card.className = 'not-ready';
  }
}

function useSpecialCard(){
  // Route to correct special based on equippedSpecial
  if(equippedSpecial === 'glitch_fury'){
    if(typeof useGlitchFuryCard === 'function') useGlitchFuryCard();
    return;
  }
  if(!specialReady || specialActive || gameOver || paused || transitioning) return;
  if(equippedSpecial !== 'black_magic') return;
  Audio.specialActivate();
  specialReady = false;
  specialChargeKills = 0;
  specialActive = true;
  const dur = getSpecialDuration();
  specialTimer = dur;
  laserActive = false;
  // Save player position and move player ABOVE the dungeon (3D flying effect)
  playerSavedPos = {x: player.x, y: player.y};
  playerInSpecial = true;
  // Start above the dungeon center
  player.x = W / 2;
  player.y = DY - 120;
  player.invincible = dur + 500;
  addParticles(playerSavedPos.x, playerSavedPos.y, '#ff22aa', 20);
  updateSpecialCardUI();
}



