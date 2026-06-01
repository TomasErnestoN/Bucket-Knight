// ─── FOICE ────────────────────────────────────────────────────────────────
function doScytheAttack() {
  if(activeEffect !== 'scythe') return;

  // Checar munição
  if(scytheAmmo <= 0) return; // sem munição
  scytheAmmo--;
  if(scytheAmmo < SCYTHE_MAX_AMMO && scytheAmmoTimer <= 0) scytheAmmoTimer = SCYTHE_AMMO_RECHARGE_MS;

  const combo = scytheCombo;
  scytheCombo = (scytheCombo + 1) % 3;

  // Helper: hit all enemies in radius with given damage
  const hitEnemiesRadius = (cx, cy, radius, dmg, pushForce) => {
    const tryHit = (en) => {
      const dx = en.x - cx, dy = en.y - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if(dist < radius) {
        en.hp -= dmg; en.hitFlash = 200; en.killedByPlayer = true; spawnDamageNumber(en.x, en.y, dmg, false);
        if(dist > 0 && pushForce > 0){ en.x += (dx/dist)*pushForce; en.y += (dy/dist)*pushForce; }
        addParticles(en.x, en.y, '#dd66ff', 5);
        scytheKills++; checkScytheKillBuffs();
      }
    };
    slimes.forEach(tryHit);
    blueSlimes.forEach(tryHit);
    redSlimes.forEach(tryHit);
    if(bombHeads) bombHeads.forEach(b=>{ if(b.state!=='air') tryHit(b); });
    assassinRats.forEach(tryHit);
    ghosts.forEach(tryHit);
    golems.forEach(g=>{ if(g.state!=='sleeping') tryHit(g); });
  };

  if(combo === 0) {
    // ATK 1: corte frontal (1 dano) — sem dash
    const ang = Math.atan2(mouseY - player.y, mouseX - player.x);
    scytheSlashAnim = { life: 0.28, maxLife: 0.28, x: player.x, y: player.y, angle: ang, range: 75 };
    const ax = player.x + Math.cos(ang)*55, ay = player.y + Math.sin(ang)*55;
    hitEnemiesRadius(ax, ay, 65, 1, 50);
    addParticles(ax, ay, '#aa66ff', 8);

  } else if(combo === 1) {
    // ATK 2: fatiada em arco (2 dano)
    const ang = Math.atan2(mouseY - player.y, mouseX - player.x);
    scytheSlashAnim = { life: 0.35, maxLife: 0.35, x: player.x, y: player.y, angle: ang, range: 100 };
    const tryFatia = (en) => {
      const dx = en.x - player.x, dy = en.y - player.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if(dist < 100 && dist > 0) {
        const dot = Math.cos(ang)*(dx/dist) + Math.sin(ang)*(dy/dist);
        if(dot > 0.25) {
          en.hp -= 2; en.hitFlash = 200; en.killedByPlayer = true; spawnDamageNumber(en.x, en.y, 2, false);
          en.x += (dx/dist)*70; en.y += (dy/dist)*70;
          addParticles(en.x, en.y, '#dd66ff', 5);
          scytheKills++; checkScytheKillBuffs();
        }
      }
    };
    slimes.forEach(tryFatia);
    blueSlimes.forEach(tryFatia);
    redSlimes.forEach(tryFatia);
    if(bombHeads) bombHeads.forEach(b=>{ if(b.state!=='air') tryFatia(b); });
    assassinRats.forEach(tryFatia);
    ghosts.forEach(tryFatia);
    golems.forEach(g=>{ if(g.state!=='sleeping') tryFatia(g); });

  } else if(combo === 2) {
    // ATK 3: giro 360 (3 dano, range 100px)
    const isCrit = activeBuffs.has('soul_pierce');
    const dmg = isCrit ? 4 : 3;
    scytheSpinAnim = { angle: 0, timer: 420, maxTimer: 420 };
    hitEnemiesRadius(player.x, player.y, 100, dmg, 90);
    if(isCrit) addParticles(player.x, player.y, '#ffcc00', 22);
  }
}

