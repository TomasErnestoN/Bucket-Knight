function spawnOutsideDungeon(offset){
  offset = offset || 60;
  const sides=['top','bottom','left','right'];
  const side=sides[Math.floor(Math.random()*4)];
  let x,y;
  if(side==='top'){
    x = DX + Math.random()*DUNGEON_SIZE;
    y = DY - offset;
  } else if(side==='bottom'){
    x = DX + Math.random()*DUNGEON_SIZE;
    y = DY + DUNGEON_SIZE + offset;
  } else if(side==='left'){
    x = DX - offset;
    y = DY + Math.random()*DUNGEON_SIZE;
  } else {
    x = DX + DUNGEON_SIZE + offset;
    y = DY + Math.random()*DUNGEON_SIZE;
  }
  return {x, y};
}

function spawnSlime(){
  const pos=spawnOutsideDungeon(150);
  const x=pos.x, y=pos.y;
  slimes.push({x,y,hp:3,maxHp:3,size:14,chargeTimer:2500+Math.random()*1000,chargeCooldown:SLIME_CHARGE_COOLDOWN,charging:false,chargeVx:0,chargeVy:0,chargeTimeLeft:0,hitFlash:0,wobble:Math.random()*Math.PI*2,contactCooldown:0});
}

function spawnBlueSlime(){
  const pos=spawnOutsideDungeon(150);
  blueSlimes.push({
    x:pos.x, y:pos.y,
    hp:2, maxHp:2, size:14,
    hitFlash:0, wobble:Math.random()*Math.PI*2,
    dashTimer: BLUE_SLIME_DASH_COOLDOWN * Math.random(),
    dashing: false, dashVx:0, dashVy:0, dashTimeLeft:0,
    slowed:false, slowMultiplier:1,
    killedByPlayer:false, goldDouble:false,
    _ballHitCooldown:0
  });
}

function spawnRedSlime(x, y, mini=false){
  const pos = (x!==undefined) ? {x,y} : spawnOutsideDungeon(150);
  redSlimes.push({
    x:pos.x, y:pos.y,
    hp: mini ? RED_SLIME_MINI_HP : RED_SLIME_HP,
    maxHp: mini ? RED_SLIME_MINI_HP : RED_SLIME_HP,
    size: mini ? RED_SLIME_MINI_SIZE : 14,
    mini,
    hitFlash:0, wobble:Math.random()*Math.PI*2,
    contactCooldown:0,
    slowed:false, slowMultiplier:1,
    killedByPlayer:false, goldDouble:false,
    _ballHitCooldown:0
  });
}

function randomDungeonPos(){
  const mg=40;
  return{x:DX+mg+Math.random()*(DUNGEON_SIZE-2*mg),y:DY+mg+Math.random()*(DUNGEON_SIZE-2*mg)};
}

// (declared in constants.js / state.js)

function spawnBombHead(){
  const pos=spawnOutsideDungeon(150);
  const x=pos.x, y=pos.y;
  bombHeads.push({
    x,y,hp:2,maxHp:2,size:13,hitFlash:0,wobble:Math.random()*Math.PI*2,
    // jump state: 'ground' -> 'warning' -> 'air' -> 'landing'
    state:'ground', jumpTimer:0,
    airX:x, airY:y,      // target land position
    shadowX:x, shadowY:y, // landing shadow
    airProgress:0,         // 0..1 arc progress
    scale:1, rotation:0,
    contactCooldown:0,
  });
}

function spawnAssassinRat(){
  const pos=spawnOutsideDungeon(150);
  const x=pos.x, y=pos.y;
  assassinRats.push({
    x,y,hp:5,maxHp:5,size:12,hitFlash:0,wobble:Math.random()*Math.PI*2,
    // states: 'chase' | 'windup' | 'dash' | 'cooldown'
    state:'chase',
    windupTimer:0, windupDuration:700,
    dashTimer:0, dashDuration:900,
    dashVx:0, dashVy:0,
    dashOriginX:0, dashOriginY:0,
    dashTargetX:0, dashTargetY:0,
    cooldownTimer:0,
    contactCooldown:0,
    killedByPlayer:false,
    angle:0,
    tailWag:Math.random()*Math.PI*2,
  });
}

// ── GHOST ───────────────────────────────────────────────────────────────────
// (declared in constants.js / state.js)
// (declared in constants.js / state.js)
// (declared in constants.js / state.js)
// (declared in constants.js / state.js)

function spawnGhost(){
  const pos=spawnOutsideDungeon(150);
  const x=pos.x, y=pos.y;
  ghosts.push({
    x,y,hp:2,maxHp:2,size:14,
    hitFlash:0,
    killedByPlayer:false,
    wobble:Math.random()*Math.PI*2,
    // visibilidade alterna a cada GHOST_INVIS_CYCLE
    invisTimer: Math.random()*GHOST_INVIS_CYCLE, // offset aleatório p/ desincronizar
    invisible: false,
  });
}

// ── GOLEM ────────────────────────────────────────────────────────────────────
// (declared in constants.js / state.js)
// (declared in constants.js / state.js)
// (declared in constants.js / state.js)
// (declared in constants.js / state.js)
// (declared in constants.js / state.js)
// (declared in constants.js / state.js)

function spawnGolem(){
  const pos=spawnOutsideDungeon(150);
  const x=pos.x, y=pos.y;
  golems.push({
    x,y,hp:10,maxHp:10,size:18,
    hitFlash:0,
    killedByPlayer:false,
    wobble:Math.random()*Math.PI*2,
    contactCooldown:0,
    goldDouble:false,
    // ciclo de sono: 'awake' | 'sleeping'
    state:'awake',
    stateTimer: GOLEM_SLEEP_CYCLE, // conta regressiva até o próximo evento
  });
}
