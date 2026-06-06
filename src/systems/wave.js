function init() {
  const artifactSpeedBoostCount = (typeof equippedArtifacts !== 'undefined') ? equippedArtifacts.filter(id => id === 'leather_boots').length : 0;
  const artifactSpeedBonus = artifactSpeedBoostCount > 0
    ? ((typeof getArtifactUpgradeValue === 'function') ? (getArtifactUpgradeValue('leather_boots') || 0.10) : 0.10)
    : 0;
  const baseSpeed = 5.5 * (1 + artifactSpeedBonus);
  player={x:W/2,y:H/2,size:16,hp:4,maxHp:4,speed:baseSpeed,rolling:false,rollVx:0,rollVy:0,rollTime:0,angle:0,hitFlash:0,invincible:0,trail:[]};
  slimes=[]; golems=[]; golemSpawnTimer=0; mana=5; maxMana=6; manaTimer=0;
  blueSlimes=[]; blueSlimeSpawnTimer=0;
  redSlimes=[]; redSlimeSpawnTimer=0;
  activeEffect=null; activeEffectSlot=-1; effectTimer=0;
  potionActive=false; potionTimer=0; bombinhasActive=false; bombAmmo=0;
  pistolActive=false; pistolAmmo=0; pistolSlot=-1; pistolFireTimer=0;
  sniperActive=false; sniperAmmo=0; sniperSlot=-1; sniperFireTimer=0;
  sniperMinigameActive=false; sniperMinigameTargets=[]; sniperMinigameHits=0;
  sniperMinigameDone=false; sniperCurrentTargetDuration=2000; sniperEquipAnim=0;
  playerBombs=[];
  skeletons=[];
  necroStaffActive=false; necroStaffAmmo=0; necroStaffSlot=-1;
  soccerBall=null; soccerBallPending=false; soccerBallPendingSlot=-1;
  specialChargeKills=0; specialReady=false; specialActive=false;
  specialTimer=0; laserActive=false; playerInSpecial=false;
  // Reset glitch fury
  glitchFuryActive=false; glitchFuryCharge=0; glitchFuryReady=false;
  glitchFuryDarkening=false; glitchFuryDarkenAlpha=0; glitchFuryDarkenTimer=0;
  glitchFuryAwaitClick=false; glitchFuryScreamTimer=-1;
  glitchFuryAttackTimer=0; glitchFurySwing=null;
  glitchFuryMessages=[]; glitchFuryMsgTimer=0;
  glitchFuryUsedDungeon=-99;
  glitchEventActive=false; glitchEventClicks=0; glitchEventOverlayAlpha=0;
  glitchEventFadeIn=true; glitchEventGlitchTimer=0; glitchEventTargets=[];
  updateSpecialCardUI();
  if(typeof updateGlitchFuryUI === 'function') updateGlitchFuryUI();
  rollCooldown=false; rollTimer=0;
  gameOver=false; keys={}; particles=[];
  damageNumbers = [];
  slimeSpawnTimer=0; swingActive=false; swingTimer=0;
  arrows=0; quivers=[]; quiverSpawnTimer=0; quiverCount=0; projectiles=[]; bowChargeTimer=0; bowCharging=false;
  blastWave=null; bombHeads=[]; bombSpawnTimer=0;
  katanaSlashes=[]; katanaDrawing=false;
  scytheCombo=0; scytheKills=0; scytheDashAnim=null; scytheSpinAnim=null; scytheSlashAnim=null;
  scytheAmmo=SCYTHE_MAX_AMMO; scytheAmmoTimer=0;
  coins=[]; flyingCoins=[]; gold=0;
  assassinRats=[]; ratSpawnTimer=0; dashTrails=[];
  ghosts=[]; ghostSpawnTimer=0;
  currentDungeon=0; killCount=0; transitioning=false; transitionTimer=0;
  discardCount=0; // reseta descartes
  updateDungeonBounds();
  playerFlyY=H/2; playerFlyAlpha=1; cubeAngle=0;
  hasRevive=true; enemySpawnDelay=3000;
  activeBuffs=new Set(); pendingFamilyNext=null; buffScreenActive=false; manaChargeRate=2500;

  // ── Artefatos de início de partida ──
  // Armadura de Couro
  playerArmorHp = (typeof hasArtifactEffect === 'function' && hasArtifactEffect('leather_armor'))
    ? ((typeof getArtifactUpgradeValue === 'function') ? (getArtifactUpgradeValue('leather_armor') || 1) : 1)
    : 0;
  // Areóla: +1 revive extra
  {
    const hasAureola = typeof hasArtifactEffect === 'function' && hasArtifactEffect('extra_revive');
    const extraRevives = hasAureola ? ((typeof getArtifactUpgradeValue === 'function') ? (getArtifactUpgradeValue('aureola') || 1) : 1) : 0;
    reviveCount = 1 + extraRevives;
  }
  hasRevive = reviveCount > 0;
  // Protorobô-9500
  if(typeof hasArtifactEffect === 'function' && hasArtifactEffect('companion_robot')) {
    const robotSleepDur = (typeof getArtifactUpgradeValue === 'function') ? (getArtifactUpgradeValue('protorobo_9500') || ROBOT_SLEEP_DURATION_BASE) : ROBOT_SLEEP_DURATION_BASE;
    companionRobot = { x: W/2 - 50, y: H/2, fireTimer: 0, sleepTimer: ROBOT_SLEEP_INTERVAL, sleeping: false, wakeTimer: 0, sleepDuration: robotSleepDur };
  } else {
    companionRobot = null;
  }

  const btn=document.getElementById('revive-btn');
  btn.disabled=false; btn.style.opacity='1'; btn.style.cursor='pointer';
  btn.textContent = reviveCount > 1 ? `💚 REVIVER (${reviveCount}x)` : '💚 REVIVER (1 vez)';
  document.getElementById('gold-display').textContent='🪙 0';
  const ghud=document.getElementById('gold-display-hud'); if(ghud) ghud.textContent='🪙 0';

  // Build deck — sistema Clash Royale: 1 cópia de cada carta, fila cíclica
  buildCycleDeck();
  hand=[];
  document.getElementById('gameover').style.display='none';
  document.getElementById('arrows-display').textContent='';
  updateHPDisplay(); buildHand(); updateManaDisplay(); updateEffectDisplay();
  updateDiscardDisplay();
  updateDungeonUI();
  spawnDungeonInitial();
  if(typeof buildArtifactHUD === 'function') buildArtifactHUD();
  window.artifactKillCounter = 0;
  // Garante que as cartas apareçam após todos os callbacks assíncronos
  setTimeout(() => { if(typeof renderHand === 'function') renderHand(); }, 50);
  // Glitch fury: check para novo evento de glitch
  if(typeof onDungeonStartGlitchCheck === 'function') onDungeonStartGlitchCheck();
}

