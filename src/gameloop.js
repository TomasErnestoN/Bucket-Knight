function gameLoop(ts){
  const dt=Math.min(ts-lastTime,50);lastTime=ts;
  if(gameStarted && !paused) dungeonTime += dt * 0.001;
  // Glitch fury: congelamento durante ativação (darkening + await click + scream)
  const glitchFuryFrozen = glitchFuryDarkening || glitchFuryAwaitClick || (glitchFuryScreamTimer > 0);
  if(gameStarted && !gameOver && !paused){
    if(transitioning) updateTransition(dt);
    else if(!glitchFuryFrozen) update(dt);
    else updateGlitchFuryOnly(dt);
  }
  if(gameStarted) draw(dt);
  requestAnimationFrame(gameLoop);
}

function updateTransition(dt){
  transitionTimer+=dt;
  const pct=Math.min(1,transitionTimer/TRANSITION_DURATION);
  // Phase 0 (0..0.35): player flies up and fades
  if(pct<0.35){
    const p=pct/0.35;
    playerFlyY=player.y-p*DUNGEON_SIZE*0.7;
    playerFlyAlpha=1-p;
    cubeAngle=0;
  }
  // Phase 1 (0.35..0.75): cube spin
  else if(pct<0.75){
    playerFlyAlpha=0;
    cubeAngle=(pct-0.35)/0.4; // 0..1
  }
  // Phase 2 (0.75..1.0): player lands back in
  else {
    const p=(pct-0.75)/0.25;
    playerFlyY=H/2-DUNGEON_SIZE*0.4*(1-p);
    playerFlyAlpha=p;
    cubeAngle=1;
    if(transitionTimer>TRANSITION_DURATION*0.78 && currentDungeon<DUNGEON_DEFS.length-1){
      // switch dungeon halfway through land so colors update first
    }
  }
  if(transitionTimer>=TRANSITION_DURATION){
    cubeAngle=0;
    const completedDungeonNum = DUNGEON_DEFS[currentDungeon].num;
    // Show buff screen before advancing; applyBuff will call finishDungeonTransition
    showBuffScreen(completedDungeonNum);
  }
}


// Atualiza só o necessário durante o congelamento do glitch fury
function updateGlitchFuryOnly(dt){
  // Fade da tela escura
  if(glitchFuryDarkening){
    glitchFuryDarkenTimer += dt;
    glitchFuryDarkenAlpha = Math.min(1, glitchFuryDarkenTimer / 600);
  }
  // Countdown de 9s com tela preta — ao final libera o efeito
  if(glitchFuryScreamTimer > 0){
    glitchFuryScreamTimer -= dt;
    if(glitchFuryScreamTimer <= 0){
      glitchFuryScreamTimer = -1;
      // Libera o efeito — música continua tocando até a dungeon acabar
      glitchFuryDarkening = false;
      glitchFuryDarkenAlpha = 0;
      glitchFuryActive = true;
      glitchFuryMsgTimer = 1500;
      glitchFuryMessages = [];
    }
  }
  // Coins e particles ainda atualizam para não travar
  if(typeof updateParticles === 'function') updateParticles(dt);
}

