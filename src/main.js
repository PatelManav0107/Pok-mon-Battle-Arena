/**
 * Master Application Entry Point
 * Orchestrates pure simulation (src/sim/), WebRTC networking (src/net/),
 * rendering engines (src/render/), and responsive user interfaces (src/ui/).
 */
import { CONFIG } from '../config.js';
import { POKEMON_POOL, ARENAS } from './sim/constants.js';
import { createInitialBattleState, serializeSnapshot, applySnapshot, ROUND_STATES } from './sim/state.js';
import { BattleSimulation } from './sim/simulation.js';
import { NetworkManager } from './net/network-manager.js';
import { SnapshotBuffer } from './net/snapshot-buffer.js';
import { audio } from './render/audio.js';
import { ArenaRenderer } from './render/arena-renderer.js';
import { FxEngine } from './render/fx-engine.js';
import { UltimateCutsceneEngine } from './render/ultimate-cutscene.js';
import { ControlsManager } from './ui/controls.js';
import { DebugOverlay } from './ui/debug-overlay.js';
import { MainMenu } from './ui/menu.js';
import { DraftScreen } from './ui/draft-screen.js';
import { OnlineLobby } from './ui/online-lobby.js';
import { BattleHud } from './ui/hud.js';

class GameApp {
  constructor() {
    this.mode = '1P'; // '1P' | 'CPU' | 'ONLINE'
    this.sim = null;
    this.net = new NetworkManager();
    this.snapshotBuffer = new SnapshotBuffer(CONFIG.NET.INTERPOLATION_OFFSET_MS);

    // Renderers
    this.arena = new ArenaRenderer('battleSceneContainer', 'battleFxCanvas', 'pokeballFxLayer');
    this.fx = new FxEngine('battleFxCanvas', 'battleSceneContainer');
    this.ultCutscene = new UltimateCutsceneEngine('ultCutsceneOverlay', 'ultCutsceneCanvas', 'battleFxCanvas');

    // UI Modules
    this.controls = new ControlsManager();
    this.debug = new DebugOverlay('debugOverlay');
    this.menu = null;
    this.draft = null;
    this.lobby = null;
    this.hud = null;

    // Simulation & Networking Loops
    this.simLoopTimer = null;
    this.snapshotBroadcastTimer = null;
    this.guestInputLoopTimer = null;
    this.lastRenderTime = performance.now();

    this.pendingLocalAction = null;
    this.rematchRequested = false;
  }

  init() {
    this.setupUI();
    this.setupNetworkingCallbacks();
    this.setupControls();
    this.debug.init(this.net, this.sim);

    // Audio & Header buttons
    const soundBtn = document.getElementById('soundToggleBtn');
    if (soundBtn) {
      soundBtn.onclick = () => {
        const on = audio.toggle();
        document.getElementById('soundIcon').textContent = on ? '🔊' : '🔇';
        document.getElementById('soundLabel').textContent = on ? 'SFX ON' : 'MUTED';
      };
    }

    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
      homeBtn.onclick = () => {
        audio.play('click');
        this.stopAllLoops();
        if (this.net.peer) this.net.disconnect();
        this.showScreen('startScreen');
      };
    }

    // Fullscreen Toggle Button
    const fsBtn = document.getElementById('fullscreenToggleBtn');
    if (fsBtn) {
      const updateFsState = () => {
        const isFs = !!document.fullscreenElement;
        const icon = document.getElementById('fullscreenIcon');
        const label = document.getElementById('fullscreenLabel');
        if (icon) icon.textContent = isFs ? '✕' : '⛶';
        if (label) label.textContent = isFs ? 'EXIT FULL' : 'FULLSCREEN';
      };

      fsBtn.onclick = async () => {
        audio.play('click');
        try {
          if (!document.fullscreenElement) {
            if (document.documentElement.requestFullscreen) {
              await document.documentElement.requestFullscreen();
            }
          } else {
            if (document.exitFullscreen) {
              await document.exitFullscreen();
            }
          }
        } catch (e) {
          console.warn('Fullscreen request failed:', e);
        }
        updateFsState();
      };

      document.addEventListener('fullscreenchange', () => {
        updateFsState();
        if (this.fx) this.fx.resize();
      });
    }

