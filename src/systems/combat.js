function shootPistol(){
  if(!pistolActive || pistolAmmo <= 0) return;
  pistolAmmo--;
  Audio.gunShot();
  document.getElementById('arrows-display').textContent = pistolAmmo > 0 ? `🔫 x${pistolAmmo}` : '🔫 sem munição';

  const dmg = activeBuffs.has('gun_damage') ? 0.75 : 0.5;
  const piercesOnHit = activeBuffs.has('gun_pierce') && Math.random() < 0.20;
  const speed = 16;
  // Spread: pequeno ângulo aleatório ao atirar
  const spread = (Math.random() - 0.5) * 0.18;
  const angle = player.angle + spread;
  projectiles.push({
    x: player.x, y: player.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 1, maxLife: 1,
    size: 3,
    damage: dmg,
    pierce: piercesOnHit,
    knockback: false,
    isBullet: true
  });

  if(pistolAmmo <= 0){
    const expiredSlot = pistolSlot;
    pistolActive = false; pistolSlot = -1;
    activeEffect = null; activeEffectSlot = -1; effectTimer = 0;
    document.querySelectorAll('.card').forEach(c => c.classList.remove('active-card'));
    updateEffectDisplay(); updateCardStates();
    setTimeout(() => { document.getElementById('arrows-display').textContent = ''; replaceCard(expiredSlot); }, 600);
  }
}

// Charge thresholds in ms
// (declared in constants.js / state.js)
// (declared in constants.js / state.js)

function getBowChargeLevel() {
  // Returns 0 (none), 1 (half), 2 (full)
  if(bowChargeTimer >= BOW_CHARGE_FULL) return 2;
  if(bowChargeTimer >= BOW_CHARGE_HALF) return 1;
  return 0;
}

function getBowChargePct() {
  return Math.min(1, bowChargeTimer / BOW_CHARGE_FULL);
}

function releaseArrow(){
  if(activeEffect!=='bow'||arrows<=0) return;
  const chargeLevel = getBowChargeLevel();
  const isBlindada = activeBuffs.has('bow_knockback');
  const isBigger = activeBuffs.has('bow_bigger');

  let dmg, pierces;
  if(isBlindada){
    // Flechas Blindadas: 2 / 4 / 8
    if(chargeLevel===2){ dmg=8; pierces=true; }
    else if(chargeLevel===1){ dmg=4; pierces=false; }
    else { dmg=2; pierces=false; }
  } else {
    // Normal: 1 / 2 / 3 + pierce on full
    if(chargeLevel===2){ dmg=3; pierces=true; }
    else if(chargeLevel===1){ dmg=2; pierces=false; }
    else { dmg=1; pierces=false; }
  }

  arrows--;
  Audio.arrow();
  document.getElementById('arrows-display').textContent=arrows>0?`🏹 x${arrows}`:'🏹 sem munição';
  const speed=13;
  const arrowSize = isBigger ? (chargeLevel===2 ? 22 : chargeLevel===1 ? 18 : 14) : (chargeLevel===2 ? 7 : chargeLevel===1 ? 5 : 4);
  projectiles.push({
    x:player.x, y:player.y,
    vx:Math.cos(player.angle)*speed,
    vy:Math.sin(player.angle)*speed,
    life:1, maxLife:1,
    size:arrowSize,
    damage:dmg,
    pierce:pierces,
    knockback:activeBuffs.has('bow_knockback')
  });

  bowChargeTimer=0; bowCharging=false;

  if(arrows<=0){
    const expiredSlot=activeEffectSlot;
    activeEffect=null; activeEffectSlot=-1; effectTimer=0;
    quivers=[]; quiverCount=0; quiverSpawnTimer=0;
    document.querySelectorAll('.card').forEach(c=>c.classList.remove('active-card'));
    updateEffectDisplay(); updateCardStates();
    setTimeout(()=>{ document.getElementById('arrows-display').textContent=''; replaceCard(expiredSlot); },600);
  }
}