function update(dt){
  manaTimer+=dt;
  if(manaTimer>=manaChargeRate){manaTimer=0;if(mana<maxMana){mana++;Audio.manaPip();updateManaDisplay();}}

  // ── Camera shake: decai exponencialmente ──
  cameraShake = Math.max(0, cameraShake - dt * 0.010);
  const shakeAmt = Math.min(Math.sqrt(cameraShake) * 1.8, 13); // curva suave, máx 13px
  cameraShakeX = shakeAmt > 0.2 ? (Math.random()-0.5) * shakeAmt : 0;
  cameraShakeY = shakeAmt > 0.2 ? (Math.random()-0.5) * shakeAmt : 0;

  if(rollCooldown){
    rollTimer+=dt;
    const effectiveCooldown = ROLL_COOLDOWN_OVERRIDE !== null ? ROLL_COOLDOWN_OVERRIDE : ROLL_COOLDOWN;
    const frac = Math.min(rollTimer/effectiveCooldown,1);
    const rb = document.getElementById('roll-bar-fill'); if(rb) rb.style.width=(frac*100)+'%';
    if(rollTimer>=effectiveCooldown){rollCooldown=false;rollTimer=0;document.getElementById('roll-display').textContent='ROLL: pronto';}
    else document.getElementById('roll-display').textContent=`ROLL: ${((effectiveCooldown-rollTimer)/1000).toFixed(1)}s`;
  } else {
    const rb = document.getElementById('roll-bar-fill'); if(rb) rb.style.width='100%';
  }

  if(activeEffect && activeEffect!=='bow' && activeEffect!=='sniper_noscope'){
    effectTimer-=dt;
    if(effectTimer<=0){
      const expiredSlot=activeEffectSlot;
      activeEffect=null;activeEffectSlot=-1;effectTimer=0;
      document.querySelectorAll('.card').forEach(c=>c.classList.remove('active-card'));
      replaceCard(expiredSlot);
    } else { updateEffectDisplay(); }
  } else if(activeEffect==='bow') { updateEffectDisplay(); }
  else if(activeEffect==='sniper_noscope') { updateEffectDisplay(); }

  // Poção: timer independente
  if(potionActive){
    potionTimer -= dt;
    if(potionTimer <= 0){
      potionActive = false; potionTimer = 0;
      ROLL_COOLDOWN_OVERRIDE = null;
      updateSecondaryEffectDisplay(); updateCardStates();
    } else { updateSecondaryEffectDisplay(); }
  }

  // Arco: atualizar charge timer
  if(bowCharging && activeEffect==='bow') {
    const isBlindada = activeBuffs.has('bow_knockback');
    const chargeSpeed = isBlindada ? 2 : 1; // Flechas Blindadas carrega 2x mais rápido
    bowChargeTimer = Math.min(bowChargeTimer + dt * chargeSpeed, BOW_CHARGE_FULL);
  }

  // Pistola: auto-fire ao segurar o mouse
  if(pistolActive && mouseButtonDown && !playerInSpecial){
    pistolFireTimer -= dt;
    if(pistolFireTimer <= 0){
      pistolFireTimer = PISTOL_FIRE_RATE;
      shootPistol();
    }
  }

  // Atualiza minigame de miras da sniper
  if(sniperMinigameActive) updateSniperMinigame(dt);

  // Bombinhas: ativo enquanto houver ammo (controlado em throwBomb/useCardSlot)
  if(bombinhasActive && bombAmmo <= 0){
    bombinhasActive = false;
    updateSecondaryEffectDisplay(); updateCardStates();
  }

  // Som de dano: detecta quando hitFlash acabou de ser setado
  if(player.hitFlash > 0 && !player._hurtSoundPlayed){
    player._hurtSoundPlayed = true;
    Audio.playerHurt();
  }
  if(player.hitFlash <= 0) player._hurtSoundPlayed = false;

  if(swingActive){swingTimer-=dt;if(swingTimer<=0)swingActive=false;}
  updateKatana(dt);
  updatePlayerBombs(dt);
  updateSoccerBall(dt);

  // ── SPECIAL CARD: BLACK MAGIC ──
  if(specialActive){
    specialTimer -= dt;
    updateSpecialCardUI();

    if(playerInSpecial){
      // Player flies above the dungeon — move freely with WASD
      const flySpeed = 5;
      const isMovingLeft  = keys['ArrowLeft']  || keys['a'] || keys['A'];
      const isMovingRight = keys['ArrowRight'] || keys['d'] || keys['D'];
      const isMovingUp    = keys['ArrowUp']    || keys['w'] || keys['W'];
      const isMovingDown  = keys['ArrowDown']  || keys['s'] || keys['S'];

      if(isMovingLeft)  player.x -= flySpeed;
      if(isMovingRight) player.x += flySpeed;
      if(isMovingUp)    player.y -= flySpeed;
      if(isMovingDown)  player.y += flySpeed;

      // Player can fly freely across the entire screen
      player.x = Math.max(10, Math.min(W - 10, player.x));
      player.y = Math.max(10, Math.min(H - 10, player.y));

      // Player faces toward the mouse (aim direction)
      player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);

      // Impact point follows the mouse freely, clamped inside dungeon
      const IMPACT_RADIUS = 22;
      const impactX = Math.max(DX + IMPACT_RADIUS, Math.min(DX + DUNGEON_SIZE - IMPACT_RADIUS, mouseX));
      const impactY = Math.max(DY + IMPACT_RADIUS, Math.min(DY + DUNGEON_SIZE - IMPACT_RADIUS, mouseY));

      // Store for draw phase
      player._impactX = impactX;
      player._impactY = impactY;

      // Damage only at the impact point
      if(laserActive){
        const LASER_DPS = 12;
        const dmgThisFrame = LASER_DPS * (dt / 1000);
        const hitEnemy = (en) => {
          const dx = en.x - impactX, dy = en.y - impactY;
          if(Math.sqrt(dx*dx + dy*dy) < IMPACT_RADIUS + en.size){
            en.hp -= dmgThisFrame; spawnDamageNumber(en.x, en.y, dmgThisFrame, false);
            en.hitFlash = 60;
            en.killedByPlayer = true;
            if(Math.random() < 0.5) addParticles(en.x, en.y, '#cc00ff', 2);
          }
        };
        slimes.forEach(hitEnemy);
        blueSlimes.forEach(hitEnemy);
        redSlimes.forEach(hitEnemy);
        bombHeads.forEach(b=>{ if(b.state!=='air') hitEnemy(b); });
        assassinRats.forEach(hitEnemy);
        ghosts.forEach(hitEnemy);
        golems.forEach(g=>{ if(g.state!=='sleeping') hitEnemy(g); });
      }
    }

    if(specialTimer <= 0){
      // End special
      specialActive = false;
      specialTimer = 0;
      laserActive = false;
      if(playerInSpecial){
        playerInSpecial = false;
        player.x = playerSavedPos.x;
        player.y = playerSavedPos.y;
        addParticles(player.x, player.y, '#ff22aa', 16);
      }
      updateSpecialCardUI();
    }
  }

  // ── GLITCH FURY: Active effect update ──
  if(glitchFuryActive){
    player.invincible = 999;
    if(glitchFuryAttackTimer > 0) glitchFuryAttackTimer -= dt;
    if(glitchFurySwing){
      glitchFurySwing.t -= dt;
      if(glitchFurySwing.t <= 0) glitchFurySwing = null;
    }
    glitchFuryMsgTimer -= dt;
    if(glitchFuryMsgTimer <= 0){
      const GMSG_LIST = [
        {key:'G_message1'},{key:'G_message2'},{key:'G_message3'},
        {key:'G_message4'},{key:'G_message5'},
      ];
      const already = glitchFuryMessages.map(m=>m.key);
      const avail = GMSG_LIST.filter(m=>!already.includes(m.key));
      const pool = avail.length > 0 ? avail : GMSG_LIST;
      const pick = pool[Math.floor(Math.random()*pool.length)];
      const px = W/2 + (Math.random()-0.5)*(W*0.5);
      const py = H/2 + (Math.random()-0.5)*(H*0.4);
      glitchFuryMessages.push({ key: pick.key, x: px, y: py, life: 2000, maxLife: 2000 });
      glitchFuryMsgTimer = 4000; // 2s visible + 2s hidden
    }
    glitchFuryMessages = glitchFuryMessages.filter(m => { m.life -= dt; return m.life > 0; });
  }
  // Efeitos visuais do glitch fury decaem independentemente de estar ativo ou não
  glitchFuryShockwaves = glitchFuryShockwaves.filter(sw => { sw.t -= dt; return sw.t > 0; });
  glitchFurySlashes    = glitchFurySlashes.filter(sl => { sl.t -= dt; return sl.t > 0; });
  glitchFuryFragments  = glitchFuryFragments.filter(fr => {
    fr.t -= dt;
    fr.x += fr.vx * dt * 0.06;
    fr.y += fr.vy * dt * 0.06;
    fr.vy += 0.08 * dt * 0.06;
    return fr.t > 0;
  });
  // Sangue no chão: voa, pousa e fica até fury acabar
  glitchFuryBlood = glitchFuryBlood.filter(b => {
    b.life -= dt / b.maxLife;
    if(!b.settled){
      b.x += b.vx * dt * 0.07;
      b.y += b.vy * dt * 0.07;
      b.vy += 0.12 * dt * 0.07; // gravidade leve
      b.vx *= Math.pow(0.88, dt * 0.06);
      b.vy *= Math.pow(0.88, dt * 0.06);
      const spd = Math.sqrt(b.vx*b.vx + b.vy*b.vy);
      if(spd < 0.3){ // pousou
        b.settled = true;
        b.scaleX = 1.6 + Math.random()*0.8; // achata em elipse
        b.scaleY = 0.5 + Math.random()*0.4;
      }
    }
    if(!glitchFuryActive) b.life -= dt / (b.maxLife * 0.15); // some mais rápido quando fury acaba
    return b.life > 0;
  });

  // ── GLITCH EVENT: fade overlay ──
  if(glitchEventActive){
    glitchEventGlitchTimer += dt;
    if(glitchEventFadeIn){
      glitchEventOverlayAlpha = Math.min(0.88, glitchEventOverlayAlpha + dt/400);
    }
  }

    // Reset slowed flag for all enemies before applying this frame's slow
  slimes.forEach(sl=>{ sl.slowed=false; });
  blueSlimes.forEach(sl=>{ sl.slowed=false; });
  redSlimes.forEach(sl=>{ sl.slowed=false; });
  bombHeads.forEach(b=>{ b.slowed=false; });
  assassinRats.forEach(r=>{ r.slowed=false; });
  golems.forEach(g=>{ g.slowed=false; });

  // Apply speed potion slow to enemies each frame (before enemy movement)
  if(potionActive){
    const slowRadius = activeBuffs.has('speed_global') ? 99999 : 170;
    const slowMult = activeBuffs.has('speed_strong') ? 0.35 : 0.55;
    const applySlowLogic = (enemy) => {
      const dx = enemy.x - player.x, dy = enemy.y - player.y;
      if(Math.sqrt(dx*dx+dy*dy) < slowRadius){
        enemy.slowed = true;
        enemy.slowMultiplier = slowMult;
      }
    };
    slimes.forEach(applySlowLogic);
    blueSlimes.forEach(applySlowLogic);
    redSlimes.forEach(applySlowLogic);
    bombHeads.forEach(applySlowLogic);
    assassinRats.forEach(applySlowLogic);
    golems.forEach(applySlowLogic);
    // speed_dash agora aumenta duração da poção (tratado na ativação)
  }

  // Quiver spawn (while bow active - replenishes ammo)
  if(activeEffect==='bow'){
    quiverSpawnTimer+=dt;
    if(quiverSpawnTimer>=2500&&quiverCount<3){quiverSpawnTimer=0;quiverCount++;const pos=randomDungeonPos();quivers.push({x:pos.x,y:pos.y,bob:Math.random()*Math.PI*2});}
  }

  // Projectiles
  projectiles.forEach(p=>{
    if(p.isSniperBullet) {
      p.x+=p.vx*(dt/16);p.y+=p.vy*(dt/16);
    } else {
      p.x+=p.vx;p.y+=p.vy;
    }
    p.life-=dt/1400;
    // Ricochetear nas paredes (Trickshot) — igual à bola de futebol
    if(p.isSniperBullet && p.bounces > 0) {
      const r = p.size || 6;
      const wLeft  = DX + r;
      const wRight = DX + DUNGEON_SIZE - r;
      const wTop   = DY + r;
      const wBot   = DY + DUNGEON_SIZE - r;
      if(p.x < wLeft)  { p.x = wLeft;  p.vx =  Math.abs(p.vx); p.bounces--; addParticles(p.x, p.y, '#ffcc44', 5); }
      if(p.x > wRight) { p.x = wRight; p.vx = -Math.abs(p.vx); p.bounces--; addParticles(p.x, p.y, '#ffcc44', 5); }
      if(p.y < wTop)   { p.y = wTop;   p.vy =  Math.abs(p.vy); p.bounces--; addParticles(p.x, p.y, '#ffcc44', 5); }
      if(p.y > wBot)   { p.y = wBot;   p.vy = -Math.abs(p.vy); p.bounces--; addParticles(p.x, p.y, '#ffcc44', 5); }
    }
    // Homing: bala teleguiada ao inimigo alvo
    if(p.homingTarget && p.homingStrength) {
      const ht = p.homingTarget;
      if(ht.hp > 0) {
        const dx = ht.x - p.x, dy = ht.y - p.y;
        const dist = Math.hypot(dx, dy);
        if(dist > 1) {
          p.vx += (dx/dist) * p.homingStrength * 4;
          p.vy += (dy/dist) * p.homingStrength * 4;
          // Limita velocidade
          const spd = Math.hypot(p.vx, p.vy);
          if(spd > 5) { p.vx = p.vx/spd*5; p.vy = p.vy/spd*5; }
        }
      }
    }
    if(!insideDungeon(p.x,p.y)) p.life=0;
    const pdmg = p.damage !== undefined ? p.damage : 1;
    slimes.forEach(sl=>{
      const dx=sl.x-p.x,dy=sl.y-p.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<sl.size+p.size&&p.life>0){
        sl.hp-=pdmg;sl.hitFlash=250;sl.killedByPlayer=true; spawnDamageNumber(sl.x, sl.y, pdmg, false);addParticles(sl.x,sl.y,'#88ccff',5);
        if(p.knockback&&dist>0){sl.x+=(dx/dist)*60;sl.y+=(dy/dist)*60;clampToDungeon(sl);}
        if(!p.pierce) p.life=0; else p.homingTarget=null;
      }
    });
    blueSlimes.forEach(sl=>{
      const dx=sl.x-p.x,dy=sl.y-p.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<sl.size+p.size&&p.life>0){
        sl.hp-=pdmg;sl.hitFlash=250;sl.killedByPlayer=true; spawnDamageNumber(sl.x, sl.y, pdmg, false);addParticles(sl.x,sl.y,'#2266ff',5);
        if(p.knockback&&dist>0){sl.x+=(dx/dist)*60;sl.y+=(dy/dist)*60;clampToDungeon(sl);}
        if(!p.pierce) p.life=0; else p.homingTarget=null;
      }
    });
    redSlimes.forEach(sl=>{
      const dx=sl.x-p.x,dy=sl.y-p.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<sl.size+p.size&&p.life>0){
        sl.hp-=pdmg;sl.hitFlash=250;sl.killedByPlayer=true; spawnDamageNumber(sl.x, sl.y, pdmg, false);addParticles(sl.x,sl.y,'#ff4422',5);
        if(p.knockback&&dist>0){sl.x+=(dx/dist)*60;sl.y+=(dy/dist)*60;clampToDungeon(sl);}
        if(!p.pierce) p.life=0; else p.homingTarget=null;
      }
    });
    bombHeads.forEach(b=>{
      if(b.state==='air') return;
      const dx=b.x-p.x,dy=b.y-p.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<b.size+p.size&&p.life>0){
        b.hp-=pdmg;b.hitFlash=250;b.killedByPlayer=true; spawnDamageNumber(b.x, b.y, pdmg, false);addParticles(b.x,b.y,'#ff8833',5);
        if(p.knockback&&dist>0){b.x+=(dx/dist)*50;b.y+=(dy/dist)*50;clampToDungeon(b);}
        if(!p.pierce) p.life=0; else p.homingTarget=null;
      }
    });
    assassinRats.forEach(r=>{
      if(r.state==='dash') return;
      const dx=r.x-p.x,dy=r.y-p.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<r.size+p.size&&p.life>0){
        r.hp-=pdmg;r.hitFlash=250;r.killedByPlayer=true; spawnDamageNumber(r.x, r.y, pdmg, false);addParticles(r.x,r.y,'#ff88cc',5);
        if(p.knockback&&dist>0){r.x+=(dx/dist)*55;r.y+=(dy/dist)*55;clampToDungeon(r);}
        if(!p.pierce) p.life=0; else p.homingTarget=null;
      }
    });
    ghosts.forEach(g=>{
      const dx=g.x-p.x,dy=g.y-p.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<g.size+p.size&&p.life>0){
        g.hp-=pdmg;g.hitFlash=250;g.killedByPlayer=true;addParticles(g.x,g.y,'#aaddff',5); spawnDamageNumber(g.x, g.y, pdmg, false);
        if(p.knockback&&dist>0){g.x+=(dx/dist)*45;g.y+=(dy/dist)*45;clampToDungeon(g);}
        if(!p.pierce) p.life=0; else p.homingTarget=null;
      }
    });
    golems.forEach(g=>{
      if(g.state==='sleeping') return;
      const dx=g.x-p.x,dy=g.y-p.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<g.size+p.size&&p.life>0){
        g.hp-=pdmg;g.hitFlash=250;g.killedByPlayer=true;addParticles(g.x,g.y,'#888888',5); spawnDamageNumber(g.x, g.y, pdmg, false);
        if(!p.pierce) p.life=0; else p.homingTarget=null;
      }
    });
  });
  projectiles=projectiles.filter(p=>p.life>0);

  if(blastWave){blastWave.r+=dt*1.1;blastWave.life=1-(blastWave.r/blastWave.maxR);if(blastWave.r>=blastWave.maxR)blastWave=null;}

  player.angle=Math.atan2(mouseY-player.y,mouseX-player.x);

  let mx=0,my=0;
  if(!playerInSpecial){
  if(keys['ArrowLeft']||keys['a']||keys['A']) mx=-1;
  if(keys['ArrowRight']||keys['d']||keys['D']) mx=1;
  if(keys['ArrowUp']||keys['w']||keys['W']) my=-1;
  if(keys['ArrowDown']||keys['s']||keys['S']) my=1;
  }
  const len=Math.sqrt(mx*mx+my*my);if(len>0){mx/=len;my/=len;}

  if(player.rolling){
    player.x+=player.rollVx*ROLL_SPEED*(dt/16);
    player.y+=player.rollVy*ROLL_SPEED*(dt/16);
    clampToDungeon(player);
    player.rollTime-=dt;
    player.trail.push({x:player.x,y:player.y,a:player.angle,life:1});
    if(player.rollTime<=0){player.rolling=false;player.trail=[];}
  } else {
    const ghostMult = (player._ghostSlowed && !player.rolling) ? player._ghostSlowMult : 1;
    const glitchSpeedMult = glitchFuryActive ? 2.5 : 1;
    player.x+=mx*player.speed*ghostMult*glitchSpeedMult*(dt/16);
    player.y+=my*player.speed*ghostMult*glitchSpeedMult*(dt/16);
    clampToDungeon(player);
  }
  // Clamp forçado — sem a condição "inside" do clampToDungeon (evita sair pelo Glitch Fury speed)
  const _pm = player.size;
  player.x = Math.max(DX + _pm, Math.min(DX + DUNGEON_SIZE - _pm, player.x));
  player.y = Math.max(DY + _pm, Math.min(DY + DUNGEON_SIZE - _pm, player.y));

  player.trail.forEach(t=>t.life-=dt/ROLL_DURATION);
  player.trail=player.trail.filter(t=>t.life>0);

  // Glitch Fury: rastro vermelho ao se mover
  if(glitchFuryActive && (mx!==0 || my!==0)){
    const GLITCH_TRAIL_LIFE = 220; // ms
    glitchFuryTrail.push({x:player.x,y:player.y,a:player.angle,life:1,maxLife:GLITCH_TRAIL_LIFE});
  }
  glitchFuryTrail.forEach(t=>{ t.life-=dt/t.maxLife; });
  glitchFuryTrail=glitchFuryTrail.filter(t=>t.life>0);
  if(player.hitFlash>0) player.hitFlash-=dt;
  if(player.invincible>0) player.invincible-=dt;
  if(jackpotAuraTimer>0) jackpotAuraTimer-=dt;


  skeletons.forEach(sk=>{
    sk.attackTimer -= dt;
    if(sk.wanderTimer === undefined) { sk.wanderTimer = 0; sk.wanderVx = (Math.random()-0.5)*2; sk.wanderVy = (Math.random()-0.5)*2; }

    const enemies = [...slimes, ...blueSlimes, ...redSlimes, ...bombHeads.filter(b=>b.state!=='air'), ...assassinRats, ...ghosts, ...golems.filter(g=>g.state!=='sleeping')];
    let nearest = null;
    let bestDist = 99999;

    enemies.forEach(en=>{
      const dx=en.x-sk.x, dy=en.y-sk.y;
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d<bestDist){
        bestDist=d;
        nearest=en;
      }
    });

    if(nearest){
      // Chase nearest enemy
      const dx=nearest.x-sk.x, dy=nearest.y-sk.y;
      const dist=Math.sqrt(dx*dx+dy*dy)||1;

      sk.x += (dx/dist) * 2.5 * (dt/16);
      sk.y += (dy/dist) * 2.5 * (dt/16);
      clampToDungeon(sk);

      if(dist < 18 && sk.attackTimer <= 0){
        const skDmg = sk.dmg !== undefined ? sk.dmg : (activeBuffs.has('necro_money') ? 1 : 0.5);
        nearest.hp -= skDmg; spawnDamageNumber(nearest.x, nearest.y, skDmg, false);
        nearest.hitFlash = 180;
        nearest.killedByPlayer = true;
        sk.attackTimer = 700;

        if(Math.random() < 0.2){
          sk.hp -= 1;
        }

        addParticles(nearest.x, nearest.y, '#ddddff', 3);
      }
    } else {
      // Wander randomly when no enemies nearby
      sk.wanderTimer -= dt;
      if(sk.wanderTimer <= 0){
        sk.wanderTimer = 1000 + Math.random()*1500;
        const ang = Math.random() * Math.PI * 2;
        sk.wanderVx = Math.cos(ang) * 1.2;
        sk.wanderVy = Math.sin(ang) * 1.2;
      }
      sk.x += sk.wanderVx * (dt/16);
      sk.y += sk.wanderVy * (dt/16);
      clampToDungeon(sk);
      // Bounce off walls
      if(sk.x <= DX + sk.size || sk.x >= DX + DUNGEON_SIZE - sk.size) sk.wanderVx *= -1;
      if(sk.y <= DY + sk.size || sk.y >= DY + DUNGEON_SIZE - sk.size) sk.wanderVy *= -1;
    }
  });

  skeletons = skeletons.filter(sk=>{
    if(sk.hp <= 0){
      addParticles(sk.x, sk.y, '#ffffff', 8);

      if(activeBuffs.has('necro_money')){
        for(let i=0;i<3;i++){
          coins.push({x:sk.x,y:sk.y,vx:(Math.random()-0.5)*4,vy:-2-Math.random()*2,life:1});
        }
        gold += 3;
      }

      return false;
    }
    return true;
  });


  // Quiver pickup
  quivers=quivers.filter(q=>{
    const dx=player.x-q.x,dy=player.y-q.y;
    if(Math.sqrt(dx*dx+dy*dy)<22){
      arrows += activeBuffs.has('bow_pierce') ? 5 : 2;
      addParticles(q.x,q.y,'#88ccff',10);
      document.getElementById('arrows-display').textContent=`🏹 x${arrows}`;
      return false;
    }
    q.bob+=dt*0.003;
    return true;
  });

  // Enemy spawn delay countdown
  if(enemySpawnDelay > 0){
    enemySpawnDelay -= dt;
    if(enemySpawnDelay < 0) enemySpawnDelay = 0;
  }

  slimeSpawnTimer+=dt;
  if(enemySpawnDelay<=0 && slimeSpawnTimer>=DUNGEON_DEFS[currentDungeon].spawnRates.slime){
    const dNum = DUNGEON_DEFS[currentDungeon].num;
    const totalCap = DUNGEON_DEFS[currentDungeon].maxSlimes;
    const currentTotal = slimes.length + blueSlimes.length + redSlimes.filter(r=>!r.mini).length;
    if(currentTotal < totalCap){
      // Probabilidade por dungeon:
      // Dungeon 1: 100% verde
      // Dungeon 2: 50% verde, 50% azul
      // Dungeon 3+: 33% verde, 33% azul, 33% vermelho
      const r = Math.random();
      if(dNum >= 3){
        if(r < 1/3) spawnSlime();
        else if(r < 2/3) spawnBlueSlime();
        else spawnRedSlime();
      } else if(dNum >= 2){
        if(r < 0.5) spawnSlime();
        else spawnBlueSlime();
      } else {
        spawnSlime();
      }
    }
    slimeSpawnTimer=0;
  }

  bombSpawnTimer+=dt;
  if(enemySpawnDelay<=0&&DUNGEON_DEFS[currentDungeon].hasBombs&&bombSpawnTimer>=DUNGEON_DEFS[currentDungeon].spawnRates.bomb&&bombHeads.length<DUNGEON_DEFS[currentDungeon].maxBombs){spawnBombHead();bombSpawnTimer=0;}

  ratSpawnTimer+=dt;
  if(enemySpawnDelay<=0&&DUNGEON_DEFS[currentDungeon].hasRats&&ratSpawnTimer>=DUNGEON_DEFS[currentDungeon].spawnRates.rat&&assassinRats.length<DUNGEON_DEFS[currentDungeon].maxRats){spawnAssassinRat();ratSpawnTimer=0;}

  // Ghost spawn (a partir da dungeon 3, máximo 2 por vez)
  ghostSpawnTimer+=dt;
  const ghostDef = DUNGEON_DEFS[currentDungeon];
  const maxGhosts = ghostDef.num >= 3 ? Math.min(2, Math.floor((ghostDef.num - 2) / 2) + 1) : 0;
  if(enemySpawnDelay<=0 && maxGhosts>0 && ghostSpawnTimer>=5000 && ghosts.length<maxGhosts){
    spawnGhost(); ghostSpawnTimer=0;
  }

  // Golem spawn
  golemSpawnTimer+=dt;
  const golemDungDef = DUNGEON_DEFS[currentDungeon];
  if(enemySpawnDelay<=0 && golemDungDef.hasGolems && golemSpawnTimer>=golemDungDef.spawnRates.golem && golems.length<golemDungDef.maxGolems){
    spawnGolem(); golemSpawnTimer=0;
  }
  blueSlimes.forEach(sl=>{
    sl.wobble+=dt*0.003;
    if(sl.hitFlash>0) sl.hitFlash-=dt;
    if(sl._ballHitCooldown>0) sl._ballHitCooldown-=dt;

    const dx=player.x-sl.x, dy=player.y-sl.y;
    const dist=Math.sqrt(dx*dx+dy*dy);
    const spd = sl.slowed ? sl.slowMultiplier : 1;

    if(sl.dashing){
      sl.x += sl.dashVx * BLUE_SLIME_DASH_SPEED * spd * (dt/16);
      sl.y += sl.dashVy * BLUE_SLIME_DASH_SPEED * spd * (dt/16);
      clampToDungeon(sl);
      sl.dashTimeLeft -= dt;
      if(sl.dashTimeLeft<=0){ sl.dashing=false; sl.dashTimer=BLUE_SLIME_DASH_COOLDOWN; }
    } else {
      // Caminha devagar entre dashes
      const walkSpd = 1.0 * spd;
      if(dist>1){ sl.x+=(dx/dist)*walkSpd*(dt/16); sl.y+=(dy/dist)*walkSpd*(dt/16); }
      clampToDungeon(sl);
      sl.dashTimer -= dt;
      if(sl.dashTimer<=0 && dist>1){
        sl.dashing=true; sl.dashTimeLeft=BLUE_SLIME_DASH_DURATION;
        sl.dashVx=dx/dist; sl.dashVy=dy/dist;
      }
    }
  });

  // Kill/remove dead blue slimes
  blueSlimes.forEach(sl=>{ if(sl.hp<=0){ spawnCoins(sl.x,sl.y,sl.goldDouble?2:1); registerKill(); } });
  blueSlimes=blueSlimes.filter(sl=>sl.hp>0);

  // ── RED SLIME UPDATE ──
  redSlimes.forEach(sl=>{
    sl.wobble+=dt*0.003;
    if(sl.hitFlash>0) sl.hitFlash-=dt;
    if(sl.contactCooldown>0) sl.contactCooldown-=dt;
    if(sl._ballHitCooldown>0) sl._ballHitCooldown-=dt;

    const dx=player.x-sl.x, dy=player.y-sl.y;
    const dist=Math.sqrt(dx*dx+dy*dy);
    const spd = (sl.slowed ? sl.slowMultiplier : 1) * (sl.mini ? 1.4 : 1.0);
    const walkSpd = 1.2 * spd;
    if(dist>1){ sl.x+=(dx/dist)*walkSpd*(dt/16); sl.y+=(dy/dist)*walkSpd*(dt/16); }
    clampToDungeon(sl);

    // Contact damage
    if(dist<player.size+sl.size && !player.rolling && player.invincible<=0 && sl.contactCooldown<=0){
      damagePlayer(RED_SLIME_CONTACT_DAMAGE);
      player.hitFlash=400; player.invincible=1000; sl.contactCooldown=1200;
      spawnDamageNumber(player.x,player.y,RED_SLIME_CONTACT_DAMAGE,true);
      addParticles(player.x,player.y,'#ff4444',8);
      updateHPDisplay();
      if(player.hp<=0) triggerGameOver();
    }
  });

  // Kill dead red slimes — big ones spawn 2 minis
  const newMinis = [];
  redSlimes.forEach(sl=>{
    if(sl.hp<=0){
      spawnCoins(sl.x,sl.y,sl.goldDouble?2:1);
      registerKill();
      if(!sl.mini){
        // spawn 2 mini red slimes
        newMinis.push({x:sl.x-10+Math.random()*20, y:sl.y-10+Math.random()*20});
        newMinis.push({x:sl.x-10+Math.random()*20, y:sl.y-10+Math.random()*20});
      }
    }
  });
  redSlimes=redSlimes.filter(sl=>sl.hp>0);
  newMinis.forEach(p=>spawnRedSlime(p.x,p.y,true));
  // Reset player slow from ghost (recalculated each frame)
  let ghostSlowingPlayer = false;

  ghosts.forEach(g=>{
    g.wobble += dt*0.002;
    if(g.hitFlash>0) g.hitFlash-=dt;

    // Ciclo de invisibilidade: alterna a cada GHOST_INVIS_CYCLE ms
    g.invisTimer += dt;
    if(g.invisTimer >= GHOST_INVIS_CYCLE){
      g.invisTimer -= GHOST_INVIS_CYCLE;
      g.invisible = !g.invisible;
    }

    // Move em direção ao player (sempre, mesmo invisível)
    const dx=player.x-g.x, dy=player.y-g.y;
    const dist=Math.sqrt(dx*dx+dy*dy)||1;
    g.x += (dx/dist)*GHOST_SPEED*(dt/16);
    g.y += (dy/dist)*GHOST_SPEED*(dt/16);
    clampToDungeon(g);

    // Aura de lentidão no player (funciona mesmo invisível)
    if(dist < GHOST_SLOW_RADIUS){
      ghostSlowingPlayer = true;
    }
  });

  // Aplica lentidão no player causada por fantasma
  if(ghostSlowingPlayer){
    player._ghostSlowed = true;
    player._ghostSlowMult = GHOST_SLOW_MULT;
  } else {
    player._ghostSlowed = false;
    player._ghostSlowMult = 1;
  }

  // Morte dos fantasmas
  ghosts.forEach(g=>{ if(g.hp<=0 && g.killedByPlayer){ spawnCoins(g.x,g.y,2); registerKill(); } });
  ghosts = ghosts.filter(g=>g.hp>0);

  // ── GOLEM UPDATE ──
  golems.forEach(g=>{
    g.wobble += dt*0.0015;
    if(g.hitFlash>0) g.hitFlash-=dt;
    if(g.contactCooldown>0) g.contactCooldown-=dt;

    // Máquina de estados: awake <-> sleeping
    g.stateTimer -= dt;
    if(g.state==='awake' && g.stateTimer<=0){
      g.state='sleeping';
      g.stateTimer=GOLEM_SLEEP_DURATION;
      addParticles(g.x,g.y,'#aaaaaa',6);
    } else if(g.state==='sleeping' && g.stateTimer<=0){
      g.state='awake';
      g.stateTimer=GOLEM_SLEEP_CYCLE;
      addParticles(g.x,g.y,'#ffffff',4);
    }

    // Só se move quando acordado
    if(g.state==='awake'){
      const dx=player.x-g.x, dy=player.y-g.y;
      const dist=Math.sqrt(dx*dx+dy*dy)||1;
      const golemSpd = GOLEM_SPEED * (g.slowed ? g.slowMultiplier : 1);
      g.x += (dx/dist)*golemSpd*(dt/16);
      g.y += (dy/dist)*golemSpd*(dt/16);
      clampToDungeon(g);

      // Dano por contato
      if(dist<player.size+g.size && !player.rolling && player.invincible<=0 && g.contactCooldown<=0){
        player.hp -= GOLEM_DAMAGE;
        spawnDamageNumber(player.x, player.y, GOLEM_DAMAGE, true);
        player.hitFlash=500;
        player.invincible=1200;
        g.contactCooldown=1400;
        addParticles(player.x,player.y,'#ff4444',12);
        updateHPDisplay();
        if(player.hp<=0) triggerGameOver();
      }
    }
  });

  // Golems dormindo são imortais (hp não pode cair a 0 enquanto sleeping)
  golems.forEach(g=>{
    if(g.state==='sleeping') g.hp=Math.max(1,g.hp); // imortal durante sono
    if(g.hp<=0 && g.killedByPlayer){ spawnCoins(g.x,g.y,g.goldDouble?20:10); registerKill(); }
  });
  golems=golems.filter(g=>g.hp>0);

  const RAT_SPEED=4.5, RAT_WINDUP_RANGE=90, RAT_DASH_SPEED=18;

  // Update dash trails
  dashTrails.forEach(t=>{ t.life-=dt/2000; });
  dashTrails=dashTrails.filter(t=>t.life>0);

  // Dash trail damage to player
  dashTrails.forEach(t=>{
    if(player.invincible>0||player.rolling) return;
    const dx=player.x-t.x, dy=player.y-t.y;
    if(Math.sqrt(dx*dx+dy*dy)<14&&!t.damagedPlayer){
      t.damagedPlayer=true;
      damagePlayer(1); player.hitFlash=400; player.invincible=900;
      spawnDamageNumber(player.x, player.y, 1, true);
      addParticles(player.x,player.y,'#ff0000',8);
      updateHPDisplay();
      if(player.hp<=0){triggerGameOver();}
    }
  });

  assassinRats.forEach(r=>{
    r.wobble+=dt*0.005; r.tailWag+=dt*0.008;
    if(r.hitFlash>0) r.hitFlash-=dt;
    if(r.contactCooldown>0) r.contactCooldown-=dt;
    const dx=player.x-r.x, dy=player.y-r.y;
    const dist=Math.sqrt(dx*dx+dy*dy);
    r.angle=Math.atan2(dy,dx);

    if(r.state==='chase'){
      const ratSpd = RAT_SPEED * (r.slowed ? r.slowMultiplier : 1);
      if(dist>1){r.x+=(dx/dist)*ratSpd*(dt/16);r.y+=(dy/dist)*ratSpd*(dt/16);}
      clampToDungeon(r);
      // Enter windup when close
      if(dist<RAT_WINDUP_RANGE){
        r.state='windup'; r.windupTimer=0;
        // Aim dash across entire dungeon in player direction
        const dashLen=DUNGEON_SIZE*1.5;
        r.dashVx=dx/dist; r.dashVy=dy/dist;
        r.dashOriginX=r.x; r.dashOriginY=r.y;
        r.dashTargetX=r.x+r.dashVx*dashLen; r.dashTargetY=r.y+r.dashVy*dashLen;
      }
      // Contact damage while chasing
      if(dist<player.size+r.size&&!player.rolling&&player.invincible<=0&&r.contactCooldown<=0){
        damagePlayer(1);player.hitFlash=400;player.invincible=1000;r.contactCooldown=1200;
        spawnDamageNumber(player.x, player.y, 1, true);
        addParticles(player.x,player.y,'#ff4444',8);
        updateHPDisplay();
        if(player.hp<=0){triggerGameOver();}
      }
    } else if(r.state==='windup'){
      r.windupTimer+=dt;
      // Stay mostly still, shake slightly
      r.x+=Math.sin(r.windupTimer*0.04)*0.3;
      if(r.windupTimer>=r.windupDuration){
        r.state='dash'; r.dashTimer=0;
        r.dashOriginX=r.x; r.dashOriginY=r.y;
      }
    } else if(r.state==='dash'){
      r.dashTimer+=dt;
      const progress=r.dashTimer/(r.dashDuration);
      const ratDash = RAT_DASH_SPEED * (r.slowed ? r.slowMultiplier : 1);
      r.x+=r.dashVx*ratDash*(dt/16);
      r.y+=r.dashVy*ratDash*(dt/16);
      // Spawn trail segments
      if(Math.floor(r.dashTimer/30)>Math.floor((r.dashTimer-dt)/30)){
        dashTrails.push({x:r.x,y:r.y,life:1,maxLife:1,damagedPlayer:false});
      }
      // Bounce off walls
      if(r.x<DX+r.size){r.x=DX+r.size;r.dashVx=Math.abs(r.dashVx);}
      if(r.x>DX+DUNGEON_SIZE-r.size){r.x=DX+DUNGEON_SIZE-r.size;r.dashVx=-Math.abs(r.dashVx);}
      if(r.y<DY+r.size){r.y=DY+r.size;r.dashVy=Math.abs(r.dashVy);}
      if(r.y>DY+DUNGEON_SIZE-r.size){r.y=DY+DUNGEON_SIZE-r.size;r.dashVy=-Math.abs(r.dashVy);}
      // Hit player during dash
      const pdx=player.x-r.x,pdy=player.y-r.y;
      if(Math.sqrt(pdx*pdx+pdy*pdy)<player.size+r.size&&!player.rolling&&player.invincible<=0){
        player.hp-=3;player.hitFlash=600;player.invincible=1500;
        spawnDamageNumber(player.x, player.y, 3, true);
        addParticles(player.x,player.y,'#ff0000',18);
        updateHPDisplay();
        if(player.hp<=0){triggerGameOver();}
      }
      if(r.dashTimer>=r.dashDuration){r.state='cooldown';r.cooldownTimer=1800;}
    } else if(r.state==='cooldown'){
      r.cooldownTimer-=dt;
      if(r.cooldownTimer<=0) r.state='chase';
    }
  });
  assassinRats.forEach(r=>{ if(r.hp<=0&&r.killedByPlayer){ spawnCoins(r.x,r.y,r.goldDouble?4:2); registerKill(); } });
  assassinRats=assassinRats.filter(r=>r.hp>0);

  // BombHead update
  bombHeads.forEach(b=>{
    b.wobble+=dt*0.004;
    if(b.hitFlash>0) b.hitFlash-=dt;
    if(b.contactCooldown>0) b.contactCooldown-=dt;

    if(b.state==='ground'){
      // move fast toward player
      const dx=player.x-b.x, dy=player.y-b.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      const bSpd = BOMB_SPEED * (b.slowed ? b.slowMultiplier : 1);
      if(dist>1){b.x+=(dx/dist)*bSpd*(dt/16);b.y+=(dy/dist)*bSpd*(dt/16);}
      clampToDungeon(b);
      b.jumpTimer+=dt;
      // trigger jump when close enough or timer threshold
      if(dist<120||b.jumpTimer>4000+Math.random()*2000){
        b.state='warning';b.jumpTimer=0;
        // aim at current player pos + small prediction
        b.shadowX=player.x+(player.x-b.x)*0.2;
        b.shadowY=player.y+(player.y-b.y)*0.2;
        // clamp shadow inside dungeon
        b.shadowX=Math.max(DX+30,Math.min(DX+DUNGEON_SIZE-30,b.shadowX));
        b.shadowY=Math.max(DY+30,Math.min(DY+DUNGEON_SIZE-30,b.shadowY));
      }
    } else if(b.state==='warning'){
      // shake in place briefly, show warning ring
      b.jumpTimer+=dt;
      b.x+=Math.sin(b.jumpTimer*0.08)*0.5;
      if(b.jumpTimer>=BOMB_JUMP_WARN){
        b.state='air'; b.airProgress=0; b.jumpTimer=0;
        b.airX=b.x; b.airY=b.y; // launch from here
      }
    } else if(b.state==='air'){
      // arc through the air - lerp position, apply height offset in draw
      b.jumpTimer+=dt;
      b.airProgress=Math.min(1,b.jumpTimer/BOMB_FALL_TIME);
      b.x=b.airX+(b.shadowX-b.airX)*b.airProgress;
      b.y=b.airY+(b.shadowY-b.airY)*b.airProgress;
      b.rotation+=dt*0.015;
      if(b.airProgress>=1){
        b.state='landing'; b.jumpTimer=0;
        b.x=b.shadowX; b.y=b.shadowY;
        // Self-damage on explosion (not a player kill)
        b.hp-=1; spawnDamageNumber(b.x, b.y, 1, false);
        if(b.hp<=0) b.killedByPlayer=false;
        // Explosion on landing
        addParticles(b.x,b.y,'#ff4400',30);
        addParticles(b.x,b.y,'#ffaa00',20);
        // Check player in blast radius
        const pdx=player.x-b.x, pdy=player.y-b.y;
        if(Math.sqrt(pdx*pdx+pdy*pdy)<BOMB_RADIUS&&player.invincible<=0){
          player.hp-=2; player.hitFlash=500; player.invincible=1200;
          spawnDamageNumber(player.x, player.y, 2, true);
          // knockback
          const angle=Math.atan2(pdy,pdx);
          player.x+=Math.cos(angle)*60; player.y+=Math.sin(angle)*60;
          clampToDungeon(player);
          updateHPDisplay();
          if(player.hp<=0){triggerGameOver();}
        }
        // also push slimes
        slimes.forEach(sl=>{
          const sdx=sl.x-b.x,sdy=sl.y-b.y,sd=Math.sqrt(sdx*sdx+sdy*sdy);
          if(sd<BOMB_RADIUS&&sd>0){sl.x+=(sdx/sd)*50;sl.y+=(sdy/sd)*50;clampToDungeon(sl);}
        });
        blueSlimes.forEach(sl=>{
          const sdx=sl.x-b.x,sdy=sl.y-b.y,sd=Math.sqrt(sdx*sdx+sdy*sdy);
          if(sd<BOMB_RADIUS&&sd>0){sl.x+=(sdx/sd)*50;sl.y+=(sdy/sd)*50;clampToDungeon(sl);}
        });
        redSlimes.forEach(sl=>{
          const sdx=sl.x-b.x,sdy=sl.y-b.y,sd=Math.sqrt(sdx*sdx+sdy*sdy);
          if(sd<BOMB_RADIUS&&sd>0){sl.x+=(sdx/sd)*50;sl.y+=(sdy/sd)*50;clampToDungeon(sl);}
        });
      }
    } else if(b.state==='landing'){
      b.jumpTimer+=dt;
      if(b.jumpTimer>500){b.state='ground';b.jumpTimer=3000+Math.random()*2000;} // cooldown before next jump
    }
  });
  bombHeads.forEach(b=>{
    if(b.hp<=0){ if(b.killedByPlayer){ spawnCoins(b.x,b.y,b.goldDouble?6:3); registerKill(); } }
  });
  bombHeads=bombHeads.filter(b=>b.hp>0);

  slimes.forEach(sl=>{
    sl.wobble+=dt*0.003;
    if(sl.hitFlash>0) sl.hitFlash-=dt;
    if(sl.contactCooldown>0) sl.contactCooldown-=dt;

    const dx=player.x-sl.x,dy=player.y-sl.y;
    const dist=Math.sqrt(dx*dx+dy*dy);

    if(sl.charging){
      const slCharge = SLIME_CHARGE_SPEED * (sl.slowed ? sl.slowMultiplier : 1);
      sl.x+=sl.chargeVx*slCharge*(dt/16);
      sl.y+=sl.chargeVy*slCharge*(dt/16);
      clampToDungeon(sl);
      sl.chargeTimeLeft-=dt;
      if(sl.chargeTimeLeft<=0){sl.charging=false;sl.chargeTimer=SLIME_CHARGE_COOLDOWN;}
    } else {
      const slWalk = 1.3 * (sl.slowed ? sl.slowMultiplier : 1);
      if(dist>1){sl.x+=(dx/dist)*slWalk*(dt/16);sl.y+=(dy/dist)*slWalk*(dt/16);}
      clampToDungeon(sl);
      sl.chargeTimer-=dt;
      if(sl.chargeTimer<=0){sl.charging=true;sl.chargeTimeLeft=SLIME_CHARGE_DURATION;if(dist>0){sl.chargeVx=dx/dist;sl.chargeVy=dy/dist;}}
    }

    if(dist<player.size+sl.size&&!player.rolling&&player.invincible<=0&&sl.contactCooldown<=0){
      damagePlayer(1);player.hitFlash=400;player.invincible=1000;sl.contactCooldown=1200;
      spawnDamageNumber(player.x, player.y, 1, true);
      addParticles(player.x,player.y,'#ff4444',8);
      updateHPDisplay();
      if(player.hp<=0){triggerGameOver();}
    }
  });
  slimes.forEach(sl=>{ if(sl.hp<=0){ spawnCoins(sl.x,sl.y,sl.goldDouble?2:1); registerKill(); } });
  slimes=slimes.filter(sl=>sl.hp>0);

  // Coins on ground
  coins.forEach(c=>{
    if(c.collected) return;
    if(c.settling){
      c.x+=c.vx; c.y+=c.vy;
      c.vy+=0.18; // gravity
      c.vx*=0.90;
      // Bounce off dungeon walls
      const cm=7;
      if(c.x<DX+cm){ c.x=DX+cm; c.vx=Math.abs(c.vx)*0.7; }
      if(c.x>DX+DUNGEON_SIZE-cm){ c.x=DX+DUNGEON_SIZE-cm; c.vx=-Math.abs(c.vx)*0.7; }
      if(c.y<DY+cm){ c.y=DY+cm; c.vy=Math.abs(c.vy)*0.7; }
      if(c.y>DY+DUNGEON_SIZE-cm){ c.y=DY+DUNGEON_SIZE-cm; c.vy=-Math.abs(c.vy)*0.55; if(Math.abs(c.vy)<0.5) c.vy=0; }
      c.settleTimer+=dt;
      if(c.settleTimer>600){ c.settling=false; c.vx=0; c.vy=0; }
    }
    c.bob+=dt*0.003;
    // Imã: atrai moedas próximas ao player
    if(typeof hasArtifactEffect === 'function' && hasArtifactEffect('coin_magnet')){
      const MAGNET_RADIUS = (typeof getArtifactUpgradeValue === 'function') ? (getArtifactUpgradeValue('magnet') || 50) : 50;
      const MAGNET_SPEED = 4.5;
      const mdx = player.x - c.x, mdy = player.y - c.y;
      const mdist = Math.sqrt(mdx*mdx + mdy*mdy);
      if(mdist < MAGNET_RADIUS && mdist > 1){
        c.x += (mdx/mdist) * MAGNET_SPEED;
        c.y += (mdy/mdist) * MAGNET_SPEED;
        c.settling = false; c.vx = 0; c.vy = 0;
      }
    }
    // pickup check
    const cdx=player.x-c.x, cdy=player.y-c.y;
    if(Math.sqrt(cdx*cdx+cdy*cdy)<22) collectCoin(c);
  });
  coins=coins.filter(c=>!c.collected);

  // Flying coins (bezier arc to gold counter)
  flyingCoins=flyingCoins.filter(fc=>{
    if(!fc.ox){ fc.ox=fc.x; fc.oy=fc.y; } // store origin on first frame
    fc.progress=Math.min(1,fc.progress+fc.speed);
    const t=fc.progress;
    // quadratic bezier: P = (1-t)^2*P0 + 2(1-t)t*C + t^2*P1
    fc.drawX=(1-t)*(1-t)*fc.ox + 2*(1-t)*t*fc.cx + t*t*fc.tx;
    fc.drawY=(1-t)*(1-t)*fc.oy + 2*(1-t)*t*fc.cy + t*t*fc.ty;
    if(fc.progress>=1){
      gold++; updateGoldDisplay();
      return false;
    }
    return true;
  });

  particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vx*=0.92;p.vy*=0.92;p.life-=dt/1000;});
  particles=particles.filter(p=>p.life>0);

  // Dice roll anim tick
  if(diceRollAnim){
    diceRollAnim.timer -= dt;
    if(diceRollAnim.timer <= 200 && !diceRollAnim.done) diceRollAnim.done = true;
    if(diceRollAnim.timer <= 0) diceRollAnim = null;
  }
  // Dice result texts tick
  diceResultTexts.forEach(t=>{ t.life -= dt/1000; t.y -= dt*0.025; });
  diceResultTexts = diceResultTexts.filter(t=>t.life>0);
  updateDamageNumbers(dt);
  // Protorobô-9500
  if(companionRobot) updateCompanionRobot(dt);
}

