// ═══════════════════════════════════════════════════════════════
// MOBILE SUPPORT — Bucket Knight
// ─ Detecção de celular
// ─ Botão FullScreen (topo direito)
// ─ Botão Pause in-game (topo esquerdo)
// ─ Analógico virtual (joystick estilo Brawl Stars)
// ─ Segurar carta para descartar (hold-to-discard)
// ─ Cheat: 5 cliques no dado na loja = +500 moedas
// ═══════════════════════════════════════════════════════════════

// IS_MOBILE é declarado via script inline no index.html (antes dos outros scripts)
// ─── ESTADO DO JOYSTICK ──────────────────────────────────────
const joystick = {
  active: false,
  baseX: 0, baseY: 0,
  stickX: 0, stickY: 0,
  touchId: null,
  dx: 0, dy: 0,
  radius: 55,
  innerRadius: 22,
};

// ─── ESTADO DO HOLD-TO-DISCARD ───────────────────────────────
const holdDiscard = {
  slotIndex: -1,
  timer: null,
  holdDuration: 600, // ms
  progress: 0,
  startTime: 0,
  animFrame: null,
};

// ─── CHEAT DA LOJA (dado) ────────────────────────────────────
let _shopDiceClicks = 0;
let _shopDiceResetTimer = null;

// ═══════════════════════════════════════════════════════════════
// FULLSCREEN
// ═══════════════════════════════════════════════════════════════
function createFullscreenButton() {
  const btn = document.createElement('button');
  btn.id = 'mobile-fullscreen-btn';
  btn.innerHTML = '⛶';
  btn.title = 'FullScreen';
  btn.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 9999;
    width: 44px;
    height: 44px;
    background: rgba(10, 8, 28, 0.85);
    border: 1.5px solid #4444aa;
    border-radius: 10px;
    color: #aaaaff;
    font-size: 22px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    box-shadow: 0 2px 12px rgba(0,0,0,0.7);
    transition: border-color 0.15s, color 0.15s;
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
  `;
  btn.addEventListener('click', toggleFullscreen);
  document.body.appendChild(btn);
  document.addEventListener('fullscreenchange', updateFullscreenIcon);
  document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
  return btn;
}

function toggleFullscreen() {
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }
}

function updateFullscreenIcon() {
  const btn = document.getElementById('mobile-fullscreen-btn');
  if (!btn) return;
  const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
  btn.innerHTML = isFS ? '✕⛶' : '⛶';
  btn.title = isFS ? 'Sair do FullScreen' : 'FullScreen';
}

// ═══════════════════════════════════════════════════════════════
// BOTÃO DE PAUSE IN-GAME
// ═══════════════════════════════════════════════════════════════
function createMobilePauseButton() {
  const btn = document.createElement('button');
  btn.id = 'mobile-pause-btn';
  btn.innerHTML = '⏸';
  btn.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    z-index: 9000;
    width: 44px;
    height: 44px;
    background: rgba(10, 8, 28, 0.85);
    border: 1.5px solid #4444aa;
    border-radius: 10px;
    color: #aaaaff;
    font-size: 20px;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    box-shadow: 0 2px 12px rgba(0,0,0,0.7);
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
  `;
  btn.addEventListener('click', () => {
    if (typeof paused === 'undefined' || typeof gameOver === 'undefined') return;
    if (gameOver || transitioning) return;
    paused = !paused;
    if (paused) {
      if (typeof showPauseScreen === 'function') showPauseScreen();
    } else {
      if (typeof hidePauseScreen === 'function') hidePauseScreen();
    }
  });
  document.body.appendChild(btn);
  return btn;
}

// Mostra/esconde o botão de pause dependendo do estado do jogo
function updateMobilePauseButtonVisibility() {
  const btn = document.getElementById('mobile-pause-btn');
  if (!btn) return;
  const shouldShow = typeof gameStarted !== 'undefined' && gameStarted
    && typeof gameOver !== 'undefined' && !gameOver;
  btn.style.display = shouldShow ? 'flex' : 'none';
}

