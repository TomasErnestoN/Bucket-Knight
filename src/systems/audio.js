
function getDungeonSizeForIndex(idx){
  const def = DUNGEON_DEFS[idx];
  if(!def) return Math.min(W,H)*0.55;
  const base = Math.min(W,H);
  if(def.theme==='blue')  return base * 0.55;
  if(def.theme==='green') return base * 0.68;
  if(def.theme==='red')   return base * 0.80;
  if(def.theme==='black') return base * 0.88;
  return base * 0.55;
}

function updateDungeonBounds(){
  DUNGEON_SIZE = getDungeonSizeForIndex(currentDungeon);
  DX = W/2 - DUNGEON_SIZE/2;
  DY = H/2 - DUNGEON_SIZE/2 - 30;
}

// ═══════════════════════════════════════════════════════════════
// MOTOR DE ÁUDIO (Web Audio API — sem arquivos externos)
// ═══════════════════════════════════════════════════════════════
const Audio = (() => {
  let ctx = null;
  let masterGain = null;
  let muted = false;
  let masterVol = 0.5;

  // ── MÚSICA DE DUNGEON ────────────────────────────────────────
  let _musicBuffer = null;
  let _musicRawBuffer = null;
  let _musicSource = null;
  let _musicGain = null;
  let _musicFilter = null;
  let _musicLoaded = false;
  let _musicPlaying = false;
  let _playPending = false;
  let _musicOffset = 0;        // posição em segundos onde a música pausou
  let _musicStartedAt = 0;     // ctx.currentTime quando o source foi iniciado

  function _loadMusic() {
    if (_musicLoaded) return;
    _musicLoaded = true;
    fetch('./assets/audio/dungeon_music.ogg')
      .then(r => r.arrayBuffer())
      .then(buf => {
        _musicRawBuffer = buf;
        if (ctx) {
          ctx.decodeAudioData(buf.slice(0), decoded => {
            _musicBuffer = decoded;
            if (_playPending) { _playPending = false; playMusic(); }
          });
        }
      })
      .catch(() => {});
  }

  function _decodeWhenReady() {
    if (!_musicRawBuffer || _musicBuffer) return;
    ctx.decodeAudioData(_musicRawBuffer.slice(0), decoded => {
      _musicBuffer = decoded;
      if (_playPending) { _playPending = false; playMusic(); }
    });
  }

  function _ensureMusicNodes() {
    if (_musicFilter) return;
    _musicFilter = ctx.createBiquadFilter();
    _musicFilter.type = 'lowpass';
    _musicFilter.frequency.value = 20000;
    _musicGain = ctx.createGain();
    _musicGain.gain.value = 0;
    _musicGain.connect(_musicFilter);
    _musicFilter.connect(masterGain);
  }

  function playMusic(offset, options) {
    if (!_musicBuffer) { _playPending = true; return; }
    if (!ctx || _musicPlaying) return;
    _ensureMusicNodes();
    const startOffset = offset || 0;
    _musicSource = ctx.createBufferSource();
    _musicSource.buffer = _musicBuffer;
    _musicSource.loop = true;
    _musicSource.connect(_musicGain);
    _musicSource.start(0, startOffset % _musicBuffer.duration);
    _musicStartedAt = ctx.currentTime - startOffset;
    _musicPlaying = true;
    const t = ctx.currentTime;
    _musicGain.gain.cancelScheduledValues(t);
    _musicGain.gain.setValueAtTime(0, t);
    _musicGain.gain.linearRampToValueAtTime(muted ? 0 : 0.55, t + (options && options.fadeIn ? options.fadeIn : 1.5));
    _musicFilter.frequency.cancelScheduledValues(t);
    _musicFilter.frequency.setValueAtTime(20000, t);
  }

  function stopMusic(saveOffset) {
    _playPending = false;
    if (_musicSource) {
      if (saveOffset) _musicOffset = (ctx.currentTime - _musicStartedAt) % (_musicBuffer ? _musicBuffer.duration : 1);
      else _musicOffset = 0;
      try { _musicSource.stop(); } catch(e) {}
      _musicSource = null;
    }
    _musicPlaying = false;
  }

  function pauseMusic() {
    if (!_musicFilter || !_musicGain || !_musicPlaying) return;
    const t = ctx.currentTime;
    _musicFilter.frequency.cancelScheduledValues(t);
    _musicFilter.frequency.setValueAtTime(_musicFilter.frequency.value, t);
    _musicFilter.frequency.linearRampToValueAtTime(400, t + 0.4);
    _musicGain.gain.cancelScheduledValues(t);
    _musicGain.gain.setValueAtTime(_musicGain.gain.value, t);
    _musicGain.gain.linearRampToValueAtTime(0.25, t + 0.4);
  }

  function resumeMusic() {
    if (!_musicFilter || !_musicGain || !_musicPlaying) return;
    const t = ctx.currentTime;
    _musicFilter.frequency.cancelScheduledValues(t);
    _musicFilter.frequency.setValueAtTime(_musicFilter.frequency.value, t);
    _musicFilter.frequency.linearRampToValueAtTime(20000, t + 0.3);
    _musicGain.gain.cancelScheduledValues(t);
    _musicGain.gain.setValueAtTime(_musicGain.gain.value, t);
    _musicGain.gain.linearRampToValueAtTime(muted ? 0 : 0.55, t + 0.3);
  }

  function setMusicMuted(m) {
    if (!_musicGain || !_musicPlaying) return;
    const t = ctx.currentTime;
    _musicGain.gain.cancelScheduledValues(t);
    _musicGain.gain.setValueAtTime(_musicGain.gain.value, t);
    _musicGain.gain.linearRampToValueAtTime(m ? 0 : 0.55, t + 0.2);
  }

  // ── MÚSICA DE JACKPOT ────────────────────────────────────────
  let _jackpotBuffer = null;
  let _jackpotRawBuffer = null;
  let _jackpotLoaded = false;
  let _jackpotSource = null;
  let _jackpotGain = null;
  let _jackpotFadeTimer = null;

  function _loadJackpot() {
    if (_jackpotLoaded) return;
    _jackpotLoaded = true;
    fetch('./assets/audio/jackpot.ogg')
      .then(r => r.arrayBuffer())
      .then(buf => {
        _jackpotRawBuffer = buf;
        if (ctx) ctx.decodeAudioData(buf.slice(0), decoded => { _jackpotBuffer = decoded; });
      })
      .catch(() => {});
  }

  function _decodeJackpotWhenReady() {
    if (!_jackpotRawBuffer || _jackpotBuffer) return;
    ctx.decodeAudioData(_jackpotRawBuffer.slice(0), decoded => { _jackpotBuffer = decoded; });
  }

  // Toca a música de jackpot.
  // - A música tema para (salvando posição) e fica silenciosa
  // - Jackpot toca por completo (15s aprox)
  // - Fade out começa nos 10s (quando o efeito acaba)
  // - Quando jackpot terminar, música tema volta de onde parou
  function playJackpotMusic() {
    if (!ctx || !_jackpotBuffer) return;

    // Para a música tema salvando a posição
    stopMusic(true);

    // Cria nó de gain para o jackpot
    if (!_jackpotGain) {
      _jackpotGain = ctx.createGain();
      _jackpotGain.connect(masterGain);
    }
    _jackpotGain.gain.cancelScheduledValues(ctx.currentTime);
    _jackpotGain.gain.setValueAtTime(muted ? 0 : 0.75, ctx.currentTime);

    // Para source anterior se houver
    if (_jackpotSource) { try { _jackpotSource.stop(); } catch(e) {} }

    _jackpotSource = ctx.createBufferSource();
    _jackpotSource.buffer = _jackpotBuffer;
    _jackpotSource.loop = false;
    _jackpotSource.connect(_jackpotGain);
    _jackpotSource.start(0);

    // Limpa timer anterior
    if (_jackpotFadeTimer) clearTimeout(_jackpotFadeTimer);

    // Aos 10s começa o fade out (efeito acabou)
    _jackpotFadeTimer = setTimeout(() => {
      if (!_jackpotGain) return;
      const t = ctx.currentTime;
      _jackpotGain.gain.cancelScheduledValues(t);
      _jackpotGain.gain.setValueAtTime(_jackpotGain.gain.value, t);
      _jackpotGain.gain.linearRampToValueAtTime(0, t + 5); // fade de 5s (10s→15s)
    }, 10000);

    // Quando a música acabar (~15s), volta a música tema de onde parou
    _jackpotSource.onended = () => {
      _jackpotSource = null;
      if (_jackpotFadeTimer) { clearTimeout(_jackpotFadeTimer); _jackpotFadeTimer = null; }
      // Volta música tema do ponto salvo (usa playDungeonMusic se já definido)
      if (typeof playDungeonMusic === 'function') playDungeonMusic(_currentTheme);
      else playMusic(_musicOffset);
    };
  }
  // ─────────────────────────────────────────────────────────────

  // ── MÚSICA DE LOJA / ARTEFATOS ───────────────────────────────
  let _shopBuffer = null;
  let _shopRawBuffer = null;
  let _shopSource = null;
  let _shopGain = null;
  let _shopLoaded = false;
  let _shopPlaying = false;
  let _shopPlayPending = false;
  let _shopKilled = false;
  let _shopOffset = 0;
  let _shopStartedAt = 0;

  function _loadShopMusic() {
    if (_shopLoaded) return;
    _shopLoaded = true;
    fetch('./assets/audio/shop_music.ogg')
      .then(r => r.arrayBuffer())
      .then(buf => {
        _shopRawBuffer = buf;
        if (ctx) {
          ctx.decodeAudioData(buf.slice(0), decoded => {
            _shopBuffer = decoded;
            if (_shopPlayPending && !_shopKilled) { _shopPlayPending = false; playShopMusic(); }
            else { _shopPlayPending = false; }
          });
        }
      })
      .catch(() => {});
  }

  function _decodeShopWhenReady() {
    if (!_shopRawBuffer || _shopBuffer) return;
    ctx.decodeAudioData(_shopRawBuffer.slice(0), decoded => {
      _shopBuffer = decoded;
      if (_shopPlayPending && !_shopKilled) { _shopPlayPending = false; playShopMusic(); }
      else { _shopPlayPending = false; }
    });
  }

  function playShopMusic() {
    _shopKilled = false;
    if (!_shopBuffer) { _shopPlayPending = true; return; }
    if (!ctx || _shopPlaying) return;
    if (!_shopGain) {
      _shopGain = ctx.createGain();
      _shopGain.gain.value = 0;
      _shopGain.connect(masterGain);
    }
    _shopSource = ctx.createBufferSource();
    _shopSource.buffer = _shopBuffer;
    _shopSource.loop = true;
    _shopSource.connect(_shopGain);
    const startOffset = _shopOffset % _shopBuffer.duration;
    _shopSource.start(0, startOffset);
    _shopStartedAt = ctx.currentTime - startOffset;
    _shopPlaying = true;
    const t = ctx.currentTime;
    _shopGain.gain.cancelScheduledValues(t);
    _shopGain.gain.setValueAtTime(0, t);
    _shopGain.gain.linearRampToValueAtTime(muted ? 0 : 0.55, t + 1.0);
  }

  function stopShopMusic() {
    _shopPlayPending = false;
    _shopKilled = true;
    if (_shopSource) {
      if (_shopPlaying && _shopBuffer) {
        _shopOffset = (ctx.currentTime - _shopStartedAt) % _shopBuffer.duration;
      }
      if (_shopGain) {
        const t = ctx ? ctx.currentTime : 0;
        _shopGain.gain.cancelScheduledValues(t);
        _shopGain.gain.setValueAtTime(0, t);
      }
      try { _shopSource.disconnect(); } catch(e) {}
      try { _shopSource.stop(); } catch(e) {}
      _shopSource = null;
    }
    _shopPlaying = false;
  }
  // ─────────────────────────────────────────────────────────────

  // ── MÚSICAS DE DUNGEON POR TEMA ───────────────────────────────
  // Fábrica para criar um sistema de música idêntico ao principal,
  // mas apontando para um arquivo diferente.
  function _makeDungeonMusicSystem(file) {
    let buf = null, rawBuf = null, src = null, gainNode = null;
    let loaded = false, playing = false, pending = false;
    let offset = 0, startedAt = 0;

    function _load() {
      if (loaded) return;
      loaded = true;
      fetch(file)
        .then(r => r.arrayBuffer())
        .then(ab => {
          rawBuf = ab;
          if (ctx) ctx.decodeAudioData(ab.slice(0), d => { buf = d; if (pending) { pending = false; play(); } });
        })
        .catch(() => {});
    }

    function _decodeWhenReady() {
      if (!rawBuf || buf) return;
      ctx.decodeAudioData(rawBuf.slice(0), d => { buf = d; if (pending) { pending = false; play(); } });
    }

    function play(fromOffset) {
      if (!buf) { pending = true; return; }
      if (!ctx || playing) return;
      if (!gainNode) {
        gainNode = ctx.createGain();
        gainNode.gain.value = 0;
        gainNode.connect(masterGain);
      }
      src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(gainNode);
      const startOff = (fromOffset !== undefined ? fromOffset : offset) % buf.duration;
      src.start(0, startOff);
      startedAt = ctx.currentTime - startOff;
      playing = true;
      const t = ctx.currentTime;
      gainNode.gain.cancelScheduledValues(t);
      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(muted ? 0 : 0.55, t + 1.5);
    }

    function stop(saveOff) {
      pending = false;
      if (src) {
        if (saveOff && playing && buf) offset = (ctx.currentTime - startedAt) % buf.duration;
        else if (!saveOff) offset = 0;
        if (gainNode) {
          const t = ctx ? ctx.currentTime : 0;
          gainNode.gain.cancelScheduledValues(t);
          gainNode.gain.setValueAtTime(0, t);
        }
        try { src.disconnect(); } catch(e) {}
        try { src.stop(); } catch(e) {}
        src = null;
      }
      playing = false;
    }

    function pause() {
      if (!gainNode || !playing) return;
      const t = ctx.currentTime;
      gainNode.gain.cancelScheduledValues(t);
      gainNode.gain.setValueAtTime(gainNode.gain.value, t);
      gainNode.gain.linearRampToValueAtTime(0.25, t + 0.4);
    }

    function resume() {
      if (!gainNode || !playing) return;
      const t = ctx.currentTime;
      gainNode.gain.cancelScheduledValues(t);
      gainNode.gain.setValueAtTime(gainNode.gain.value, t);
      gainNode.gain.linearRampToValueAtTime(muted ? 0 : 0.55, t + 0.3);
    }

    function isPlaying() { return playing; }

    _load();
    return { play, stop, pause, resume, isPlaying, _decodeWhenReady };
  }

  const _greenMusic = _makeDungeonMusicSystem('./assets/audio/green_dungeon_music.ogg');
  const _redMusic   = _makeDungeonMusicSystem('./assets/audio/red_dungeon_music.ogg');
  const _blackMusic = _makeDungeonMusicSystem('./assets/audio/black_dungeon_music.ogg');

  // Qual sistema de música está tocando agora (blue = o principal _musicSource)
  let _currentTheme = 'blue';

  function _getThemeSystem(theme) {
    if (theme === 'green') return _greenMusic;
    if (theme === 'red')   return _redMusic;
    if (theme === 'black') return _blackMusic;
    return null; // blue usa o sistema principal
  }

  // Para todos os sistemas de dungeon (exceto jackpot/lobby/shop)
  function _stopAllDungeonMusic(saveOff) {
    stopMusic(saveOff);
    _greenMusic.stop(saveOff);
    _redMusic.stop(saveOff);
    _blackMusic.stop(saveOff);
  }

  // Toca a música do tema correto, parando as outras
  function playDungeonMusic(theme) {
    theme = theme || 'blue';
    _currentTheme = theme;
    const sys = _getThemeSystem(theme);
    if (sys) {
      // Para o sistema principal (blue) e os outros temas
      stopMusic(false);
      _greenMusic.stop(theme !== 'green');
      _redMusic.stop(theme !== 'red');
      _blackMusic.stop(theme !== 'black');
      sys.play();
    } else {
      // blue: usa sistema principal
      _greenMusic.stop(false);
      _redMusic.stop(false);
      _blackMusic.stop(false);
      playMusic(0);
    }
  }

  function pauseDungeonMusic() {
    const sys = _getThemeSystem(_currentTheme);
    if (sys) sys.pause(); else pauseMusic();
  }

  function resumeDungeonMusic() {
    const sys = _getThemeSystem(_currentTheme);
    if (sys) sys.resume(); else resumeMusic();
  }

  function stopDungeonMusic(saveOff) {
    const sys = _getThemeSystem(_currentTheme);
    if (sys) sys.stop(saveOff); else stopMusic(saveOff);
  }

  // ── MÚSICA DE BUFF / SELECT ───────────────────────────────────
  const _buffMusic = _makeDungeonMusicSystem('./assets/audio/buff_music.ogg');

  function playBuffMusic() { _buffMusic.play(0); }
  function stopBuffMusic()  { _buffMusic.stop(false); }
  // ─────────────────────────────────────────────────────────────

  // ── MÚSICA DE LOBBY ──────────────────────────────────────────
  let _lobbyBuffer = null;
  let _lobbyRawBuffer = null;
  let _lobbySource = null;
  let _lobbyGain = null;
  let _lobbyLoaded = false;
  let _lobbyPlaying = false;
  let _lobbyPlayPending = false;
  let _lobbyKilled = false;
  let _lobbyOffset = 0;
  let _lobbyStartedAt = 0;

  function _loadLobbyMusic() {
    if (_lobbyLoaded) return;
    _lobbyLoaded = true;
    fetch('./assets/audio/lobby_music.ogg')
      .then(r => r.arrayBuffer())
      .then(buf => {
        _lobbyRawBuffer = buf;
        if (ctx) {
          ctx.decodeAudioData(buf.slice(0), decoded => {
            _lobbyBuffer = decoded;
            if (_lobbyPlayPending && !_lobbyKilled) { _lobbyPlayPending = false; playLobbyMusic(); }
            else { _lobbyPlayPending = false; }
          });
        }
      })
      .catch(() => {});
  }

  function _decodeLobbyWhenReady() {
    if (!_lobbyRawBuffer || _lobbyBuffer) return;
    ctx.decodeAudioData(_lobbyRawBuffer.slice(0), decoded => {
      _lobbyBuffer = decoded;
      if (_lobbyPlayPending && !_lobbyKilled) { _lobbyPlayPending = false; playLobbyMusic(); }
      else { _lobbyPlayPending = false; }
    });
  }

  function playLobbyMusic() {
    _lobbyKilled = false;
    if (!_lobbyBuffer) { _lobbyPlayPending = true; return; }
    if (!ctx || _lobbyPlaying) return;
    if (!_lobbyGain) {
      _lobbyGain = ctx.createGain();
      _lobbyGain.gain.value = 0;
      _lobbyGain.connect(masterGain);
    }
    _lobbySource = ctx.createBufferSource();
    _lobbySource.buffer = _lobbyBuffer;
    _lobbySource.loop = true;
    _lobbySource.connect(_lobbyGain);
    const startOffset = _lobbyOffset % _lobbyBuffer.duration;
    _lobbySource.start(0, startOffset);
    _lobbyStartedAt = ctx.currentTime - startOffset;
    _lobbyPlaying = true;
    const t = ctx.currentTime;
    _lobbyGain.gain.cancelScheduledValues(t);
    _lobbyGain.gain.setValueAtTime(0, t);
    _lobbyGain.gain.linearRampToValueAtTime(muted ? 0 : 0.55, t + 1.5);
  }

  function stopLobbyMusic() {
    _lobbyPlayPending = false;
    _lobbyKilled = true;
    if (_lobbySource) {
      if (_lobbyPlaying && _lobbyBuffer) {
        _lobbyOffset = (ctx.currentTime - _lobbyStartedAt) % _lobbyBuffer.duration;
      }
      if (_lobbyGain) {
        const t = ctx ? ctx.currentTime : 0;
        _lobbyGain.gain.cancelScheduledValues(t);
        _lobbyGain.gain.setValueAtTime(0, t);
      }
      try { _lobbySource.disconnect(); } catch(e) {}
      try { _lobbySource.stop(); } catch(e) {}
      _lobbySource = null;
    }
    _lobbyPlaying = false;
  }
  // ─────────────────────────────────────────────────────────────

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = masterVol;
    masterGain.connect(ctx.destination);
    _decodeWhenReady();
    _decodeJackpotWhenReady();
    _decodeSniperSounds();
    _decodeLobbyWhenReady();
    _decodeShopWhenReady();
    _decodeMenuSounds();
    _decodeTrickySounds();
    _greenMusic._decodeWhenReady();
    _redMusic._decodeWhenReady();
    _blackMusic._decodeWhenReady();
    _buffMusic._decodeWhenReady();
  }

  // Inicia ambos os fetches imediatamente
  _loadMusic();
  _loadJackpot();
  _loadLobbyMusic();
  _loadShopMusic();

  // ── TRICKY / GLITCH FURY SOUNDS ──────────────────────────────
  let _trickyMusicRaw = null, _trickyMusicBuffer = null;
  let _trickyMusicSource = null;
  let _trickyMusicGain = null;
  let _trickyMusicOffset = 0;     // posição em segundos onde pausou
  let _trickyMusicStartedAt = 0;  // ctx.currentTime quando o source foi iniciado
  let _trickyMusicPaused = false;

  fetch('./assets/audio/Madness.ogg')
    .then(r => r.arrayBuffer())
    .then(buf => { _trickyMusicRaw = buf; if(ctx) ctx.decodeAudioData(buf.slice(0), d => { _trickyMusicBuffer = d; }); })
    .catch(() => {});

  function _decodeTrickySounds() {
    if(_trickyMusicRaw && !_trickyMusicBuffer) ctx.decodeAudioData(_trickyMusicRaw.slice(0), d => { _trickyMusicBuffer = d; });
  }

  function playTrickyMusic() {
    if(!ctx || !_trickyMusicBuffer || muted) return;
    if(_trickyMusicSource) { try { _trickyMusicSource.stop(); } catch(e){} _trickyMusicSource = null; }
    if(!_trickyMusicGain) { _trickyMusicGain = ctx.createGain(); _trickyMusicGain.connect(masterGain); }
    _trickyMusicGain.gain.cancelScheduledValues(ctx.currentTime);
    _trickyMusicGain.gain.setValueAtTime(muted ? 0 : 0.85, ctx.currentTime);
    _trickyMusicSource = ctx.createBufferSource();
    _trickyMusicSource.buffer = _trickyMusicBuffer;
    _trickyMusicSource.loop = true;
    _trickyMusicSource.connect(_trickyMusicGain);
    const startOffset = _trickyMusicOffset % _trickyMusicBuffer.duration;
    _trickyMusicSource.start(0, startOffset);
    _trickyMusicStartedAt = ctx.currentTime - startOffset;
    _trickyMusicPaused = false;
    _trickyMusicOffset = 0;
  }

  function pauseTrickyMusic() {
    if(!_trickyMusicSource || _trickyMusicPaused) return;
    _trickyMusicOffset = (ctx.currentTime - _trickyMusicStartedAt) % (_trickyMusicBuffer ? _trickyMusicBuffer.duration : 1);
    try { _trickyMusicSource.stop(); } catch(e){}
    _trickyMusicSource = null;
    _trickyMusicPaused = true;
  }

  function resumeTrickyMusic() {
    if(!_trickyMusicPaused || !_trickyMusicBuffer) return;
    _trickyMusicPaused = false;
    if(!_trickyMusicGain) { _trickyMusicGain = ctx.createGain(); _trickyMusicGain.connect(masterGain); }
    _trickyMusicGain.gain.cancelScheduledValues(ctx.currentTime);
    _trickyMusicGain.gain.setValueAtTime(muted ? 0 : 0.85, ctx.currentTime);
    _trickyMusicSource = ctx.createBufferSource();
    _trickyMusicSource.buffer = _trickyMusicBuffer;
    _trickyMusicSource.loop = true;
    _trickyMusicSource.connect(_trickyMusicGain);
    const startOffset = _trickyMusicOffset % _trickyMusicBuffer.duration;
    _trickyMusicSource.start(0, startOffset);
    _trickyMusicStartedAt = ctx.currentTime - startOffset;
    _trickyMusicOffset = 0;
  }

  function stopTrickyMusic() {
    if(_trickyMusicSource) { try { _trickyMusicSource.stop(); } catch(e){} _trickyMusicSource = null; }
    _trickyMusicPaused = false;
    _trickyMusicOffset = 0;
  }

  function fadeTrickyMusicOut(duration) {
    if(!ctx || !_trickyMusicGain || !_trickyMusicSource) return;
    const t = ctx.currentTime;
    _trickyMusicGain.gain.cancelScheduledValues(t);
    _trickyMusicGain.gain.setValueAtTime(_trickyMusicGain.gain.value, t);
    _trickyMusicGain.gain.linearRampToValueAtTime(0, t + duration);
    const src = _trickyMusicSource;
    setTimeout(() => {
      if(src) { try { src.stop(); } catch(e){} }
      if(_trickyMusicSource === src) _trickyMusicSource = null;
    }, duration * 1000 + 100);
  }

  // ── SNIPER SOUNDS ────────────────────────────────────────────
  let _recargaRaw = null;
  let _recargaBuffer = null;
  let _balaRaw = null;
  let _balaBuffer = null;

  fetch('./assets/audio/Recarga.ogg')
    .then(r => r.arrayBuffer())
    .then(buf => { _recargaRaw = buf; if(ctx) ctx.decodeAudioData(buf.slice(0), d => { _recargaBuffer = d; }); })
    .catch(() => {});

  fetch('./assets/audio/Bala_de_sniper.ogg')
    .then(r => r.arrayBuffer())
    .then(buf => { _balaRaw = buf; if(ctx) ctx.decodeAudioData(buf.slice(0), d => { _balaBuffer = d; }); })
    .catch(() => {});

  function _decodeSniperSounds() {
    if(_recargaRaw && !_recargaBuffer) ctx.decodeAudioData(_recargaRaw.slice(0), d => { _recargaBuffer = d; });
    if(_balaRaw && !_balaBuffer) ctx.decodeAudioData(_balaRaw.slice(0), d => { _balaBuffer = d; });
  }

  // ── MENU SOUNDS ──────────────────────────────────────────────
  let _selecaoRaw = null;
  let _selecaoBuffer = null;
  let _selecaoClickRaw = null;
  let _selecaoClickBuffer = null;

  fetch('./assets/audio/Selecao.ogg')
    .then(r => r.arrayBuffer())
    .then(buf => { _selecaoRaw = buf; if(ctx) ctx.decodeAudioData(buf.slice(0), d => { _selecaoBuffer = d; }); })
    .catch(() => {});

  fetch('./assets/audio/Selecao_click.ogg')
    .then(r => r.arrayBuffer())
    .then(buf => { _selecaoClickRaw = buf; if(ctx) ctx.decodeAudioData(buf.slice(0), d => { _selecaoClickBuffer = d; }); })
    .catch(() => {});

  let _selecaoErroRaw = null;
  let _selecaoErroBuffer = null;

  fetch('./assets/audio/Selecao_erro.ogg')
    .then(r => r.arrayBuffer())
    .then(buf => { _selecaoErroRaw = buf; if(ctx) ctx.decodeAudioData(buf.slice(0), d => { _selecaoErroBuffer = d; }); })
    .catch(() => {});

  function _decodeMenuSounds() {
    if(_selecaoRaw && !_selecaoBuffer) ctx.decodeAudioData(_selecaoRaw.slice(0), d => { _selecaoBuffer = d; });
    if(_selecaoClickRaw && !_selecaoClickBuffer) ctx.decodeAudioData(_selecaoClickRaw.slice(0), d => { _selecaoClickBuffer = d; });
    if(_selecaoErroRaw && !_selecaoErroBuffer) ctx.decodeAudioData(_selecaoErroRaw.slice(0), d => { _selecaoErroBuffer = d; });
  }

  function _playBuffer(buffer) {
    if(!ctx || !buffer || muted) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = 0.8;
    src.connect(g); g.connect(masterGain);
    src.start(ctx.currentTime);
  }

  function sniperReload() {
    if(!ctx || !_recargaBuffer || muted) return;
    const src = ctx.createBufferSource();
    src.buffer = _recargaBuffer;
    const g = ctx.createGain();
    g.gain.value = 1.8;
    src.connect(g); g.connect(masterGain);
    src.start(ctx.currentTime);
  }
  function sniperShot()   { _playBuffer(_balaBuffer); }

  function menuHover() { _playBuffer(_selecaoBuffer); }
  function menuClick() { _playBuffer(_selecaoClickBuffer); }
  function menuError() { _playBuffer(_selecaoErroBuffer); }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  // Cria um nó de ganho conectado ao master
  function gain(vol) {
    const g = ctx.createGain();
    g.gain.value = vol;
    g.connect(masterGain);
    return g;
  }

  // Oscilador simples com envelope ADSR básico
  function osc(type, freq, vol, attack, decay, sustain, release, out) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.linearRampToValueAtTime(sustain * vol, t + attack + decay);
    g.gain.setValueAtTime(sustain * vol, t + attack + decay + 0.01);
    g.gain.linearRampToValueAtTime(0, t + attack + decay + release);
    o.connect(g);
    g.connect(out || masterGain);
    o.start(t);
    o.stop(t + attack + decay + release + 0.05);
    return { osc: o, gain: g };
  }

  // Ruído branco com envelope
  function noise(vol, attack, decay, out) {
    const bufSize = ctx.sampleRate * (attack + decay + 0.1);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    src.connect(g);
    g.connect(out || masterGain);
    src.start(t);
    return { src, gain: g };
  }

  // Frequência que muda ao longo do tempo
  function sweep(type, freqStart, freqEnd, vol, duration, out) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    const t = ctx.currentTime;
    o.frequency.setValueAtTime(freqStart, t);
    o.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g);
    g.connect(out || masterGain);
    o.start(t);
    o.stop(t + duration + 0.05);
  }

  // ── SONS DO JOGO ─────────────────────────────────────────────

  function sword() {
    if (!ctx || muted) return;
    // Whoosh: ruído filtrado passando rápido
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.18, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 900;
    filt.Q.value = 0.6;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.32, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    src.connect(filt); filt.connect(g); g.connect(masterGain);
    src.start(t);
    // Leve clang metálico
    osc('sawtooth', 340, 0.08, 0.001, 0.12, 0, 0.06);
  }

  function arrow() {
    if (!ctx || muted) return;
    // Whoosh agudo curto
    sweep('sawtooth', 1200, 400, 0.12, 0.11);
    noise(0.07, 0.001, 0.10);
  }

  function explosion() {
    if (!ctx || muted) return;
    // Boom grave
    sweep('sine', 180, 28, 0.6, 0.55);
    sweep('sine', 90, 20, 0.4, 0.7);
    noise(0.5, 0.001, 0.45);
    // Crack de impacto
    osc('sawtooth', 220, 0.2, 0.001, 0.08, 0, 0.05);
  }

  function hit() {
    if (!ctx || muted) return;
    // Impacto curto
    sweep('square', 200, 60, 0.18, 0.12);
    noise(0.12, 0.001, 0.08);
  }

  function playerHurt() {
    if (!ctx || muted) return;
    // Tom descendente de dano
    sweep('sawtooth', 440, 110, 0.3, 0.25);
    noise(0.15, 0.001, 0.15);
  }

  function heal() {
    if (!ctx || muted) return;
    // Arpejo ascendente suave
    [0, 100, 200].forEach(delay => {
      setTimeout(() => {
        if (!ctx || muted) return;
        const freqs = [523, 659, 784];
        const idx = [0, 100, 200].indexOf(delay);
        osc('sine', freqs[idx], 0.18, 0.01, 0.08, 0.3, 0.12);
      }, delay);
    });
  }

  function coin() {
    if (!ctx || muted) return;
    // Bip agudo e curto
    sweep('sine', 880, 1200, 0.12, 0.08);
  }

  function axeWhoosh() {
    if (!ctx || muted) return;
    // Ruído suave de giro
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 600;
    filt.Q.value = 1.2;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    src.connect(filt); filt.connect(g); g.connect(masterGain);
    src.start(t);
  }

  function katanaSlash() {
    if (!ctx || muted) return;
    sweep('sawtooth', 1800, 600, 0.14, 0.09);
    noise(0.06, 0.001, 0.07);
  }

  function skeleton() {
    if (!ctx || muted) return;
    // Som etéreo de invocação
    osc('sine', 220, 0.15, 0.05, 0.1, 0.4, 0.3);
    osc('sine', 330, 0.08, 0.08, 0.15, 0.2, 0.25);
    sweep('triangle', 440, 110, 0.06, 0.35);
  }

  function blast() {
    if (!ctx || muted) return;
    // Onda expansiva — boom + ring
    sweep('sine', 120, 25, 0.55, 0.6);
    noise(0.4, 0.001, 0.5);
    osc('sine', 660, 0.1, 0.001, 0.04, 0, 0.18);
  }

  function bombThrow() {
    if (!ctx || muted) return;
    sweep('triangle', 400, 200, 0.1, 0.12);
  }

  function rollDash() {
    if (!ctx || muted) return;
    noise(0.12, 0.001, 0.14);
    sweep('sine', 300, 150, 0.08, 0.14);
  }

  function gameOver() {
    if (!ctx || muted) return;
    // Tom descendente dramático
    [0, 200, 450, 750].forEach((delay, i) => {
      setTimeout(() => {
        if (!ctx || muted) return;
        const notes = [440, 330, 220, 110];
        sweep('sawtooth', notes[i] * 1.05, notes[i] * 0.7, 0.25 - i * 0.04, 0.35);
      }, delay);
    });
  }

  function dungeonClear() {
    if (!ctx || muted) return;
    // Fanfarra rápida
    const melody = [523, 659, 784, 1047];
    melody.forEach((freq, i) => {
      setTimeout(() => {
        if (!ctx || muted) return;
        osc('square', freq, 0.18, 0.01, 0.06, 0.5, 0.12);
        osc('sine', freq, 0.12, 0.01, 0.06, 0.5, 0.12);
      }, i * 110);
    });
  }

  function specialActivate() {
    if (!ctx || muted) return;
    sweep('sine', 80, 40, 0.4, 0.8);
    osc('sawtooth', 220, 0.2, 0.05, 0.3, 0.3, 0.4);
    noise(0.2, 0.05, 0.6);
  }

  function laser() {
    if (!ctx || muted) return;
    // Zumbido pulsante do laser
    const o = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = 120;
    lfo.type = 'sine';
    lfo.frequency.value = 14;
    lfoGain.gain.value = 40;
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    lfo.connect(lfoGain); lfoGain.connect(o.frequency);
    o.connect(g); g.connect(masterGain);
    o.start(t); lfo.start(t);
    o.stop(t + 0.2); lfo.stop(t + 0.2);
  }

  function buffPick() {
    if (!ctx || muted) return;
    // Acorde mágico
    [261, 329, 392, 523].forEach((f, i) => {
      setTimeout(() => {
        if (!ctx || muted) return;
        osc('sine', f, 0.15, 0.01, 0.1, 0.4, 0.3);
      }, i * 60);
    });
  }

  function cardDraw() {
    if (!ctx || muted) return;
    sweep('sine', 300, 500, 0.08, 0.07);
  }

  function manaPip() {
    if (!ctx || muted) return;
    osc('sine', 660, 0.06, 0.005, 0.04, 0, 0.05);
  }

  // Sons de moeda reais (2 variações) — carregados via base64 embutido
  const _coinAudioB64 = [
    'data:audio/mpeg;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7pAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEluZm8AAAAPAAAAKAAATOAADAwSEhgYGB8fJSUlKysxMTE4OD4+PkRESkpKUVFXV1ddXWNjY2pqcHBwdnZ8fHyDg4mJiY+PlZWVnJyioqKoqK6urrW1u7u7wcHHx8fOztTU1Nra4ODg5+ft7e3z8/n5+f//AAAAAExhdmM2MC4zLgAAAAAAAAAAAAAAAAAAAAAAAAAAAEzgLFvTagAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7pAQAAA3gAGkAAAAAAAANIAAAAAAAAaQAAAAAAAA0gAAAAP/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////7pAQAAA3gAGkAAAAAAAANIAAAAAAAAaQAAAAAAAA0gAAAAP/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////7pAQAAA3gAGkAAAAAAAANIAAAAAAAAaQAAAAAAAA0gAAAAP/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////7pAQAAATIKjGBrWpgWQVGMDWtTAyhh0AHva3JlDDoAPe1uWfvdqdNS3ZNNdb39enprTUtJE+zn2Tvdk1vrrdr97rRN2TvdmPsDhd4ff9J8m/1pPh96+tJ8m/95N/7w+8eLC7WkwmXl/SfJv9aT5N/rSfD712tkz5N/rSf/////////////////////////////////////////////////////////////////////////////////////2fvdqdNS3ZNNdb39enprTUtJE+zn2Tvdk1vrrdr97rRN2TvdmPsDhd4ff9J8m/1pPh96+tJ8m/95N/7w+8eLC7WkwmXl/SfJv9aT5N/rSfD712tkz5N/rSfONWTe/pm/pnENdFwXbPDkm+oeNZ98afz0zvcrmXxKM+M4vin39wMqxtVeM/O/l9ZwkQScRoBvj8XTf79bsvU1k9On/+h6kGW/9eqy61N0Nv3//dS0/rf/vWkTRMxiDIjZ3/5CYg41ZN7+mb+mcQ10XBds8OSb6h41n3xp/PTO9yuZfEoz4zi+Kff3AyrG1V4z87+X1nCRBJxGgG+PxdN/v1uy9TWT06f/6HqQZb/16rLrU3Q2/f/91LT+t/+9aRNEzGIMiNnf/kJiP/7pAQAARRWYVaB7ZNwZIwq0D2ybgzNi2AHyk3JmbFsAPlJuTympr37G53xq8eoHuWm60kNB2rVOEpszF9Q4g4FKZTpp1p00iSIJeNNnUt6aluG7AVcihUTqbU6etS1IKQao066kEEU/retTKV9Cur9dTKXtTegt1v//7f1f/WouEBD1w+LfCbv//////////////////////////////////////////////////zympr37G53xq8eoHuWm60kNB2rVOEpszF9Q4g4FKZTpp1p00iSIJeNNnUt6aluG7AVcihUTqbU6etS1IKQao066kEEU/retTKV9Cur9dTKXtTegt1v//7f1f/WouEBD1w+LfCbkp96xGsvx85eZw1hDIo7pJqRUUEJxNdQ6jRarTEE1M0KkHrSroVi5lHUUzdNOtzzGZwhoCuObvdSfsYI3vZBTm+91zzPWe9mnkFL63tWn01beu6q0tf9b/0E3V//9NRcG6LKMThtSlPvWI1l+PnLzOGsIZFHdJNSKighOJrqHUaLVaYgmpmhUg9aVdCsXMo6imbpp1ueYzOENAVxzd7qT9jBG97IKc33uueZ6z3s08gpfW9q0+mrb13VWlr/rf+gm6v//pqLg3RZRicNqf/7pAQAB3QUYVgB8INyawwrAD4QbkzphWAGyg3JnTCsANlBuTU+d5jw19pzFv8xwy6D9UvqZSRamVaSxnzVJ5xaAYwGkgpE6tRMIPugmQFqls6zVVFM0NxuAR0i2bKOZ6kpaDqbQPqUdLa1PqOIvUkrZVJ61PsnS6dK9fS+u9qFD9z1HqWbL///UdSJ0N4V///////////////////////////////zU+d5jw19pzFv8xwy6D9UvqZSRamVaSxnzVJ5xaAYwGkgpE6tRMIPugmQFqls6zVVFM0NxuAR0i2bKOZ6kpaDqbQPqUdLa1PqOIvUkrZVJ61PsnS6dK9fS+u9qFD9z1HqWbL///UdSJ0N4VFrWgt6JHsg6z4EKBxMxdWiw+0VGKSrEBKytJZYAfA7NEwNY56KkV2chzu7JIVKWyBmYEeALGBmzHqjPTqpFVSbPZNRhSrqN6Kr1nmerevr3VvWvU7WVXVrXp+vf62Nf1of/rSJQWGkWtaC3okeyDrPgQoHEzF1aLD7RUYpKsQErK0llgB8Ds0TA1jnoqRXZyHO7skhUpbIGZgR4AsYGbMeqM9OqkVVJs9k1GFKuo3oqvWeZ6t6+vdW9a9TtZVdWten69/rY1/Wh/+tIlBYaf/7pAQAB3RkYdgBtJNyZAw7ADaSbky5iWAGzk3JlzEsANnJuSjdJa1S2arpkwIEhDFmjLSl0/VSUkLwyRdE6ZGIFRJET7PUcKtSuom5utS6ZdmJk5odLgDak+dnTPS6nqInTQrTo1vUzH1rdSmWeqS+vr7tV1f9f9rI1bfqTV9RaQd//RIcLGr/////////////////////////////////////////////////////8o3SWtUtmq6ZMCBIQxZoy0pdP1UlJC8MkXROmRiBUSRE+z1HCrUrqJubrUumXZiZOaHS4A2pPnZ0z0up6iJ00K06Nb1Mx9a3Uplnqkvr6+7VdX/X/ayNW36k1fUWkHf/0SHCxqTdBW5kqzqWYARwCjDcvlBNnH097G6i8eY0Wo44ho3z2zIEGVQd8uV0nTUpb6jhwEblw2ZJFCigpGjOjuTsy2My2krzpla9SzyFbak623r+rVfr79SqSKvnf5ur8n2SZ/9bFMTU2ZN0FbmSrOpZgBHAKMNy+UE2cfT3sbqLx5jRajjiGjfPbMgQZVB3y5XSdNSlvqOHARuXDZkkUKKCkaM6O5OzLYzLaSvOmVr1LPIVtqTrbev6tV+vv1KpIq+d/m6vyfZJn/1sUxNTZv/7pAQAAROwYlmB72twa8xLMD3tbg2lkWAGta3BtLIsANa1uHOPjU8CXc0SHI9c1YTsK1PFzfXxEnxne4FfrOJrw59Eqac498x5oku9bxjd7Z19a7zJkyYNIlhGN0DFNTpTxfHwJ4MgkzRalKqRMqlq1sv62TTstv//t/9r2o/0v1t+s4dHGMAd/tckSUL+T/////////////9zj41PAl3NEhyPXNWE7CtTxc318RJ8Z3uBX6zia8OfRKmnOPfMeaJLvW8Y3e2dfWu8yZMmDSJYRjdAxTU6U8Xx8CeDIJM0WpSqkTKpatbL+tk07Lb//7f/a9qP9L9bfrOHRxjAHf7XJElC/kxfPrd60XNU0LZmTgDKJ2ttVE4aKUmlUtZQNpg6jdZuSgEQyJnso4hUzKsiLMospNlLQM7IOixxyQAN4UD5qpGqmbdJWp0Ouy1n1La2rbQVWmj/Tsn1Wpe/Wkvqtf1LQTB5FY2f88tI6a+XH/wwL59bvWi5qmhbMycAZRO1tqonDRSk0qlrKBtMHUbrNyUAiGRM9lHEKmZVkRZlFlJspaBnZB0WOOSABvCgfNVI1UzbpK1Oh12Ws+pbW1baCq00f6dk+q1L360l9Vr+paCYPIrGz/nlpHTXy4/+GP/7pAQAD/SFZFgB7ZNwY6yLAD2ybgx9tWAHza3Jj7asAPm1uTy3THtvNEvrWa0OFZUAbAUxqbIKuo4b11MhTE+NM0TP4PAMiLNXpl+7qRZoztc8u7IM1SKCJkR4S0lVaTMyJopq9U1tbrTd62uvt/WzL7avW9Z5HV63X9VDX1SqI1f/t+bf8N////////////////////////////////////////////////////////////nlumPbeaJfWs1ocKyoA2ApjU2QVdRw3rqZCmJ8aZomfweAZEWavTL93UizRna55d2QZqkUETIjwlpKq0mZkTRTV6pra3Wm71tdfb+tmX21et6zyOr1uv6qGvqlURq//b82/4bVUHFvrVdoCDn7w5oXwQcGYNUmS2RIVS9FTIi9rZTn2NwvAs1p9cuNrvckT5q9StR9boLXl8HIK5qiuhdz1GvWkYW72Oo6kLVoV3r/9Vn9F6jJDT9br/ZPS9QUAlJt//53//8vKqDi31qu0BBz94c0L4IODMGqTJbIkKpeipkRe1spz7G4XgWa0+uXG13uSJ81epWo+t0Fry+DkFc1RXQu56jXrSMLd7HUdSFq0K71/+qz+i9Rkhp+t1/snpeoKASk2//87//+Xv/7pAQAD/OubVgB8ZNyak2rAD4ybk3BtV4Hza3JuDarwPm1uZ6+1P536jm1rPWRhuA+AvD9J0jBEpmC0lpqTrIIfXpmzHQ1wc82RUnN3WT+qhzp+7ImzJopKqZI4dLgJ4Pxmcos9aP6aybTrr0kT37bq+tTr9+pF2+i3rdMzPsqpH27VlgOEXX//9D//8z///////////////56+1P536jm1rPWRhuA+AvD9J0jBEpmC0lpqTrIIfXpmzHQ1wc82RUnN3WT+qhzp+7ImzJopKqZI4dLgJ4Pxmcos9aP6aybTrr0kT37bq+tTr9+pF2+i3rdMzPsqpH27VlgOEXX//9D//8zxH3vOYFaa3GmzZiULABOQUqXjyS7pmI2U6T2ZxlkDZVZtOiXAw59BC6DLHYt0e7GJ9NaKlq88mpmPoAOcKVmn0VLn/qWw5KPXnDzP2ZleySlp+k1d+j2c/pvXk9Jr7bUFosyzgOIRR///3b//5zEfe85gVprcabNmJQsAE5BSpePJLumYjZTpPZnGWQNlVm06JcDDn0ELoMsdi3R7sYn01oqWrzyamY+gA5wpWafRUuf+pbDko9ecPM/ZmV7JKWn6TV36PZz+m9eT0mvttQWizLOA4hFH///dv//nP/7pAQAARQ/ZFgBtItwZ6yLADaRbgzJb2YGva3BmS3swNe1uK7VprYuKRU6kDMnAmtIGmjnEpwxNrsauzHTz6knUXw0o/stVjdSlro7H1LWt1Uz9nsuWQQci6lmqqkVqdl95B7vrrQLSFFCpbI6qTIrpbqa+1/Usu+qqWUG+Z07tdqi+Ktf//mdyvzv//////////////////////////////////////////9dq01sXFIqdSBmTgTWkDTRziU4Ym12NXZjp59STqL4aUf2WqxupS10dj6lrW6qZ+z2XLIIORdSzVVSK1Oy+8g9311oFpCihUtkdVJkV0t1Nfa/qWXfVVLKDfM6d2u1RfFWv//zO5X509QXZ2WZsuilM/QgWEtylfPYyGOsWhX9/8fMOmcZ3X7gyXiZpW1qbp8asrHOkl1VvVqXoE8aBOjRR5M67WXpupazVJBakkXLg7xhzJk1////+7OcMRzlMzUt9Ri3/rVXdQ0jyPf+cPUF2dlmbLopTP0IFhLcpXz2MhjrFoV/f/HzDpnGd1+4Ml4maVtam6fGrKxzpJdVb1al6BPGgTo0UeTOu1l6bqWs1SQWpJFy4O8YcyZNf////uznDEc5TM1LfUYt/61V3UNI8j3/nP/7pAQAD/QJZdgBr2tyaWy7ADXtbk0Zl2AGya3JozLsANk1uSmle7nObFwqM9ekKfGfsKI45tzz0zv4xGgxvbWp/aXG7KvxPelP/6DsQaSbXaykpuquvNWTWMyHapOitSaKa20K1LDuAwrU7s2prpNX1bPav0H2AmjJIv3WxndldrayampNFSv3s37x2v///////////////////////////////5TSvdznNi4VGevSFPjP2FEcc2556Z38YjQY3trU/tLjdlX4nvSn/9B2INJNrtZSU3VXXmrJrGZDtUnRWpNFNbaFalh3AYVqd2bU10mr6tntX6D7ATRkkX7rYzuyu1tZNTUmipX72b947XKR6rprpIkIuG6e6lnnLof4Cbl5EmzekjQUkQyiukt6J5RiO50EHQTS5wRkJOapKYxZbvUXHo2dlsuTmTqWmqt6mQdBl1vcuB9DMkh+vX9J/bbVfZjMFPPOl9bM71JrVvqKn+33/9Idh8pHqumukiQi4bp7qWecuh/gJuXkSbN6SNBSRDKK6S3onlGI7nQQdBNLnBGQk5qkpjFlu9RcejZ2Wy5OZOpaaq3qZB0GXW9y4H0MySH69f0n9ttV9mMwU886X1szvUmtW+oqf7ff/0h2H//7pAQAB3PiZleB+Wtya4zK8D8tbk1Fl14Gza3JqLLrwNm1uXmPjNfjecPVDGtzDXcMt6uMjK64vuveq473zt2H7Ofce9x3zt2bgTe71rWP71+Kt6vqK0qnTRXJdJJOlVrlR7foV21J7aEvAoR3H1t/9LR9Ja011Ul1nFGYEwKbo/+1a+/L/31akv+xwSY0f//////////////////////eY+M1+N5w9UMa3MNdwy3q4yMrri+696rjvfO3Yfs59x73HfO3ZuBN7vWtY/vX4q3q+orSqdNFcl0kk6VWuVHt+hXbUntoS8ChHcfW3/0tH0lrTXVSXWcUZgTApuj/7Vr78v/fVqS/7HBJjRxkUnN07a49iWTWuYpTZMyBNoCqiLy6edFJ3OlsWatTmTouyKzFiKpJIru+sshIY9HtbM6SE6TlshR91k6hW+t6TpVvQoL2DGFwZaH/stboK/tS61XMQL8/S/010rovXUs8k32Qeo9/8T88Mik5unbXHsSya1zFKbJmQJtAVUReXTzopO50tizVqcydF2RWYsRVJJFd31lkJDHo9rZnSQnSctkKPusnUK31vSdKt6FBewYwuDLQ/9lrdBX9qXWq5iBfn6X+muldF66lnkm+yD1Hv/ifnv/7pAQAC7O7ZdeBs2tyaey68DZtbk2tl1wH0g3JtbLrgPpBuR0sg5o1FmWculSOzNZiUggmAowxlwqupBmRNDI+mtqFnc45NJVLNqB9acNRNGWmm69SE8tmd7bnypkqFa12XU9q0N7iCgWmtnXanu6GpK1NaFFOpTNrMgTh6P976tvpILWr3qUnX1dlEq//////////////////46WQc0aizLOXSpHZmsxKQQTAUYYy4VXUgzImhkfTW1Czuccmkqlm1A+tOGomjLTTdepCeWzO9tz5UyVCta7Lqe1aG9xBQLTWzrtT3dDUlamtCinUpm1mQJw9H+99W30kFrV71KTr6uyiVdo1BtrdtxafK9Wykk1Inp5wvSCnAkDAwNa2aqRhomlegpecG8aKZkT6S2dYbsbzfsucKqndTqczUtigaJaLqrrY6zVutanpl0KrUtJB5tvr7VaK3VQoszUwubQZL+19ba1PWZ0q3dmtOK/646jzRqDbW7bi0+V6tlJJqRPTzhekFOBIGBga1s1UjDRNK9BS84N40UzIn0ls6w3Y3m/Zc4VVO6nU5mpbFA0S0XVXWx1mrda1PTLoVWpaSDzbfX2q0VuqhRZmphc2gyX9r621qeszpVu7NacV/1x1Hv/7pAQAD/PnZdcB9Gtybuy64D6Nbk0FmVoGza3JoLMrQNm1uVmub7zXNf9nfLObrSQSZSRfBIAApRJwuE0fV1MgT55KynZTsssEHds2W71HQ9kQJPLXTUu6Y8qVBJ1Gz2liLKP1oLUqtNBSXug4xAIljfsyut+6SndHpq6nZa0zwOy6P/epbV2fPPrXV6iyr/jHPf/////////////////+s1zfea5r/s75ZzdaSCTKSL4JAAFKJOFwmj6upkCfPJWU7Kdllgg7tmy3eo6HsiBJ5a6al3THlSoJOo2e0sRZR+tBalVpoKS90HGIBEsb9mV1v3SU7o9NXU7LWmeB2XR/71Lauz559a6vUWVf8Y54jLdlKqejHAfNTVmTdVAohGgjEpKKxbubJrOGo5LrQUtBSmWpMaV11qRetxSAgV2WplLrUxYyr8463Myxa0nQdVaqVdd2UylhgCV0v/S39V/utWixgDnQpf6j+knX8nKurV9q/9YnpuxGW7KVU9GOA+amrMm6qBRCNBGJSUVi3c2TWcNRyXWgpaClMtSY0rrrUi9bikBArstTKXWpixlX5x1uZli1pOg6q1Uq67splLDAErpf+lv6r/datFjAHOhS/1H9JOv5OVdWr7V/6xPTdv/7pAQAB3RTZlWBs2tyaWzKsDZtbkyFmVQGza3JkLMqgNm1uTrp0WqXUspHlG6zTRWkXQTgD9kKXTM2U7p1JEwbF3TSbRYplRLXWfUmdNAzoUV193UugZqW/ZkHcikFZs5zU91L02ZklrSRBiLrp//72UrbenWvTOOD4t0f+61es9XH/Up6vRN//ULA2X///////////////////////////////////////////+ddOi1S6llI8o3WaaK0i6CcAfshS6ZmyndOpImDYu6aTaLF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hrMqANa1uWe2qZmvJikuWLHZTMitSSg0cCai+omT1EvF2zupJK9DZFx6OmlFRl3YExCjqUi6e62WtBaWgtaNZytNdVFulPqXWfvUAqQlFbr/dmrS0UE9BrPqdNIxYAomYuUmW27VavporfrdtBqt/0Vh1f//////////////////////////////////////////9ntqmZryYpLlix2UzIrUkoNHAmovqJk9RLxds7qSSvQ2RcejppRUZd2BMQo6lIunutlrQWloLWjWcrTXVRbpT6l1n71AKkJRW6/3Zq0tFBPQaz6nTSMWAKJmLlJltu1Wr6aK363bQarf9FYdXF+eSdbujQYzSV0jZE+dUArhLTJE0bZRkYoqX6aDJKTLi6GtqkkSWDMyaSa9qj+mnX7MVOyl0033a72Zk+oKEBQZTV/qWylUV6Ors9XUZAG67p0XZuh9135yzVf1b/XclD7C/PJOt3RoMZpK6RsifOqAVwlpkiaNsoyMUVL9NBklJlxdDW1SSJLBmZNJNe1R/TTr9mKnZS6ab7td7MyfUFCAoMpq/1LZSqK9HV2erqMgDdd06Ls3Q+6785Zqv6t/ruSh9v/7pAQAARQgZdMB8ZNyasy6YD4ybkzVl04Gxi3JmrLpwNjFuRrWrm1d2zC3elqmylLopJKCPG+fQnmuplWd0VnpqymUeHlndWktjE6PkRc1Tai05poLoKnU5izjUNls1NCvSvZNta7j5BmMs7RQUf5wxrf8wZG2iy3UkZwbWPLNP+/0FVZD9W66/fb12IEr/////////////////////////////////xrWrm1d2zC3elqmylLopJKCPG+fQnmuplWd0VnpqymUeHlndWktjE6PkRc1Tai05poLoKnU5izjUNls1NCvSvZNta7j5BmMs7RQUf5wxrf8wZG2iy3UkZwbWPLNP+/0FVZD9W66/fb12IEoId3ZNetalVPTUmlUs4E+TCUwLqkVVsgZnzMwMD63U9Rw1PPSW1KfQFDjfMTJ0VO9lUFGnR7LH0kqymQr57bdVSCY6AeWTUYzyn9BV/roq7KpUnOHwtdTm//S+vVY0dTV+y3/+sdaYQ7uya9a1KqempNKpZwJ8mEpgXVIqrZAzPmZgYH1up6jhqeektqU+gKHG+YmToqd7KoKNOj2WPpJVlMhXz226qkEx0A8smoxnlP6Cr/XRV2VSpOcPha6nN/+l9eqxo6mr9lv/9Y60//7pAQAAARIZdOBsmtyaQy6cDZNbkyhl04G0a3JlDLpwNo1uQzXqquk7malrTY6ycxLAQGBOEUigarXSUykE5sp1F2pB0iTUpk0mc+tI6EIl5aN9Nep63SegkzpnNFFdGvSau2yCKKweAOJgmhVdX6HZetFqSqlTmkgAznmjJ/rXo0+hpLfd+7/r9pRLf//////////////////////////////////////////DNeqq6TuZqWtNjrJzEsBAYE4RSKBqtdJTKQTmynUXakHSJNSmTSZz60joQiXlo3016nrdJ6CTOmc0UV0a9Jq7bIIorB4A4mCaFV1fodl60WpKqVOaSADOeaMn+tejT6Gkt937v+v2lEtEU1lOuk/Teu69FIcILUDQwLC1KutGTSnpOtPVRSZa9lJHVJhqI3tTNSSQWxsjSdA2Wy1JmSdVObJJLvU1JdFdUD4JTdSkl73UujS1sum1rbqsiiB1z60v9Lt+jbqXZSk/1anjUoRTWU66T9N67r0UhwgtQNDAsLUq60ZNKek609VFJlr2UkdUmGoje1M1JJBbGyNJ0DZbLUmZJ1U5skku9TUl0V1QPglN1KSXvdS6NLWy6bWtuqyKIHXPrS/0u36NupdlKT/VqeNSv/7pAQAAAPeZdMBtGtyaQy6YDaNbk11mUoG0a3JrrMpQNo1uRbLUitC/XZpxA9vL4JCgJUSIHC8bsbLVWmdbWi6nPKuZtRqdqTSiJg7skpN2aipbH3RRqc7OKvUums7RqptrUt4EMMtKpez903VspqdBnfegpSqwGs80Wvs6/X7uqcZdu3U6r7vW6x7nv////////////////////////xbLUitC/XZpxA9vL4JCgJUSIHC8bsbLVWmdbWi6nPKuZtRqdqTSiJg7skpN2aipbH3RRqc7OKvUums7RqptrUt4EMMtKpez903VspqdBnfegpSqwGs80Wvs6/X7uqcZdu3U6r7vW6x7nhlLTVr02YwWkpTs6UwLIQIg3JQQKxbZlLrkefdBaKNqbFkekUF2SZqSZcECn89ToKVZa6q1ecLK1fWtRgqpkarUwYgX3ZJNbJ0V7LVWyCrL6lda3WmsCNZI2WttbVKf0/Ubtb19dDoNfj1PsMpaatemzGC0lKdnSmBZCBEG5KCBWLbMpdcjz7oLRRtTYsj0iguyTNSTLggU/nqdBSrLXVWrzhZWr61qMFVMjVamDEC+7JJrZOivZaq2QVZfUrrW601gRrJGy1trapT+n6jdrevrodBr8ep9v/7pAQAB3O3ZdKB9Gtyaiy6UD6Nbk2xmUgG0a3BtjMpANo1uHK+751nFN2pHg+mu1E+dBCSAavlZy+V9jFB5OGzsgtalLMDApjsZqqSSkGSD2BRbJbNu3QSrdGtZwo3Q2VorTdkumzWEcBXd1dfW7s6lsy6lsySFbo7JuWglFW+vZ/t1yRe1L19S+v1CwV////////////////+5X3fOs4pu1I8H012onzoISQDV8rOXyvsYoPJw2dkFrUpZgYFMdjNVSSUgyQewKLZLZt26CVbo1rOFG6GytFabsl02awjgK7urr63dnUtmXUtmSQrdHZNy0Eoq317P9uuSL2pevqX1+oWCjbqND9SSDEqkyL1G00PmA3wRjiXMyZOJs6jY2QGsgmyKDqZKiYDRSvdN1UTgRCGNFak60XUdVO1K71yB1V3atj1SmQalQJIBSTPUmdH6lrtv2dd9ar0DMG+evoHqqlur3XaokPpv3v+l5CLP/7zbqND9SSDEqkyL1G00PmA3wRjiXMyZOJs6jY2QGsgmyKDqZKiYDRSvdN1UTgRCGNFak60XUdVO1K71yB1V3atj1SmQalQJIBSTPUmdH6lrtv2dd9ar0DMG+evoHqqlur3XaokPpv3v+l5CLP/7//7pAQACZQ3ZdIBs2tyZyy6QDZtbkzhl0QG0a3JnDLogNo1uS+q7JLa1y9RMHVSdTmANWgM+IuXyKlSczLL5500FMpFRossE+ki61ILZNZgGPCpu1klaTKPTmkuutysgrW7dd9JetRp5WDMuldTo1KU6tLW311P7WCKO6On99v9jdlKvX3sv6usWJj//////////////////////////////////////////l9V2SW1rl6iYOqk6nMAatAZ8RcvkVKk5mWXzzpoKZSKjRZYJ9JF1qQWyazAMeFTdrJK0mUenNJddblZBWt2676S9ajTysGZdK6nRqUp1aWtvrqf2sEUd0dP77f7G7KVevvZf1dYsTEpoTzVHGdjrV3SNlqOIlAIEYZELrmpLKRsyLkai65hdJ3nxbklUF1JzzChg4OrTUrQY8mutLVsRR0U1dtJ9eut66YhQhln10Vre37KStWpT0HT65mgC1nmMtNurpdu8eqVf9X1fxPHKaE81RxnY61d0jZajiJQCBGGRC65qSykbMi5GouuYXSd58W5JVBdSc8woYODq01K0GPJrrS1bEUdFNXbSfXrreumIUIZZ9dFa3t+ykrVqU9B0+uZoAtZ5jLTbq6XbvHqlX/V9X8Tx//7pAQAD/QFZlCBs2tybKzKEDZtbkztmUIGza3JnbMoQNm1uRbLTdMxXXSrOU7m5qpI1SBLYVqeUcKqa1zNpGm61qVc0dR0opMdZbUGuXCTC4yalKu1Rmp3RUjbskRSMp3VXu6Z2xgx6ydNQYwhkVUtan1e3epXmKHe0JR00fdNTLapvutEfrPuzVdf/OCfFj//////////////////////////+LZabpmK66VZync3NVJGqQJbCtTyjhVTWuZtI03WtSrmjqOlFJjrLag1y4SYXGTUpV2qM1O6KkbdkiKRlO6q93TO2MGPWTpqDGEMiqlrU+r271K8xQ72hKOmj7pqZbVN91oj9Z92arr/5wT4scTpN2trd0Wc8qqggq4NDg9rKJQ1Z81TYoG6V3bTPHCiaLqRqpHXTBCUSZkmRdbJrayp5Z50FqVFiUbKrVazOlfVqrDSKVSn+frUl/7aqvUmgE6NaC9a1tPLte+usk22dXXsv/ohRmqQnSbtbW7os55VVBBVwaHB7WUShqz5qmxQN0ru2meOFE0XUjVSOumCEokzJMi62TW1lTyzzoLUqLEo2VWq1mdK+rVWGkUqlP8/WpL/21VepNAJ0a0F61raeXa99dZJts6uvZf/RCjNUv/7pAQAB3OQZlCBs2tybEzKEDZtbk3dlUIG0a3Bu7KoQNo1uC1XmiZ9alpOgcPIrWYrMXEIQR8POTDGTmCBg7kOPtfagcMi6RBO6k3a7GYQLLjMt06SnOVm+gmyFeLNtTWTalte1061hBivQTeucvWm/6ugtadF1uo+cYFNN6attbKb3+mSp/6nV7et+mPE+v///////y1XmiZ9alpOgcPIrWYrMXEIQR8POTDGTmCBg7kOPtfagcMi6RBO6k3a7GYQLLjMt06SnOVm+gmyFeLNtTWTalte1061hBivQTeucvWm/6ugtadF1uo+cYFNN6attbKb3+mSp/6nV7et+mPE+s0QZSS72WmZGK3da0lqnwyAC2QqGBQWeZOkiaFg0oNZO60jAb1bqZFtcNyKI6lpJpJO7qnLomaS+iLEtVvfX0EnUtdSkYG8Tp0qrOt1b3Wp63r27WZa2MAKZBZortZ1ft1x+U9lqSV3+2pVQm3/9hogykl3stMyMVu61pLVPhkAFshUMCgs8ydJE0LBpQayd1pGA3q3UyLa4bkUR1LSTSSd3VOXRM0l9EWJare+voJOpa6lIwN4nTpVWdbq3utT1vXt2sy1sYAUyCzRXazq/brj8p7LUkrv9tSqhNv/7P/7pAQADMSiZdEBtGtyYwy6IDaNbkxNlUAHza3JibKoAPm1uRsMWrOudzM2OmtFTVLSmgICQFoJOMXkpxp6Znz2k6CtSJYM7LscrWxuLSIEddkGMk06+900kEayKf2qr/WhTZFF8Gkw59fXUlX72Q1a/trBpXPs7IvRrv1q7ye32/qqtbWONv/////////////////////////////////////////////////////////////////Gwxas653MzY6a0VNUtKaAgJAWgk4xeSnGnpmfPaToK1IlgzsuxytbG4tIgR12QYyTTr73TSQRrIp/aqv9aFNkUXwaTDn19dSVfvZDVr+2sGlc+zsi9Gu/WrvJ7fb+qq1tY42BEYjW1/nGM1xjrQSZFFy8ZAPsFp7yeJ71ssdJqzqqeYsxSHc9a0E9eOgRrR0KujrZFGjUk5dNnStUyNbqS33vWBSg+miSLo/oqX/1O/60nWoJMQlnv10qnV/RNXX/9v66x6giMRra/zjGa4x1oJMii5eMgH2C095PE962WOk1Z1VPMWYpDuetaCevHQI1o6FXR1sijRqScumzpWqZGt1Jb73rApQfTRJF0f0VL/6nf9aTrUEmISz366VTq/omrr/+39dY9f/7pAQACIQRa8yCc2tybK15kE5tbkzVmSQMza3BmrMkgZm1uAJ1Jc4knVMTKiXUS89SKklJFUCMAD/DjKZqbP0NA+jRZS0r1qVrUkvRMA4oW02RotWpWbMtuk6tR9a0dFSWp9VGt3mwdQRk0dq9FtVJ31o6LelqraXRBTQwNl/Vo+tutAvP9Wvb7dZwdxS/+bf///////////////////////////+BOpLnEk6piZUS6iXnqRUkpIqgRgAf4cZTNTZ+hoH0aLKWletStakl6JgHFC2myNFq1KzZlt0nVqPrWjoqS1Pqo1u82DqCMmjtXotqpO+tHRb0tVbS6IKaGBsv6tH1t1oF5/q17fbrODuKX/zYXlZNN3sandb+1YmKTM8ZJIoGJqfKgXSAVURcrkVajRUkZLLyR9GjpqmJo7KfXnTwrxVMnrpPWitHs6rXRSU62o2toKRa1b2TElCVNP7df/7/9RkLA/Rtqe1/t2qv6T6kv/sbGT/EQvKyabvY1O639qxMUmZ4ySRQMTU+VAukAqoi5XIq1GipIyWXkj6NHTVMTR2U+vOnhXiqZPXSetFaPZ1Wuikp1tRtbQUi1q3smJKEqaf26//3/6jIWB+jbU9r/btVf0n1Jf/Y2Mn+Iv/7pAQAD/PnTkWDT2rwYunIsGntXg3FOQgOPavBuKchAce1eBfLOWbVFljr915Ap1S+xjEX129gExAhQ8MNLe3vSsKLCff43/XGn3uTrLdtQmxoXdudWjU7sk9nsbl09fnk6pqZmleukpR0+Ck19q+79m//85Lgm5cUXnpOrQb2SPVT6TI4S//////////////////////////////////+L5ZyzaossdfuvIFOqX2MYi+u3sAmIEKHhhpb296VhRYT7/G/640+9ydZbtqE2NC7tzq0andkns9jcunr88nVNTM0r10lKOnwUmvtX3fs3//nJcE3Lii89J1aDeyR6qfSZHCUBjGNSmhpZRLubxpa16xXtZJv/lTMYtqMgTvcZ/rW8XX+f7f1rjdtor0WUsuoF1GjV+pL+qYl1FHRR90jprr9aisco7iWWj/1ot9X6tbc4OIljE6XZJ4KiXK7/+5YKhoOgqVteV9yw0WypL///yQDGMalNDSyiXc3jS1r1ivayTf/KmYxbUZAne4z/Wt4uv8/2/rXG7bRXospZdQLqNGr9SX9UxLqKOij7pHTXX61FY5R3EstH/rRb6v1a25wcRLGJ0uyTwVEuV3/9ywVDQdBUra8r7lhotlSX///kv/7pAQAD/S8KL4Dr2pgZcUXwHXtTAvsfPgOvalBfY+fAde1KDtIIysAWoOimY0iRySBrhrt0CGjYMZgbYb7UeNDngPv6Q5fuh4uJKm548m541eo42ktNTMgnOreo+tbOtHn8wk2iUkFrAbERdL78W1Rsxl311t2W3XuZXVeuzen9l36aPZ+yxvfv//////////////////////////////////////////////////////////////////ztIIysAWoOimY0iRySBrhrt0CGjYMZgbYb7UeNDngPv6Q5fuh4uJKm548m541eo42ktNTMgnOreo+tbOtHn8wk2iUkFrAbERdL78W1Rsxl311t2W3XuZXVeuzen9l36aPZ+yxvfvOUAfDAGYI8Sar3T0AwlwJGaCpoSjrG3Iw2dxpo+8tc03OmTLOmpuoxnZoyTmarUnSdB1IGRcTED0QMCAHkEiySMfTLQoo/gW9lt89oZzOrUl/6bdein9P7v9+r3/of3HKAPhgDMEeJNV7p6AYS4EjNBU0JR1jbkYbO400feWuabnTJlnTU3UYzs0ZJzNVqTpOg6kDIuJiB6IGBADyCRZJGPploUUfwLey2+e0M5nVqS/9NuvRT+n93+/V7/0P7v/7pAQAD/REGD2Dr3nAYoMHsHXvOA0QlvQOvalBohLegde1KDjYDVake3FZQ11yXfeJlmepqC2xqsD2j2kOK+8mquM7+TFIzzN56Qr7n3mEFCw8uBA2HhUwIyQoMLsOse9RMJgJRcSsrMMQ11R5y1LRltLaWOv7+llab+3GVo1/T37/6k/a7//////////////////////////////////////////////////zjYDVake3FZQ11yXfeJlmepqC2xqsD2j2kOK+8mquM7+TFIzzN56Qr7n3mEFCw8uBA2HhUwIyQoMLsOse9RMJgJRcSsrMMQ11R5y1LRltLaWOv7+llab+3GVo1/T37/6k/a44qAcs2yFTp2ILfeVQxLlI9X511AXLW2tcjVtvgtkkCS5mxhM61qUtcypJLMZlMVorUcrqqUtNSlrcxnDJpCDZg29z3PpQbDLnmkIShJkw9z3pQkh/ShD3PfpRTe9z5BCf/vc/6U3uOPOKgHLNshU6diC33lUMS5SPV+ddQFy1trXI1bb4LZJAkuZsYTOtalLXMqSSzGZTFaK1HK6qlLTUpa3MZwyaQg2YNvc9z6UGwy55pCEoSZMPc96UJIf0oQ9z36UU3vc+QQn/73P+lN7jj//7pAQAD/TKGr0Dj3nAYANXoHHvOAwsgPIOPelBhZAeQce9KD5wJAoDbiwKAH5iMHuTmt6ZID9/pszJAeyzxpptTYnhxYFocmZfCxWsau5/Nie40OISYAihdjEJQlQuxqUmDbjzGrFBg9yEJqFulOuylDntYytT3///p2NY3v/9n9KNrP///////////////////////////////////////////////////////////////////////////8+cCQKA24sCgB+YjB7k5remSA/f6bMyQHss8aabU2J4cWBaHJmXwsVrGrufzYnuNDiEmAIoXYxCUJULsalJg248xqxQYPchCahbpTrspQ57WMrU9///6djWN7//Z/Sjaw+UEQUDk+XTcindaEPHH500xsVY7qG24mc5IMd5HexqR6QbUjyvtQ6VjUvm1bwMz6zX63jP1eUgOKiEBNGhQuWSeekJoFjcckVKtfHoFk9SEs6WmetLXf/vr7X///1///9p8oIgoHJ8um5FO60IeOPzppjYqx3UNtxM5yQY7yO9jUj0g2pHlfah0rGpfNq3gZn1mv1vGfq8pAcVEICaNChcsk89ITQLG45IqVa+PQLJ6kJZ0tM9aWu//fX2v///r///7f/7pAQAD/S1HDyDj3pQYiOHkHHvSgw0cPAOPalBho4eAce1KDuwLJgKjJGlWs8uPa+lCqlewvmd7CnfQ4sZ/BnfyzRJNTSeaTVs1teLJ55czw87vmahkJEkFhjED2pHnQkSHtKBBAxqR7UlR7UjmIYh7d7Uj2lFfuUPalfq//9yv9X//1f3f/////////////////////////////////////////////////////////////////////ndgWTAVGSNKtZ5ce19KFVK9hfM72FO+hxYz+DO/lmiSamk80mrZra8WTzy5nh53fM1DISJILDGIHtSPOhIkPaUCCBjUj2pKj2pHMQxD272pHtKK/coe1K/V//7lf6v//q/uBbACoEXI6FinicTicQbnzk5NK05Mz1ta2uWWuqP3912PHjyRskZHDhxSTMzM255gibNmhKLi442J1uMmyQoKTCLjCGi4oNNm/tF1mDPq5pEXWrzZuxq/6v9Vd5v/9X/F/3AtgBUCLkdCxTxOJxOINz5ycmlacmZ62tbXLLXVH7+67Hjx5I2SMjhw4pJmZmbc8wRNmzQlFxccbE63GTZIUFJhFxhDRcUGmzf2i6zBn1c0iLrV5s3Y1f9X+qu83/+r/i/7v/7pAQAD/QpJLsDj3pQa6SXYHHvSgy0VPANvecBloqeAbe84DvQEQuXKsKqViLiy25GUNQ1QsuoT5XK1li+E+fPn2sQnz59bdZHz6Nv1gwbW3mta11rNa1rr2rWtf7WtFngaWeBoSxgNQ6Cq3gqVOh0BzwdwaIQsL2iXrm96YZN55Nq2RfavZp+GU/2f7P8h/////////////////////////////////+d6AiFy5VhVSsRcWW3IyhqGqFl1CfK5WssXwnz58+1iE+fPrbrI+fRt+sGDa281rWutZrWtde1a1r/a1os8DSzwNCWMBqHQVW8FSp0OgOeDuDRCFhe0S9c3vTDJvPJtWyL7V7NPwyn+z/Z/kD5iclAlKV3NddZ5YPRioVasY2BvamtufPX0WeaPEfw4EOSWSDasWeaeJcEwAaDwLCosDgOGjYZBkWCgTAJkyGhUVFRU0aNExQWFlmgCZiwu170FWtbpTrXe/iv//1f6v7lf6v//cfMTkoEpSu5rrrPLB6MVCrVjGwN7U1tz56+izzR4j+HAhySyQbVizzTxLgmADQeBYVFgcBw0bDIMiwUCYBMmQ0KioqKmjRomKCwss0ATMWF2vegq1rdKda738V//+r/V/cr/V//7v/7pAQAD/PekDcDrWtyY9IG4HWtbk3IcO4NvelBuQ4dwbe9KA+gGywxG6SnqTdBQSuxb5fRSUXa661LOqTZ1us4UE6dP07rdaSijTvf+utRYne+tf9RRve69f6ixd9da6/nCz/p/yjX+u/1Fi///KN//9RYv+v+os/6/5Z/r/qPf9f8o/6/1nP///////////////////////////////w+gGywxG6SnqTdBQSuxb5fRSUXa661LOqTZ1us4UE6dP07rdaSijTvf+utRYne+tf9RRve69f6ixd9da6/nCz/p/yjX+u/1Fi///KN//9RYv+v+os/6/5Z/r/qPf9f8o/6/1nDui8OI05F+LnfprklfuJuSGNqrbHTG+fyRH8Z5K/gTvKv5IkPbzESHPArHxSBWPil908TIUBcgJgMAQofEYgAw0LnCaAM4JsJiEAjj5wQFxo5zUF1DXNQXW+0rW9tMdbTfbUt/6vX1dvd/1f6v7jui8OI05F+LnfprklfuJuSGNqrbHTG+fyRH8Z5K/gTvKv5IkPbzESHPArHxSBWPil908TIUBcgJgMAQofEYgAw0LnCaAM4JsJiEAjj5wQFxo5zUF1DXNQXW+0rW9tMdbTfbUt/6vX1dvd/1f6v7v/7pAQAD/UkiDmDb2twalEHMG3tbgrWQNgLNa3JWsgbAWa1uT5ghHNAa0qD3ZlEPRGfjNJLrtK+newXsKeDR9mLLqNmtt1xFxuurZ1b2zXG66hU3nVs1xvbo3Xey6VFTro3XSsj1313X6j2u66rr66jzrv//PL//89//6j3/f9Tf//Pf//Pf/+o9//89/u/////////////////////////////////////////////////////////////////////////////8+YIRzQGtKg92ZRD0Rn4zSS67Svp3sF7Cng0fZiy6jZrbdcRcbrq2dW9s1xuuoVN51bNcb26N13sulRU66N10rI9d9d1+o9ruuq6+uo867//zy///Pf/+o9/3/U3//z3//z3//qPf//Pf7gYn7/TT/Kiiv+7/qILv+m9/OFF/6a/1FFP+7/nCi/9NevqIK/6b/nCD/u/6iC/9NP9RR/016+ogr/pv+cKP+m/5wgv/Tf9RBf+m/6ii/9N/zhBf+m/5UDE/f6af5UUV/3f9RBd/03v5wov/TX+oop/3f84UX/pr19RBX/Tf84Qf93/UQX/pp/qKP+mvX1EFf9N/zhR/03/OEF/6b/qIL/03/UUX/pv+cIL/03/Kv/7pAQAD/TpkDYCzWtyVrIGwFmtbkyGIOgNva3BkMQdAbe1uAYn7/TT/Kiiv+7/qILv+m9/OFF/6a/1FFP+7/nCi/9NevqIK/6b/nCD/u/6iC/9NP9RR/016+ogr/pv+cKP+m/5wgv/Tf9RBf+m/6ii/9N/zhBf+m/5V/////////////////////////////////////////////////////////////////////////////////////////////+DE/f6af5UUV/3f9RBd/03v5wov/TX+oop/3f84UX/pr19RBX/Tf84Qf93/UQX/pp/qKP+mvX1EFf9N/zhR/03/OEF/6b/qIL/03/UUX/pv+cIL/03/KiOQUsVvdZrlK/9NLKakqy+tSQX8J/Z5K/xEzHzHxEzHxTMTN8azfGsavvGs3xnGr7xq+7uqm6s8m6qdChT6dTafTp9Pzz9/v3qbf7/6P//z3//0f//nv//U3//z3//qb//57/cRyClit7rNcpX/ppZTUlWX1qSC/hP7PJX+ImY+Y+ImY+KZiZvjWb41jV941m+M41feNX3d1U3Vnk3VToUKfTqbT6dPp+efv9+9Tb/f/R//+e//+j//89//6m//+e//9Tf//Pf7g==',
    'data:audio/mp4;base64,AAAAHGZ0eXBNNEEgAAACAE00QSBpc29taXNvMgAAAAhmcmVlAABhQ21kYXQhAAUAoBv/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3pwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeyEQBQCgG//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADengAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAdyEQBQCgG//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADenAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB6IRAFAKAb/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAN6eAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB1IRAFAKAb/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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',
  ];
  const _coinAudioEls = _coinAudioB64.map(src => {
    const a = new window.Audio(src);
    a.volume = 0.55;
    return a;
  });
  let _lastCoinVariant = -1;

  function coinReal() {
    if (muted) return;
    // Alterna aleatoriamente entre as 2 variações, evitando repetir a mesma
    let v;
    do { v = Math.floor(Math.random() * _coinAudioEls.length); } while (v === _lastCoinVariant && _coinAudioEls.length > 1);
    _lastCoinVariant = v;
    const el = _coinAudioEls[v];
    el.currentTime = 0;
    el.play().catch(() => {});
  }

  // Expõe toggle de mute para o menu/pause
  function toggleMute() {
    muted = !muted;
    if (masterGain) masterGain.gain.value = muted ? 0 : masterVol;
    setMusicMuted(muted);
    return muted;
  }
  function isMuted() { return muted; }

  // Inicializa no primeiro gesto do usuário
  document.addEventListener('click', () => { init(); resume(); }, { once: false });
  document.addEventListener('keydown', () => { init(); resume(); }, { once: false });

  function gunShot() {
    if (!ctx || muted) return;
    // Tiro seco e rápido — crack de alta frequência + punch grave
    noise(0.28, 0.001, 0.04);
    sweep('square', 280, 60, 0.22, 0.07);
    osc('sine', 120, 0.15, 0.001, 0.02, 0, 0.05);
  }

  function ballKick() {
    if (!ctx || muted) return;
    // Chute: thud grave + puff de ar
    osc('sine', 140, 0.35, 0.001, 0.04, 0, 0.08);
    osc('triangle', 80, 0.2, 0.001, 0.06, 0, 0.10);
    noise(0.12, 0.001, 0.06);
  }

  return {
    sword, arrow, explosion, hit, playerHurt, heal, coin,
    axeWhoosh, katanaSlash, skeleton, blast, bombThrow,
    rollDash, gameOver, dungeonClear, specialActivate, laser,
    buffPick, cardDraw, manaPip, gunShot, ballKick,
    sniperReload, sniperShot,
    menuHover, menuClick, menuError,
    init, resume,
    coinReal, toggleMute, isMuted,
    playMusic, stopMusic, pauseMusic, resumeMusic,
    playDungeonMusic, stopDungeonMusic, pauseDungeonMusic, resumeDungeonMusic,
    playBuffMusic, stopBuffMusic,
    playJackpotMusic,
    playLobbyMusic, stopLobbyMusic,
    playShopMusic, stopShopMusic,
    playTrickyMusic, stopTrickyMusic, fadeTrickyMusicOut,
    pauseTrickyMusic, resumeTrickyMusic,
  };
})();