function doSwordSwing(){
  if(activeEffect!=='sword') return;
  swingActive=true; swingTimer=260;
  Audio.sword();
  // Buff-based sword range and damage
  const baseRange = activeBuffs.has('sword_range') ? 100 : 80;
  const swordDamage = activeBuffs.has('sword_damage') ? 2 : 1;
  const swordPush = activeBuffs.has('sword_push');
  const hitEnemy = (en) => {
    const dx=en.x-player.x,dy=en.y-player.y;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if(dist>baseRange) return;
    let diff=Math.atan2(dy,dx)-player.angle;
    while(diff>Math.PI) diff-=Math.PI*2;
    while(diff<-Math.PI) diff+=Math.PI*2;
    if(Math.abs(diff)<Math.PI*0.55){
      en.hp-=swordDamage; en.hitFlash=220; en.killedByPlayer=true; spawnDamageNumber(en.x, en.y, swordDamage, false);
      addParticles(en.x,en.y,'#ffaa33',6);
      if(swordPush && dist>0){
        const pushForce = 180;
        en.x+=(dx/dist)*pushForce; en.y+=(dy/dist)*pushForce;
        clampToDungeon(en);
      }
    }
  };
  slimes.forEach(hitEnemy);
  blueSlimes.forEach(hitEnemy);
  redSlimes.forEach(hitEnemy);
  bombHeads.forEach(b=>{ if(b.state!=='air') hitEnemy(b); });
  assassinRats.forEach(r=>{ if(r.state!=='dash') hitEnemy(r); });
  ghosts.forEach(hitEnemy);
  golems.forEach(g=>{ if(g.state!=='sleeping') hitEnemy(g); });
}


// ── PLAYER BOMBS (bombinhas card) ────────────────────────────────────────────
// (declared in constants.js / state.js)

function throwBomb(tx, ty){
  if(!bombinhasActive||bombAmmo<=0) return;
  bombAmmo--;
  Audio.bombThrow();
  updateSecondaryEffectDisplay();
  playerBombs.push({
    startX: player.x, startY: player.y,
    targetX: tx, targetY: ty,
    progress: 0, speed: 0.025,
    exploded: false,
    fireTrails: [],
    warningAlpha: 0,
  });
  addParticles(player.x, player.y, '#ff8844', 8);
  if(bombAmmo<=0){ bombinhasActive=false; updateSecondaryEffectDisplay(); updateCardStates(); }
}

function explodeBomb(b){
  b.exploded = true;
  const bx = b.targetX, by = b.targetY;
  const radius = 45;
  const damage = 2;
  Audio.explosion();
  addParticles(bx, by, '#ff6600', 20);
  addParticles(bx, by, '#ffdd44', 14);

  // Fire trails buff
  if(activeBuffs.has('bomb_area')){
    b.fireTrails.push({x:bx, y:by, life:1, maxLife:2000, timer:0});
  }

  // Damage player if in range
  const pdx = player.x - bx, pdy = player.y - by;
  const pdist = Math.sqrt(pdx*pdx + pdy*pdy);
  if(pdist < radius && player.invincible <= 0 && !player.rolling){
    damagePlayer(1); player.hitFlash = 400; player.invincible = 800;
    spawnDamageNumber(player.x, player.y, 1, true);
    addParticles(player.x, player.y, '#ff0000', 10);
    if(player.hp <= 0) triggerGameOver();
  }

  const hitEnemies = (en) => {
    const dx=en.x-bx, dy=en.y-by;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<radius&&dist>=0){
      const force=(1-(dist/radius))*1.6;
      if(dist>0){ en.x+=(dx/dist)*150*force; en.y+=(dy/dist)*150*force; clampToDungeon(en); }
      en.hp -= damage; en.killedByPlayer=true; en.hitFlash=300; spawnDamageNumber(en.x, en.y, damage, false);
      addParticles(en.x,en.y,'#ff8833',6);
    }
  };
  slimes.forEach(hitEnemies);
  blueSlimes.forEach(hitEnemies);
  redSlimes.forEach(hitEnemies);
  bombHeads.forEach(bh=>{ if(bh.state!=='air') hitEnemies(bh); });
  assassinRats.forEach(hitEnemies);
  ghosts.forEach(hitEnemies);
  golems.forEach(g=>{ if(g.state!=='sleeping') hitEnemies(g); });

  // bomb_bombastic: second bigger explosion after delay
  if(activeBuffs.has('bomb_bombastic')){
    setTimeout(()=>{
      if(gameOver) return;
      const r2 = 80;
      addParticles(bx, by, '#ff4400', 28);
      addParticles(bx, by, '#ffaa00', 16);
      // Damage player in second explosion too
      const pdx2 = player.x - bx, pdy2 = player.y - by;
      if(Math.sqrt(pdx2*pdx2+pdy2*pdy2) < r2 && player.invincible <= 0 && !player.rolling){
        damagePlayer(1); player.hitFlash = 400; player.invincible = 800;
        spawnDamageNumber(player.x, player.y, 1, true);
        addParticles(player.x, player.y, '#ff0000', 10);
        if(player.hp <= 0) triggerGameOver();
      }
      const hitEnemies2 = (en) => {
        const dx=en.x-bx, dy=en.y-by;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<r2&&dist>=0){
          const force=(1-(dist/r2))*2.2;
          if(dist>0){ en.x+=(dx/dist)*220*force; en.y+=(dy/dist)*220*force; clampToDungeon(en); }
          en.hp -= 2; en.killedByPlayer=true; en.hitFlash=300; spawnDamageNumber(en.x, en.y, 2, false);
          addParticles(en.x,en.y,'#ff6600',8);
        }
      };
      slimes.forEach(hitEnemies2);
      bombHeads.forEach(bh=>{ if(bh.state!=='air') hitEnemies2(bh); });
      assassinRats.forEach(hitEnemies2);
      ghosts.forEach(hitEnemies2);
      golems.forEach(g=>{ if(g.state!=='sleeping') hitEnemies2(g); });
    }, 350);
  }
}

