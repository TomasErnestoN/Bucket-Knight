// ═══════════════════════════════════════════════════════════════
// ESTADO GLOBAL DO JOGO
// Todas as variáveis mutáveis que os módulos compartilham
// ═══════════════════════════════════════════════════════════════

// ─── PLAYER ───────────────────────────────────────────────────
let player = null;
let playerArmorHp = 0;
let playerFlyY = 0, playerFlyAlpha = 1;
let playerSavedPos = {x:0, y:0};
let playerInSpecial = false;

// ─── INIMIGOS ─────────────────────────────────────────────────
let slimes = [];
let blueSlimes = [], blueSlimeSpawnTimer = 0;
let redSlimes = [], redSlimeSpawnTimer = 0;
let golems = [], golemSpawnTimer = 0;
let assassinRats = [], ratSpawnTimer = 0;
let ghosts = [], ghostSpawnTimer = 0;
let bombHeads = [], bombSpawnTimer = 0;
let skeletons = [];
let enemySpawnDelay = 0;

// ─── DUNGEON ──────────────────────────────────────────────────
let currentDungeon = 0;
let killCount = 0;
let transitioning = false;
let transitionTimer = 0;
let cubeAngle = 0, cubeTargetAngle = 0;

// ─── MANA ─────────────────────────────────────────────────────
let mana = 5;
let maxMana = 6;
let manaTimer = 0;
let manaChargeRate = 2500;

// ─── CARTAS ───────────────────────────────────────────────────
let deck = [];
let hand = [];
let activeEffect = null;
let activeEffectSlot = -1;
let effectTimer = 0;
let discardCount = 0;

// ─── ARCO ─────────────────────────────────────────────────────
let arrows = 0;
let quivers = [], quiverSpawnTimer = 0, quiverCount = 0;
let projectiles = [];
let bowChargeTimer = 0;
let bowCharging = false;

// ─── PISTOLA ──────────────────────────────────────────────────
let pistolActive = false;
let pistolAmmo = 0;
let pistolSlot = -1;
let pistolFireTimer = 0;

// ── SNIPER NO SCOPE ──
let sniperActive = false;
let sniperAmmo = 0;
let sniperSlot = -1;
let sniperFireTimer = 0;
let sniperFireRate = 60;
let sniperMinigameActive = false;
let sniperMinigameTargets = [];
let sniperMinigameHits = 0;
let sniperMinigameDone = false;
let sniperCurrentTargetDuration = 2000;
let sniperSpinAngle = 0;
let sniperEquipAnim = 0;

// ─── MACHADO ──────────────────────────────────────────────────
let axeAngle = 0;
let axeWhooshTimer = 0;

// ─── KATANA ───────────────────────────────────────────────────
let katanaSlashes = [];
let katanaDrawing = false;
let katanaLastX = 0, katanaLastY = 0;

// ─── FOICE ────────────────────────────────────────────────────
let scytheCombo = 0;
let scytheKills = 0;
let scytheDashAnim = null;
let scytheSpinAnim = null;
let scytheSlashAnim = null;
let scytheAmmo = 4; // SCYTHE_MAX_AMMO — redeclarado depois que constants.js carrega
let scytheAmmoTimer = 0;

// ─── POÇÃO / BOMBINHAS ────────────────────────────────────────
let potionActive = false;
let potionTimer = 0;
let bombinhasActive = false;
let bombAmmo = 0;

// ─── BOMBAS ───────────────────────────────────────────────────
let playerBombs = [];

// ─── BOLA DE FUTEBOL ──────────────────────────────────────────
let soccerBall = null;
let soccerBallPending = false;
let soccerBallPendingSlot = -1;
let _ballRot = 0;

// ─── CAJADO NECRO ─────────────────────────────────────────────
let necroStaffActive = false;
let necroStaffAmmo = 0;
let necroStaffSlot = -1;

// ─── CARTA ESPECIAL (MAGIA NEGRA) ─────────────────────────────
let specialChargeKills = 0;
let specialReady = false;
let specialActive = false;
let specialTimer = 0;
let laserActive = false;

// ─── DADOS ────────────────────────────────────────────────────
let diceRollAnim = null;
let diceResultTexts = [];