// ═══════════════════════════════════════════════════════════════
// JOYSTICK VIRTUAL (ANALÓGICO)
// ═══════════════════════════════════════════════════════════════
const joystickCanvas = document.createElement('canvas');
joystickCanvas.id = 'joystick-canvas';
joystickCanvas.style.cssText = `
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 8000;
  pointer-events: none;
  display: none;
`;
document.body.appendChild(joystickCanvas);
const jCtx = joystickCanvas.getContext('2d');

function resizeJoystickCanvas() {
  joystickCanvas.width = window.innerWidth;
  joystickCanvas.height = window.innerHeight;
}
resizeJoystickCanvas();
window.addEventListener('resize', resizeJoystickCanvas);

function drawJoystick() {
  if (!joystick.active) {
    jCtx.clearRect(0, 0, joystickCanvas.width, joystickCanvas.height);
    return;
  }
  jCtx.clearRect(0, 0, joystickCanvas.width, joystickCanvas.height);

  // Base (anel externo)
  jCtx.beginPath();
  jCtx.arc(joystick.baseX, joystick.baseY, joystick.radius, 0, Math.PI * 2);
  jCtx.strokeStyle = 'rgba(150, 150, 255, 0.35)';
  jCtx.lineWidth = 3;
  jCtx.stroke();
  jCtx.fillStyle = 'rgba(20, 15, 50, 0.45)';
  jCtx.fill();

  // Stick (bolinha interna)
  const sx = joystick.baseX + joystick.dx * joystick.radius;
  const sy = joystick.baseY + joystick.dy * joystick.radius;
  const grad = jCtx.createRadialGradient(sx - 4, sy - 4, 2, sx, sy, joystick.innerRadius);
  grad.addColorStop(0, 'rgba(180, 160, 255, 0.95)');
  grad.addColorStop(1, 'rgba(80, 60, 180, 0.75)');
  jCtx.beginPath();
  jCtx.arc(sx, sy, joystick.innerRadius, 0, Math.PI * 2);
  jCtx.fillStyle = grad;
  jCtx.shadowColor = '#8866ff';
  jCtx.shadowBlur = 12;
  jCtx.fill();
  jCtx.shadowBlur = 0;
  // Borda interna
  jCtx.strokeStyle = 'rgba(200, 180, 255, 0.6)';
  jCtx.lineWidth = 1.5;
  jCtx.stroke();
}

// Injeta as direções do joystick nas teclas virtuais
function applyJoystickToPlayer() {
  if (typeof keys === 'undefined') return;
  if (joystick.active) {
    const deadzone = 0.18;
    keys['_joyLeft']  = joystick.dx < -deadzone;
    keys['_joyRight'] = joystick.dx >  deadzone;
    keys['_joyUp']    = joystick.dy < -deadzone;
    keys['_joyDown']  = joystick.dy >  deadzone;
  } else {
    keys['_joyLeft'] = keys['_joyRight'] = keys['_joyUp'] = keys['_joyDown'] = false;
  }
}

function handleJoystickStart(touch) {
  // Só ativa joystick na metade esquerda da tela e abaixo do meio
  if (touch.clientX > window.innerWidth * 0.55) return false;
  joystick.active = true;
  joystick.baseX = touch.clientX;
  joystick.baseY = touch.clientY;
  joystick.stickX = touch.clientX;
  joystick.stickY = touch.clientY;
  joystick.dx = 0;
  joystick.dy = 0;
  joystick.touchId = touch.identifier;
  joystickCanvas.style.display = 'block';
  return true;
}

function handleJoystickMove(touch) {
  const rawDx = touch.clientX - joystick.baseX;
  const rawDy = touch.clientY - joystick.baseY;
  const dist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
  const maxDist = joystick.radius * 0.85;
  if (dist > 0) {
    joystick.dx = (rawDx / dist) * Math.min(dist / maxDist, 1);
    joystick.dy = (rawDy / dist) * Math.min(dist / maxDist, 1);
  } else {
    joystick.dx = 0;
    joystick.dy = 0;
  }
}

function handleJoystickEnd() {
  joystick.active = false;
  joystick.dx = 0;
  joystick.dy = 0;
  joystick.touchId = null;
  jCtx.clearRect(0, 0, joystickCanvas.width, joystickCanvas.height);
  applyJoystickToPlayer();
}