// Spawna FORA da dungeon (além das paredes), em um lado aleatório.
// O inimigo entra andando naturalmente pela IA de chase.
// offset = quantos pixels além da parede o inimigo aparece

function updateDungeonUI(){
  const def=DUNGEON_DEFS[currentDungeon];
  const el=document.getElementById('dungeon-display');
  el.textContent=def.name;
  el.style.color=def.color;
  const fill=document.getElementById('kill-bar-fill');
  const label=document.getElementById('kill-bar-label');
  if(def.killGoal>=9999){
    fill.style.width='100%';
    fill.style.background=def.color;
    label.textContent='∞ sem fim...';
    label.style.color=def.color;
  } else {
    const pct=Math.min(1,killCount/def.killGoal)*100;
    fill.style.width=pct+'%';
    fill.style.background=def.color;
    label.textContent=`${killCount} / ${def.killGoal} inimigos`;
    label.style.color='#555588';
  }
  // Update kill bar color
  const killBarWrap=document.getElementById('kill-bar-wrap');
}

function registerKill(){
  if(transitioning||gameOver) return;
  killCount++;
  Audio.hit();
  // Artifact: caveira de sangue (heal per 30 kills)
  if(typeof onArtifactKill === 'function') onArtifactKill();
  updateDungeonUI();
  // Charge special card
  if(!specialReady && equippedSpecial === 'black_magic'){
    specialChargeKills++;
    if(specialChargeKills >= SPECIAL_CHARGE_GOAL){
      specialChargeKills = SPECIAL_CHARGE_GOAL;
      specialReady = true;
    }
    updateSpecialCardUI();
  }
  const def=DUNGEON_DEFS[currentDungeon];
  if(killCount>=def.killGoal && def.killGoal<9999){
    startDungeonTransition();
  }
}