    window.addEventListener('resize', () => {
      if (this.fx) this.fx.resize();
    });

    this.showScreen('startScreen');
    this.menu.init();
  }

  showScreen(screenId) {
    ['startScreen', 'lobbyScreen', 'draftScreen', 'battleScreen'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });

    const activeEl = document.getElementById(screenId);
    if (activeEl) activeEl.classList.remove('hidden');

    const homeBtn = document.getElementById('homeBtn');
    const modeBadge = document.getElementById('modeBadge');
    if (homeBtn) {
      if (screenId === 'startScreen') homeBtn.classList.add('hidden');
      else homeBtn.classList.remove('hidden');
    }
    if (modeBadge) {
      if (screenId === 'startScreen') modeBadge.textContent = 'Title Screen';
      else if (screenId === 'lobbyScreen') modeBadge.textContent = `Online Room (${this.net.roomCode || 'Lobby'})`;
      else if (screenId === 'draftScreen') modeBadge.textContent = 'Team Draft';
      else if (screenId === 'battleScreen') modeBadge.textContent = this.mode === 'ONLINE' ? 'Online Match' : this.mode === 'CPU' ? 'AI Spectator' : 'Single Player';
    }
  }

  setupUI() {
    // 1. Main Menu
    this.menu = new MainMenu('startScreen', {
      onStart1P: () => this.startLocalDraft('1P'),
      onStartCpu: () => this.startLocalDraft('CPU'),
      onHostOnline: () => this.hostOnlineGame(),
      onJoinOnline: (code, isSpectator) => this.joinOnlineGame(code, isSpectator)
    });

    // 2. Draft Screen
    this.draft = new DraftScreen('draftScreen', (teamIds) => {
      if (this.mode === 'ONLINE') {
        if (this.net.role === 'HOST') {
          this.lobby.p1.team = teamIds;
          this.net.sendLobbyState({ p1: { team: teamIds } });
        } else {
          this.lobby.p2.team = teamIds;
          this.net.sendLobbyState({ p2: { team: teamIds } });
        }
        this.showScreen('lobbyScreen');
      } else {
        // Start offline match
        this.startOfflineBattle(teamIds);
      }
    });

    // 3. Online Lobby
    this.lobby = new OnlineLobby('lobbyScreen', {
      onStartBattle: (matchConfig) => this.launchOnlineBattle(matchConfig),
      onUpdateSettings: (payload) => {
        const data = (payload.settings || payload.p1 || payload.p2) ? payload : { settings: payload };
        this.net.sendLobbyState(data);
      },
      onDraftRequest: (playerKey) => {
        const initial = playerKey === 'p1' ? this.lobby.p1.team : this.lobby.p2.team;
        this.draft.init({ teamSize: this.lobby.settings.teamSize, isOnline: true, initialTeam: initial });
        this.showScreen('draftScreen');
      },
      onLeave: () => {
        this.net.disconnect();
        this.showScreen('startScreen');
      }
    });

    // 4. Battle HUD
    this.hud = new BattleHud({
      onMoveSelected: (moveIdx) => {
        this.queueLocalCombatAction({ type: 'move', moveIdx });
      },
      onUltSelected: () => {
        this.queueLocalCombatAction({ type: 'ult' });
      },
      onSwitchSelected: (targetIdx) => {
        this.queueLocalCombatAction({ type: 'switch', targetIdx });
      },
      onRematchRequest: () => {
        this.handleRematch();
      },
      onReturnMenu: () => {
        this.stopAllLoops();
        this.showScreen('startScreen');
      }
    });

    // Rematch Modal buttons
    const rematchBtn = document.getElementById('rematchBtn');
    if (rematchBtn) rematchBtn.onclick = () => this.handleRematch();

    const returnMenuBtn = document.getElementById('returnMenuBtn');
    if (returnMenuBtn) returnMenuBtn.onclick = () => {
      document.getElementById('gameOverModal')?.classList.add('hidden');
      this.stopAllLoops();
      this.showScreen('startScreen');
    };
  }

  setupControls() {
    this.controls.onActionCallback = (type, index) => {
      if (!this.sim || this.sim.state.roundState !== ROUND_STATES.ACTIVE_COMBAT) return;

      const isP1 = this.net.role !== 'GUEST';
      const mySide = isP1 ? this.sim.state.p1 : this.sim.state.p2;

      if (type === 'number') {
        if (this.hud.isSwitchMenuOpen) {
          this.hud.isSwitchMenuOpen = false;
          this.queueLocalCombatAction({ type: 'switch', targetIdx: index });
        } else {
          this.queueLocalCombatAction({ type: 'move', moveIdx: index });
        }
      } else if (type === 'ultimate') {
        this.queueLocalCombatAction({ type: 'ult' });
      } else if (type === 'switch_toggle') {
        if (this.hud.isSwitchMenuOpen) this.hud.closeSwitchMenu();
        else this.hud.openSwitchMenu(false, mySide);
      }
    };

    this.controls.onTabVisibilityChange = (isActive) => {
      if (this.mode === 'ONLINE' && this.net.role === 'GUEST') {
        this.net.sendInput(this.sim?.state?.frame || 0, { type: 'blur', active: isActive });
      }
    };
  }

  setupNetworkingCallbacks() {
    this.net.onConnected = ({ role, roomCode }) => {
      this.lobby.setRole(role, roomCode);
      if (role === 'HOST') {
        this.lobby.p2.connected = true;
        this.lobby.p2.name = 'Player 2';
        this.net.sendLobbyState({
          p1: this.lobby.p1,
          settings: this.lobby.settings
        });
      }
      this.showScreen('lobbyScreen');
    };

    this.net.onLobbyState = (data) => {
      this.lobby.updateLobbyState(data);
    };

    this.net.onSnapshot = (snapshot, receiveTime) => {
      this.snapshotBuffer.addSnapshot(snapshot, receiveTime);
      if (this.sim && snapshot) {
        applySnapshot(this.sim.state, snapshot);
      }
    };

    this.net.onGameEvent = (event) => {
      this.handleNetworkGameEvent(event);
    };

    this.net.onDisconnect = ({ countdown, forfeitWinner, reason }) => {
      if (countdown !== undefined) {
        this.hud.showDisconnectNotice(countdown);
      }
      if (forfeitWinner) {
        this.hud.hideDisconnectNotice();
        this.hud.showGameOver({
          winnerIsP1: forfeitWinner === 'HOST',
          isLocalP1: this.net.role === 'HOST'
        });
      }
      if (reason) {
        this.hud.appendLog(`⚠️ ${reason}`, 'text-rose-400 font-bold');
      }
    };

    this.net.onGuestInput = (msg) => {
      // Host validates and queues guest action
      if (this.sim && msg.action) {
        this.sim.queueAction('p2', msg.action);
      }
    };
  }

  // Handle Reliable Network Game Events
  async handleNetworkGameEvent(event) {
    if (!event) return;

    if (event.type === 'BATTLE_INIT' && this.net.role !== 'HOST') {
      this.launchOnlineBattle(event.matchConfig);
      return;
    }

    if (event.type === 'ROUND_START') {
      audio.play('fight');
      this.hud.appendLog(`⚔️ Round ${event.round} Start!`, 'text-amber-300 font-extrabold');
      await Promise.all([
        this.arena.playPokeballEnter(true),
        this.arena.playPokeballEnter(false)
      ]);
    } else if (event.type === 'HIT') {
      const isLocalAttacker = (event.attackerIsP1 && this.net.role !== 'GUEST') ||
                              (!event.attackerIsP1 && this.net.role === 'GUEST');
      this.hud.appendLog(`${event.moveName} struck! (-${event.damage} HP)`, isLocalAttacker ? 'text-amber-300' : 'text-cyan-300');
      await this.fx.playMoveAnimation({ name: event.moveName, type: event.moveType }, isLocalAttacker);
      await this.arena.playHitReaction(!isLocalAttacker, event.damage, 160, event.effectiveness, event.isCrit);
    } else if (event.type === 'ULTIMATE_CINEMATIC_START') {
      const isLocalAttacker = (event.attackerIsP1 && this.net.role !== 'GUEST') ||
                              (!event.attackerIsP1 && this.net.role === 'GUEST');
      const poke = POKEMON_POOL.find(p => p.id === event.pokemonId) || POKEMON_POOL[0];
      const trainerName = isLocalAttacker ? 'You' : 'Opponent';
      await this.ultCutscene.play(poke, trainerName, isLocalAttacker);
    } else if (event.type === 'SWITCH') {
      const isLocal = (event.playerKey === 'p1' && this.net.role !== 'GUEST') ||
                      (event.playerKey === 'p2' && this.net.role === 'GUEST');
      await this.arena.playPokeballRecall(isLocal);
      await this.arena.playPokeballEnter(isLocal);
      this.hud.appendLog(`${isLocal ? 'You' : 'Opponent'} sent out ${event.pokemon.name}!`);
    } else if (event.type === 'MATCH_OVER') {
      this.hud.showGameOver({
        winnerIsP1: event.winnerIsP1,
        p1Score: event.p1Score,
        p2Score: event.p2Score,
        isLocalP1: this.net.role !== 'GUEST'
      });
    } else if (event.type === 'REMATCH_ACCEPTED') {
      document.getElementById('gameOverModal')?.classList.add('hidden');
      if (this.net.role === 'HOST') {
        this.launchOnlineBattle({
          settings: this.lobby.settings,
          p1Team: this.lobby.p1.team,
          p2Team: this.lobby.p2.team
        });
      }
    }
  }

  // --- HOSTING & JOINING ---
  async hostOnlineGame() {
    this.mode = 'ONLINE';
    try {
      const code = await this.net.hostGame();
      this.lobby.setRole('HOST', code);
      this.showScreen('lobbyScreen');
    } catch (err) {
      alert(`Error hosting game: ${err.message}`);
    }
  }

  async joinOnlineGame(code, isSpectator = false) {
    this.mode = 'ONLINE';
    this.hud.isSpectator = isSpectator;
    try {
      await this.net.joinGame(code, isSpectator);
      this.lobby.setRole(isSpectator ? 'SPECTATOR' : 'GUEST', code);
      this.showScreen('lobbyScreen');
    } catch (err) {
      alert(`Error joining room: ${err.message}`);
    }
  }

  // --- LAUNCH BATTLE ---
  launchOnlineBattle(matchConfig) {
    const isHost = this.net.role === 'HOST';

    if (isHost) {
      this.net.broadcastEvent({
        type: 'BATTLE_INIT',
        matchConfig
      });
    }

    const initState = createInitialBattleState({
      arena: matchConfig.settings.arena,
      teamSize: matchConfig.settings.teamSize,
      roundTime: matchConfig.settings.roundTime,
      bestOf: matchConfig.settings.bestOf,
      p1: { name: this.lobby.p1.name, teamIds: matchConfig.p1Team, isAI: false },
      p2: { name: this.lobby.p2.name, teamIds: matchConfig.p2Team, isAI: false }
    });

    this.sim = new BattleSimulation(initState);
    this.arena.setArena(matchConfig.settings.arena);

    this.showScreen('battleScreen');
    this.hud.update(this.sim.state, isHost);

    if (isHost) {
      this.startHostSimLoop();
    } else {
      this.startGuestRenderLoop();
    }
  }

  startHostSimLoop() {
    this.stopAllLoops();

    // 1. 60Hz Simulation Step
    this.simLoopTimer = setInterval(() => {
      if (!this.sim) return;
      const events = this.sim.update();

      // Broadcast events reliably
      events.forEach(ev => {
        this.net.broadcastEvent(ev);
        this.handleNetworkGameEvent(ev);
      });
    }, 1000 / CONFIG.SIM.TICK_RATE);

    // 2. 30Hz Snapshot Broadcast
    this.snapshotBroadcastTimer = setInterval(() => {
      if (!this.sim) return;
      const snap = serializeSnapshot(this.sim.state);
      this.net.broadcastSnapshot(snap);
      this.hud.update(this.sim.state, true);
    }, CONFIG.SIM.SNAPSHOT_INTERVAL_MS);
  }

  startGuestRenderLoop() {
    this.stopAllLoops();

    // 1. 60Hz Input Sender
    this.guestInputLoopTimer = setInterval(() => {
      if (this.pendingLocalAction) {
        this.net.sendInput(this.sim?.state?.frame || 0, this.pendingLocalAction, this.controls.inputDelayFrames);
        this.pendingLocalAction = null;
      }
    }, 1000 / 60);

    // 2. Interpolation Render Frame
    const render = () => {
      if (this.mode === 'ONLINE' && this.net.role !== 'HOST') {
        const interpState = this.snapshotBuffer.getInterpolatedState();
        if (interpState && this.sim) {
          applySnapshot(this.sim.state, interpState);
          this.hud.update(this.sim.state, false);
        }
        requestAnimationFrame(render);
      }
    };
    requestAnimationFrame(render);
  }

  queueLocalCombatAction(action) {
    if (this.mode === 'ONLINE') {
      if (this.net.role === 'HOST') {
        this.sim.queueAction('p1', action);
      } else {
        this.pendingLocalAction = action;
        this.snapshotBuffer.predictAction(this.sim?.state?.frame || 0, action);
      }
    } else {
      // Offline mode
      this.sim.queueAction('p1', action);
    }
  }

  // --- OFFLINE 1P & CPU MODES ---
  startLocalDraft(mode) {
    this.mode = mode;
    this.draft.init({ teamSize: 4, isOnline: false });
    this.showScreen('draftScreen');
  }

  startOfflineBattle(p1TeamIds) {
    const p2TeamIds = [150, 448, 130, 94]; // Default AI team
    const initState = createInitialBattleState({
      arena: 'stadium',
      p1: { name: this.mode === 'CPU' ? 'Computer 1' : 'You', teamIds: p1TeamIds, isAI: this.mode === 'CPU' },
      p2: { name: 'Computer 2', teamIds: p2TeamIds, isAI: true }
    });

    this.sim = new BattleSimulation(initState);
    this.arena.setArena('stadium');
    this.showScreen('battleScreen');

    this.stopAllLoops();
    this.simLoopTimer = setInterval(() => {
      if (!this.sim) return;
      const events = this.sim.update();
      events.forEach(ev => this.handleNetworkGameEvent(ev));
      this.hud.update(this.sim.state, true);
    }, 1000 / CONFIG.SIM.TICK_RATE);
  }

  handleRematch() {
    audio.play('click');
    if (this.mode === 'ONLINE') {
      if (!this.rematchRequested) {
        this.rematchRequested = true;
        this.net.broadcastEvent({ type: 'REMATCH_ACCEPTED' });
        this.hud.appendLog('✓ You accepted rematch! Waiting for opponent...', 'text-amber-300 font-bold');
      }
    } else {
      document.getElementById('gameOverModal')?.classList.add('hidden');
      this.startOfflineBattle([25, 6, 9, 3]);
    }
  }

  stopAllLoops() {
    if (this.simLoopTimer) clearInterval(this.simLoopTimer);
    if (this.snapshotBroadcastTimer) clearInterval(this.snapshotBroadcastTimer);
    if (this.guestInputLoopTimer) clearInterval(this.guestInputLoopTimer);
    this.simLoopTimer = null;
    this.snapshotBroadcastTimer = null;
    this.guestInputLoopTimer = null;
  }
}

// Instantiate and start app
window.addEventListener('DOMContentLoaded', () => {
  const app = new GameApp();
  app.init();
});