// ─── Touch events para joystick (canvas principal) ───────────
function setupJoystickTouchEvents() {
  const c = document.getElementById('c');
  if (!c) return;

  c.addEventListener('touchstart', (e) => {
    if (typeof gameStarted === 'undefined' || !gameStarted) return;
    if (typeof gameOver !== 'undefined' && gameOver) return;
    if (typeof paused !== 'undefined' && paused) return;
    if (typeof buffScreenActive !== 'undefined' && buffScreenActive) return;
    if (typeof transitioning !== 'undefined' && transitioning) return;

    for (const touch of e.changedTouches) {
      if (!joystick.active) {
        const started = handleJoystickStart(touch);
        if (started) continue;
      }
      // Toque na metade direita: simula clique para ações
      if (touch.clientX > window.innerWidth * 0.45) {
        simulateTouchAction(touch);
      }
    }
    applyJoystickToPlayer();
    drawJoystick();
  }, { passive: true });

  c.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (touch.identifier === joystick.touchId) {
        handleJoystickMove(touch);
      }
    }
    applyJoystickToPlayer();
    drawJoystick();
  }, { passive: false });

  c.addEventListener('touchend', (e) => {
    for (const touch of e.changedTouches) {
      if (touch.identifier === joystick.touchId) {
        handleJoystickEnd();
      }
    }
    applyJoystickToPlayer();
    drawJoystick();
  }, { passive: true });

  c.addEventListener('touchcancel', (e) => {
    handleJoystickEnd();
  }, { passive: true });
}

// Simula clique/ação do mouse no lado direito da tela (ataques)
function simulateTouchAction(touch) {
  mouseX = touch.clientX;
  mouseY = touch.clientY;
  if (typeof activeEffect === 'undefined') return;
  if (activeEffect === 'sword' && typeof doSwordSwing === 'function') doSwordSwing();
  else if (activeEffect === 'scythe' && typeof doScytheAttack === 'function') doScytheAttack();
  else if (activeEffect === 'axe') { /* machado é automático */ }
  else if (activeEffect === 'pistol' && typeof shootPistol === 'function') shootPistol();
  else if (glitchFuryActive && typeof doGlitchFuryAttack === 'function') doGlitchFuryAttack();
  else if (activeEffect === 'bow') {
    bowCharging = true;
    bowChargeTimer = 0;
  }
}

// ─── Patch no update do player para aceitar joystick ─────────
// Sobrescreve a leitura de teclas no gameloop para incluir joy
const _origUpdate = typeof update !== 'undefined' ? update : null;

// Patch via proxy nas keys — adiciona aliases para o joystick
function patchKeysForJoystick() {
  if (typeof keys === 'undefined') { setTimeout(patchKeysForJoystick, 200); return; }
  // Usamos Proxy para interceptar leituras de keys
  // Como keys é um objeto simples, o patch direto via _joy* é suficiente
  // O gameloop lê: keys['ArrowLeft']||keys['a']||keys['A']
  // Adicionamos: keys['_joyLeft'] etc. — mas o gameloop não lê _joy*
  // Então vamos fazer um setInterval que copia os valores joy para as keys reais
  setInterval(() => {
    if (!joystick.active) return;
    if (typeof keys === 'undefined') return;
    const deadzone = 0.18;
    // Evitamos sobrescrever se o jogador também estiver usando teclado
    if (joystick.dx < -deadzone) { keys['ArrowLeft'] = true; keys['a'] = true; }
    else { if (keys['a'] === true && !keys['ArrowLeft_real']) { keys['ArrowLeft'] = false; keys['a'] = false; } }
    if (joystick.dx > deadzone)  { keys['ArrowRight'] = true; keys['d'] = true; }
    else { if (keys['d'] === true && !keys['ArrowRight_real']) { keys['ArrowRight'] = false; keys['d'] = false; } }
    if (joystick.dy < -deadzone) { keys['ArrowUp'] = true; keys['w'] = true; }
    else { if (keys['w'] === true && !keys['ArrowUp_real']) { keys['ArrowUp'] = false; keys['w'] = false; } }
    if (joystick.dy > deadzone)  { keys['ArrowDown'] = true; keys['s'] = true; }
    else { if (keys['s'] === true && !keys['ArrowDown_real']) { keys['ArrowDown'] = false; keys['s'] = false; } }
  }, 16);
}