// ─── ROBÔ COMPANHEIRO ─────────────────────────────────────────
let companionRobot = null;
const ROBOT_SLEEP_INTERVAL = 10000;
const ROBOT_SLEEP_DURATION_BASE = 5000;

// ─── BUFFS ────────────────────────────────────────────────────
let activeBuffs = new Set();
let pendingFamilyNext = null;
let buffScreenActive = false;
let buffPicksRemaining = 0;

// ─── FÍSICA / ROLAGEM ─────────────────────────────────────────
let rollCooldown = false;
let rollTimer = 0;
let ROLL_COOLDOWN_OVERRIDE = null;
let swingTimer = 0;
let swingActive = false;
let mouseX = 0, mouseY = 0;
let mouseButtonDown = false;

// ─── PARTÍCULAS / FX ──────────────────────────────────────────
let particles = [];
let damageNumbers = [];
let dashTrails = [];
let blastWave = null;

// ─── MOEDAS ───────────────────────────────────────────────────
let coins = [], flyingCoins = [], gold = 0;

// ─── GAME STATE ───────────────────────────────────────────────
let gameOver = false;
let keys = {};
let paused = false;
let lastTime = 0;
let gameLoopStarted = false;
let slimeSpawnTimer = 0;

// ─── REVIVE ───────────────────────────────────────────────────
let hasRevive = true;
let reviveCount = 1;

// ─── JACKPOT ──────────────────────────────────────────────────
let jackpotAuraTimer = 0; // ms restantes da aura verde do jackpot

// ─── MISC ─────────────────────────────────────────────────────
let secondaryEffectEl = null;
let currentEquippedDeck = [];

// ─── GLITCH FURY ──────────────────────────────────────────────
let glitchFuryActive = false;          // Efeito de fury ativo durante a dungeon
let glitchFuryCharge = 0;             // 0-3 glitches coletados
let glitchFuryReady = false;          // Carta pronta para uso
let glitchFuryDarkening = false;      // Fase de escurecimento ao ativar
let glitchFuryDarkenAlpha = 0;        // 0..1
let glitchFuryDarkenTimer = 0;        // ms
let glitchFuryAwaitClick = false;     // aguardando clique para começar
let glitchFuryScreamTimer = -1;       // timer para grito (-1 = inativo)
let glitchFuryAttackTimer = 0;        // cooldown entre ataques com a placa
let glitchFurySwing = null;           // animação de ataque atual {x,y,t,maxT}
let glitchFurySwingDir = 1;
let cameraShake = 0;        // intensidade atual do shake (decai com o tempo)
let cameraShakeX = 0, cameraShakeY = 0; // offset atual do frame           // +1 direita, -1 esquerda (alterna a cada ataque)
let glitchFuryCombo = 0;              // contador de ataques consecutivos
let glitchFuryShockwaves = [];        // ondas de choque {x,y,t,maxT,r}
let glitchFurySlashes = [];           // rastros de slash {points,t,maxT,color}
let glitchFuryFragments = [];         // fragmentos voando {x,y,vx,vy,t,maxT,color,size}
let glitchFuryTrail    = [];          // rastro vermelho quando fury ativo {x,y,a,life,maxLife}
let glitchFuryBlood    = [];          // partículas de sangue no chão {x,y,r,angle,alpha,life,maxLife,settled,vx,vy}
let glitchFuryScars    = [];          // rasgos pretos no chão {cx,cy,R,a0,a1,isFinisher}
let glitchFuryMessages = [];          // mensagens glitchando na tela
let glitchFuryMsgTimer = 0;           // timer para próxima mensagem
let glitchFuryMsgInterval = 5000;     // ms entre mensagens
let glitchFuryUsedDungeon = -99;      // dungeon onde fury foi usado
let glitchEventDungeon = -99;         // dungeon onde o glitch vai aparecer
let glitchEventActive = false;        // overlay do glitch pre-dungeon ativo
let glitchEventClicks = 0;            // cliques no glitch
let glitchEventOverlayAlpha = 0;      // fade do overlay
let glitchEventFadeIn = true;
let glitchEventGlitchTimer = 0;       // efeito glitch visual no overlay
let glitchEventTargets = [];          // alvos clicáveis espalhados na tela
let glitchEventTotal = 7;             // total de glitches a clicar