function startDungeonTransition(){
  transitioning=true;
  transitionTimer=0;
  cubeAngle=0;
  playerFlyY=player.y;
  playerFlyAlpha=1;
  Audio.dungeonClear();
  // Encerra glitch fury ao completar dungeon
  if(glitchFuryActive){
    glitchFuryActive = false;
    glitchFuryMessages = [];
    glitchFurySwing = null;
    if(typeof Audio !== 'undefined' && Audio.stopTrickyMusic) Audio.stopTrickyMusic();
    if(typeof Audio !== 'undefined' && Audio.playMusic) Audio.playMusic();
  }
  // Artifact: coxinha (heal on dungeon complete)
  if(typeof onArtifactDungeonComplete === 'function') onArtifactDungeonComplete();
  slimes=[]; golems=[]; bombHeads=[]; assassinRats=[]; ghosts=[]; projectiles=[]; dashTrails=[];
  blueSlimes=[]; redSlimes=[];
  blastWave=null; coins=[]; flyingCoins=[]; playerBombs=[]; soccerBall=null; soccerBallPending=false;
  paused=false;
}

function finishDungeonTransition(){
  transitioning=false;
  transitionTimer=0;
  if(currentDungeon<DUNGEON_DEFS.length-1) currentDungeon++;
  updateDungeonBounds();
  killCount=0;
  discardCount=0; // reseta descartes para nova dungeon
  updateDiscardDisplay();
  slimeSpawnTimer=0; bombSpawnTimer=0; ratSpawnTimer=0; golemSpawnTimer=0; ghostSpawnTimer=0;
  blueSlimeSpawnTimer=0; redSlimeSpawnTimer=0;
  skeletons=[];
  enemySpawnDelay=3000;
  scytheDashAnim=null; scytheSpinAnim=null; scytheSlashAnim=null;
  player.x=W/2; player.y=H/2; player.rolling=false; player.invincible=600;
  playerFlyY=H/2; playerFlyAlpha=1;
  spawnDungeonInitial();
  updateDungeonUI();
  updateBuffListDisplay();
  // Reconstrói a mão ao entrar na nova dungeon
  buildHand();
  setTimeout(() => { if(typeof renderHand === 'function') renderHand(); }, 50);
  // Glitch fury: check para novo evento de glitch
  if(typeof onDungeonStartGlitchCheck === 'function') onDungeonStartGlitchCheck();
}

function spawnDungeonInitial(){
  // Enemies will spawn after the 3-second delay (enemySpawnDelay)
  // Nothing spawns immediately when entering a dungeon
}

function clampToDungeon(obj){
  // Only clamp objects that are already inside (or touching) the dungeon.
  // Enemies that are still outside can walk in freely.
  const m=obj.size;
  const inside = obj.x > DX-m && obj.x < DX+DUNGEON_SIZE+m &&
                 obj.y > DY-m && obj.y < DY+DUNGEON_SIZE+m;
  if(!inside) return;
  obj.x=Math.max(DX+m,Math.min(DX+DUNGEON_SIZE-m,obj.x));
  obj.y=Math.max(DY+m,Math.min(DY+DUNGEON_SIZE-m,obj.y));
}

function insideDungeon(x,y){return x>DX&&x<DX+DUNGEON_SIZE&&y>DY&&y<DY+DUNGEON_SIZE;}