function updateCompanionRobot(dt){
  const r = companionRobot;

  // Sleep cycle
  if(!r.sleeping){
    r.sleepTimer -= dt;
    if(r.sleepTimer <= 0){
      r.sleeping = true;
      r.wakeTimer = r.sleepDuration || ROBOT_SLEEP_DURATION_BASE;
    }
  } else {
    r.wakeTimer -= dt;
    if(r.wakeTimer <= 0){
      r.sleeping = false;
      r.sleepTimer = ROBOT_SLEEP_INTERVAL;
    }
  }

  // Follow player
  const dx = player.x - r.x;
  const dy = player.y - r.y;
  const dist = Math.sqrt(dx*dx+dy*dy);
  const followDist = 45;
  if(dist > followDist){
    const speed = ROBOT_SPEED * (r.sleeping ? 0.5 : 1);
    r.x += (dx/dist)*speed;
    r.y += (dy/dist)*speed;
  }

  // Shoot at enemies when awake
  if(!r.sleeping){
    r.fireTimer -= dt;
    if(r.fireTimer <= 0){
      r.fireTimer = ROBOT_FIRE_RATE;
      robotShoot();
    }
  }
}

function robotShoot(){
  // Find nearest enemy
  const r = companionRobot;
  let nearest = null, nearestDist = 999999;
  const allEnemies = [...(slimes||[]), ...(blueSlimes||[]), ...(redSlimes||[]), ...(bombHeads||[]), ...(assassinRats||[]), ...(ghosts||[]), ...(golems||[])];
  allEnemies.forEach(en => {
    const dx = en.x - r.x, dy = en.y - r.y;
    const d = Math.sqrt(dx*dx+dy*dy);
    if(d < nearestDist){ nearestDist = d; nearest = en; }
  });
  if(!nearest || nearestDist > 350) return;
  const dx = nearest.x - r.x, dy = nearest.y - r.y;
  const dist = Math.sqrt(dx*dx+dy*dy);
  const speed = 14;
  const spread = (Math.random()-0.5)*0.15;
  const angle = Math.atan2(dy, dx) + spread;
  projectiles.push({
    x: r.x, y: r.y,
    vx: Math.cos(angle)*speed,
    vy: Math.sin(angle)*speed,
    life: 1, maxLife: 1,
    size: 3,
    damage: 0.25,
    pierce: false,
    knockback: false,
    isBullet: true,
    fromRobot: true,
  });
}

function drawCompanionRobot(){
  if(!companionRobot) return;
  const r = companionRobot;
  ctx.save();
  ctx.translate(r.x, r.y);
  const sleeping = r.sleeping;

  // Body
  ctx.fillStyle = sleeping ? '#445566' : '#44aaff';
  ctx.shadowColor = sleeping ? '#223344' : '#00ccff';
  ctx.shadowBlur = sleeping ? 6 : 14;
  ctx.fillRect(-8, -8, 16, 16);

  // Head
  ctx.fillStyle = sleeping ? '#334455' : '#2288dd';
  ctx.fillRect(-6, -14, 12, 8);

  // Eyes
  if(!sleeping){
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -12, 3, 4);
    ctx.fillRect(1, -12, 3, 4);
    ctx.fillStyle = '#ff2244';
    ctx.fillRect(-3, -11, 2, 2);
    ctx.fillRect(2, -11, 2, 2);
  } else {
    // Zzz
    ctx.fillStyle = '#aabbcc';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('z', 0, -8);
  }

  // Sleep timer bar above robot
  if(!sleeping){
    const frac = r.sleepTimer / ROBOT_SLEEP_INTERVAL;
    ctx.fillStyle = '#223344';
    ctx.fillRect(-10, -20, 20, 3);
    ctx.fillStyle = frac > 0.3 ? '#44ff88' : '#ff8844';
    ctx.fillRect(-10, -20, 20*frac, 3);
  } else {
    const frac = r.wakeTimer / (r.sleepDuration || ROBOT_SLEEP_DURATION_BASE);
    ctx.fillStyle = '#223344';
    ctx.fillRect(-10, -20, 20, 3);
    ctx.fillStyle = '#aaaaff';
    ctx.fillRect(-10, -20, 20*(1-frac), 3);
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawTransition(def, nextDef){
  const pct=Math.min(1,transitionTimer/TRANSITION_DURATION);
  // Determine which colors to show based on phase
  const showNext=pct>0.5;
  const activeDef=showNext?nextDef:def;

  // Draw dungeon floor with cube-spin effect
  ctx.save();
  ctx.translate(W/2, H/2);

  if(pct>=0.35&&pct<0.75){
    // Cube spin phase: skew the square like a rotating cube face
    const spinPct=(pct-0.35)/0.4; // 0..1
    const scaleX=Math.abs(Math.cos(spinPct*Math.PI)); // 1 -> 0 -> 1
    const half=DUNGEON_SIZE/2;

    // Draw side face (other color) when collapsing
    if(spinPct>0.5){
      // fading in the next dungeon color as the "new face" comes in
      const sidePct=(spinPct-0.5)*2;
      ctx.fillStyle=nextDef.floorColor;
      ctx.beginPath();
      ctx.rect(-half*scaleX,-half,half*scaleX*2,DUNGEON_SIZE);
      ctx.fill();
      // grid lines on new face
      ctx.strokeStyle=nextDef.tileColor;ctx.lineWidth=1;
      const TILE=40;
      for(let x=-half*scaleX;x<=half*scaleX;x+=TILE){ctx.beginPath();ctx.moveTo(x,-half);ctx.lineTo(x,half);ctx.stroke();}
      for(let y=-half;y<=half;y+=TILE){ctx.beginPath();ctx.moveTo(-half*scaleX,y);ctx.lineTo(half*scaleX,y);ctx.stroke();}
      ctx.strokeStyle=nextDef.wallColor;ctx.lineWidth=4*scaleX;
      ctx.strokeRect(-half*scaleX,-half,half*scaleX*2,DUNGEON_SIZE);
    } else {
      // current face collapsing
      ctx.fillStyle=def.floorColor;
      ctx.beginPath();
      ctx.rect(-half*scaleX,-half,half*scaleX*2,DUNGEON_SIZE);
      ctx.fill();
      ctx.strokeStyle=def.tileColor;ctx.lineWidth=1;
      const TILE=40;
      for(let x=-half*scaleX;x<=half*scaleX;x+=TILE){ctx.beginPath();ctx.moveTo(x,-half);ctx.lineTo(x,half);ctx.stroke();}
      for(let y=-half;y<=half;y+=TILE){ctx.beginPath();ctx.moveTo(-half*scaleX,y);ctx.lineTo(half*scaleX,y);ctx.stroke();}
      ctx.strokeStyle=def.wallColor;ctx.lineWidth=4*scaleX;
      ctx.strokeRect(-half*scaleX,-half,half*scaleX*2,DUNGEON_SIZE);
    }
  } else {
    // Phase 0 (fly-up) or phase 2 (landing): draw normal dungeon slightly faded
    const alpha=pct<0.35?(1-pct/0.35)*0.6:(pct-0.75)/0.25*0.8;
    ctx.globalAlpha=Math.max(0,Math.min(1,alpha));
    const half=DUNGEON_SIZE/2;
    ctx.fillStyle=activeDef.floorColor;ctx.fillRect(-half,-half,DUNGEON_SIZE,DUNGEON_SIZE);
    ctx.strokeStyle=activeDef.tileColor;ctx.lineWidth=1;
    const TILE=40;
    for(let x=-half;x<=half;x+=TILE){ctx.beginPath();ctx.moveTo(x,-half);ctx.lineTo(x,half);ctx.stroke();}
    for(let y=-half;y<=half;y+=TILE){ctx.beginPath();ctx.moveTo(-half,y);ctx.lineTo(half,y);ctx.stroke();}
    ctx.strokeStyle=activeDef.wallColor;ctx.lineWidth=4;ctx.strokeRect(-half,-half,DUNGEON_SIZE,DUNGEON_SIZE);
    ctx.shadowColor=activeDef.glowColor;ctx.shadowBlur=14;
    ctx.strokeStyle=activeDef.color;ctx.lineWidth=1.5;ctx.strokeRect(-half+6,-half+6,DUNGEON_SIZE-12,DUNGEON_SIZE-12);
    ctx.shadowBlur=0;
  }

  ctx.globalAlpha=1;
  ctx.restore();
}


// ── Toggle de efeitos visuais ──────────────────────────────────
let fancyEffects = (()=>{ try{ return localStorage.getItem('bk_effects')!=='0'; }catch(e){ return true; } })();
function setFancyEffects(v){ fancyEffects=v; try{ localStorage.setItem('bk_effects',v?'1':'0'); }catch(e){} updatePauseEffectsLabel(); if(typeof updateOptionsEffectsLabel==='function') updateOptionsEffectsLabel(); }
function toggleFancyEffects(){ setFancyEffects(!fancyEffects); }
function updatePauseEffectsLabel(){
  const btn=document.getElementById('pause-effects-btn');
  if(!btn) return;
  btn.textContent = fancyEffects ? '✦ Efeitos: LIGADO' : '✧ Efeitos: DESLIGADO';
  btn.style.opacity = fancyEffects ? '1' : '0.55';
}

function drawDungeonBackground(def) {
  const theme = def.theme;
  const DIAG = Math.hypot(W, H);

  if (theme === 'blue') {
    ctx.fillStyle = '#04040e'; ctx.fillRect(0,0,W,H);
    const bg = ctx.createRadialGradient(W*0.5, H*0.42, 0, W*0.5, H*0.5, DIAG*0.6);
    bg.addColorStop(0, '#0c0c28'); bg.addColorStop(1, '#04040e');
    ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
    if(!fancyEffects) return;
    const GRID=52, pulse2=0.4+0.15*Math.sin(dungeonTime*1.1);
    for(let gx=0;gx<=W;gx+=GRID){ for(let gy=0;gy<=H;gy+=GRID){
      const wave=0.5+0.5*Math.sin(dungeonTime*0.9-Math.hypot(gx-W/2,gy-H/2)*0.012);
      ctx.globalAlpha=pulse2*wave*0.35; ctx.fillStyle='#3355aa';
      ctx.beginPath();ctx.arc(gx,gy,1.1,0,Math.PI*2);ctx.fill();
    }}
    ctx.globalAlpha=1;

  } else if (theme === 'green') {
    ctx.fillStyle = '#020602'; ctx.fillRect(0,0,W,H);
    const bg = ctx.createRadialGradient(W*0.5,H*0.55,0,W*0.5,H*0.5,DIAG*0.6);
    bg.addColorStop(0,'#070f08'); bg.addColorStop(1,'#020602');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    if(!fancyEffects) return;
    for(let i=0;i<5;i++){
      const nx=W*(0.1+i*0.2)+Math.sin(dungeonTime*0.3+i*1.7)*40;
      const ny=H*(0.2+i*0.14)+Math.cos(dungeonTime*0.25+i*1.1)*28;
      const nr=80+i*30+Math.sin(dungeonTime*0.5+i)*20;
      const ng=ctx.createRadialGradient(nx,ny,0,nx,ny,nr);
      ng.addColorStop(0,`rgba(20,80,35,${0.12+0.04*Math.sin(dungeonTime+i)})`); ng.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=ng; ctx.fillRect(nx-nr,ny-nr,nr*2,nr*2);
    }
    const lineAlpha=0.07+0.03*Math.sin(dungeonTime*0.6);
    for(let ly=0;ly<H;ly+=18){
      ctx.globalAlpha=lineAlpha*(0.5+0.5*Math.sin(ly*0.08+dungeonTime*0.3));
      ctx.fillStyle='#226633'; ctx.fillRect(0,ly,W,1);
    }
    ctx.globalAlpha=1;
    const pg=ctx.createRadialGradient(W/2,H*0.8,0,W/2,H*0.8,H*0.5);
    pg.addColorStop(0,`rgba(30,100,50,${0.08+0.04*Math.sin(dungeonTime*1.3)})`); pg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=pg; ctx.fillRect(0,0,W,H);

  } else if (theme === 'red') {
    ctx.fillStyle='#060101'; ctx.fillRect(0,0,W,H);
    const bg=ctx.createRadialGradient(W*0.5,H*0.6,0,W*0.5,H*0.5,DIAG*0.6);
    bg.addColorStop(0,'#160404'); bg.addColorStop(1,'#060101');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    if(!fancyEffects) return;

    const heat=0.06+0.04*Math.sin(dungeonTime*2.1);
    const hg=ctx.createRadialGradient(W/2,H*0.65,0,W/2,H*0.65,DIAG*0.4);
    hg.addColorStop(0,`rgba(160,20,10,${heat})`); hg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=hg; ctx.fillRect(0,0,W,H);

    for(let i=0;i<3;i++){
      const wy=H*(0.5+i*0.17)+Math.sin(dungeonTime*1.1+i*2.2)*22;
      const wa=0.04+0.02*Math.sin(dungeonTime*1.5+i);
      const wg=ctx.createLinearGradient(0,wy-25,0,wy+25);
      wg.addColorStop(0,'rgba(180,30,10,0)'); wg.addColorStop(0.5,`rgba(180,30,10,${wa})`); wg.addColorStop(1,'rgba(180,30,10,0)');
      ctx.fillStyle=wg; ctx.fillRect(0,wy-25,W,50);
    }
    ambientParticles.slice(0,8).forEach(p=>{
      if(p.life>0){
        const fade=Math.sin(p.life*Math.PI); ctx.save(); ctx.globalAlpha=0.18*fade;
        const eg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*3);
        eg.addColorStop(0,'rgba(255,160,40,1)'); eg.addColorStop(1,'rgba(255,50,10,0)');
        ctx.fillStyle=eg; ctx.beginPath();ctx.arc(p.x,p.y,p.r*3,0,Math.PI*2);ctx.fill(); ctx.restore();
      }
    });

  } else if (theme === 'black') {
    ctx.fillStyle='#010002'; ctx.fillRect(0,0,W,H);
    const bg=ctx.createRadialGradient(W*0.5,H*0.45,0,W*0.5,H*0.5,DIAG*0.6);
    bg.addColorStop(0,'#0a0410'); bg.addColorStop(1,'#010002');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    if(!fancyEffects) return;
    if(!drawDungeonBackground._stars){
      drawDungeonBackground._stars=Array.from({length:60},(_,i)=>({
        x:((i*137.5)%1)*W, y:((i*97.3+13)%1)*H,
        r:0.4+((i*31)%10)*0.18, phase:(i*0.7)%(Math.PI*2),
      }));
    }
    drawDungeonBackground._stars.forEach(s=>{
      ctx.globalAlpha=0.2+0.15*Math.sin(dungeonTime*0.8+s.phase);
      ctx.fillStyle='#cc88ff'; ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
    });
    ctx.globalAlpha=1;
    for(let i=0;i<4;i++){
      const oy=H*(0.18+i*0.2)+Math.sin(dungeonTime*0.5+i*1.6)*30;
      const oa=0.04+0.025*Math.sin(dungeonTime*1.2+i*0.9);
      const og=ctx.createLinearGradient(0,oy-40,0,oy+40);
      og.addColorStop(0,'rgba(100,20,180,0)'); og.addColorStop(0.5,`rgba(100,20,180,${oa})`); og.addColorStop(1,'rgba(100,20,180,0)');
      ctx.fillStyle=og; ctx.fillRect(0,oy-40,W,80);
    }
    const vg=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,DIAG*0.3);
    vg.addColorStop(0,`rgba(60,0,100,${0.12+0.06*Math.sin(dungeonTime*0.7)})`); vg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
  } else {
    ctx.fillStyle='#06060e'; ctx.fillRect(0,0,W,H);
  }
  ctx.globalAlpha=1;
}