function updatePlayerBombs(dt){
  playerBombs.forEach(b=>{
    if(b.exploded){
      // Update fire trails
      b.fireTrails.forEach(f=>{
        f.life -= dt/f.maxLife;
        f.timer += dt;
        // Fire damage tick every 400ms
        if(Math.floor(f.timer/400) > Math.floor((f.timer-dt)/400)){
          const fireDamage = (en) => {
            const dx=en.x-f.x, dy=en.y-f.y;
            if(Math.sqrt(dx*dx+dy*dy)<45){ en.hp-=1; en.killedByPlayer=true; en.hitFlash=200; spawnDamageNumber(en.x, en.y, 1, false); }
          };
          slimes.forEach(fireDamage);
          blueSlimes.forEach(fireDamage);
          redSlimes.forEach(fireDamage);
          bombHeads.forEach(bh=>{ if(bh.state!=='air') fireDamage(bh); });
          assassinRats.forEach(fireDamage);
        }
      });
      b.fireTrails = b.fireTrails.filter(f=>f.life>0);
      return;
    }
    b.progress = Math.min(1, b.progress + b.speed*(dt/16));
    // Warning circle fades in as bomb approaches (last 40% of flight)
    b.warningAlpha = b.progress > 0.6 ? (b.progress - 0.6) / 0.4 : 0;
    if(b.progress >= 1) explodeBomb(b);
  });
  playerBombs = playerBombs.filter(b=>!b.exploded || b.fireTrails.length>0);
}