// Garante que ao soltar o joystick as teclas sejam limpas
function clearJoystickKeys() {
  if (typeof keys === 'undefined') return;
  // Só limpa se não tiver teclado físico pressionado
  keys['ArrowLeft'] = false; keys['a'] = false;
  keys['ArrowRight'] = false; keys['d'] = false;
  keys['ArrowUp'] = false; keys['w'] = false;
  keys['ArrowDown'] = false; keys['s'] = false;
}

// ═══════════════════════════════════════════════════════════════
// HOLD-TO-DISCARD (segurar para descartar)
// ═══════════════════════════════════════════════════════════════

// Barra de progresso visual sobre a carta
let holdDiscardOverlay = null;

function createHoldDiscardOverlay() {
  holdDiscardOverlay = document.createElement('div');
  holdDiscardOverlay.id = 'hold-discard-overlay';
  holdDiscardOverlay.style.cssText = `
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 4px;
    background: #ff4444;
    border-radius: 0 0 6px 6px;
    transform-origin: left;
    transform: scaleX(0);
    transition: none;
    pointer-events: none;
    z-index: 10;
  `;
  return holdDiscardOverlay;
}

function setupHoldToDiscard() {
  // Observa o DOM para cards e adiciona touch hold
  // Usamos MutationObserver para capturar quando as cartas são renderizadas
  const area = document.getElementById('cards-area');
  if (!area) { setTimeout(setupHoldToDiscard, 300); return; }

  function attachHoldListeners(cardEl, slotIndex) {
    let holdTimer = null;
    let holdStart = 0;
    let animFrame = null;
    let overlay = null;

    function startHold(e) {
      // Não inicia hold se for toque de ataque (metade direita tem cards no HUD baixo)
      if (typeof gameOver !== 'undefined' && gameOver) return;
      if (typeof paused !== 'undefined' && paused) return;
      holdStart = Date.now();

      // Cria overlay de progresso
      overlay = createHoldDiscardOverlay();
      cardEl.style.position = 'relative';
      cardEl.appendChild(overlay);

      function animate() {
        const elapsed = Date.now() - holdStart;
        const pct = Math.min(elapsed / holdDiscard.holdDuration, 1);
        if (overlay) overlay.style.transform = `scaleX(${pct})`;
        if (pct < 1) {
          animFrame = requestAnimationFrame(animate);
        }
      }
      animFrame = requestAnimationFrame(animate);

      holdTimer = setTimeout(() => {
        // Executa descarte
        if (typeof discardCard === 'function') {
          discardCard(slotIndex);
        }
        cleanup();
      }, holdDiscard.holdDuration);

      // Previne scroll ao segurar carta
      e.preventDefault();
    }

    function cancelHold() {
      clearTimeout(holdTimer);
      cancelAnimationFrame(animFrame);
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      overlay = null;
    }

    function cleanup() {
      cancelHold();
    }

    cardEl.addEventListener('touchstart', startHold, { passive: false });
    cardEl.addEventListener('touchend', cancelHold, { passive: true });
    cardEl.addEventListener('touchcancel', cancelHold, { passive: true });
    cardEl.addEventListener('touchmove', (e) => {
      // Cancela se mover muito
      cancelHold();
    }, { passive: true });
  }

  // Observer para reattach quando as cartas mudam
  const observer = new MutationObserver(() => {
    const cards = area.querySelectorAll('.card');
    cards.forEach((card, i) => {
      if (!card._holdAttached) {
        card._holdAttached = true;
        attachHoldListeners(card, i);
      }
    });
  });
  observer.observe(area, { childList: true, subtree: true });
}