function draw(dt){
  const def=DUNGEON_DEFS[currentDungeon];
  const nextDef=DUNGEON_DEFS[Math.min(currentDungeon+1,DUNGEON_DEFS.length-1)];
  ctx.clearRect(0,0,W,H);
  ctx.setTransform(1,0,0,1,0,0); // garante transform limpo a cada frame
  drawDungeonBackground(def);
  // ── Camera shake translate ──
  const _shakeApplied = (cameraShakeX !== 0 || cameraShakeY !== 0);
  if(_shakeApplied){
    ctx.save();
    ctx.translate(cameraShakeX, cameraShakeY);
  }

  if(transitioning){
    drawTransition(def,nextDef);
    // draw player flying during transition
    if(playerFlyAlpha>0.05){
      ctx.save();ctx.globalAlpha=playerFlyAlpha;
      ctx.translate(player.x,playerFlyY);ctx.rotate(player.angle);
      ctx.fillStyle='#aaaacc';ctx.fillRect(-player.size/2,-player.size/2,player.size,player.size);
      ctx.fillStyle='#8888aa';ctx.fillRect(-player.size/2+2,-player.size/2-4,player.size-4,8);
      ctx.restore();ctx.globalAlpha=1;
    }
    // pause overlay during transition? No - just a dungeon name flash
    const pct=transitionTimer/TRANSITION_DURATION;
    if(pct>0.6&&pct<0.95){
      const alpha=Math.sin((pct-0.6)/0.35*Math.PI);
      ctx.globalAlpha=alpha;
      ctx.fillStyle=nextDef.color;ctx.font='bold 28px Courier New';ctx.textAlign='center';
      ctx.fillText(nextDef.name,W/2,H/2);
      if(nextDef.killGoal>=9999){
        ctx.fillStyle='#aaaaaa';ctx.font='13px Courier New';
        ctx.fillText('⚠ em produção... sem fim',W/2,H/2+26);
      }
      ctx.textAlign='left';ctx.globalAlpha=1;
    }
    if(_shakeApplied) ctx.restore();
    return;
  }

  // ─── Normal floor ─────────────────────────────────────────────────────────
  ctx.fillStyle=def.floorColor;ctx.fillRect(DX,DY,DUNGEON_SIZE,DUNGEON_SIZE);
  ctx.strokeStyle=def.tileColor;ctx.lineWidth=1;
  const TILE=40;
  for(let x=DX;x<=DX+DUNGEON_SIZE;x+=TILE){ctx.beginPath();ctx.moveTo(x,DY);ctx.lineTo(x,DY+DUNGEON_SIZE);ctx.stroke();}
  for(let y=DY;y<=DY+DUNGEON_SIZE;y+=TILE){ctx.beginPath();ctx.moveTo(DX,y);ctx.lineTo(DX+DUNGEON_SIZE,y);ctx.stroke();}

  // ── Scanlines sutis ──
  if(fancyEffects){
    ctx.save();
    ctx.beginPath();ctx.rect(DX,DY,DUNGEON_SIZE,DUNGEON_SIZE);ctx.clip();
    for(let sy=DY;sy<=DY+DUNGEON_SIZE;sy+=4){
      ctx.fillStyle='rgba(0,0,0,0.055)';
      ctx.fillRect(DX,sy,DUNGEON_SIZE,2);
    }
    ctx.restore();
  }

  // ── Glow pulsante nas bordas da dungeon ──
  const pulse=fancyEffects ? 0.7+0.3*Math.sin(dungeonTime*1.8) : 1.0;
  ctx.shadowColor=def.glowColor;ctx.shadowBlur=16*pulse;
  ctx.strokeStyle=def.wallColor;ctx.lineWidth=4;ctx.strokeRect(DX,DY,DUNGEON_SIZE,DUNGEON_SIZE);
  ctx.shadowBlur=20*pulse;
  ctx.strokeStyle=def.color;ctx.lineWidth=1.5;ctx.strokeRect(DX+6,DY+6,DUNGEON_SIZE-12,DUNGEON_SIZE-12);
  ctx.shadowBlur=0;
  [[DX,DY],[DX+DUNGEON_SIZE,DY],[DX,DY+DUNGEON_SIZE],[DX+DUNGEON_SIZE,DY+DUNGEON_SIZE]].forEach(([cx,cy])=>{ctx.fillStyle=def.wallColor;ctx.fillRect(cx-8,cy-8,16,16);});

  if(fancyEffects){
    // ── Corner glows ──
    ctx.save();
    [[DX,DY],[DX+DUNGEON_SIZE,DY],[DX,DY+DUNGEON_SIZE],[DX+DUNGEON_SIZE,DY+DUNGEON_SIZE]].forEach(([cx,cy])=>{
      const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,70);
      cg.addColorStop(0,def.glowColor.replace(/^#([0-9a-f]{6})$/i,(_,h)=>`rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${0.22*pulse})`));
      cg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=cg;
      ctx.beginPath();ctx.arc(cx,cy,70,0,Math.PI*2);ctx.fill();
    });
    ctx.restore();

    // ── Vinheta sobre o canvas inteiro (bordas escuras pulsando) ──
    const vAlpha=0.38+0.08*Math.sin(dungeonTime*0.9);
    const VDIAG=Math.hypot(W,H);
    const vgrd=ctx.createRadialGradient(W/2,H/2,VDIAG*0.28,W/2,H/2,VDIAG*0.62);
    vgrd.addColorStop(0,'rgba(0,0,0,0)');
    vgrd.addColorStop(1,`rgba(0,0,0,${vAlpha})`);
    ctx.fillStyle=vgrd;ctx.fillRect(0,0,W,H);

    // ── Partículas ambientes clipadas à dungeon ──
    ctx.save();
    ctx.beginPath();ctx.rect(DX,DY,DUNGEON_SIZE,DUNGEON_SIZE);ctx.clip();
    ambientParticles.forEach(p=>{
      if(p.life===0||p.x===0){resetAmbientParticle(p,DX,DY,DUNGEON_SIZE);}
      p.life+=dt*0.00045;
      p.x+=p.vx+(Math.sin(dungeonTime*1.2+p.wobble)*0.15);
      p.y+=p.vy;
      p.wobble+=0.03;
      if(p.life>1||p.y<DY-10){resetAmbientParticle(p,DX,DY,DUNGEON_SIZE);}
      const fade=Math.sin(p.life*Math.PI);
      ctx.save();
      ctx.globalAlpha=p.alpha*fade;
      ctx.shadowColor=def.glowColor;ctx.shadowBlur=p.r*6;
      ctx.fillStyle=def.color;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;ctx.restore();
    });
    ctx.restore();
  }

  // Blast wave
  if(blastWave){
    ctx.beginPath();ctx.arc(blastWave.x,blastWave.y,blastWave.r,0,Math.PI*2);
    ctx.strokeStyle=`rgba(255,140,50,${blastWave.life*0.9})`;ctx.lineWidth=8*blastWave.life;ctx.stroke();
    ctx.beginPath();ctx.arc(blastWave.x,blastWave.y,blastWave.r*0.6,0,Math.PI*2);
    ctx.strokeStyle=`rgba(255,220,100,${blastWave.life*0.5})`;ctx.lineWidth=4*blastWave.life;ctx.stroke();
  }

  // Sangue no chão (Glitch Fury kill splatter)
  // ── Rasgos no chão (persistem enquanto fury ativo, clipados à dungeon) ──
  if(glitchFuryScars.length > 0){
    ctx.save();
    ctx.beginPath();
    ctx.rect(DX, DY, DUNGEON_SIZE, DUNGEON_SIZE);
    ctx.clip();
    glitchFuryScars.forEach(sc => {
      ctx.save();
      ctx.translate(sc.cx, sc.cy);
      ctx.beginPath();
      ctx.arc(0, 0, sc.R, sc.a0, sc.a1);
      ctx.strokeStyle = sc.isFinisher ? 'rgba(80,80,80,0.35)' : 'rgba(60,60,60,0.28)';
      ctx.lineWidth = sc.isFinisher ? 10 : 7;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }

  glitchFuryBlood.forEach(b => {
    const alpha = b.life * (b.settled ? 0.82 : 0.65);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(b.x, b.y);
    if(b.settled){
      // Elipse achatada no chão
      ctx.scale(b.scaleX, b.scaleY);
    }
    // Núcleo escuro com halo vermelho
    const grad = ctx.createRadialGradient(0,0,0, 0,0,b.r*(b.settled?1.4:1));
    grad.addColorStop(0,   '#770000');
    grad.addColorStop(0.5, '#cc0000');
    grad.addColorStop(1,   'rgba(180,0,0,0)');
    ctx.beginPath();
    ctx.arc(0, 0, b.r*(b.settled?1.5:1), 0, Math.PI*2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  });
  ctx.globalAlpha = 1;

  // Quivers
  quivers.forEach(q=>{
    const bob=Math.sin(q.bob)*3;
    ctx.save();ctx.translate(q.x,q.y+bob);
    ctx.fillStyle='#8b5e3c';ctx.fillRect(-4,-10,8,14);
    ctx.fillStyle='#88ccff';
    for(let i=0;i<3;i++){ctx.fillRect(-3+i*2.5,-15,2,7);}
    ctx.restore();
    ctx.beginPath();ctx.arc(q.x,q.y+Math.sin(q.bob)*3,16,0,Math.PI*2);
    ctx.strokeStyle='rgba(136,204,255,0.25)';ctx.lineWidth=2;ctx.stroke();
  });

  // Ground coins
  coins.forEach(c=>{
    const bob=Math.sin(c.bob)*2.5;
    ctx.save();ctx.translate(c.x,c.y+bob);
    // glow
    ctx.shadowColor='#ffd700';ctx.shadowBlur=8;
    // coin body
    ctx.fillStyle='#ffd700';
    ctx.beginPath();ctx.ellipse(0,0,7,5,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffaa00';
    ctx.beginPath();ctx.ellipse(-1,-1,5,3.5,0,0,Math.PI*2);ctx.fill();
    // shine
    ctx.fillStyle='rgba(255,255,200,0.7)';
    ctx.beginPath();ctx.ellipse(-2,-1.5,2,1.2,Math.PI*0.3,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.restore();
    // pickup ring
    ctx.beginPath();ctx.arc(c.x,c.y,14,0,Math.PI*2);
    ctx.strokeStyle='rgba(255,215,0,0.18)';ctx.lineWidth=1.5;ctx.stroke();
  });

  // Flying coins (bezier arc to counter)
  flyingCoins.forEach(fc=>{
    if(fc.drawX===undefined) return;
    const t=fc.progress;
    const scl=0.7+Math.sin(t*Math.PI)*0.5; // grows then shrinks
    ctx.save();ctx.translate(fc.drawX,fc.drawY);ctx.scale(scl,scl);
    ctx.shadowColor='#ffd700';ctx.shadowBlur=12;
    ctx.fillStyle='#ffd700';
    ctx.beginPath();ctx.ellipse(0,0,7,5,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffaa00';
    ctx.beginPath();ctx.ellipse(-1,-1,5,3.5,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,200,0.7)';
    ctx.beginPath();ctx.ellipse(-2,-1.5,2,1.2,Math.PI*0.3,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.restore();
    // trail dots
    for(let i=1;i<=3;i++){
      const tp=Math.max(0,t-i*0.06);
      const tx2=(1-tp)*(1-tp)*fc.ox+2*(1-tp)*tp*fc.cx+tp*tp*fc.tx;
      const ty2=(1-tp)*(1-tp)*fc.oy+2*(1-tp)*tp*fc.cy+tp*tp*fc.ty;
      ctx.globalAlpha=(1-i*0.28)*0.5;
      ctx.fillStyle='#ffd700';
      ctx.beginPath();ctx.arc(tx2,ty2,3-i*0.5,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
    }
  });

  // Dash trails (red danger zones)
  dashTrails.forEach(t=>{
    const alpha=t.life*0.55;
    ctx.beginPath();ctx.arc(t.x,t.y,14,0,Math.PI*2);
    ctx.fillStyle=`rgba(220,0,0,${alpha*0.35})`;ctx.fill();
    ctx.strokeStyle=`rgba(255,60,60,${alpha*0.7})`;ctx.lineWidth=2;ctx.stroke();
  });

  // Assassin Rats
  assassinRats.forEach(r=>{
    // Windup indicator: show the slash line
    if(r.state==='windup'){
      const pct=r.windupTimer/r.windupDuration;
      const lineLen=DUNGEON_SIZE;
      const ex=r.x+r.dashVx*lineLen, ey=r.y+r.dashVy*lineLen;
      ctx.save();
      ctx.globalAlpha=pct*0.75;
      ctx.strokeStyle='#ff2200';ctx.lineWidth=3+pct*4;ctx.lineCap='round';
      ctx.setLineDash([8,8]);
      ctx.beginPath();ctx.moveTo(r.x,r.y);ctx.lineTo(ex,ey);ctx.stroke();
      ctx.setLineDash([]);
      // warning icon at head
      ctx.globalAlpha=pct;
      ctx.fillStyle='#ff4400';ctx.font=`bold ${10+pct*6}px Courier New`;
      ctx.textAlign='center';ctx.fillText('!',r.x,r.y-r.size-8);
      ctx.restore();
    }

    ctx.save();ctx.translate(r.x,r.y);ctx.rotate(r.angle);
    const isDashing=r.state==='dash';
    if(isDashing){ctx.shadowColor='#ff0000';ctx.shadowBlur=20;}
    const flash=r.hitFlash>0;
    // Body (elongated when dashing)
    const bw=isDashing?r.size*1.8:r.size*(1+Math.sin(r.wobble)*0.08);
    const bh=isDashing?r.size*0.7:r.size*(0.85-Math.sin(r.wobble)*0.04);
    ctx.fillStyle=flash?'#ffffff':(isDashing?'#ff2200':(r.state==='windup'?'#cc3300':'#553322'));
    ctx.beginPath();ctx.ellipse(0,0,bw,bh,0,0,Math.PI*2);ctx.fill();
    // Ears
    if(!isDashing){
      ctx.fillStyle=flash?'#fff':'#774433';
      ctx.beginPath();ctx.ellipse(-r.size*0.5,-r.size*0.7,4,6,Math.PI*0.2,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(r.size*0.5,-r.size*0.7,4,6,-Math.PI*0.2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffaaaa';
      ctx.beginPath();ctx.ellipse(-r.size*0.5,-r.size*0.7,2,3.5,Math.PI*0.2,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(r.size*0.5,-r.size*0.7,2,3.5,-Math.PI*0.2,0,Math.PI*2);ctx.fill();
    }
    // Eyes
    ctx.fillStyle=flash?'#fff':(isDashing?'#ffff00':'#ff3300');
    ctx.beginPath();ctx.arc(-3,-3,2.5,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(3,-3,2.5,0,Math.PI*2);ctx.fill();
    // Tail
    if(!isDashing){
      const tw=Math.sin(r.tailWag);
      ctx.strokeStyle=flash?'#fff':'#553322';ctx.lineWidth=2.5;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(-r.size,0);
      ctx.quadraticCurveTo(-r.size*1.6,tw*8,-r.size*1.3,tw*14);ctx.stroke();
    }
    ctx.shadowBlur=0;ctx.restore();

    // HP bar
    ctx.fillStyle='#333';ctx.fillRect(r.x-r.size,r.y-r.size-10,r.size*2,4);
    ctx.fillStyle='#dd2200';ctx.fillRect(r.x-r.size,r.y-r.size-10,(r.hp/r.maxHp)*r.size*2,4);
  });

  // Particles
  particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/p.maxLife);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();});
  ctx.globalAlpha=1;

  // Dice roll animation
  if(diceRollAnim){
    const anim = diceRollAnim;
    const prog = 1 - (anim.timer / anim.totalTime);
    const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
    const sides = activeBuffs.has('jackpot') ? 6 : 5;
    const displayFace = anim.done ? faces[anim.result-1] : faces[Math.floor(Math.random()*sides)];
    ctx.save();
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const shake = anim.done ? 0 : (1-prog)*6*(Math.random()-0.5);
    ctx.translate(player.x + shake, player.y - 60 + shake);
    const scale = 0.8 + 0.2*prog;
    ctx.scale(scale, scale);
    ctx.shadowColor = '#ffdd00';
    ctx.shadowBlur = anim.done ? 30 : 10;
    ctx.fillText(displayFace, 0, 0);
    ctx.restore();
  }

  // Dice result texts
  diceResultTexts.forEach(t=>{
    const alpha = Math.min(1, t.life / t.maxLife * 2);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = t.color;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 6;
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  });

  // Damage floating numbers
  drawDamageNumbers();

  // Arrow projectiles
  projectiles.forEach(p=>{
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.vy,p.vx));
    if(p.isBullet){
      if(p.isSniperBullet && window._sniperBalaImg && window._sniperBalaImg.complete) {
        // Bala de sniper: bem maior e visível
        // Imagem é vertical (ponta para cima), rotaciona +90° para ponta apontar na direção do movimento
        ctx.rotate(Math.PI / 2);
        ctx.shadowColor='#ff8800'; ctx.shadowBlur=14;
        ctx.drawImage(window._sniperBalaImg, -11, -22, 22, 44);
      } else if(p.isSniperBullet) {
        // Fallback bala grossa
        ctx.shadowColor='#ff8800';ctx.shadowBlur=12;
        ctx.fillStyle='#ffcc44';ctx.fillRect(-18,-5,28,10);
        ctx.fillStyle='#cc6600';ctx.fillRect(-18,-5,8,10);
      } else {
        // Bala: ponto amarelo-dourado pequeno e brilhante
        ctx.shadowColor='#ffcc44';ctx.shadowBlur=6;
        ctx.fillStyle='#ffe066';ctx.fillRect(-5,-1.5,10,3);
        ctx.fillStyle='#ffaa00';ctx.fillRect(-5,-1.5,4,3);
      }
    } else {
      ctx.fillStyle='#ffdd88';ctx.fillRect(-10,-1.5,20,3);
      ctx.fillStyle='#88ccff';ctx.fillRect(-10,-3,5,6);
      ctx.fillStyle='#cc8844';ctx.fillRect(8,-2,4,4);
    }
    ctx.restore();
  });

  // Slimes
  slimes.forEach(sl=>{
    const wb=Math.sin(sl.wobble)*0.12;
    const sw=sl.size*(1.3+wb),sh=sl.size*(0.9-wb*0.5);
    ctx.save();ctx.translate(sl.x,sl.y);
    if(sl.charging){ctx.shadowColor='#ff4400';ctx.shadowBlur=14;}
    ctx.fillStyle=sl.hitFlash>0?'#ffffff':(sl.charging?'#ff6633':'#44cc44');
    ctx.beginPath();ctx.ellipse(0,0,sw,sh,0,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle='#002200';
    ctx.beginPath();ctx.arc(-sw*0.3,-sh*0.2,2.5,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(sw*0.3,-sh*0.2,2.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#333';ctx.fillRect(-sl.size,-sl.size-10,sl.size*2,4);
    ctx.fillStyle='#44ff44';ctx.fillRect(-sl.size,-sl.size-10,(sl.hp/sl.maxHp)*sl.size*2,4);
    ctx.restore();
  });

  // Blue Slimes
  blueSlimes.forEach(sl=>{
    const wb=Math.sin(sl.wobble)*0.12;
    const sw=sl.size*(1.3+wb), sh=sl.size*(0.9-wb*0.5);
    const isDashing = sl.dashing;
    ctx.save(); ctx.translate(sl.x, sl.y);

    // Glow durante dash
    if(isDashing){ ctx.shadowColor='#0088ff'; ctx.shadowBlur=16; }

    ctx.fillStyle = sl.hitFlash>0 ? '#ffffff' : (isDashing ? '#55aaff' : '#2266cc');
    ctx.beginPath(); ctx.ellipse(0,0,sw,sh,0,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;

    // Eyes
    ctx.fillStyle='#001133';
    ctx.beginPath();ctx.arc(-sw*0.3,-sh*0.2,2.5,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(sw*0.3,-sh*0.2,2.5,0,Math.PI*2);ctx.fill();

    // HP bar
    ctx.fillStyle='#333';ctx.fillRect(-sl.size,-sl.size-10,sl.size*2,4);
    ctx.fillStyle='#2299ff';ctx.fillRect(-sl.size,-sl.size-10,(sl.hp/sl.maxHp)*sl.size*2,4);
    ctx.restore();
  });

  // Red Slimes
  redSlimes.forEach(sl=>{
    const wb=Math.sin(sl.wobble)*0.14;
    const sw=sl.size*(1.3+wb), sh=sl.size*(0.9-wb*0.5);
    ctx.save(); ctx.translate(sl.x, sl.y);

    ctx.shadowColor='#ff2200'; ctx.shadowBlur=sl.mini?6:10;
    ctx.fillStyle = sl.hitFlash>0 ? '#ffffff' : (sl.mini ? '#ff6644' : '#cc2200');
    ctx.beginPath(); ctx.ellipse(0,0,sw,sh,0,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;

    // Eyes (angrier — slanted inward)
    ctx.fillStyle='#330000';
    ctx.save();
    ctx.translate(-sw*0.28, -sh*0.15);
    ctx.rotate(0.4);
    ctx.fillRect(-2.5,-1,5,2.5);
    ctx.restore();
    ctx.save();
    ctx.translate(sw*0.28, -sh*0.15);
    ctx.rotate(-0.4);
    ctx.fillRect(-2.5,-1,5,2.5);
    ctx.restore();

    // Mini indicator: small skull icon
    if(!sl.mini){
      ctx.fillStyle='rgba(255,200,100,0.9)';
      ctx.font=`${sl.size*0.85}px serif`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('💀', 0, sh*0.25);
    }

    // HP bar
    if(!sl.mini){
      ctx.fillStyle='#333';ctx.fillRect(-sl.size,-sl.size-10,sl.size*2,4);
      ctx.fillStyle='#ff3300';ctx.fillRect(-sl.size,-sl.size-10,(sl.hp/sl.maxHp)*sl.size*2,4);
    } else {
      ctx.fillStyle='#333';ctx.fillRect(-sl.size,-sl.size-8,sl.size*2,3);
      ctx.fillStyle='#ff6644';ctx.fillRect(-sl.size,-sl.size-8,(sl.hp/sl.maxHp)*sl.size*2,3);
    }
    ctx.restore();
  });

  // Ghosts
  ghosts.forEach(g=>{
    const flash = g.hitFlash > 0;
    const wb = Math.sin(g.wobble * 1.4) * 0.1;

    // Opacidade: visível = 0.85, invisível = 0 (fade suave via invisTimer)
    // Usa um valor de transição nos últimos 300ms de cada fase
    const FADE_WINDOW = 300;
    let alpha;
    if(g.invisible){
      // fadeando para invisível: nos primeiros 300ms da fase invísivel
      alpha = g.invisTimer < FADE_WINDOW ? 0.85 * (1 - g.invisTimer / FADE_WINDOW) : 0;
    } else {
      // fadeando para visível: nos últimos 300ms da fase visível
      alpha = g.invisTimer > GHOST_INVIS_CYCLE - FADE_WINDOW
        ? 0.85 * ((GHOST_INVIS_CYCLE - g.invisTimer) / FADE_WINDOW)
        : 0.85;
    }
    if(flash) alpha = Math.max(alpha, 0.9);

    if(alpha <= 0.01) return; // completamente invisível — não desenha

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(g.x, g.y);

    const sz = g.size;

    // Aura de lentidão (desenha antes do corpo)
    const auraPulse = 0.7 + Math.sin(g.wobble * 2) * 0.15;
    const auraRadius = GHOST_SLOW_RADIUS * auraPulse;
    const auraGrad = ctx.createRadialGradient(0,0,sz*0.8,0,0,auraRadius);
    auraGrad.addColorStop(0, 'rgba(160,100,255,0.22)');
    auraGrad.addColorStop(0.6, 'rgba(100,60,220,0.10)');
    auraGrad.addColorStop(1, 'rgba(80,40,200,0)');
    ctx.beginPath();ctx.arc(0,0,auraRadius,0,Math.PI*2);
    ctx.fillStyle = auraGrad;
    ctx.fill();
    // Anel da aura
    ctx.beginPath();ctx.arc(0,0,auraRadius,0,Math.PI*2);
    ctx.strokeStyle = `rgba(180,120,255,${0.3 * auraPulse})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Corpo do fantasma — forma arredondada tipo "sheet ghost"
    ctx.shadowColor = flash ? '#ffffff' : '#aa66ff';
    ctx.shadowBlur = flash ? 22 : 16;
    ctx.fillStyle = flash ? '#ffffff' : '#ddc8ff';

    // Cabeça/corpo principal
    ctx.beginPath();
    ctx.arc(0, -(sz*0.2), sz*(1+wb), 0, Math.PI);
    // Base ondulada (3 ondas no fundo)
    const base = sz*0.8;
    ctx.lineTo(-sz*(1+wb), base);
    for(let i=0;i<3;i++){
      const x1 = -sz*(1+wb) + sz*(2+wb*2)*(i+0.5)/3;
      const x2 = -sz*(1+wb) + sz*(2+wb*2)*(i+1)/3;
      const waveY = i%2===0 ? base+5 : base-3;
      ctx.quadraticCurveTo(x1, waveY + Math.sin(g.wobble+i)*3, x2, base);
    }
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;

    // Olhos
    const eyeColor = flash ? '#ffffff' : '#6600cc';
    ctx.fillStyle = eyeColor;
    ctx.beginPath();ctx.ellipse(-sz*0.32, -(sz*0.25), sz*0.22, sz*0.28, -0.2, 0, Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(sz*0.32, -(sz*0.25), sz*0.22, sz*0.28, 0.2, 0, Math.PI*2);ctx.fill();
    // brilho dos olhos
    ctx.fillStyle = 'rgba(220,180,255,0.6)';
    ctx.beginPath();ctx.arc(-sz*0.36, -(sz*0.3), sz*0.08, 0, Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(sz*0.28, -(sz*0.3), sz*0.08, 0, Math.PI*2);ctx.fill();

    ctx.restore();
    ctx.globalAlpha = 1;

    // Barra de HP (sempre visível quando não completamente invisível)
    if(alpha > 0.1){
      ctx.save();
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillStyle='#333';ctx.fillRect(g.x-g.size, g.y-g.size-10, g.size*2, 4);
      ctx.fillStyle='#aa66ff';ctx.fillRect(g.x-g.size, g.y-g.size-10, (g.hp/g.maxHp)*g.size*2, 4);
      ctx.restore();
    }
  });

  // Golems
  golems.forEach(g=>{
    const flash = g.hitFlash > 0;
    const sleeping = g.state === 'sleeping';
    const wb = Math.sin(g.wobble) * (sleeping ? 0 : 0.06);
    const sz = g.size;

    ctx.save();
    ctx.translate(g.x, g.y);

    // Aura de imortalidade durante o sono
    if(sleeping){
      const pulse = 0.5 + Math.sin(Date.now()*0.003)*0.3;
      ctx.beginPath();ctx.arc(0,0,sz*1.7,0,Math.PI*2);
      ctx.strokeStyle='rgba(150,220,255,'+(0.5*pulse)+')';
      ctx.lineWidth=3;ctx.setLineDash([6,4]);ctx.stroke();ctx.setLineDash([]);
      ctx.beginPath();ctx.arc(0,0,sz*1.3,0,Math.PI*2);
      ctx.fillStyle='rgba(100,180,255,'+(0.08*pulse)+')';ctx.fill();
    }

    // Sombra / base
    ctx.beginPath();ctx.ellipse(0,sz*0.7,sz*1.1,sz*0.35,0,0,Math.PI*2);
    ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fill();

    // Corpo principal — bloco de pedra
    const bodyColor = flash ? '#ffffff' : (sleeping ? '#8899aa' : '#6677aa');
    ctx.shadowColor = sleeping ? '#88ccff' : '#4455aa';
    ctx.shadowBlur = sleeping ? 18 : 8;
    ctx.fillStyle = bodyColor;
    const bw=sz*(0.75+wb), bh_top=sz*0.85, bh_bot=sz*0.85;
    ctx.beginPath();
    ctx.moveTo(-bw,-bh_top+sz*0.2);
    ctx.lineTo(-bw+sz*0.2,-bh_top);
    ctx.lineTo(bw-sz*0.2,-bh_top);
    ctx.lineTo(bw,-bh_top+sz*0.2);
    ctx.lineTo(bw,bh_bot-sz*0.2);
    ctx.lineTo(bw-sz*0.2,bh_bot);
    ctx.lineTo(-bw+sz*0.2,bh_bot);
    ctx.lineTo(-bw,bh_bot-sz*0.2);
    ctx.closePath();ctx.fill();

    // Rachadura decorativa
    if(!flash){
      ctx.strokeStyle='rgba(0,0,0,0.22)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(-sz*0.1,-sz*0.5);ctx.lineTo(sz*0.2,sz*0.3);ctx.stroke();
      ctx.beginPath();ctx.moveTo(sz*0.3,-sz*0.2);ctx.lineTo(sz*0.1,sz*0.5);ctx.stroke();
    }

    // Cabeça
    ctx.shadowBlur=0;
    ctx.fillStyle = flash?'#ffffff':(sleeping?'#99aacc':'#7788bb');
    ctx.beginPath();
    ctx.ellipse(0,-sz*1.2,sz*0.65,sz*0.52,0,0,Math.PI*2);
    ctx.fill();

    // Olhos
    if(sleeping){
      ctx.strokeStyle=flash?'#ffffff':'#223366';ctx.lineWidth=2;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(-sz*0.28,-sz*1.22);ctx.lineTo(-sz*0.08,-sz*1.22);ctx.stroke();
      ctx.beginPath();ctx.moveTo(sz*0.08,-sz*1.22);ctx.lineTo(sz*0.28,-sz*1.22);ctx.stroke();
      // ZZZ animado
      const zOff = Math.sin(Date.now()*0.002)*3;
      ctx.fillStyle='rgba(180,230,255,0.9)';
      ctx.font='bold '+Math.round(sz*0.4)+'px Arial';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.globalAlpha=0.85;
      ctx.fillText('z',sz*0.55,-sz*1.85+zOff);
      ctx.font='bold '+Math.round(sz*0.3)+'px Arial';
      ctx.fillText('z',sz*0.85,-sz*2.1+zOff*1.2);
      ctx.globalAlpha=1;
    } else {
      ctx.fillStyle=flash?'#ffffff':'#ff8833';
      ctx.beginPath();ctx.arc(-sz*0.22,-sz*1.22,sz*0.13,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(sz*0.22,-sz*1.22,sz*0.13,0,Math.PI*2);ctx.fill();
    }

    ctx.shadowBlur=0;
    ctx.restore();

    // Barra de HP
    const barAlpha = sleeping ? 0.55 : 1;
    ctx.save();ctx.globalAlpha=barAlpha;
    ctx.fillStyle='#333';ctx.fillRect(g.x-g.size,g.y-g.size*2.2,g.size*2,4);
    ctx.fillStyle= sleeping ? '#88ccff' : '#8855ff';
    ctx.fillRect(g.x-g.size,g.y-g.size*2.2,(g.hp/g.maxHp)*g.size*2,4);
    if(sleeping){
      ctx.font='11px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('🛡',g.x,g.y-g.size*2.6);
    }
    ctx.restore();
  });

  // BombHeads
  bombHeads.forEach(b=>{
    const inAir = b.state==='air';
    const heightOffset = inAir ? -Math.sin(b.airProgress*Math.PI)*90 : 0;
    const scl = inAir ? (1+Math.sin(b.airProgress*Math.PI)*0.3) : 1;

    // Draw shadow + landing zone when in warning or air
    if(b.state==='warning'||b.state==='air'){
      const shadowAlpha = b.state==='warning'?(0.3+Math.sin(b.wobble*6)*0.15):Math.max(0.1,1-b.airProgress*0.5);
      // danger zone ring
      ctx.beginPath();ctx.arc(b.shadowX,b.shadowY,BOMB_RADIUS,0,Math.PI*2);
      ctx.strokeStyle=`rgba(255,60,0,${shadowAlpha*0.8})`;ctx.lineWidth=2.5;ctx.stroke();
      ctx.fillStyle=`rgba(255,30,0,${shadowAlpha*0.15})`;ctx.fill();
      // inner cross hairs
      ctx.strokeStyle=`rgba(255,120,0,${shadowAlpha*0.6})`;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(b.shadowX-BOMB_RADIUS,b.shadowY);ctx.lineTo(b.shadowX+BOMB_RADIUS,b.shadowY);ctx.stroke();
      ctx.beginPath();ctx.moveTo(b.shadowX,b.shadowY-BOMB_RADIUS);ctx.lineTo(b.shadowX,b.shadowY+BOMB_RADIUS);ctx.stroke();
      // shadow blob under the bomb
      if(inAir){
        const shadowSize=b.size*(1-b.airProgress*0.4);
        ctx.beginPath();ctx.ellipse(b.x,b.y,shadowSize*1.2,shadowSize*0.4,0,0,Math.PI*2);
        ctx.fillStyle=`rgba(0,0,0,${0.4*(1-b.airProgress*0.5)})`;ctx.fill();
      }
    }

    // Draw the bomb enemy itself
    ctx.save();
    ctx.translate(b.x, b.y+heightOffset);
    ctx.rotate(b.rotation||0);
    ctx.scale(scl,scl);

    if(inAir){ctx.shadowColor='#ff4400';ctx.shadowBlur=20;}

    // Body - round dark bomb head
    const wobX=Math.sin(b.wobble)*0.08;
    ctx.fillStyle=b.hitFlash>0?'#ffffff':(b.state==='warning'?'#ff6600':'#222222');
    ctx.beginPath();ctx.ellipse(0,0,b.size*(1+wobX),b.size*(1-wobX*0.5),0,0,Math.PI*2);ctx.fill();

    // Skull face
    if(!inAir){
      ctx.fillStyle='#ff3300';
      ctx.beginPath();ctx.arc(-b.size*0.3,-b.size*0.15,3,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(b.size*0.3,-b.size*0.15,3,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(0,b.size*0.25,b.size*0.35,0,Math.PI);ctx.strokeStyle='#ff3300';ctx.lineWidth=2;ctx.stroke();
    } else {
      // spiral eyes when flying
      ctx.fillStyle='#ffaa00';
      ctx.beginPath();ctx.arc(-b.size*0.3,-b.size*0.1,4,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(b.size*0.3,-b.size*0.1,4,0,Math.PI*2);ctx.fill();
    }

    // Fuse on top
    ctx.strokeStyle='#885533';ctx.lineWidth=2;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(0,-b.size);
    ctx.quadraticCurveTo(b.size*0.4,-b.size*1.5,0,-b.size*1.8);ctx.stroke();
    // Fuse spark
    if(b.state==='warning'||inAir){
      ctx.fillStyle='#ffff44';
      ctx.beginPath();ctx.arc(0,-b.size*1.8,3+Math.random()*2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ff8800';
      ctx.beginPath();ctx.arc(Math.random()*4-2,-b.size*1.8+Math.random()*4-2,2,0,Math.PI*2);ctx.fill();
    }

    ctx.shadowBlur=0;
    ctx.restore();

    // HP bar (only when on ground)
    if(!inAir){
      ctx.fillStyle='#333';ctx.fillRect(b.x-b.size,b.y-b.size-10,b.size*2,4);
      ctx.fillStyle='#ff4400';ctx.fillRect(b.x-b.size,b.y-b.size-10,(b.hp/b.maxHp)*b.size*2,4);
    }

    // Landing explosion flash
    if(b.state==='landing'&&b.jumpTimer<200){
      const alpha=(1-b.jumpTimer/200)*0.7;
      ctx.beginPath();ctx.arc(b.x,b.y,BOMB_RADIUS*(1-b.jumpTimer/200),0,Math.PI*2);
      ctx.fillStyle=`rgba(255,140,0,${alpha*0.4})`;ctx.fill();
      ctx.strokeStyle=`rgba(255,200,0,${alpha})`;ctx.lineWidth=3;ctx.stroke();
    }
  });

  // ── ATTACK PREVIEWS ─────────────────────────────────────────────────────

  // ESPADA — cone de ataque em arco (~110°)
  if(activeEffect==='sword'){
    const arcR = activeBuffs.has('sword_range') ? 100 : 80;
    const ang = Math.atan2(mouseY - player.y, mouseX - player.x);
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#ffdd44';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.arc(player.x, player.y, arcR, ang - Math.PI*0.55, ang + Math.PI*0.55);
    ctx.closePath();
    ctx.fill();
    // Borda
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.restore();
  }

  // ARCO — linha de tiro + ponto de impacto estimado
  if(activeEffect==='bow' && arrows > 0){
    const ang = Math.atan2(mouseY - player.y, mouseX - player.x);
    const projRange = 420;
    const ex = player.x + Math.cos(ang) * projRange;
    const ey = player.y + Math.sin(ang) * projRange;
    ctx.save();
    // Linha tracejada da trajetória
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#88ccff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.shadowColor = '#44aaff';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(player.x + Math.cos(ang)*20, player.y + Math.sin(ang)*20);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);
    // Ponto de impacto
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#88ccff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(ex, ey, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  // PISTOLA — linha de tiro (hitscan reto)
  if(activeEffect==='pistol' && pistolActive && pistolAmmo > 0){
    const ang = Math.atan2(mouseY - player.y, mouseX - player.x);
    const range = 500;
    const ex = player.x + Math.cos(ang) * range;
    const ey = player.y + Math.sin(ang) * range;
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#ffee44';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(player.x + Math.cos(ang)*18, player.y + Math.sin(ang)*18);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);
    // Ponto de mira
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#ffee44';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(player.x + Math.cos(ang)*range*0.85, player.y + Math.sin(ang)*range*0.85, 4, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  // SNIPER — linha de mira vermelha
  if(activeEffect==='sniper_noscope' && sniperActive && sniperAmmo > 0){
    const ang = Math.atan2(mouseY - player.y, mouseX - player.x);
    const range = 700;
    const ex = player.x + Math.cos(ang) * range;
    const ey = player.y + Math.sin(ang) * range;
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = '#ff2200';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(player.x + Math.cos(ang)*18, player.y + Math.sin(ang)*18);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // MACHADO — anel de rotação (mostra raio de alcance)
  if(activeEffect==='axe'){
    const radius = activeBuffs.has('axe_size') ? 90 : 65;
    ctx.save();
    ctx.globalAlpha = mouseButtonDown ? 0.22 : 0.1;
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = mouseButtonDown ? 2 : 1.5;
    ctx.setLineDash([4, 5]);
    ctx.shadowColor = '#cccccc';
    ctx.shadowBlur = mouseButtonDown ? 8 : 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y, radius, 0, Math.PI*2);
    ctx.stroke();
    ctx.setLineDash([]);
    // Preenchimento leve quando girando
    if(mouseButtonDown){
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = '#aaaaaa';
      ctx.beginPath();
      ctx.arc(player.x, player.y, radius, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Sword arc (efeito de swing ativo)
  if(activeEffect==='sword'&&swingActive){
    const arcR = activeBuffs.has('sword_range') ? 100 : 80;
    ctx.save();ctx.translate(player.x,player.y);ctx.rotate(player.angle);
    ctx.strokeStyle='rgba(255,220,50,0.45)';ctx.lineWidth=28;ctx.lineCap='round';
    ctx.beginPath();ctx.arc(0,0,arcR,-Math.PI*0.55,Math.PI*0.55);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,180,0.85)';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.arc(0,0,arcR,-Math.PI*0.55,Math.PI*0.55);ctx.stroke();
    ctx.restore();
  }

  // Weapon visuals
  if(activeEffect==='sword'){
    ctx.save();ctx.translate(player.x,player.y);ctx.rotate(player.angle);
    ctx.fillStyle='#aaaaff';ctx.fillRect(14,-3,5,6);
    ctx.fillStyle='#ffdd44';ctx.fillRect(19,-2,26,4);
    ctx.fillStyle='#ffeeaa';ctx.fillRect(43,-1.5,5,3);
    ctx.restore();
  }
  if(activeEffect==='bow'){
    ctx.save();ctx.translate(player.x,player.y);ctx.rotate(player.angle);
    ctx.strokeStyle='#8b5e3c';ctx.lineWidth=3;ctx.lineCap='round';
    ctx.beginPath();ctx.arc(0,0,14,-Math.PI*0.5,Math.PI*0.5);ctx.stroke();
    ctx.strokeStyle='#ddccaa';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(0,14);ctx.stroke();
    ctx.restore();
  }

  // Axe spinning weapon
  updateAndDrawAxe();

  // Foice animations
  updateAndDrawScythe(dt);

  // Speed potion aura
  updateSpeedPotion();

  // Katana slashes
  drawKatana();

  // Bomb trajectory preview (shown when bombinhas active, before throwing)
  drawBombTrajectoryPreview();

  // Player bombs (bombinhas card)
  drawPlayerBombs();

  // Soccer ball (boa de futebol card)
  drawSoccerBall();

  // Sniper no scope animations
  drawSniperEquipAnim(dt);

  // Sniper minigame targets
  drawSniperMinigame();

  // Sniper minigame banner
  if(sniperMinigameActive && !sniperMinigameDone) {
    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(W/2 - 200, 18, 400, 38);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ff4400';
    ctx.font = 'bold 18px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(`🎯 CLIQUE NAS MIRAS! — ${sniperMinigameHits} acertos`, W/2, 43);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  // Protorobô-9500 companion
  drawCompanionRobot();

  // Glitch Fury: rastro vermelho ao se mover
  if(glitchFuryTrail.length > 0){
    glitchFuryTrail.forEach((t,i)=>{
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.a);
      const alpha = t.life * 0.55;
      const scale = 0.5 + t.life * 0.5; // encolhe enquanto some
      ctx.globalAlpha = alpha;
      // Brilho externo vermelho
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur  = 12 * t.life;
      ctx.fillStyle   = `rgba(255,${Math.floor(30+40*t.life)},0,1)`;
      const s = player.size * scale;
      ctx.fillRect(-s/2, -s/2, s, s);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
  }

  // Roll trail
  player.trail.forEach(t=>{
    ctx.save();ctx.translate(t.x,t.y);ctx.rotate(t.a);
    ctx.globalAlpha=t.life*0.35;ctx.fillStyle='#8888ff';
    ctx.fillRect(-player.size/2,-player.size/2,player.size,player.size);
    ctx.restore();
  });
  ctx.globalAlpha=1;

  // Player
  if(!playerInSpecial){
  // Imã: aura de atração de moedas
  if(typeof hasArtifactEffect === 'function' && hasArtifactEffect('coin_magnet')){
    const magnetR = (typeof getArtifactUpgradeValue === 'function') ? (getArtifactUpgradeValue('magnet') || 50) : 50;
    const pulse = 0.35 + Math.sin(Date.now()*0.004)*0.15;
    const grad = ctx.createRadialGradient(player.x, player.y, 5, player.x, player.y, magnetR);
    grad.addColorStop(0, `rgba(255,220,50,${pulse * 0.55})`);
    grad.addColorStop(0.6, `rgba(255,180,0,${pulse * 0.25})`);
    grad.addColorStop(1, 'rgba(255,180,0,0)');
    ctx.beginPath();
    ctx.arc(player.x, player.y, magnetR, 0, Math.PI*2);
    ctx.fillStyle = grad;
    ctx.fill();
    // Dashed ring on the edge
    ctx.save();
    ctx.beginPath();
    ctx.arc(player.x, player.y, magnetR, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(255,210,30,${0.4 + Math.sin(Date.now()*0.006)*0.2})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6,5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  // Ghost slow indicator: anel roxo ao redor do player
  if(player._ghostSlowed){
    ctx.save();
    const pulse = 0.6 + Math.sin(Date.now()*0.005)*0.2;
    ctx.beginPath();ctx.arc(player.x, player.y, player.size*1.9, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(180,100,255,${0.55*pulse})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([5,4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = `rgba(200,150,255,${0.8*pulse})`;
    ctx.font = 'bold 9px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('LENTO', player.x, player.y - player.size - 8);
    ctx.restore();
  }

  // ── AURA JACKPOT (verde pulsante) ──────────────────────────
  if(jackpotAuraTimer > 0) {
    const pulse = 0.55 + Math.sin(Date.now()*0.008)*0.35;
    const ringPulse = 0.7 + Math.sin(Date.now()*0.005)*0.3;
    ctx.save();
    // Brilho interno
    const grd = ctx.createRadialGradient(player.x, player.y, player.size*0.3, player.x, player.y, player.size*2.8);
    grd.addColorStop(0, `rgba(0,255,120,${0.18*pulse})`);
    grd.addColorStop(1, `rgba(0,255,80,0)`);
    ctx.beginPath(); ctx.arc(player.x, player.y, player.size*2.8, 0, Math.PI*2);
    ctx.fillStyle = grd; ctx.fill();
    // Anel externo
    ctx.beginPath(); ctx.arc(player.x, player.y, player.size*2.2 + ringPulse*4, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(0,255,100,${0.7*pulse})`;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6,4]);
    ctx.stroke();
    ctx.setLineDash([]);
    // Anel interno sólido
    ctx.beginPath(); ctx.arc(player.x, player.y, player.size*1.6, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(150,255,180,${0.9*pulse})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
  // ── GLITCH FURY: aura verde + aureola vermelha ──
  if(glitchFuryActive){
    const pulse = 0.55 + Math.sin(Date.now()*0.009)*0.35;
    const grd = ctx.createRadialGradient(player.x, player.y, player.size*0.3, player.x, player.y, player.size*3.2);
    grd.addColorStop(0, `rgba(0,255,80,${0.22*pulse})`);
    grd.addColorStop(1, 'rgba(0,255,50,0)');
    ctx.save();
    ctx.beginPath(); ctx.arc(player.x, player.y, player.size*3.2, 0, Math.PI*2);
    ctx.fillStyle = grd; ctx.fill();
    ctx.beginPath(); ctx.arc(player.x, player.y, player.size*2.3 + pulse*3, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(0,255,80,${0.75*pulse})`;
    ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }

  // ── SETA BRANCA ACIMA DA CABEÇA DO PLAYER ──────────────────────────────
  if(!playerInSpecial){
    const arrowBob = Math.sin(Date.now() * 0.005) * 3;
    const arrowY = player.y - player.size - 18 + arrowBob;
    ctx.save();
    ctx.translate(player.x, arrowY);
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    // Seta apontando para baixo (▼)
    ctx.beginPath();
    ctx.moveTo(0, 10);       // ponta da seta
    ctx.lineTo(-8, -4);
    ctx.lineTo(-3, -4);
    ctx.lineTo(-3, -12);
    ctx.lineTo(3, -12);
    ctx.lineTo(3, -4);
    ctx.lineTo(8, -4);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  ctx.save();ctx.translate(player.x,player.y);
  if(player.rolling){ctx.shadowColor='#aaaaff';ctx.shadowBlur=18;ctx.globalAlpha=0.75;}
  ctx.rotate(player.angle+(player.rolling?Math.PI/2:0));
  const flash=player.hitFlash>0&&!player.rolling;
  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.beginPath();ctx.ellipse(3,player.size-2,player.size*0.7,player.size*0.3,0,0,Math.PI*2);ctx.fill();
  // Glow no corpo do player nas dungeons tardias
  if(!flash && !glitchFuryActive){
    const _dn = currentDungeon + 1;
    if(_dn >= 5){
      const _gs = Math.min(1, (_dn - 4) / 5);
      ctx.shadowColor = '#aaddff';
      ctx.shadowBlur = 8 + _gs * 10;
    }
  }
  // Corpo verde se glitch fury ativo
  ctx.fillStyle=flash?'#ffffff':(glitchFuryActive?'#44ff88':'#aaaacc');ctx.fillRect(-player.size/2,-player.size/2,player.size,player.size);
  ctx.shadowBlur=0;
  ctx.fillStyle=flash?'#ffffff':(glitchFuryActive?'#22cc66':'#8888aa');ctx.fillRect(-player.size/2+2,-player.size/2-4,player.size-4,8);
  ctx.fillStyle='#222244';ctx.fillRect(-player.size/2+3,-player.size/2-2,player.size-6,3);
  if(!activeEffect && !glitchFuryActive){ctx.fillStyle='#4444aa';ctx.fillRect(-player.size/2-6,-4,5,10);}
  // Placa como arma (glitch fury ativo) — versão épica com direção alternada
  if(glitchFuryActive){
    const swingProg = glitchFurySwing ? (1 - glitchFurySwing.t/glitchFurySwing.maxT) : 0;
    const swingDir  = glitchFurySwing ? glitchFurySwing.dir : 1;
    const arcFrom   = glitchFurySwing ? glitchFurySwing.arcFrom : 0;
    const arcTo     = glitchFurySwing ? glitchFurySwing.arcTo   : 0;
    const isFinisher= glitchFurySwing ? glitchFurySwing.isFinisher : false;
    // Ease-in-out suave: progress segue uma curva cubic
    const ease = swingProg < 0.5 ? 4*swingProg*swingProg*swingProg : 1-Math.pow(-2*swingProg+2,3)/2;
    const swingArc = glitchFurySwing ? (arcFrom + (arcTo - arcFrom) * ease) : 0;

    // ── Slash em arco da placa (espaço rotacionado do player) ──
    if(glitchFurySwing){
      const arcProg = Math.sin(swingProg * Math.PI); // 0→1→0 bell curve
      const R = player.size * 5.5; // raio do arco
      // Ângulo varrido até agora (do início até swingArc)
      const a0 = Math.min(arcFrom, swingArc);
      const a1 = Math.max(arcFrom, swingArc);
      const swingColor  = isFinisher ? '#ff0055' : '#ff2200';
      const swingColor2 = isFinisher ? '#ff6600' : '#ff5500';

      ctx.save();
      ctx.lineCap = 'round';

      // Camada 1 — aura grossa difusa (o "volume" do slash)
      ctx.globalAlpha = 0.30 * arcProg;
      ctx.strokeStyle = swingColor;
      ctx.lineWidth = isFinisher ? 60 : 42;
      ctx.shadowColor = swingColor; ctx.shadowBlur = 28 * arcProg;
      ctx.beginPath(); ctx.arc(0, 0, R, a0, a1); ctx.stroke();

      // Camada 2 — corpo do slash, mais vivo
      ctx.globalAlpha = 0.70 * arcProg;
      ctx.strokeStyle = swingColor2;
      ctx.lineWidth = isFinisher ? 26 : 17;
      ctx.shadowColor = swingColor2; ctx.shadowBlur = 14 * arcProg;
      ctx.beginPath(); ctx.arc(0, 0, R, a0, a1); ctx.stroke();

      // Camada 3 — borda afiada branco-quente (a "lâmina" do arco)
      ctx.globalAlpha = 0.95 * arcProg;
      ctx.strokeStyle = isFinisher ? 'rgba(255,255,230,1)' : 'rgba(255,210,160,0.95)';
      ctx.lineWidth = isFinisher ? 3 : 2;
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10 * arcProg;
      ctx.beginPath(); ctx.arc(0, 0, R, a0, a1); ctx.stroke();

      // Camada 4 — borda interna sutil (profundidade)
      ctx.globalAlpha = 0.4 * arcProg;
      ctx.strokeStyle = 'rgba(80,0,0,0.8)';
      ctx.lineWidth = 1.2;
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(0, 0, R - (isFinisher ? 14 : 9), a0, a1); ctx.stroke();

      // Finisher: arco fantasma externo
      if(isFinisher){
        ctx.globalAlpha = 0.22 * arcProg;
        ctx.strokeStyle = '#ff0088';
        ctx.lineWidth = 14;
        ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 22 * arcProg;
        ctx.beginPath(); ctx.arc(0, 0, R + 22, a0, a1); ctx.stroke();
      }

      ctx.restore();
    }

    // ── Placa: posição suavizada pela direção ──
    ctx.save();
    ctx.rotate(swingArc); // gira junto com o swing

    // Cabeça da placa sai direto do corpo do player, sem cabo
    if(window._placaImg && window._placaImg.complete){
      const pw = player.size * 3.0;
      const ph = player.size * 4.2;
      ctx.drawImage(window._placaImg, player.size * 0.8, -ph * 0.5, pw, ph);
    } else {
      ctx.fillStyle = '#888888';
      ctx.fillRect(player.size * 0.8, -player.size * 2.0, player.size * 2.0, player.size * 2.8);
    }
    ctx.restore();
    // Aureola vermelha acima da cabeça
    ctx.save();
    ctx.rotate(-player.angle-(player.rolling?Math.PI/2:0));
    const hpulse = 0.7 + Math.sin(Date.now()*0.008)*0.3;
    ctx.shadowColor='#ff2200'; ctx.shadowBlur=12;
    ctx.strokeStyle=`rgba(255,50,0,${0.85*hpulse})`;
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.ellipse(0, -player.size*0.9, player.size*0.75, player.size*0.22, 0, 0, Math.PI*2);
    ctx.stroke();
    ctx.shadowBlur=0;
    ctx.restore();
  }
  ctx.shadowBlur=0;ctx.restore();ctx.globalAlpha=1;
  }

  // Mana charge bar (HTML only)
  {
    const frac = mana < maxMana ? manaTimer/manaChargeRate : 1;
    const fill = document.getElementById('mana-charge-bar-fill');
    if(fill) fill.style.width=(frac*100)+'%';
  }

  // Bow charge bar (canvas, above player)
  if(bowCharging && activeEffect==='bow' && bowChargeTimer > 0){
    const pct = getBowChargePct();
    const barW = 36, barH = 5;
    const bx = player.x - barW/2, by = player.y - player.size - 14;
    // background
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,0.55)';
    ctx.fillRect(bx-1,by-1,barW+2,barH+2);
    // fill — color changes by level
    const lvl = getBowChargeLevel();
    ctx.fillStyle = lvl===2 ? '#ff6600' : lvl===1 ? '#ffdd00' : '#88ccff';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur=6;
    ctx.fillRect(bx,by,barW*pct,barH);
    ctx.shadowBlur=0;
    ctx.restore();
  }

  // Enemy spawn countdown display
  if(enemySpawnDelay > 0 && !paused && !transitioning){
    const secs = Math.ceil(enemySpawnDelay / 1000);
    const alpha = Math.min(1, enemySpawnDelay / 500);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#aaaaff';
    ctx.font = 'bold 22px Courier New';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#4444ff';
    ctx.shadowBlur = 12;
    ctx.fillText(`⚠ Inimigos em ${secs}...`, W/2, DY - 18);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── SPECIAL: BLACK MAGIC DRAW ── (Aura Storm style)
  if(specialActive && playerInSpecial){
    const lx = player.x;
    const lyTop = player.y;
    const lyFloor = DY + DUNGEON_SIZE;
    // Impact point follows mouse (stored in update phase)
    const impX = (player._impactX !== undefined) ? player._impactX : lx;
    const impY = (player._impactY !== undefined) ? player._impactY : lyFloor - 8;
    // Cone: wide at player top, tapers to a narrow point at the impact point
    const BEAM_TOP = 85;
    const BEAM_BOT = 5;
    const IMPACT_R = 22;
    const bigScale = 2.8;
    const ps = player.size * bigScale;

    // Dark vignette
    ctx.save();
    ctx.fillStyle = `rgba(8,0,18,${0.38 + 0.1*Math.sin(Date.now()*0.004)})`;
    ctx.fillRect(DX, DY, DUNGEON_SIZE, DUNGEON_SIZE);
    ctx.restore();

    if(laserActive){
      ctx.save();

      // Layer 1: wide outer aura (trapezoid — from player to impact point)
      ctx.beginPath();
      ctx.moveTo(lx - BEAM_TOP*2.0, lyTop + ps*0.5);
      ctx.lineTo(lx + BEAM_TOP*2.0, lyTop + ps*0.5);
      ctx.lineTo(impX + BEAM_BOT*3,   impY);
      ctx.lineTo(impX - BEAM_BOT*3,   impY);
      ctx.closePath();
      const g1 = ctx.createLinearGradient(lx, lyTop, impX, impY);
      g1.addColorStop(0,   'rgba(100,0,180,0.30)');
      g1.addColorStop(0.5, 'rgba(70,0,140,0.16)');
      g1.addColorStop(1,   'rgba(30,0,60,0.04)');
      ctx.fillStyle = g1;
      ctx.fill();

      // Layer 2: mid glow
      ctx.beginPath();
      ctx.moveTo(lx - BEAM_TOP*1.05, lyTop + ps*0.5);
      ctx.lineTo(lx + BEAM_TOP*1.05, lyTop + ps*0.5);
      ctx.lineTo(impX + BEAM_BOT*1.6,  impY);
      ctx.lineTo(impX - BEAM_BOT*1.6,  impY);
      ctx.closePath();
      const g2 = ctx.createLinearGradient(lx, lyTop, impX, impY);
      g2.addColorStop(0,   'rgba(200,60,255,0.80)');
      g2.addColorStop(0.4, 'rgba(150,30,255,0.52)');
      g2.addColorStop(0.8, 'rgba(90,0,200,0.26)');
      g2.addColorStop(1,   'rgba(50,0,120,0.06)');
      ctx.fillStyle = g2;
      ctx.fill();

      // Layer 3: bright core
      ctx.beginPath();
      ctx.moveTo(lx - BEAM_TOP*0.48, lyTop + ps*0.5);
      ctx.lineTo(lx + BEAM_TOP*0.48, lyTop + ps*0.5);
      ctx.lineTo(impX + BEAM_BOT,    impY);
      ctx.lineTo(impX - BEAM_BOT,    impY);
      ctx.closePath();
      const g3 = ctx.createLinearGradient(lx, lyTop, impX, impY);
      g3.addColorStop(0,   'rgba(255,230,255,1.0)');
      g3.addColorStop(0.18,'rgba(255,170,255,0.95)');
      g3.addColorStop(0.55,'rgba(190,60,255,0.72)');
      g3.addColorStop(0.88,'rgba(120,0,220,0.42)');
      g3.addColorStop(1,   'rgba(60,0,140,0.12)');
      ctx.fillStyle = g3;
      ctx.fill();

      // Layer 4: white-hot center spine
      ctx.beginPath();
      ctx.moveTo(lx - BEAM_TOP*0.14, lyTop + ps*0.5);
      ctx.lineTo(lx + BEAM_TOP*0.14, lyTop + ps*0.5);
      ctx.lineTo(impX + 2,           impY);
      ctx.lineTo(impX - 2,           impY);
      ctx.closePath();
      const g4 = ctx.createLinearGradient(lx, lyTop, impX, impY);
      g4.addColorStop(0,   'rgba(255,255,255,1.0)');
      g4.addColorStop(0.45,'rgba(255,210,255,0.88)');
      g4.addColorStop(1,   'rgba(200,140,255,0.28)');
      ctx.fillStyle = g4;
      ctx.fill();

      // Scanlines (energy flicker across beam width, tapering with cone)
      const flk = 0.10 + 0.07*Math.sin(Date.now()*0.022);
      ctx.globalAlpha = flk;
      ctx.strokeStyle = '#ee88ff';
      ctx.lineWidth = 1;
      const _beamDX = impX - lx, _beamDY = impY - (lyTop + ps*0.5);
      const _beamLen = Math.sqrt(_beamDX*_beamDX + _beamDY*_beamDY) || 1;
      const _steps = 30;
      for(let _i = 0; _i <= _steps; _i++){
        const t = _i / _steps;
        const fx = lx + _beamDX * t;
        const fy = (lyTop + ps*0.5) + _beamDY * t;
        const hw = (BEAM_TOP * (1-t) + BEAM_BOT * t) * 0.88;
        // perpendicular to beam direction
        const px = -_beamDY / _beamLen, py = _beamDX / _beamLen;
        ctx.beginPath();
        ctx.moveTo(fx - px*hw, fy - py*hw);
        ctx.lineTo(fx + px*hw, fy + py*hw);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // ── IMPACT POINT (follows mouse) ──
      const ip = 0.72 + 0.28*Math.sin(Date.now()*0.016);
      // Shockwave ring
      ctx.beginPath();
      ctx.arc(impX, impY, IMPACT_R * 2.6 * ip, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(200,80,255,${0.6*ip})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // Inner crater glow
      const ig = ctx.createRadialGradient(impX, impY, 0, impX, impY, IMPACT_R * 2.0);
      ig.addColorStop(0,   `rgba(255,255,255,${0.98*ip})`);
      ig.addColorStop(0.22,`rgba(255,200,255,${0.88*ip})`);
      ig.addColorStop(0.55,`rgba(170,0,255,${0.60*ip})`);
      ig.addColorStop(1,   'rgba(80,0,160,0)');
      ctx.beginPath();
      ctx.arc(impX, impY, IMPACT_R * 2.0, 0, Math.PI*2);
      ctx.fillStyle = ig;
      ctx.fill();
      // Hot white dot
      ctx.beginPath();
      ctx.arc(impX, impY, BEAM_BOT * 1.8, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${0.95*ip})`;
      ctx.fill();

      // Impact sparks
      if(Math.random() < 0.65){
        const sa = Math.random()*Math.PI*2;
        addParticles(impX + Math.cos(sa)*Math.random()*IMPACT_R, impY + Math.sin(sa)*Math.random()*IMPACT_R*0.5, '#cc44ff', 1);
      }
      if(Math.random() < 0.28) addParticles(impX+(Math.random()-0.5)*IMPACT_R*1.4, impY-Math.random()*16, '#ffffff', 1);

      ctx.restore();

    } else {
      // Not firing — faint aim cone toward mouse + dashed line
      ctx.save();
      const t2 = Date.now()*0.004;
      ctx.globalAlpha = 0.18 + 0.08*Math.sin(t2);
      ctx.beginPath();
      ctx.moveTo(lx - BEAM_TOP*0.5, lyTop + ps*0.5);
      ctx.lineTo(lx + BEAM_TOP*0.5, lyTop + ps*0.5);
      ctx.lineTo(impX + BEAM_BOT,   impY);
      ctx.lineTo(impX - BEAM_BOT,   impY);
      ctx.closePath();
      ctx.fillStyle = 'rgba(170,30,255,0.14)';
      ctx.fill();
      ctx.globalAlpha = 0.32;
      ctx.strokeStyle = '#ff22aa';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5,9]);
      ctx.beginPath();
      ctx.moveTo(lx, lyTop + ps*0.5 + 4);
      ctx.lineTo(impX, impY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.38 + 0.18*Math.sin(t2*1.4);
      ctx.beginPath();
      ctx.arc(impX, impY, IMPACT_R*1.5, 0, Math.PI*2);
      ctx.strokeStyle = '#ff22aa';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }

    // Shadow below player on ground (at impact point)
    ctx.save();
    ctx.globalAlpha = 0.16 + 0.06*Math.sin(Date.now()*0.003);
    ctx.beginPath();
    ctx.ellipse(lx, DY + DUNGEON_SIZE - 5, ps * 0.7, ps * 0.16, 0, 0, Math.PI*2);
    ctx.fillStyle = '#220033';
    ctx.fill();
    ctx.restore();

    // ── BIG PLAYER SPRITE (perspective: large because "close to camera" at top) ──
    ctx.save();
    ctx.translate(lx, lyTop);
    const ep = 1 + 0.035*Math.sin(Date.now()*0.006);
    ctx.scale(ep, ep);

    ctx.shadowColor = '#bb00ff';
    ctx.shadowBlur = 55;

    // Body
    ctx.fillStyle = '#cc88ff';
    ctx.fillRect(-ps/2, -ps/2, ps, ps);
    // Head armor
    ctx.fillStyle = '#aa66dd';
    ctx.fillRect(-ps/2 + 3, -ps/2 - 7, ps - 6, 13);
    // Visor slit
    ctx.fillStyle = '#110022';
    ctx.fillRect(-ps/2 + 6, -ps/2 - 5, ps - 12, 6);
    // Visor glow
    ctx.fillStyle = laserActive ? '#ff44ff' : '#8844cc';
    ctx.fillRect(-ps/2 + 7, -ps/2 - 4, ps - 14, 4);

    // Charging orb at player feet (beam origin)
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 35;
    const orbPulse = 0.55 + 0.45*Math.sin(Date.now()*0.012);
    ctx.fillStyle = laserActive
      ? `rgba(255,255,255,${orbPulse})`
      : `rgba(200,100,255,${orbPulse*0.6})`;
    ctx.beginPath();
    ctx.ellipse(0, ps/2 + 2, laserActive ? ps*0.42 : ps*0.24, laserActive ? ps*0.18 : ps*0.10, 0, 0, Math.PI*2);
    ctx.fill();

    // Wings
    ctx.shadowColor = '#ff22aa';
    ctx.shadowBlur = 22;
    const wp = Math.sin(Date.now()*0.007);
    ctx.globalAlpha = 0.68 + 0.32*Math.abs(wp);
    ctx.fillStyle = '#ff22aa';
    ctx.beginPath();
    ctx.moveTo(-ps/2,        -ps*0.08);
    ctx.lineTo(-ps/2 - 32 + wp*6, -ps*0.32 + wp*9);
    ctx.lineTo(-ps/2 - 20,  ps*0.38);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ps/2,         -ps*0.08);
    ctx.lineTo(ps/2 + 32 - wp*6, -ps*0.32 + wp*9);
    ctx.lineTo(ps/2 + 20,   ps*0.38);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.restore();

    // Timer arc
    const timerFrac = specialTimer / getSpecialDuration();
    ctx.save();
    ctx.translate(lx, lyTop - ps*ep*0.52 - 20);
    ctx.beginPath();
    ctx.arc(0, 0, 16, -Math.PI/2, -Math.PI/2 + Math.PI*2*timerFrac);
    ctx.strokeStyle = '#ff22aa';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.fillStyle = '#ff88cc';
    ctx.font = 'bold 10px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(laserActive ? '⚡' : 'WASD', 0, 0);
    ctx.restore();
  }

  
  skeletons.forEach(sk=>{
    ctx.save();
    ctx.translate(sk.x, sk.y);

    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💀',0,0);

    // Health bar — drawn relative to translated origin, above the skull
    const barW = 20, barH = 3;
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(-barW/2, -16, barW, barH);
    ctx.fillStyle = '#44ff88';
    ctx.fillRect(-barW/2, -16, (sk.hp/sk.maxHp)*barW, barH);

    ctx.restore();
  });


// ── GLITCH FURY: Overlay vermelho — desenhado APÓS o shake para não vazar nas bordas ──
// (movido para depois do ctx.restore() do shake — ver abaixo)

  // ── GLITCH FURY: Mensagens glitch flutuantes ──
  if(glitchFuryActive && glitchFuryMessages.length > 0){
    const gt = Date.now();
    glitchFuryMessages.forEach(msg => {
      const frac = msg.life / msg.maxLife; // 1→0
      // Fade in fast, hold, fade out at the end
      const alpha = frac > 0.85 ? ((1-frac)/0.15) : (frac < 0.15 ? frac/0.15 : 1);
      const imgKey = '_glitchImg_' + msg.key;
      const img = window[imgKey];
      if(!img || !img.complete || !img.naturalWidth) return;
      const dispW = 260, dispH = 146;
      const wobX = Math.sin(gt*0.006 + msg.x)*7;
      const wobY = Math.cos(gt*0.004 + msg.y)*5;
      const sc = 0.90 + Math.sin(gt*0.007 + msg.x)*0.08;
      const pulse = 0.5 + Math.sin(gt*0.01 + msg.x)*0.5;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(msg.x + wobX, msg.y + wobY);
      ctx.scale(sc, sc);
      ctx.shadowColor = `rgba(255,0,0,${pulse})`;
      ctx.shadowBlur = 18 + pulse*14;
      // RGB offset glitch esporádico
      if(Math.random() < 0.20){
        ctx.globalAlpha = alpha * 0.35;
        ctx.drawImage(img, -dispW/2+4, -dispH/2, dispW, dispH);
        ctx.drawImage(img, -dispW/2-4, -dispH/2, dispW, dispH);
        ctx.globalAlpha = alpha;
      }
      ctx.drawImage(img, -dispW/2, -dispH/2, dispW, dispH);
      // Borda vermelha piscando
      ctx.shadowBlur = 0;
      ctx.globalAlpha = alpha * (0.4 + Math.sin(gt*0.012 + msg.x)*0.3);
      ctx.strokeStyle = '#ff2200';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-dispW/2-4, -dispH/2-4, dispW+8, dispH+8);
      ctx.restore();
    });
  }

  // ── GLITCH FURY: Darkening overlay ao ativar ──
  if(glitchFuryDarkening || glitchFuryScreamTimer > 0){
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${glitchFuryDarkenAlpha})`;
    ctx.fillRect(0,0,W,H);
    // Pequeno efeito de glitch visual durante os 9s escuros
    if(glitchFuryScreamTimer > 0 && Math.random() < 0.12){
      const bh = 4 + Math.random()*20;
      const by = Math.random()*(H-bh);
      ctx.globalAlpha = 0.08 + Math.random()*0.12;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, by, W, bh);
    }
    ctx.restore();
  }

  // ── GLITCH EVENT OVERLAY (glitch pré-dungeon) ──
  if(glitchEventActive){
    ctx.save();
    const gt = glitchEventGlitchTimer;

    // Fundo vermelho pulsante com alpha
    ctx.globalAlpha = glitchEventOverlayAlpha * (0.82 + Math.sin(gt*0.009)*0.08);
    ctx.fillStyle = 'rgba(60,0,0,0.92)';
    ctx.fillRect(0,0,W,H);

    // Scanlines de glitch horizontais (ruído visual)
    for(let i=0;i<14;i++){
      const gy = ((gt*0.18 + i*73.4) % H);
      const gw = 120 + Math.sin(gt*0.007+i*1.3)*80;
      const gx = (Math.cos(gt*0.005+i*2.1)*0.5+0.5)*(W-gw);
      ctx.globalAlpha = glitchEventOverlayAlpha * (0.10 + Math.random()*0.12);
      ctx.fillStyle = `rgb(255,${Math.floor(Math.random()*60)},0)`;
      ctx.fillRect(gx, gy-2, gw, 3+Math.random()*4);
    }

    // Blocos de glitch digitais (deslocamento de tela estilo VHS)
    if(Math.random() < 0.18){
      ctx.globalAlpha = glitchEventOverlayAlpha * 0.22;
      const bh = 8 + Math.random()*30;
      const by = Math.random()*(H-bh);
      const shift = (Math.random()-0.5)*40;
      ctx.fillStyle = `rgba(255,0,0,0.35)`;
      ctx.fillRect(shift, by, W, bh);
    }

    // Alvos clicáveis (G_messages glitchando)
    ctx.globalAlpha = glitchEventOverlayAlpha;
    for(const t of glitchEventTargets){
      if(t.dead && t.deathAnim <= 0) continue;
      if(t.dead && t.deathAnim > 0) t.deathAnim -= 0.07;

      const wobX = Math.sin(gt*0.006 + t.wobbleOff)*7;
      const wobY = Math.cos(gt*0.004 + t.wobbleOff)*5;
      const sc = 0.88 + Math.sin(gt*0.007 + t.scaleOff)*0.10;
      const alpha = t.dead ? Math.max(0, t.deathAnim) : 1;

      const imgKey = '_glitchImg_' + t.imgKey;
      const img = window[imgKey];
      if(!img || !img.complete) continue;

      // Tamanho de exibição baseado no aspect ratio da imagem (1280x720 → ~260x146)
      const dispW = 260, dispH = 146;

      ctx.save();
      ctx.globalAlpha = glitchEventOverlayAlpha * alpha;
      ctx.translate(t.x + wobX, t.y + wobY);
      ctx.scale(sc, sc);

      // Sombra vermelha pulsante
      if(!t.dead){
        const pulse = 0.5 + Math.sin(gt*0.01 + t.wobbleOff)*0.5;
        ctx.shadowColor = `rgba(255,0,0,${pulse})`;
        ctx.shadowBlur = 18 + pulse*14;
      }

      // Glitch de offset RGB esporádico
      if(!t.dead && Math.random() < 0.20){
        ctx.globalAlpha = glitchEventOverlayAlpha * 0.35 * alpha;
        ctx.drawImage(img, -dispW/2+4, -dispH/2, dispW, dispH);
        ctx.drawImage(img, -dispW/2-4, -dispH/2, dispW, dispH);
        ctx.globalAlpha = glitchEventOverlayAlpha * alpha;
      }

      ctx.drawImage(img, -dispW/2, -dispH/2, dispW, dispH);

      // Borda vermelha piscando ao redor do alvo
      if(!t.dead){
        ctx.shadowBlur = 0;
        ctx.globalAlpha = glitchEventOverlayAlpha * (0.4 + Math.sin(gt*0.012 + t.wobbleOff)*0.3);
        ctx.strokeStyle = '#ff2200';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-dispW/2 - 4, -dispH/2 - 4, dispW + 8, dispH + 8);
      }

      ctx.restore();
    }

    // Texto de instrução com contagem
    const alive = glitchEventTargets.filter(t=>!t.dead).length;
    ctx.globalAlpha = glitchEventOverlayAlpha * (0.7 + Math.sin(gt*0.008)*0.3);
    ctx.fillStyle = '#ff4400';
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'center';
    ctx.shadowColor='#ff2200'; ctx.shadowBlur=18;
    ctx.fillText(`DESTRUA OS GLITCHES  [${glitchEventClicks}/${glitchEventTotal}]`, W/2, H - 40);
    ctx.shadowBlur=0;

    ctx.restore();
  }

  // ── GLITCH FURY: Slash trails — rastros em arco persistindo na tela ──
  if(glitchFurySlashes.length > 0){
    glitchFurySlashes.forEach(sl => {
      const frac = sl.t / sl.maxT;                        // 1→0
      const alpha = Math.pow(frac, 0.55);                  // fade suave
      // arco desenhado em world space: centralizado no player quando spawnado
      ctx.save();
      ctx.translate(sl.cx, sl.cy);                         // centro do arco
      ctx.rotate(sl.baseAngle);                            // orientação do player
      ctx.lineCap = 'round';

      // Aura grossa que some primeiro
      ctx.globalAlpha = alpha * 0.35 * frac;
      ctx.strokeStyle = sl.color;
      ctx.lineWidth = sl.isFinisher ? 55 : 38;
      ctx.shadowColor = sl.color; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(0, 0, sl.R, sl.a0, sl.a1); ctx.stroke();

      // Corpo colorido
      ctx.globalAlpha = alpha * 0.65;
      ctx.strokeStyle = sl.color;
      ctx.lineWidth = sl.isFinisher ? 20 : 13;
      ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(0, 0, sl.R, sl.a0, sl.a1); ctx.stroke();

      // Borda afiada branca
      ctx.globalAlpha = alpha * 0.90;
      ctx.strokeStyle = sl.isFinisher ? 'rgba(255,255,220,0.95)' : 'rgba(255,200,150,0.85)';
      ctx.lineWidth = sl.isFinisher ? 2.5 : 1.8;
      ctx.shadowColor = '#fff'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(0, 0, sl.R, sl.a0, sl.a1); ctx.stroke();

      ctx.restore();
    });
  }

  // ── GLITCH FURY: Shockwaves ──
  if(glitchFuryShockwaves.length > 0){
    glitchFuryShockwaves.forEach(sw => {
      const prog = 1 - sw.t / sw.maxT;
      const r = sw.maxR * prog;
      const alpha = (1 - prog) * 0.75;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 4 * (1 - prog);
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, r, 0, Math.PI*2);
      ctx.stroke();
      // Inner ring
      ctx.globalAlpha = alpha * 0.4;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, r * 0.6, 0, Math.PI*2);
      ctx.stroke();
      ctx.restore();
    });
  }

  // ── GLITCH FURY: Fragments ──
  if(glitchFuryFragments.length > 0){
    glitchFuryFragments.forEach(fr => {
      const alpha = Math.pow(fr.t / fr.maxT, 0.7);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = fr.color;
      ctx.shadowColor = fr.color;
      ctx.shadowBlur = fr.size * 3;
      ctx.beginPath();
      ctx.arc(fr.x, fr.y, fr.size, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    });
  }

// ── Fecha o camera shake translate ──
  if(_shakeApplied){
    ctx.restore();
    const pad = 20;
    ctx.fillStyle = '#06060e';
    ctx.fillRect(0, 0, W, pad);
    ctx.fillRect(0, H - pad, W, pad);
    ctx.fillRect(0, 0, pad, H);
    ctx.fillRect(W - pad, 0, pad, H);
  }

  // ── Equalizador vermelho (só na dungeon vermelha) ──
  if(def && def.theme === 'red'){
    if(!draw._eqBars) draw._eqBars = new Float32Array(48).fill(0);
    const eqBars = draw._eqBars;
    const BAR_COUNT = eqBars.length;
    const freqData = Audio.getRedFreqData ? Audio.getRedFreqData() : null;

    const eqBottom = H - HUD_RESERVE;
    const eqTop    = DY + DUNGEON_SIZE;
    const eqHeight = eqBottom - eqTop;

    const barW   = W / BAR_COUNT;
    const barGap = Math.max(1, barW * 0.15);

    ctx.save();
    for(let i = 0; i < BAR_COUNT; i++){
      let target = 0;
      if(freqData){
        const t0 = Math.pow(i / BAR_COUNT, 1.8);
        const t1 = Math.pow((i + 1) / BAR_COUNT, 1.8);
        const binStart = Math.floor(t0 * freqData.length * 0.7);
        const binEnd   = Math.max(binStart + 1, Math.floor(t1 * freqData.length * 0.7));
        let sum = 0;
        for(let b = binStart; b < binEnd; b++) sum += freqData[b];
        target = (sum / (binEnd - binStart)) / 255;
      }

      if(target > eqBars[i]) eqBars[i] += (target - eqBars[i]) * 0.7;
      else                    eqBars[i] += (target - eqBars[i]) * 0.10;

      const barH = eqBars[i] * eqHeight;
      if(barH < 1) continue;

      const x = i * barW + barGap * 0.5;
      const w = barW - barGap;
      const y = eqBottom - barH;
      const v = eqBars[i];

      // Cor: vai de vermelho escuro (base) a vermelho vivo (topo)
      const r = Math.round(60 + v * 170);
      const g = Math.round(v * 6);
      ctx.globalAlpha = 0.45 + v * 0.45;
      ctx.fillStyle = `rgb(${r},${g},0)`;
      ctx.fillRect(x, y, w, barH);

      // Reflexo
      ctx.globalAlpha = 0.07 * v;
      ctx.fillRect(x, eqBottom, w, barH * 0.25);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── GLITCH FURY: Overlay vermelho pulsante com vinheta (fora do shake) ──
  if(glitchFuryActive){
    ctx.save();
    const glitchRed = 0.10 + Math.sin(Date.now()*0.003)*0.05;
    const finisherFlash = (glitchFurySwing && glitchFurySwing.isFinisher)
      ? Math.sin((1 - glitchFurySwing.t/glitchFurySwing.maxT) * Math.PI) * 0.18
      : 0;
    ctx.fillStyle = `rgba(200,0,0,${glitchRed + finisherFlash})`;
    ctx.fillRect(0,0,W,H);
    const vgrd = ctx.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.8);
    vgrd.addColorStop(0, 'rgba(120,0,0,0)');
    vgrd.addColorStop(1, `rgba(180,0,0,${0.22 + Math.sin(Date.now()*0.002)*0.06})`);
    ctx.fillStyle = vgrd;
    ctx.fillRect(0,0,W,H);
    ctx.restore();
  }

// Pause overlay — gerenciado via DOM (ver #pause-screen no HTML)
  if(paused){
    ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(0,0,W,H);
  }
}

let debuggerActive = (()=>{ try{ return localStorage.getItem('bk_debugger')==='1'; }catch(e){ return false; } })();
function setDebuggerActive(v){ debuggerActive=v; try{ localStorage.setItem('bk_debugger',v?'1':'0'); }catch(e){} }

function showPauseScreen() {
  updatePauseSoundLabel();
  updatePauseEffectsLabel();
  // Mostrar botão debug só se modo debugger estiver ativo
  const dbgBtn = document.getElementById('pause-debug-btn');
  if(dbgBtn) dbgBtn.style.display = debuggerActive ? 'block' : 'none';
  document.getElementById('pause-screen').style.display = 'flex';
  Audio.pauseDungeonMusic();
  if(typeof Audio.pauseTrickyMusic === 'function') Audio.pauseTrickyMusic();
}

function hidePauseScreen() {
  document.getElementById('pause-screen').style.display = 'none';
  Audio.resumeDungeonMusic();
  if(typeof Audio.resumeTrickyMusic === 'function') Audio.resumeTrickyMusic();
}

function updatePauseSoundLabel() {
  const btn = document.getElementById('pause-sound-btn');
  if(btn) btn.textContent = Audio.isMuted() ? '🔇 Ativar som' : '🔊 Desativar som';
}

function togglePauseSound() {
  const nowMuted = Audio.toggleMute();
  updatePauseSoundLabel();
  // Sincroniza label na tela de opções também
  updateOptionsSoundLabel();
}

function resumeFromPause() {
  paused = false;
  hidePauseScreen();
}

function pauseBackToMenu() {
  paused = false;
  hidePauseScreen();
  Audio.stopDungeonMusic(false);
  if(typeof Audio !== 'undefined' && Audio.playLobbyMusic) Audio.playLobbyMusic();
  restartGame();
}

// ═══════════════════════════════════════════════════════════════
// TELA DE DEBUG
// ═══════════════════════════════════════════════════════════════
function openDebugScreen() {
  if(!gameStarted || gameOver || transitioning || buffScreenActive) return;
  hidePauseScreen();
  // Reseta o grid colapsado
  const grid = document.getElementById('debug-dungeon-grid');
  grid.innerHTML = '';
  grid.style.display = 'none';
  const toggleBtn = document.getElementById('debug-phase-toggle');
  if(toggleBtn) { toggleBtn.textContent = '📋 SELECIONAR FASE ▾'; toggleBtn.classList.remove('open'); }
  document.getElementById('debug-screen').classList.add('open');
}

function toggleDebugPhaseList() {
  const grid = document.getElementById('debug-dungeon-grid');
  const btn = document.getElementById('debug-phase-toggle');
  const isOpen = grid.style.display === 'grid';
  if(isOpen) {
    grid.style.display = 'none';
    btn.textContent = '📋 SELECIONAR FASE ▾';
    btn.classList.remove('open');
  } else {
    grid.innerHTML = '';
    DUNGEON_DEFS.forEach((def, idx) => {
      const item = document.createElement('button');
      item.className = 'debug-dungeon-btn' + (idx === currentDungeon ? ' current' : '');
      item.innerHTML = `<span>${def.name}</span><span class="dbg-theme">${def.theme.toUpperCase()}</span>`;
      item.onclick = () => debugGoToDungeon(idx);
      grid.appendChild(item);
    });
    grid.style.display = 'grid';
    btn.textContent = '📋 SELECIONAR FASE ▴';
    btn.classList.add('open');
  }
}

function closeDebugScreen() {
  document.getElementById('debug-screen').classList.remove('open');
  showPauseScreen();
}

function debugGoToDungeon(targetIdx) {
  closeDebugScreen();

  // Limpa todos os inimigos e timers
  slimes=[]; blueSlimes=[]; redSlimes=[]; bombHeads=[];
  assassinRats=[]; ghosts=[]; golems=[]; skeletons=[];
  killCount=0; discardCount=0;
  slimeSpawnTimer=0; bombSpawnTimer=0; ratSpawnTimer=0;
  golemSpawnTimer=0; ghostSpawnTimer=0;
  blueSlimeSpawnTimer=0; redSlimeSpawnTimer=0;
  enemySpawnDelay=3000;
  transitioning=false; transitionTimer=0;

  // Posiciona currentDungeon um antes do alvo para finishDungeonTransition fazer ++
  currentDungeon = Math.max(0, targetIdx - 1);

  // Reseta player
  player.x=W/2; player.y=H/2; player.rolling=false; player.invincible=600;
  playerFlyY=H/2; playerFlyAlpha=1; cubeAngle=0;

  // Mostra tela de buff da dungeon anterior ao alvo (simula completar a anterior)
  const prevDungeonNum = DUNGEON_DEFS[Math.max(0, targetIdx - 1)].num;
  showBuffScreen(prevDungeonNum);
}

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&gameStarted&&!gameOver&&!transitioning&&!buffScreenActive){
    paused=!paused;
    if(paused) showPauseScreen(); else hidePauseScreen();
    e.preventDefault(); return;
  }
  if(paused) return;
  keys[e.key]=true;

  // ── CHEAT CODE: digitar "luck" na dungeon ──────────────────
  if(gameStarted && !gameOver && !transitioning && e.key.length === 1) {
    _cheatBuffer = (_cheatBuffer + e.key.toLowerCase()).slice(-4);
    if(_cheatBuffer === 'luck') {
      _cheatBuffer = '';
      activateJackpotEffect();
    }
  }
  if(e.key==='q'||e.key==='Q'){ useSpecialCard(); return; }
  if(e.key===' '&&!rollCooldown&&!player.rolling&&!gameOver){
    player.rolling=true;player.rollTime=ROLL_DURATION;player.trail=[];
    Audio.rollDash();
    const dx=(keys['ArrowRight']||keys['d']||keys['D'])?1:(keys['ArrowLeft']||keys['a']||keys['A'])?-1:Math.cos(player.angle);
    const dy=(keys['ArrowDown']||keys['s']||keys['S'])?1:(keys['ArrowUp']||keys['w']||keys['W'])?-1:Math.sin(player.angle);
    const l=Math.sqrt(dx*dx+dy*dy)||1;
    player.rollVx=dx/l;player.rollVy=dy/l;
    player.invincible=ROLL_DURATION+80;
    rollCooldown=true;rollTimer=0;
    addParticles(player.x,player.y,'#8888ff',6);
    e.preventDefault();
  }
  const num=parseInt(e.key);
  if(num>=1&&num<=5) useCardSlot(num-1);
});
document.addEventListener('keyup',e=>{keys[e.key]=false;});
document.addEventListener('mousemove',e=>{
  mouseX=e.clientX; mouseY=e.clientY;
  if(katanaDrawing && activeEffect==='katana'){
    katanaAddSegment(mouseX, mouseY);
    katanaLastX=mouseX; katanaLastY=mouseY;
  }
});
canvas.addEventListener('mousedown',e=>{
  // Glitch event overlay: clique nos glitches espalhados
  if(glitchEventActive){
    if(e.button===0) handleGlitchEventClick(e.clientX, e.clientY);
    return;
  }
  // Glitch fury darkening: aguarda clique para começar
  if(glitchFuryAwaitClick && e.button===0){
    startGlitchFuryEffect();
    return;
  }
  if(gameOver) return;
  if(e.button===0) mouseButtonDown=true;
  if(e.button===2){
    // Right-click: throw bomb if bombinhas active
    if(bombinhasActive && bombAmmo>0) throwBomb(mouseX, mouseY);
    return;
  }
  if(e.button!==0) return;
  // Sniper minigame: check if clicked a target
  if(sniperMinigameActive && onSniperTargetClick(mouseX, mouseY)) return;
  if(playerInSpecial){
    laserActive = true;
    Audio.laser();
    return;
  }
  if(activeEffect==='sword') doSwordSwing();
  else if(activeEffect==='scythe') doScytheAttack();
  else if(activeEffect==='bow') { bowCharging=true; bowChargeTimer=0; }
  else if(activeEffect==='pistol'){ pistolFireTimer=0; shootPistol(); }
  else if(activeEffect==='sniper_noscope' && sniperMinigameActive){ /* clique tratado em onSniperTargetClick */ }
  else if(glitchFuryActive){ doGlitchFuryAttack(); }
  else if(activeEffect==='katana'){
    katanaDrawing=true;
    katanaLastX=mouseX; katanaLastY=mouseY;
  }
  else if(soccerBallPending){
    // Place the ball at the clicked dungeon position
    const bx = Math.max(DX+20, Math.min(DX+DUNGEON_SIZE-20, mouseX));
    const by = Math.max(DY+20, Math.min(DY+DUNGEON_SIZE-20, mouseY));
    const maxT = activeBuffs.has('camisa10') ? 15000 : 8000;
    const ballSize = activeBuffs.has('craque') ? 42 : 32;
    const savedSlot = soccerBallPendingSlot;
    soccerBallPending = false;
    soccerBallPendingSlot = -1;
    soccerBall = {
      x: bx, y: by,
      vx: 0, vy: 0,
      timer: maxT, maxTimer: maxT,
      speed: 0,
      kickCount: 0,
      onFire: false,
      size: ballSize,
      _kickCooldown: 0,
    };
    // Dominada: blast wave on placement
    if(activeBuffs.has('dominada')) {
      const waveRadius = 90;
      const waveDmg = 0.5;
      const pushForce = 7;
      const allEnemies = [...(slimes||[]), ...(blueSlimes||[]), ...(redSlimes||[]), ...(bombHeads||[]), ...(assassinRats||[]), ...(ghosts||[]), ...(golems||[])];
      allEnemies.forEach(en => {
        const dx = en.x - bx;
        const dy = en.y - by;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < waveRadius && dist > 0) {
          en.hp -= waveDmg;
          en.killedByPlayer = true;
          en.hitFlash = 200;
          spawnDamageNumber(en.x, en.y, waveDmg, false);
          en.x += (dx/dist) * pushForce * (1 - dist/waveRadius);
          en.y += (dy/dist) * pushForce * (1 - dist/waveRadius);
          addParticles(en.x, en.y, '#88aaff', 5);
        }
      });
      addParticles(bx, by, '#88aaff', 20);
      addParticles(bx, by, '#ffffff', 10);
    }
    replaceCard(savedSlot);
    addParticles(bx, by, '#ffffff', 14);
    return;
  }
  else if(necroStaffActive && necroStaffAmmo > 0){
    // 1 mana = 2 esqueletos invocados
    if(mana < 1) return;
    mana -= 1;
    updateManaDisplay();
    const hp = activeBuffs.has('necro_tank') ? 3 : 1;
    const spawnCount = 2;
    for(let s = 0; s < spawnCount; s++){
      skeletons.push({
        x: player.x + (Math.random()*60-30),
        y: player.y + (Math.random()*60-30),
        size: 8,
        hp: hp,
        maxHp: hp,
        attackTimer: 0,
        wanderTimer: 0,
        wanderVx: (Math.random()-0.5)*2,
        wanderVy: (Math.random()-0.5)*2,
        dead: false
      });
      necroStaffAmmo--;
      if(necroStaffAmmo <= 0) break;
    }
    Audio.skeleton();
    addParticles(player.x, player.y, '#ddddff', 10);
    updateSecondaryEffectDisplay();
    if(necroStaffAmmo <= 0){
      necroStaffActive = false;
      replaceCard(necroStaffSlot);
      necroStaffSlot = -1;
      updateCardStates();
    }
  }
  // Left-click throws bomb only if no weapon active
  else if(bombinhasActive && bombAmmo>0) throwBomb(mouseX, mouseY);
});
canvas.addEventListener('contextmenu', e=>{ e.preventDefault(); });
document.addEventListener('mouseup',e=>{
  if(e.button===0){
    mouseButtonDown=false; katanaDrawing=false; laserActive=false;
    if(bowCharging && activeEffect==='bow') releaseArrow();
    bowCharging=false;
  }
});

// ── CHEAT CODE ────────────────────────────────────────────────
let _cheatBuffer = '';

function activateJackpotEffect() {
  if(!player) return;
  player.maxHp += 1;
  maxMana += 1;
  player.hp = player.maxHp;
  mana = maxMana;
  player.invincible = Math.max(player.invincible, 10000);
  jackpotAuraTimer = 10000;
  updateHPDisplay(); updateManaDisplay();
  spawnCoins(player.x, player.y, 100);
  addParticles(player.x, player.y, '#00ff88', 60);
  addParticles(player.x, player.y, '#ffee00', 40);
  diceResultTexts.push({ text: '🎰 JACKPOT! (cheat)', color: '#00ff88', x: player.x, y: player.y - 40, life: 2.5, maxLife: 2.5 });
  Audio.playJackpotMusic();
}

function restartGame(){
  paused=false; transitioning=false;
  jackpotAuraTimer=0;
  // Reset glitch fury state
  glitchFuryActive=false; glitchFuryCharge=0; glitchFuryReady=false;
  glitchFuryDarkening=false; glitchFuryDarkenAlpha=0; glitchFuryDarkenTimer=0;
  glitchFuryAwaitClick=false; glitchFuryScreamTimer=-1;
  glitchFuryAttackTimer=0; glitchFurySwing=null;
  glitchFurySwingDir=1; glitchFuryCombo=0;
  glitchFuryShockwaves=[]; glitchFurySlashes=[]; glitchFuryFragments=[]; glitchFuryTrail=[]; glitchFuryBlood=[]; glitchFuryScars = [];
  glitchFuryMessages=[]; glitchFuryMsgTimer=0;
  glitchFuryUsedDungeon=-99;
  glitchEventActive=false; glitchEventClicks=0; glitchEventOverlayAlpha=0;
  glitchEventFadeIn=true; glitchEventGlitchTimer=0;
  hidePauseScreen();
  persistentGold += gold;
  writeSave();
  updateMenuGold();
  document.getElementById('gameover').style.display='none';
  Audio.stopDungeonMusic(false);
  goToMenu();
}

// (declared in state.js)
// (declared in state.js)
function revivePlayer(){
  if(!hasRevive || reviveCount<=0) return;
  reviveCount--;
  if(reviveCount<=0) hasRevive=false;
  document.getElementById('gameover').style.display='none';
  player.hp=Math.ceil(player.maxHp/2);
  player.x=W/2; player.y=H/2;
  player.invincible=2000; player.hitFlash=0; player.rolling=false;
  gameOver=false;
  updateHPDisplay();
  addParticles(player.x,player.y,'#44ff88',30);
  const btn=document.getElementById('revive-btn');
  if(reviveCount<=0){
    btn.disabled=true;
    btn.style.opacity='0.3';
    btn.style.cursor='not-allowed';
    btn.textContent='\u{1F480} sem revive';
  } else {
    btn.textContent=`\u{1F49A} REVIVER (${reviveCount}x)`;
  }
}

// ═══════════════════════════════════════════════════════════════
// GLITCH FURY — Funções
// ═══════════════════════════════════════════════════════════════

// Ataque com a placa (clique durante glitch fury) — versão épica
function doGlitchFuryAttack(){
  if(!glitchFuryActive) return;
  if(glitchFuryAttackTimer > 0) return;

  const SWING_DUR = 220;
  glitchFuryAttackTimer = SWING_DUR;

  // Alterna direção a cada ataque
  const dir = glitchFurySwingDir;
  glitchFurySwingDir *= -1;
  glitchFuryCombo = (glitchFuryCombo + 1) % 4;
  const isFinisher = glitchFuryCombo === 0;

  // Arco de swing vai de um lado ao outro baseado na direção
  const arcFrom = dir > 0 ? -1.1 : 1.1;
  const arcTo   = dir > 0 ?  1.1 : -1.1;
  glitchFurySwing = { t: SWING_DUR, maxT: SWING_DUR, dir, arcFrom, arcTo, isFinisher };

  // ── Camera shake: acumula a cada ataque ──
  cameraShake = Math.min(cameraShake + (isFinisher ? 8 : 4), 30);

  // ── Onda de choque no player ──
  glitchFuryShockwaves.push({
    x: player.x, y: player.y,
    t: 300, maxT: 300,
    maxR: isFinisher ? 130 : 90,
    color: isFinisher ? '#ff0044' : '#ff3300'
  });

  // ── Rastros em arco (persistem na tela após o swing) ──
  const angleBase = player.angle;
  const slashR = player.size * 5.5;
  // Trail principal: o arco completo do swing
  glitchFurySlashes.push({
    cx: player.x, cy: player.y,   // centro do arco
    baseAngle: 0,                  // já em world space: a0/a1 incluem player.angle
    R: slashR,
    a0: angleBase + Math.min(arcFrom, arcTo),
    a1: angleBase + Math.max(arcFrom, arcTo),
    t: 340, maxT: 340,
    color: isFinisher ? '#ff0055' : '#ff2200',
    isFinisher
  });
  // Ghost trail: arco levemente maior, some mais rápido — dá profundidade
  glitchFurySlashes.push({
    cx: player.x, cy: player.y,
    baseAngle: 0,
    R: slashR + (isFinisher ? 16 : 10),
    a0: angleBase + Math.min(arcFrom, arcTo),
    a1: angleBase + Math.max(arcFrom, arcTo),
    t: 180, maxT: 180,
    color: isFinisher ? '#ff0088' : '#cc3300',
    isFinisher
  });

  // ── Rasgo preto no chão ──
  glitchFuryScars.push({
    cx: player.x, cy: player.y,
    R: slashR,
    a0: angleBase + Math.min(arcFrom, arcTo),
    a1: angleBase + Math.max(arcFrom, arcTo),
    isFinisher
  });

  // ── Fragmentos voando ──
  const fragColors = ['#ff0000','#ff4400','#ffaa00','#ff2244','#cc0022'];
  const fragCount = isFinisher ? 18 : 8;
  for(let i = 0; i < fragCount; i++){
    const a = angleBase + (arcFrom + arcTo) * 0.5 + (Math.random()-0.5) * Math.abs(arcTo - arcFrom);
    const spd = 2 + Math.random() * 4;
    glitchFuryFragments.push({
      x: player.x, y: player.y,
      vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
      t: 350 + Math.random()*200, maxT: 550,
      color: fragColors[Math.floor(Math.random()*fragColors.length)],
      size: isFinisher ? 2 + Math.random()*4 : 1.5 + Math.random()*2.5
    });
  }

  // ── Dano nos inimigos ──
  const SIGN_DMG = isFinisher ? 9 : 5;
  const SIGN_RADIUS = isFinisher ? 110 : 80;
  const allEnemies = [...(slimes||[]), ...(blueSlimes||[]), ...(redSlimes||[]),
                      ...(bombHeads||[]), ...(assassinRats||[]), ...(ghosts||[]),
                      ...(golems||[])];
  allEnemies.forEach(en => {
    const dx = en.x - player.x, dy = en.y - player.y;
    const dist = Math.sqrt(dx*dx+dy*dy);
    if(dist > SIGN_RADIUS + en.size) return;
    let diff = Math.atan2(dy, dx) - player.angle;
    while(diff > Math.PI) diff -= Math.PI*2;
    while(diff < -Math.PI) diff += Math.PI*2;
    const coneAngle = isFinisher ? Math.PI*0.75 : Math.PI*0.6;
    if(Math.abs(diff) < coneAngle){
      en.hp -= SIGN_DMG;
      en.hitFlash = 250;
      en.killedByPlayer = true;
      spawnDamageNumber(en.x, en.y, SIGN_DMG, false);
      // Knockback vermelho
      const kbAngle = Math.atan2(dy, dx);
      en.x += Math.cos(kbAngle) * (isFinisher ? 18 : 10);
      en.y += Math.sin(kbAngle) * (isFinisher ? 18 : 10);
      // Impede que o inimigo empurrado cause dano de contato imediato no player
      if('contactCooldown' in en) en.contactCooldown = 1200;
      player.invincible = Math.max(player.invincible, 300);
      addParticles(en.x, en.y, '#ff2200', isFinisher ? 14 : 8);
      addParticles(en.x, en.y, '#ff8800', isFinisher ? 6 : 3);
      // Onda extra no inimigo atingido
      glitchFuryShockwaves.push({ x: en.x, y: en.y, t: 200, maxT: 200, maxR: 40, color: '#ff4400' });
      // Sangue no chão ao matar
      if(en.hp <= 0) spawnGlitchBlood(en.x, en.y, isFinisher);
    }
  });
}

// Spawna sangue no chão ao matar inimigo com a placa (Glitch Fury)
function spawnGlitchBlood(ex, ey, isFinisher){
  const count = isFinisher ? 22 : 12;
  const LIFE  = 18000; // dura 18s (até o fury acabar em geral)
  for(let i = 0; i < count; i++){
    const angle = Math.random() * Math.PI * 2;
    const spd   = 1.5 + Math.random() * (isFinisher ? 5 : 3.5);
    const r     = (isFinisher ? 3 : 2) + Math.random() * 3;
    glitchFuryBlood.push({
      x: ex + (Math.random()-0.5)*12,
      y: ey + (Math.random()-0.5)*12,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      r,
      life: 1,
      maxLife: LIFE,
      settled: false,
      // splat shape: elipse achatada ao parar
      scaleX: 1, scaleY: 1,
    });
  }
}

// Spawna os alvos do glitch event espalhados pela tela
function spawnGlitchEventTargets(){
  glitchEventTargets = [];
  glitchEventTotal = 7;
  const margin = 120;
  const keys = ['G_message1','G_message2','G_message3','G_message4','G_message5'];
  for(let i = 0; i < glitchEventTotal; i++){
    glitchEventTargets.push({
      x: margin + Math.random() * (W - margin*2),
      y: margin + Math.random() * (H - margin*2),
      r: 80,                             // raio de colisão (G_messages são grandes)
      imgKey: keys[i % keys.length],     // cada alvo tem uma mensagem diferente
      wobbleOff: Math.random()*Math.PI*2,
      scaleOff: Math.random()*Math.PI*2,
      dead: false,
      deathAnim: 1,
    });
  }
}

// Clique no glitch do overlay pré-dungeon — verifica hit em qualquer alvo
function handleGlitchEventClick(mx, my){
  if(!glitchEventActive) return;
  let hit = false;
  for(const t of glitchEventTargets){
    if(t.dead) continue;
    const dx = mx - t.x, dy = my - t.y;
    if(Math.abs(dx) < 130 && Math.abs(dy) < 73){  // 260/2 x 146/2
      t.dead = true;
      t.deathAnim = 1;
      glitchEventClicks++;
      addParticles(t.x, t.y, '#ff2200', 10);
      addParticles(t.x, t.y, '#ff8800', 6);
      hit = true;
      break;
    }
  }
  if(!hit) return; // só conta acerto
  if(glitchEventClicks >= glitchEventTotal){
    // Glitch coletado!
    setTimeout(() => {
      glitchEventActive = false;
      glitchEventClicks = 0;
      glitchEventOverlayAlpha = 0;
      glitchEventFadeIn = true;
      glitchEventGlitchTimer = 0;
      glitchEventTargets = [];
    }, 400);
    // Conta para a carga da carta
    glitchFuryCharge++;
    if(glitchFuryCharge >= 3){
      glitchFuryCharge = 3;
      glitchFuryReady = true;
    }
    updateGlitchFuryUI();
    addParticles(player.x, player.y, '#ff2200', 20);
    addParticles(player.x, player.y, '#ffffff', 10);
  }
}

// Ativar a carta Glitch Fury (usuário pressiona Q ou clica na carta)
function useGlitchFuryCard(){
  if(!glitchFuryReady || glitchFuryActive || glitchFuryDarkening || gameOver || paused || transitioning) return;
  if(equippedSpecial !== 'glitch_fury') return;
  glitchFuryReady = false;
  glitchFuryCharge = 0;
  glitchFuryUsedDungeon = DUNGEON_DEFS[currentDungeon].num;

  // Para música salvando offset para retomar depois
  if(typeof Audio !== 'undefined' && Audio.stopDungeonMusic) Audio.stopDungeonMusic(true);

  glitchFuryDarkening = true;
  glitchFuryDarkenTimer = 0;
  glitchFuryDarkenAlpha = 0;
  glitchFuryAwaitClick = false;

  // Após 600ms de fade para preto, mantém escuro por 9s (sincronizado com Tricky music)
  // e então ativa o efeito
  setTimeout(() => {
    glitchFuryDarkening = false;
    glitchFuryDarkenAlpha = 1;
    // Toca a música de Tricky durante os 9s
    if(typeof Audio !== 'undefined' && Audio.playTrickyMusic) Audio.playTrickyMusic();
    // Timer de 9 segundos — ao final libera o efeito
    glitchFuryScreamTimer = 9000;
  }, 600);

  updateGlitchFuryUI();
}

// Chamado quando o player clica após o escurecimento (não usada mais, mantida por compatibilidade)
function startGlitchFuryEffect(){
  glitchFuryAwaitClick = false;
  if(typeof Audio !== 'undefined' && Audio.playTrickyMusic) Audio.playTrickyMusic();
  if(typeof Audio !== 'undefined' && Audio.stopDungeonMusic) Audio.stopDungeonMusic(true);
  glitchFuryScreamTimer = 9000;
  glitchFuryDarkenAlpha = 1;
  glitchFuryDarkening = false;
}

// Chamado no finishDungeonTransition para encerrar glitch fury e sortear próximo glitch
function onDungeonStartGlitchCheck(){
  // Sempre limpa rasgos do chão ao trocar de dungeon
  glitchFuryScars = [];
  // Encerra o efeito fury se estava ativo
  if(glitchFuryActive){
    glitchFuryActive = false;
    glitchFuryMessages = [];
    glitchFurySwing = null;
    glitchFurySwingDir = 1; glitchFuryCombo = 0;
    glitchFuryShockwaves = []; glitchFurySlashes = []; glitchFuryFragments = []; glitchFuryTrail = []; glitchFuryBlood = []; glitchFuryScars = [];
    const TRICKY_FADE = 2.5; // segundos de fade out da Madness
    const MUSIC_FADE  = 3.0; // segundos de fade in da música normal
    if(typeof Audio !== 'undefined' && Audio.fadeTrickyMusicOut) Audio.fadeTrickyMusicOut(TRICKY_FADE);
    setTimeout(() => {
      if(typeof Audio !== 'undefined' && Audio.playDungeonMusic) {
        const theme = DUNGEON_DEFS[currentDungeon] ? DUNGEON_DEFS[currentDungeon].theme : 'blue';
        Audio.playDungeonMusic(theme);
      }
    }, TRICKY_FADE * 1000);
  }
  // Sorteia se um glitch vai aparecer nesta dungeon
  // Bloqueado se foi a dungeon imediatamente após o uso
  const thisDungeonNum = DUNGEON_DEFS[currentDungeon].num;
  const skipDungeon = glitchFuryUsedDungeon + 1;
  if(equippedSpecial === 'glitch_fury' && thisDungeonNum !== skipDungeon){
    // Chance aumenta com o nível do upgrade: L1=50%, L2=60%, L3=70%, L4=80%, L5=90%
    const glitchChanceTable = [0.5, 0.6, 0.7, 0.8, 0.9];
    const glitchLevel = (typeof specialUpgradeLevel !== 'undefined') ? specialUpgradeLevel : 1;
    const glitchChance = glitchChanceTable[Math.min(glitchLevel - 1, 4)];
    if(Math.random() < glitchChance){
      // Ativa o overlay de glitch após 1.5s (após o player entrar)
      setTimeout(() => {
        if(!gameOver && !transitioning){
          glitchEventActive = true;
          glitchEventClicks = 0;
          glitchEventOverlayAlpha = 0;
          glitchEventFadeIn = true;
          glitchEventGlitchTimer = 0;
          spawnGlitchEventTargets();
        }
      }, 1500);
    }
  }
}

function updateGlitchFuryUI(){
  const slot = document.getElementById('special-card-slot');
  const icon = document.getElementById('special-card-icon');
  const name = document.getElementById('special-card-name');
  const chargeLabel = document.getElementById('special-charge-label');
  const fill = document.getElementById('special-charge-bar-fill');
  if(!slot) return;
  if(equippedSpecial === 'glitch_fury'){
    // Substitui o display da carta especial
    if(icon) icon.textContent = '📛';
    if(name) name.textContent = 'GLITCH FURY';
    const pct = Math.min(1, glitchFuryCharge / 3) * 100;
    if(fill) fill.style.width = pct + '%';
    if(chargeLabel) chargeLabel.textContent = glitchFuryReady ? 'PRONTO!' : `${glitchFuryCharge} / 3`;
    const card = document.getElementById('special-card');
    if(card){
      if(glitchFuryReady) card.classList.add('ready');
      else card.classList.remove('ready');
    }
  }
}

// O jogo só começa quando o menu chamar startGame()
// Inicia o loop de render imediatamente (para futuro background animado no menu)
requestAnimationFrame(gameLoop);