function checkScytheKillBuffs() {
  if(scytheKills > 0 && scytheKills % 20 === 0) {
    if(activeBuffs.has('vulture')) {
      player.hp = Math.min(player.maxHp, player.hp + 1);
      updateHPDisplay();
      addParticles(player.x, player.y, '#ff6688', 10);
      showDiceResultText('+1❤️ (Abutre)', '#ff6688');
    }
    if(activeBuffs.has('lord_of_dead')) {
      skeletons.push({
        x: player.x + (Math.random()*80-40),
        y: player.y + (Math.random()*80-40),
        size: 10, hp: 4, maxHp: 4, dmg: 2,
        attackTimer: 0, wanderTimer: 0,
        wanderVx: (Math.random()-0.5)*2,
        wanderVy: (Math.random()-0.5)*2,
        dead: false
      });
      addParticles(player.x, player.y, '#aaaaff', 12);
    }
  }
}

function updateAndDrawScythe(dt) {
  // Recarga de munição
  if(activeEffect === 'scythe' && scytheAmmo < SCYTHE_MAX_AMMO) {
    scytheAmmoTimer -= dt;
    if(scytheAmmoTimer <= 0) {
      scytheAmmo++;
      scytheAmmoTimer = scytheAmmo < SCYTHE_MAX_AMMO ? SCYTHE_AMMO_RECHARGE_MS : 0;
    }
  }

  if(activeEffect !== 'scythe' && !scytheDashAnim && !scytheSpinAnim && !scytheSlashAnim) return;

  // Dash animation (move player)
  if(scytheDashAnim) {
    scytheDashAnim.timer -= dt;
    const p = 1 - scytheDashAnim.timer / scytheDashAnim.maxTimer;
    player.x = scytheDashAnim.ox + (scytheDashAnim.tx - scytheDashAnim.ox) * Math.min(1, p * 2);
    player.y = scytheDashAnim.oy + (scytheDashAnim.ty - scytheDashAnim.oy) * Math.min(1, p * 2);
    clampToDungeon(player);
    if(scytheDashAnim.timer <= 0) scytheDashAnim = null;
  }

  // Slash animation (fatiada)
  if(scytheSlashAnim) {
    scytheSlashAnim.life -= dt/1000;
    const s = scytheSlashAnim;
    const alpha = Math.max(0, s.life / s.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#dd66ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff88ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    // Arco de ~120° na frente
    const startA = s.angle - Math.PI/3;
    const endA = s.angle + Math.PI/3;
    ctx.arc(s.x, s.y, s.range, startA, endA);
    ctx.stroke();
    ctx.restore();
    if(scytheSlashAnim.life <= 0) scytheSlashAnim = null;
  }

  // Spin animation (giro 360)
  if(scytheSpinAnim) {
    scytheSpinAnim.timer -= dt;
    scytheSpinAnim.angle += dt * 0.025;
    const alpha = Math.max(0, scytheSpinAnim.timer / scytheSpinAnim.maxTimer);
    const radius = 100;
    ctx.save();
    ctx.globalAlpha = alpha * 0.7;
    ctx.strokeStyle = activeBuffs.has('soul_pierce') ? '#ffdd00' : '#aa55ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = activeBuffs.has('soul_pierce') ? '#ffee88' : '#cc88ff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Draw scythe rotating
    const sx = player.x + Math.cos(scytheSpinAnim.angle) * radius;
    const sy = player.y + Math.sin(scytheSpinAnim.angle) * radius;
    ctx.save();
    ctx.globalAlpha = Math.max(0, scytheSpinAnim.timer / scytheSpinAnim.maxTimer);
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.translate(sx, sy);
    ctx.rotate(scytheSpinAnim.angle + Math.PI/2);
    ctx.fillText('🌙', 0, 0);
    ctx.restore();

    if(scytheSpinAnim.timer <= 0) scytheSpinAnim = null;
  }

  if(activeEffect !== 'scythe') return;

  const ang = Math.atan2(mouseY - player.y, mouseX - player.x);

  // ── PREVIEW DO ATAQUE (estilo Brawl Stars) ──────────────────────────────
  if(scytheAmmo > 0) {
    const noAmmo = scytheAmmo <= 0;
    ctx.save();
    ctx.globalAlpha = 0.22;

    if(scytheCombo === 0) {
      // ATK 1: arco frontal (~120°)
      const previewRange = 75;
      ctx.strokeStyle = '#cc88ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#aa55ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.arc(player.x, player.y, previewRange, ang - Math.PI/3, ang + Math.PI/3);
      ctx.closePath();
      ctx.fillStyle = '#cc88ff';
      ctx.fill();
      ctx.stroke();
    } else if(scytheCombo === 1) {
      // ATK 2: arco largo de fatiada (range 100)
      const previewRange = 100;
      ctx.strokeStyle = '#ff99ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ee55ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.arc(player.x, player.y, previewRange, ang - Math.PI/3, ang + Math.PI/3);
      ctx.closePath();
      ctx.fillStyle = '#ff88ff';
      ctx.fill();
      ctx.stroke();
    } else {
      // ATK 3: círculo 360 completo
      const previewRange = 100;
      ctx.strokeStyle = activeBuffs.has('soul_pierce') ? '#ffee44' : '#aa55ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = activeBuffs.has('soul_pierce') ? '#ffcc00' : '#cc88ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(player.x, player.y, previewRange, 0, Math.PI*2);
      ctx.fillStyle = activeBuffs.has('soul_pierce') ? '#ffee44' : '#aa55ff';
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // Linha de mira (traço da direção)
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = '#ee99ff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.shadowColor = '#cc55ff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    const lineLen = scytheCombo === 2 ? 0 : (scytheCombo === 1 ? 100 : 75);
    if(lineLen > 0) {
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(player.x + Math.cos(ang)*lineLen, player.y + Math.sin(ang)*lineLen);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ── BARRAS DE MUNIÇÃO (estilo Brawl Stars) ─────────────────────────────
  const barW = 10, barH = 4, barGap = 3;
  const totalW = SCYTHE_MAX_AMMO * barW + (SCYTHE_MAX_AMMO - 1) * barGap;
  const barsX = player.x - totalW / 2;
  const barsY = player.y + player.size + 8;

  ctx.save();
  for(let i = 0; i < SCYTHE_MAX_AMMO; i++) {
    const bx = barsX + i * (barW + barGap);
    const filled = i < scytheAmmo;
    const isCharging = !filled && i === scytheAmmo; // barra sendo carregada

    // Fundo escuro
    ctx.fillStyle = '#220033';
    ctx.beginPath();
    ctx.roundRect(bx, barsY, barW, barH, 2);
    ctx.fill();

    if(filled) {
      // Barra cheia — roxo vibrante
      ctx.shadowColor = '#cc44ff';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#cc55ff';
      ctx.beginPath();
      ctx.roundRect(bx, barsY, barW, barH, 2);
      ctx.fill();
    } else if(isCharging && scytheAmmoTimer > 0) {
      // Barra sendo carregada — progresso parcial
      const progress = 1 - (scytheAmmoTimer / SCYTHE_AMMO_RECHARGE_MS);
      const filledW = Math.max(1, barW * progress);
      ctx.shadowColor = '#aa33cc';
      ctx.shadowBlur = 4;
      ctx.fillStyle = '#883399';
      ctx.beginPath();
      ctx.roundRect(bx, barsY, filledW, barH, 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
  ctx.restore();

  // ── COMBO INDICATOR ─────────────────────────────────────────────────────
  const comboSymbols = ['①', '②', '③'];
  ctx.save();
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = scytheAmmo > 0 ? '#dd88ff' : '#884488';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 4;
  ctx.fillText(comboSymbols[scytheCombo], player.x, player.y - player.size - 14);
  ctx.restore();
}
// ─── FIM FOICE ─────────────────────────────────────────────────────────────

function updateSpeedPotion(){
  if(!potionActive) return;
  // Draw aura (visual only — slow logic is applied in update())
  const drawRadius = activeBuffs.has('speed_global') ? 220 : 170;
  ctx.save();
  ctx.beginPath();
  ctx.arc(player.x, player.y, drawRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(100,255,255,0.10)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,255,255,0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// (declared in state.js)



// ── KATANA ───────────────────────────────────────────────────────────────────

// Check if segment (ax,ay)-(bx,by) intersects circle (cx,cy,r)
function segmentHitsCircle(ax,ay,bx,by,cx,cy,r){
  const dx=bx-ax, dy=by-ay;
  const fx=ax-cx, fy=ay-cy;
  const a=dx*dx+dy*dy;
  if(a===0) return Math.sqrt(fx*fx+fy*fy)<r;
  const b=2*(fx*dx+fy*dy);
  const c=fx*fx+fy*fy-r*r;
  let disc=b*b-4*a*c;
  if(disc<0) return false;
  disc=Math.sqrt(disc);
  const t1=(-b-disc)/(2*a);
  const t2=(-b+disc)/(2*a);
  return (t1>=0&&t1<=1)||(t2>=0&&t2<=1);
}

function katanaAddSegment(mx, my){
  const x1=katanaLastX, y1=katanaLastY, x2=mx, y2=my;
  const dx=x2-x1, dy=y2-y1;
  if(dx*dx+dy*dy < 4) return; // too short, ignore micro-moves

  const slash = {x1,y1,x2,y2, life:1, hitIds: new Set()};

  const tryHit = (en, id) => {
    if(slash.hitIds.has(id)) return; // already hit this enemy with this slash
    if(segmentHitsCircle(x1,y1,x2,y2, en.x,en.y, en.size+6)){
      slash.hitIds.add(id);
      Audio.katanaSlash();
      en.hp -= 1; spawnDamageNumber(en.x, en.y, 1, false);
      en.hitFlash = 200;
      en.killedByPlayer = true;
      addParticles(en.x, en.y, '#cc44ff', 5);
      // sashimi: heal on kill
      if(activeBuffs.has('sashimi') && en.hp <= 0){
        player.hp = Math.min(player.maxHp, player.hp + 1);
        updateHPDisplay();
        addParticles(player.x, player.y, '#ff4488', 8);
      }
    }
  };

  slimes.forEach((sl,i) => tryHit(sl, 'sl'+i));
  blueSlimes.forEach((sl,i) => tryHit(sl, 'bs'+i));
  redSlimes.forEach((sl,i) => tryHit(sl, 'rs'+i));
  bombHeads.forEach((b,i) => { if(b.state!=='air') tryHit(b, 'bh'+i); });
  assassinRats.forEach((r,i) => tryHit(r, 'rt'+i));
  ghosts.forEach((g,i) => tryHit(g, 'gh'+i));

  katanaSlashes.push(slash);
}

function updateKatana(dt){
  katanaSlashes = katanaSlashes.filter(s => {
    s.life -= dt / 220;
    return s.life > 0;
  });
  // samurai: keep invincible while active
  if(activeEffect==='katana' && activeBuffs.has('samurai')){
    player.invincible = Math.max(player.invincible, 100);
  }
}

function drawKatana(){
  if(activeEffect !== 'katana' && katanaSlashes.length === 0) return;

  // Draw slash trails
  katanaSlashes.forEach(s => {
    const alpha = Math.max(0, s.life);
    ctx.save();
    ctx.globalAlpha = alpha;
    // Glow
    ctx.strokeStyle = `rgba(200,80,255,${alpha*0.4})`;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(s.x1,s.y1); ctx.lineTo(s.x2,s.y2); ctx.stroke();
    // Core
    ctx.strokeStyle = `rgba(255,200,255,${alpha*0.95})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(s.x1,s.y1); ctx.lineTo(s.x2,s.y2); ctx.stroke();
    ctx.restore();
  });

  // Cursor blade indicator when active
  if(activeEffect === 'katana'){
    ctx.save();
    ctx.globalAlpha = katanaDrawing ? 0.9 : 0.45;
    ctx.strokeStyle = katanaDrawing ? '#ee88ff' : '#9944cc';
    ctx.lineWidth = katanaDrawing ? 2 : 1.5;
    ctx.lineCap = 'round';
    // Small blade at cursor
    const ang = Math.atan2(mouseY - player.y, mouseX - player.x);
    ctx.beginPath();
    ctx.moveTo(mouseX - Math.cos(ang)*16, mouseY - Math.sin(ang)*16);
    ctx.lineTo(mouseX + Math.cos(ang)*16, mouseY + Math.sin(ang)*16);
    ctx.stroke();
    ctx.restore();
  }
}

function addParticles(x,y,color,n){
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=1+Math.random()*3;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:0.8+Math.random()*0.4,maxLife:1.2,color,size:2+Math.random()*3});}
}

// ─── DADOS CARD ────────────────────────────────────────────────────────
// (declared in state.js)

function useDiceCard(slotIndex) {
  const double = activeBuffs.has('highbets');
  const hasJackpot = activeBuffs.has('jackpot');
  // Sem buff: 1-5 (sem jackpot). Com buff: 1-10, só o 10 é jackpot (10% → raro)
  const sides = hasJackpot ? 10 : 5;
  const result = Math.floor(Math.random() * sides) + 1;
  // Normaliza: resultado 6-9 com jackpot ativo vira resultado 5 (melhor resultado normal)
  const effectiveResult = (hasJackpot && result >= 6 && result <= 9) ? 5
                        : (hasJackpot && result === 10) ? 6
                        : result;

  diceRollAnim = { slot: slotIndex, roll: 0, timer: 1200, totalTime: 1200, result: effectiveResult, double };

  setTimeout(() => {
    applyDiceResult(effectiveResult, double, hasJackpot, slotIndex);
  }, 1300);
}

function applyDiceResult(result, double, hasJackpot, slotIndex) {
  const mult = double ? 2 : 1;

  if(result === 1) {
    const coinLoss = 15 * mult;
    gold = Math.max(0, gold - coinLoss);
    updateGoldDisplay();
    if(player.hp > 1) { player.hp -= 1 * mult; spawnDamageNumber(player.x, player.y, 1 * mult, true); player.hitFlash = 300; }
    mana = Math.max(0, mana - 1 * mult);
    updateHPDisplay(); updateManaDisplay();
    addParticles(player.x, player.y, '#ff4444', 14);
    showDiceResultText(`-${coinLoss}🪙 -${1*mult}❤️ -${1*mult}💧`, '#ff4444');
  } else if(result === 2) {
    const coinLoss = 5 * mult;
    gold = Math.max(0, gold - coinLoss);
    updateGoldDisplay();
    mana = Math.max(0, mana - 1 * mult);
    updateManaDisplay();
    addParticles(player.x, player.y, '#ff8844', 10);
    showDiceResultText(`-${coinLoss}🪙 -${1*mult}💧`, '#ff8844');
  } else if(result === 3) {
    const heal = 1 * mult;
    player.hp = Math.min(player.maxHp, player.hp + heal);
    updateHPDisplay();
    addParticles(player.x, player.y, '#ff6688', 14);
    showDiceResultText(`+${heal} ❤️`, '#ff6688');
  } else if(result === 4) {
    const gain = 30 * mult;
    spawnCoins(player.x, player.y, gain);
    showDiceResultText(`+${gain} 🪙`, '#ffcc00');
    addParticles(player.x, player.y, '#ffdd44', 18);
  } else if(result === 5) {
    const healAmt = 2 * mult;
    const manaAmt = 2 * mult;
    const coinAmt = 30 * mult;
    player.hp = Math.min(player.maxHp, player.hp + healAmt);
    mana = Math.min(maxMana, mana + manaAmt);
    updateHPDisplay(); updateManaDisplay();
    spawnCoins(player.x, player.y, coinAmt);
    addParticles(player.x, player.y, '#aaffaa', 22);
    showDiceResultText(`+${healAmt}❤️ +${manaAmt}💧 +${coinAmt}🪙`, '#aaffaa');
  } else if(result === 6 && hasJackpot) {
    // JACKPOT! — vida total +1, mana total +1, vida/mana cheias, invencível 10s
    player.maxHp += 1;
    maxMana += 1;
    player.hp = player.maxHp;
    mana = maxMana;
    player.invincible = Math.max(player.invincible, 10000);
    jackpotAuraTimer = 10000; // aura verde por 10s
    updateHPDisplay(); updateManaDisplay();
    spawnCoins(player.x, player.y, 100);
    addParticles(player.x, player.y, '#00ff88', 60);
    addParticles(player.x, player.y, '#ffee00', 40);
    showDiceResultText('🎰 JACKPOT! +1❤️MAX +1💧MAX Imortal 10s!', '#00ff88');
    Audio.playJackpotMusic();
  }

  replaceCard(slotIndex);
}

// Floating text shown after dice roll
// (declared in state.js)
function showDiceResultText(text, color) {
  diceResultTexts.push({ text, color, x: player.x, y: player.y - 40, life: 2.5, maxLife: 2.5 });
}
// ─── END DADOS ─────────────────────────────────────────────────────────