// ═══════════════════════════════════════════════════════════════
// CHEAT DA LOJA: 5 cliques no dado = +500 moedas
// ═══════════════════════════════════════════════════════════════
function setupShopDiceCheat() {
  // Observa quando a loja abre para injetar o listener no dado
  const observer = new MutationObserver(() => {
    const shopGrid = document.getElementById('shop-grid');
    if (!shopGrid) return;
    const cards = shopGrid.querySelectorAll('.shop-card');
    cards.forEach(card => {
      // Procura o card com ícone de dado 🎲
      if (card.textContent.includes('🎲') && !card._diceCheatAttached) {
        card._diceCheatAttached = true;
        card.addEventListener('click', onDiceCardClick, true);
        // Touch também
        card.addEventListener('touchend', onDiceCardClick, { capture: true, passive: true });
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function onDiceCardClick(e) {
  _shopDiceClicks++;
  clearTimeout(_shopDiceResetTimer);
  _shopDiceResetTimer = setTimeout(() => { _shopDiceClicks = 0; }, 2500);

  if (_shopDiceClicks >= 5) {
    _shopDiceClicks = 0;
    // Adiciona 500 moedas
    if (typeof persistentGold !== 'undefined') {
      persistentGold += 500;
      if (typeof writeSave === 'function') writeSave();
      if (typeof renderShopScreen === 'function') renderShopScreen();
      // Flash visual
      showShopCheatFeedback();
    }
  }
}

function showShopCheatFeedback() {
  const msg = document.createElement('div');
  msg.textContent = '🎲 +500 🪙 CHEAT!';
  msg.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(10, 30, 10, 0.95);
    border: 2px solid #44ff88;
    color: #44ff88;
    font-family: 'Courier New', monospace;
    font-size: 22px;
    font-weight: bold;
    letter-spacing: 3px;
    padding: 18px 36px;
    border-radius: 10px;
    z-index: 99999;
    pointer-events: none;
    text-shadow: 0 0 16px #44ff88;
    box-shadow: 0 0 30px rgba(68, 255, 136, 0.4);
    animation: cheatFadeOut 1.5s ease forwards;
  `;
  document.body.appendChild(msg);
  setTimeout(() => { if (msg.parentNode) msg.parentNode.removeChild(msg); }, 1600);

  // Adiciona a animação CSS se não existir
  if (!document.getElementById('cheat-anim-style')) {
    const style = document.createElement('style');
    style.id = 'cheat-anim-style';
    style.textContent = `
      @keyframes cheatFadeOut {
        0%   { opacity: 1; transform: translate(-50%, -55%) scale(1.1); }
        70%  { opacity: 1; transform: translate(-50%, -60%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -70%) scale(0.9); }
      }
    `;
    document.head.appendChild(style);
  }
}

// ═══════════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════
function initMobile() {
  if (!IS_MOBILE) {
    setupShopDiceCheat();
    return;
  }

  // Mobile: todas as features
  console.log('[Mobile] Modo mobile detectado — ativando suporte touch');

  // Metadados para evitar zoom indesejado
  const viewport = document.querySelector('meta[name=viewport]');
  if (viewport) {
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  }

  // Botão de pause
  createMobilePauseButton();

  // Joystick
  setupJoystickTouchEvents();
  patchKeysForJoystick();

  // Hold-to-discard
  setupHoldToDiscard();

  // Cheat da loja
  setupShopDiceCheat();

  // Atualiza visibilidade do botão de pause periodicamente
  setInterval(updateMobilePauseButtonVisibility, 500);

  // Estilo extra: aumenta área de toque das cartas
  const style = document.createElement('style');
  style.id = 'mobile-extra-styles';
  style.textContent = `
    /* Mobile: cartas maiores e mais acessíveis */
    @media (max-width: 768px), (pointer: coarse) {
      .card {
        min-width: 62px !important;
        min-height: 90px !important;
        font-size: 11px !important;
        touch-action: none;
      }
      .card-icon { font-size: 26px !important; }
      #hud-cards-row { gap: 6px !important; }
      /* Hint de descarte adaptado para mobile */
      .card-discard-hint::after { content: ' (segure)'; }
      .card-discard-hint { font-size: 8px !important; }

      /* Aumenta botões de menu */
      .menu-btn { min-height: 50px !important; font-size: 15px !important; }

      /* Impede double-tap zoom no canvas */
      #c { touch-action: none; }
    }
  `;
  document.head.appendChild(style);

  // Trata o evento de joystickEnd para limpar teclas
  document.getElementById('c')?.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) {
      // Nenhum toque ativo — garante que joystick está limpo
      if (!joystick.active) clearJoystickKeys();
    }
  }, { passive: true });
}

// Aguarda o DOM estar pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobile);
} else {
  initMobile();
}