function drawPlayerBombs(){
  playerBombs.forEach(b=>{
    // Draw fire trails (bomb_area buff)
    b.fireTrails.forEach(f=>{
      const a = f.life * 0.55;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 45, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,100,0,0.18)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,160,0,0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      if(Math.random()<0.15) addParticles(f.x+(Math.random()-0.5)*60, f.y+(Math.random()-0.5)*60, '#ff6600', 1);
    });

    if(b.exploded) return;

    const t = b.progress;
    const mx = (b.startX+b.targetX)/2;
    const my = Math.min(b.startY, b.targetY) - 100;
    // Quadratic bezier position
    const bx = (1-t)*(1-t)*b.startX + 2*(1-t)*t*mx + t*t*b.targetX;
    const by = (1-t)*(1-t)*b.startY + 2*(1-t)*t*my + t*t*b.targetY;

    // Warning/danger circle at landing zone — fades in as bomb approaches
    if(b.warningAlpha > 0){
      ctx.save();
      const pulse = 0.7 + 0.3*Math.sin(Date.now()*0.02);
      ctx.globalAlpha = b.warningAlpha * pulse * 0.75;
      // Danger fill
      ctx.beginPath();
      ctx.arc(b.targetX, b.targetY, 45, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,80,0,0.18)';
      ctx.fill();
      // Danger ring
      ctx.strokeStyle = `rgba(255,120,0,${b.warningAlpha * 0.9})`;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
      // Shadow cross-hair at center
      ctx.globalAlpha = b.warningAlpha * 0.6;
      ctx.strokeStyle = 'rgba(255,60,0,0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.targetX - 10, b.targetY); ctx.lineTo(b.targetX + 10, b.targetY);
      ctx.moveTo(b.targetX, b.targetY - 10); ctx.lineTo(b.targetX, b.targetY + 10);
      ctx.stroke();
      ctx.restore();
    }

    // Shadow on ground (small ellipse under arc)
    ctx.save();
    ctx.globalAlpha = t * 0.35;
    ctx.beginPath();
    ctx.ellipse(b.targetX, b.targetY, 14, 7, 0, 0, Math.PI*2);
    ctx.fillStyle = '#aa4400';
    ctx.fill();
    ctx.restore();

    // Bomb emoji in flight
    ctx.save();
    ctx.font = `${16+t*4}px Arial`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.globalAlpha = 0.9;
    ctx.fillText('🧨', bx, by);
    ctx.restore();
  });
}
function drawBombTrajectoryPreview(){
  if(!bombinhasActive || bombAmmo <= 0 || gameOver || transitioning) return;

  const sx = player.x, sy = player.y;
  const tx = mouseX, ty = mouseY;
  const cx = (sx + tx) / 2;
  const cy = Math.min(sy, ty) - 100;

  const STEPS = 28;
  const RADIUS = 45;

  ctx.save();

  // --- Arc trajectory dots ---
  for(let i = 0; i <= STEPS; i++){
    const t = i / STEPS;
    const x = (1-t)*(1-t)*sx + 2*(1-t)*t*cx + t*t*tx;
    const y = (1-t)*(1-t)*sy + 2*(1-t)*t*cy + t*t*ty;

    // Dots get larger and more opaque toward the end
    const alpha = 0.25 + t * 0.55;
    const r = 2.5 + t * 2.5;

    // Skip every other dot for dashed feel
    if(i % 2 === 0){
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255, 160, 40, ${alpha})`;
      ctx.fill();
    }
  }

  // --- Explosion radius preview at mouse ---
  const pulse = 0.65 + 0.35 * Math.sin(Date.now() * 0.006);

  // Filled zone (very transparent)
  ctx.beginPath();
  ctx.arc(tx, ty, RADIUS, 0, Math.PI*2);
  ctx.fillStyle = `rgba(255, 80, 0, ${0.10 * pulse})`;
  ctx.fill();

  // Dashed ring
  ctx.beginPath();
  ctx.arc(tx, ty, RADIUS, 0, Math.PI*2);
  ctx.strokeStyle = `rgba(255, 140, 0, ${0.75 * pulse})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Small crosshair at center
  ctx.strokeStyle = `rgba(255, 200, 50, ${0.85 * pulse})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(tx - 8, ty); ctx.lineTo(tx + 8, ty);
  ctx.moveTo(tx, ty - 8); ctx.lineTo(tx, ty + 8);
  ctx.stroke();

  // Bomb icon preview at cursor
  ctx.globalAlpha = 0.7 * pulse;
  ctx.font = '18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧨', tx, ty - RADIUS - 14);

  ctx.restore();
}

// ─── BOLA DE FUTEBOL ────────────────────────────────────────────────────────
function updateSoccerBall(dt) {
  if(!soccerBall) return;

  const b = soccerBall;
  b.timer -= dt;
  if(b.timer <= 0) {
    addParticles(b.x, b.y, '#ffffff', 10);
    soccerBall = null;
    return;
  }

  const hasDominada = activeBuffs.has('dominada');
  const hasCraque    = activeBuffs.has('craque');

  // Ball size (can change with craque buff — already stored on ball at spawn)
  const radius = b.size;

  // ── Move ball ──
  const spd = Math.sqrt(b.vx*b.vx + b.vy*b.vy);
  if(spd > 0) {
    // Foguete é padrão — boa retenção de velocidade
    const friction = 0.985;
    b.vx *= Math.pow(friction, dt / 16);
    b.vy *= Math.pow(friction, dt / 16);

    b.x += b.vx * (dt / 16);
    b.y += b.vy * (dt / 16);
  }

  // ── Wall bounce ──
  const wallLeft  = DX + radius;
  const wallRight = DX + DUNGEON_SIZE - radius;
  const wallTop   = DY + radius;
  const wallBot   = DY + DUNGEON_SIZE - radius;

  if(b.x < wallLeft)  { b.x = wallLeft;  b.vx = Math.abs(b.vx) * 0.92; addParticles(b.x, b.y, '#aaaaaa', 4); }
  if(b.x > wallRight) { b.x = wallRight; b.vx = -Math.abs(b.vx) * 0.92; addParticles(b.x, b.y, '#aaaaaa', 4); }
  if(b.y < wallTop)   { b.y = wallTop;   b.vy = Math.abs(b.vy) * 0.92; addParticles(b.x, b.y, '#aaaaaa', 4); }
  if(b.y > wallBot)   { b.y = wallBot;   b.vy = -Math.abs(b.vy) * 0.92; addParticles(b.x, b.y, '#aaaaaa', 4); }

  // ── Player kick ──
  const pdx = b.x - player.x;
  const pdy = b.y - player.y;
  const pdist = Math.sqrt(pdx*pdx + pdy*pdy);
  if(!b._kickCooldown) b._kickCooldown = 0;
  if(b._kickCooldown > 0) b._kickCooldown -= dt;

  if(pdist < radius + player.size + 4 && pdist > 0 && b._kickCooldown <= 0) {
    b._kickCooldown = 180; // ms between kicks
    // Direction away from player
    const nx = pdx / pdist;
    const ny = pdy / pdist;

    // Foguete é padrão: cada chute acumula velocidade
    b.kickCount++;
    const boostSpeed = Math.min(16 + b.kickCount * 1.5, 30);
    b.vx = nx * boostSpeed;
    b.vy = ny * boostSpeed;
    b.speed = Math.sqrt(b.vx*b.vx + b.vy*b.vy);
    // On fire at high speed
    b.onFire = b.speed >= 14;

    // Separate ball from player immediately
    b.x = player.x + nx * (radius + player.size + 5);
    b.y = player.y + ny * (radius + player.size + 5);

    // Little particle burst
    addParticles(b.x, b.y, '#ffffff', 8);
    if(b.onFire) addParticles(b.x, b.y, '#ff6600', 10);
    Audio.ballKick();
  } else {
    // Decelerate fire state when not being kicked
    if(b.speed > 0) {
      b.speed = Math.max(0, b.speed - 0.08 * (dt / 16));
      b.onFire = b.speed >= 14;
    }
  }

  // ── Enemy damage ──
  // Ball damage: 2 normally, 3 if on fire
  const damage = b.onFire ? 3 : 2;

  // Track which enemies were hit this frame to skip (ball passes through)
  // We use a per-tick set to avoid hitting same enemy multiple times per tick,
  // but the ball CAN damage the same enemy again after a cooldown stored on the enemy.
  const hitEnemy = (en) => {
    const dx = en.x - b.x;
    const dy = en.y - b.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const hitDist = radius + (en.size || 12);
    if(dist < hitDist && dist > 0) {
      if(!en._ballHitCooldown || en._ballHitCooldown <= 0) {
        en.hp -= damage;
        en.killedByPlayer = true;
        en.hitFlash = 300;
        en._ballHitCooldown = 600; // ms before same enemy can be hit again
        spawnDamageNumber(en.x, en.y, damage, false);
        addParticles(en.x, en.y, b.onFire ? '#ff6600' : '#ffffff', 6);
      }
    }
    // Tick cooldown
    if(en._ballHitCooldown > 0) en._ballHitCooldown -= dt;
  };

  slimes.forEach(hitEnemy);
  blueSlimes.forEach(hitEnemy);
  redSlimes.forEach(hitEnemy);
  bombHeads.forEach(bh => { if(bh.state !== 'air') hitEnemy(bh); });
  assassinRats.forEach(hitEnemy);
  ghosts.forEach(hitEnemy);
  golems.forEach(g => { if(g.state !== 'sleeping') hitEnemy(g); });

  // ── Fire trail particles ──
  if(b.onFire && Math.random() < 0.4) {
    addParticles(b.x, b.y, '#ff4400', 3);
  }
}

// (declared in constants.js / state.js)

function drawSoccerBall() {
  // Draw cursor target when placing
  if(soccerBallPending) {
    const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.007);
    ctx.save();
    ctx.globalAlpha = 0.75 * pulse;
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚽', mouseX, mouseY);
    ctx.globalAlpha = 0.4 * pulse;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 22, 0, Math.PI*2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    return;
  }

  if(!soccerBall) return;
  const b = soccerBall;

  const spd = Math.sqrt(b.vx*b.vx + b.vy*b.vy);
  _ballRot += spd * 0.04;

  const hasCraque = activeBuffs.has('craque');
  const fontSize  = hasCraque ? 38 : 24;

  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(_ballRot);

  // Fire glow
  if(b.onFire) {
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur  = 20 + Math.random() * 10;
  } else {
    // Timer fade: flicker when < 2s left
    if(b.timer < 2000 && Math.sin(Date.now() * 0.02) < 0) {
      ctx.globalAlpha = 0.45;
    }
  }

  ctx.font = `${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚽', 0, 0);

  ctx.shadowBlur = 0;
  ctx.restore();
  ctx.globalAlpha = 1;
}

function updateAndDrawAxe(){
  if(activeEffect !== 'axe') return;
  if(!mouseButtonDown) return;

  axeAngle += 0.18;
  axeWhooshTimer += 0.18;
  if(axeWhooshTimer >= Math.PI){ axeWhooshTimer = 0; Audio.axeWhoosh(); }

  const radius = activeBuffs.has('axe_size') ? 90 : 65;

  const axeX = player.x + Math.cos(axeAngle) * radius;
  const axeY = player.y + Math.sin(axeAngle) * radius;

  const pushForce = activeBuffs.has('axe_push') ? 260 : 140;

  const hitAxeEnemy = (en) => {
    const dx = en.x - axeX;
    const dy = en.y - axeY;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if(dist < 26){
      en.hp -= 1; spawnDamageNumber(en.x, en.y, 1, false);
      en.hitFlash = 120;
      en.killedByPlayer = true;

      if(dist > 0){
        en.x += (dx/dist) * pushForce * 0.05;
        en.y += (dy/dist) * pushForce * 0.05;
      }

      addParticles(en.x, en.y, '#bbbbbb', 2);
    }
  };

  slimes.forEach(hitAxeEnemy);
  blueSlimes.forEach(hitAxeEnemy);
  redSlimes.forEach(hitAxeEnemy);

  bombHeads.forEach(b => {
    if(b.state !== 'air') hitAxeEnemy(b);
  });

  assassinRats.forEach(hitAxeEnemy);
  ghosts.forEach(hitAxeEnemy);
  golems.forEach(g=>{ if(g.state!=='sleeping') hitAxeEnemy(g); });

  ctx.save();
  ctx.translate(axeX, axeY);
  ctx.rotate(axeAngle * 2);
  const axeFontSize = activeBuffs.has('axe_size') ? 42 : 28;
  ctx.font = `${axeFontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🪓', 0, 0);
  ctx.restore();
}




// ═══════════════════════════════════════════════════════════════
// SNIPER NO SCOPE
// ═══════════════════════════════════════════════════════════════

function spawnSniperTarget() {
  if(!sniperMinigameActive || sniperMinigameDone) return;
  // Posição aleatória na tela (fora do centro do player)
  const pad = 80; // pixels fora da dungeon
  let tx, ty;
  do {
    tx = (DX - pad) + Math.random() * (DUNGEON_SIZE + pad*2);
    ty = (DY - pad) + Math.random() * (DUNGEON_SIZE + pad*2);
  } while(Math.hypot(tx - player.x, ty - player.y) < 80);

  sniperMinigameTargets = [{
    x: tx, y: ty,
    spawnTime: Date.now(),
    duration: sniperCurrentTargetDuration,
    scale: 1,
    angle: 0,
    hit: false
  }];
  if(typeof Audio !== 'undefined' && Audio.sniperReload) Audio.sniperReload();
}

function updateSniperMinigame(dt) {
  if(!sniperMinigameActive || sniperMinigameDone) return;
  const now = Date.now();
  sniperMinigameTargets = sniperMinigameTargets.filter(t => {
    if(t.hit) return false;
    const elapsed = now - t.spawnTime;
    const frac = elapsed / t.duration;
    t.angle += dt * 0.003; // gira
    t.scale = 1 - frac * 0.75; // encolhe
    if(frac >= 1) {
      // Tempo esgotado — fim do minigame
      sniperMinigameTargets = [];
      endSniperMinigame();
      return false;
    }
    return true;
  });
}

function endSniperMinigame() {
  sniperMinigameDone = true;
  sniperMinigameActive = false;
  sniperMinigameTargets = [];
  // Mira expirou — encerra o efeito da sniper
  const expiredSlot = sniperSlot;
  sniperActive = false; sniperSlot = -1;
  activeEffect = null; activeEffectSlot = -1; effectTimer = 0;
  document.querySelectorAll('.card').forEach(c => c.classList.remove('active-card'));
  document.getElementById('arrows-display').textContent = '';
  updateEffectDisplay(); updateCardStates();
  setTimeout(() => { replaceCard(expiredSlot); }, 400);
}

// Dispara bala teleguiada ao inimigo mais próximo ao acertar uma mira
function fireSniperHoming() {
  const hasTrickshot = activeBuffs.has('sniper_trickshot');
  const hasPierce   = activeBuffs.has('sniper_pierce');
  const hasInfinite = activeBuffs.has('sniper_infinite');
  const bulletCount = 1;

  // Inimigo mais próximo
  let target = null;
  let bestDist = Infinity;
  const allEnemies = [...slimes, ...blueSlimes, ...redSlimes,
                      ...golems.filter(g=>g.state!=='sleeping'),
                      ...assassinRats, ...ghosts,
                      ...bombHeads.filter(b=>b.state!=='air'), ...skeletons];
  for(const e of allEnemies) {
    const d = Math.hypot(e.x - player.x, e.y - player.y);
    if(d < bestDist) { bestDist = d; target = e; }
  }

  for(let b = 0; b < bulletCount; b++) {
    let vx, vy;
    const spread = b === 1 ? 0.18 : 0;
    if(target) {
      const angle = Math.atan2(target.y - player.y, target.x - player.x) + spread;
      vx = Math.cos(angle) * 7;
      vy = Math.sin(angle) * 7;
    } else {
      const angle = player.angle + (Math.random() - 0.5) * 0.3;
      vx = Math.cos(angle) * 7;
      vy = Math.sin(angle) * 7;
    }
    projectiles.push({
      x: player.x, y: player.y,
      vx, vy,
      life: 3.0, maxLife: 3.0,
      size: hasTrickshot ? 9 : 6,
      damage: 10,
      pierce: hasPierce,
      knockback: false,
      isBullet: true,
      isSniperBullet: true,
      bounces: hasTrickshot ? 1 : 0,
      homingTarget: target,
      homingStrength: 0.06,
    });
  }

  if(typeof Audio !== 'undefined' && Audio.gunShot) Audio.gunShot();
  addParticles(player.x, player.y, '#ff8800', 4);
  sniperAmmo++;
  document.getElementById('arrows-display').textContent = `🔫 x${sniperAmmo}`;
}

function onSniperTargetClick(mouseX, mouseY) {
  if(!sniperMinigameActive || sniperMinigameDone) return false;
  for(let t of sniperMinigameTargets) {
    if(t.hit) continue;
    const dist = Math.hypot(mouseX - t.x, mouseY - t.y);
    const hitRadius = 30 * t.scale + 15;
    if(dist < hitRadius) {
      t.hit = true;
      sniperMinigameHits++;
      addParticles(t.x, t.y, '#ff4400', 8);
      sniperCurrentTargetDuration = Math.max(300, sniperCurrentTargetDuration - (activeBuffs.has('sniper_infinite') ? 80 : 150));
      if(typeof Audio !== 'undefined' && Audio.sniperShot) Audio.sniperShot();
      fireSniperHoming();
      // Gira a sniper a cada mira acertada
      sniperEquipAnim = 400;
      sniperSpinAngle = 0;
      // Spawn próxima mira (duração fixa, mais fácil)
      setTimeout(() => {
        if(sniperMinigameActive && !sniperMinigameDone) spawnSniperTarget();
      }, 120);
      return true;
    }
  }
  return false;
}

function shootSniper() {
  if(!sniperActive || sniperAmmo <= 0) return;
  sniperAmmo--;
  if(typeof Audio !== 'undefined' && Audio.gunShot) Audio.gunShot();
  document.getElementById('arrows-display').textContent = sniperAmmo > 0 ? `🔫 x${sniperAmmo}` : '🔫 sem munição';

  const hasTrickshot = activeBuffs.has('sniper_trickshot');
  const hasPierce = activeBuffs.has('sniper_pierce');
  const speed = 20;
  const spreadAmount = hasTrickshot ? 0.04 : 0.32;
  // Múltiplos projéteis com spread
  const bulletCount = 3;
  for(let i = 0; i < bulletCount; i++) {
    const spread = (Math.random() - 0.5) * spreadAmount;
    const angle = player.angle + spread;
    const pierces = hasPierce && Math.random() < 0.30;
    projectiles.push({
      x: player.x, y: player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1, maxLife: 1,
      size: 5, // mais grossa que pistola (3)
      damage: 1.5,
      pierce: pierces,
      knockback: false,
      isBullet: true,
      isSniperBullet: true,
      bounces: hasTrickshot ? 1 : 0,
    });
  }

  if(sniperAmmo <= 0) {
    const expiredSlot = sniperSlot;
    sniperActive = false; sniperSlot = -1;
    activeEffect = null; activeEffectSlot = -1; effectTimer = 0;
    document.querySelectorAll('.card').forEach(c => c.classList.remove('active-card'));
    updateEffectDisplay(); updateCardStates();
    setTimeout(() => { document.getElementById('arrows-display').textContent = ''; replaceCard(expiredSlot); }, 600);
  }
}

function drawSniperMinigame() {
  if(!sniperMinigameActive || sniperMinigameDone) return;
  const now = Date.now();
  sniperMinigameTargets.forEach(t => {
    if(t.hit) return;
    const elapsed = now - t.spawnTime;
    const frac = elapsed / t.duration;
    const s = t.scale;
    const r = 40 * s;

    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);
    ctx.globalAlpha = 0.85 + Math.sin(now * 0.01) * 0.1;

    // Círculo de tempo (arco que encolhe)
    ctx.beginPath();
    ctx.arc(0, 0, r + 12, -Math.PI/2, -Math.PI/2 + Math.PI*2*(1-frac));
    ctx.strokeStyle = frac > 0.6 ? '#ff2200' : '#ff8800';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Desenha a mira (crosshair) usando a imagem Mira.png
    if(window._sniperMiraImg && window._sniperMiraImg.complete) {
      ctx.drawImage(window._sniperMiraImg, -r, -r, r*2, r*2);
    } else {
      // Fallback desenhado
      ctx.strokeStyle = '#ff2200';
      ctx.lineWidth = 3 * s;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r*0.35, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r*1.3, 0); ctx.lineTo(-r*0.5, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r*0.5, 0); ctx.lineTo(r*1.3, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -r*1.3); ctx.lineTo(0, -r*0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, r*0.5); ctx.lineTo(0, r*1.3); ctx.stroke();
      ctx.fillStyle = '#ff2200';
      ctx.beginPath(); ctx.arc(0, 0, 5*s, 0, Math.PI*2); ctx.fill();
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  });
}

function drawSniperEquipAnim(dt) {
  if(activeEffect !== 'sniper_noscope') return;
  if(sniperEquipAnim > 0) {
    sniperEquipAnim -= dt;
    sniperSpinAngle += dt * 0.015;
  }
  // Desenha sniper girando (animação de equipar)
  if(sniperEquipAnim > 0 && window._sniperImg && window._sniperImg.complete) {
    const alpha = Math.min(1, sniperEquipAnim / 400);
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(sniperSpinAngle);
    ctx.globalAlpha = alpha;
    ctx.scale(-1, 1); // espelha para consistência
    ctx.drawImage(window._sniperImg, -50, -14, 100, 28);
    ctx.restore();
    ctx.globalAlpha = 1;
    return;
  }
  // Sniper equipada: mostrar saindo da mão do cavaleiro
  if(sniperActive && window._sniperImg && window._sniperImg.complete) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.scale(-1, 1);
    ctx.drawImage(window._sniperImg, -90, -7, 80, 18);
    ctx.restore();
  } else if(sniperMinigameActive && window._sniperImg && window._sniperImg.complete) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.scale(-1, 1);
    ctx.drawImage(window._sniperImg, -90, -7, 80, 18);
    ctx.restore();
  }
}
