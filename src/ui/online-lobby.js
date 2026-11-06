/**
 * Online Lobby & Room Manager
 * Manages room codes, match settings, player ready checks, spectators, and 3-2-1 countdown.
 */
import { ARENAS } from '../sim/constants.js';
import { audio } from '../render/audio.js';

export class OnlineLobby {
  constructor(containerId, { onStartBattle, onUpdateSettings, onDraftRequest, onLeave }) {
    this.container = document.getElementById(containerId);
    this.onStartBattle = onStartBattle;
    this.onUpdateSettings = onUpdateSettings;
    this.onDraftRequest = onDraftRequest;
    this.onLeave = onLeave;

    this.role = 'HOST'; // 'HOST' | 'GUEST' | 'SPECTATOR'
    this.roomCode = '';
    this.p1 = { name: 'Player 1', ready: false, ping: 0, team: [25, 6, 9, 3] };
    this.p2 = { name: 'Waiting for player...', ready: false, ping: 0, connected: false, team: [150, 448, 130, 94] };
    this.spectatorCount = 0;

    // Match Settings (Controlled by Host)
    this.settings = {
      arena: 'stadium',
      teamSize: 4,
      bestOf: 1,
      roundTime: 90
    };

    this.countdown = 0;
    this.countdownTimer = null;
  }

  setRole(role, roomCode) {
    if (role) this.role = role;
    if (roomCode) this.roomCode = roomCode;
    this.render();
  }

  updateLobbyState(state) {
    if (state.settings && this.role !== 'HOST') {
      this.settings = { ...this.settings, ...state.settings };
    }
    if (state.p1) this.p1 = { ...this.p1, ...state.p1 };
    if (state.p2) this.p2 = { ...this.p2, ...state.p2 };
    if (state.spectatorCount !== undefined) this.spectatorCount = state.spectatorCount;

    // Check if both ready
    if (this.p1.ready && this.p2.ready && !this.countdownTimer) {
      this.startCountdown();
    } else if ((!this.p1.ready || !this.p2.ready) && this.countdownTimer) {
      this.cancelCountdown();
    }

    this.render();
  }

  startCountdown() {
    this.countdown = 3;
    audio.play('countdown');
    this.render();

    this.countdownTimer = setInterval(() => {
      this.countdown--;
      if (this.countdown > 0) {
        audio.play('countdown');
        this.render();
      } else {
        audio.play('fight');
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        if (this.onStartBattle) {
          this.onStartBattle({
            settings: this.settings,
            p1Team: this.p1.team,
            p2Team: this.p2.team
          });
        }
      }
    }, 1000);
  }

  cancelCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
      this.countdown = 0;
      this.render();
    }
  }

  copyRoomCode() {
    audio.play('click');
    navigator.clipboard.writeText(this.roomCode).then(() => {
      const btn = document.getElementById('copyCodeBtn');
      if (btn) btn.textContent = '✓ Copied!';
      setTimeout(() => { if (btn) btn.textContent = '📋 Copy Code'; }, 2000);
    });
  }

  copyShareLink() {
    audio.play('click');
    const url = `${window.location.origin}${window.location.pathname}?room=${this.roomCode}`;
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.getElementById('copyLinkBtn');
      if (btn) btn.textContent = '✓ Link Copied!';
      setTimeout(() => { if (btn) btn.textContent = '🔗 Share Link'; }, 2000);
    });
  }

  render() {
    if (!this.container) return;

    const isHost = this.role === 'HOST';
    const isGuest = this.role === 'GUEST';
    const isSpectator = this.role === 'SPECTATOR';

    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${this.roomCode}`;

    this.container.innerHTML = `
      <div class="p-4 sm:p-6 bg-slate-900 flex flex-col gap-4 max-w-3xl mx-auto w-full">
        <!-- Room Code & Connection Banner -->
        <div class="bg-gradient-to-r from-slate-800 to-slate-900 border-2 border-amber-400/80 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div class="text-[11px] font-black uppercase tracking-widest text-amber-400 mb-1">
              ONLINE MULTIPLAYER ROOM
            </div>
            <div class="flex items-center gap-3">
              <span class="font-display font-black text-3xl sm:text-4xl text-white tracking-widest bg-slate-950 px-4 py-1.5 rounded-2xl border border-slate-700">
                ${this.roomCode}
              </span>
              <button id="copyCodeBtn" class="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold border border-slate-500 transition">
                📋 Copy Code
              </button>
              <button id="copyLinkBtn" class="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 text-xs font-bold border border-amber-400/50 transition">
                🔗 Share Link
              </button>
            </div>
          </div>

          <!-- Spectator Badge -->
          <div class="flex items-center gap-2 bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2">
            <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span class="text-xs font-bold text-slate-300">
              Spectators: <strong class="text-white">${this.spectatorCount}</strong> / 6
            </span>
          </div>
        </div>

        <!-- 3-2-1 Countdown Overlay Banner -->
        ${this.countdown > 0 ? `
          <div class="bg-gradient-to-r from-amber-500 to-rose-600 rounded-2xl p-4 text-center animate-bounce shadow-xl">
            <div class="font-display font-black text-4xl text-white">
              BATTLE STARTS IN: ${this.countdown}
            </div>
          </div>
        ` : ''}

        <!-- Two Player Status Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <!-- Player 1 (Host) -->
          <div class="bg-slate-800 border-2 ${this.p1.ready ? 'border-emerald-400 bg-emerald-500/10' : 'border-slate-700'} rounded-2xl p-4 shadow flex flex-col justify-between">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="text-lg">👑</span>
                <span class="font-display font-bold text-white text-base">${this.p1.name} (Host)</span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${this.p1.ready ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'}">
                ${this.p1.ready ? '✓ READY' : 'NOT READY'}
              </span>
            </div>
            <div class="text-xs text-slate-400 mb-3">
              Team: <strong class="text-amber-300">${this.p1.team.length} Pokémon selected</strong>
            </div>
            ${isHost ? `
              <div class="flex items-center gap-2">
                <button id="p1DraftBtn" class="flex-1 py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold border border-slate-500 transition">
                  ✏️ Edit Squad
                </button>
                <button id="p1ReadyBtn" class="flex-1 py-2 px-3 rounded-xl ${this.p1.ready ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-500 hover:bg-emerald-400'} text-slate-950 font-display font-bold text-xs uppercase transition shadow">
                  ${this.p1.ready ? 'Cancel Ready' : 'Ready!'}
                </button>
              </div>
            ` : ''}
          </div>

          <!-- Player 2 (Guest) -->
          <div class="bg-slate-800 border-2 ${this.p2.ready ? 'border-emerald-400 bg-emerald-500/10' : 'border-slate-700'} rounded-2xl p-4 shadow flex flex-col justify-between">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="text-lg">⚔️</span>
                <span class="font-display font-bold text-white text-base">${this.p2.name}</span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${this.p2.ready ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'}">
                ${this.p2.connected ? (this.p2.ready ? '✓ READY' : 'NOT READY') : 'WAITING...'}
              </span>
            </div>
            <div class="text-xs text-slate-400 mb-3">
              ${this.p2.connected ? `Team: <strong class="text-cyan-300">${this.p2.team.length} Pokémon selected</strong>` : 'Share room code to invite opponent!'}
            </div>
            ${isGuest ? `
              <div class="flex items-center gap-2">
                <button id="p2DraftBtn" class="flex-1 py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold border border-slate-500 transition">
                  ✏️ Edit Squad
                </button>
                <button id="p2ReadyBtn" class="flex-1 py-2 px-3 rounded-xl ${this.p2.ready ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-500 hover:bg-emerald-400'} text-slate-950 font-display font-bold text-xs uppercase transition shadow">
                  ${this.p2.ready ? 'Cancel Ready' : 'Ready!'}
                </button>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Host Match Rules & Arena Settings -->
        <div class="bg-slate-800/90 border border-slate-700 rounded-2xl p-4">
          <div class="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-3 flex items-center justify-between">
            <span>🏟️ Match Rules & Arena Selection</span>
            ${!isHost ? '<span class="text-[10px] text-slate-400 lowercase">(configured by host)</span>' : ''}
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <!-- Arena Selection -->
            <div>
              <label class="block text-slate-400 mb-1 font-bold">Arena:</label>
              <select id="arenaSelect" ${!isHost ? 'disabled' : ''} class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-semibold">
                ${ARENAS.map(a => `<option value="${a.id}" ${this.settings.arena === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
              </select>
            </div>

            <!-- Team Size -->
            <div>
              <label class="block text-slate-400 mb-1 font-bold">Team Size:</label>
              <select id="teamSizeSelect" ${!isHost ? 'disabled' : ''} class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-semibold">
                <option value="1" ${this.settings.teamSize === 1 ? 'selected' : ''}>1 vs 1 Duel</option>
                <option value="2" ${this.settings.teamSize === 2 ? 'selected' : ''}>2 vs 2</option>
                <option value="3" ${this.settings.teamSize === 3 ? 'selected' : ''}>3 vs 3 Standard</option>
                <option value="4" ${this.settings.teamSize === 4 ? 'selected' : ''}>4 vs 4 Stadium</option>
              </select>
            </div>

            <!-- Match Format -->
            <div>
              <label class="block text-slate-400 mb-1 font-bold">Format:</label>
              <select id="bestOfSelect" ${!isHost ? 'disabled' : ''} class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-semibold">
                <option value="1" ${this.settings.bestOf === 1 ? 'selected' : ''}>Single Match</option>
                <option value="3" ${this.settings.bestOf === 3 ? 'selected' : ''}>Best of 3 Sets</option>
              </select>
            </div>

            <!-- Turn Timer -->
            <div>
              <label class="block text-slate-400 mb-1 font-bold">Battle Timer:</label>
              <select id="roundTimeSelect" ${!isHost ? 'disabled' : ''} class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-semibold">
                <option value="60" ${this.settings.roundTime === 60 ? 'selected' : ''}>60 Seconds</option>
                <option value="90" ${this.settings.roundTime === 90 ? 'selected' : ''}>90 Seconds</option>
                <option value="0" ${this.settings.roundTime === 0 ? 'selected' : ''}>Unlimited</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Exit Lobby Button -->
        <div class="flex justify-between items-center pt-2">
          <button id="leaveLobbyBtn" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-600 transition">
            ← Exit Lobby
          </button>
          <span class="text-[11px] text-slate-500">
            Press <strong class="text-slate-300">F3</strong> anytime to toggle Ping & Snapshot rate monitor
          </span>
        </div>
      </div>
    `;

    // Bind event listeners
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    if (copyCodeBtn) copyCodeBtn.addEventListener('click', () => this.copyRoomCode());

    const copyLinkBtn = document.getElementById('copyLinkBtn');
    if (copyLinkBtn) copyLinkBtn.addEventListener('click', () => this.copyShareLink());

    const leaveBtn = document.getElementById('leaveLobbyBtn');
    if (leaveBtn) leaveBtn.addEventListener('click', () => { if (this.onLeave) this.onLeave(); });

    if (isHost) {
      ['arenaSelect', 'teamSizeSelect', 'bestOfSelect', 'roundTimeSelect'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('change', () => {
            this.settings.arena = document.getElementById('arenaSelect').value;
            this.settings.teamSize = parseInt(document.getElementById('teamSizeSelect').value, 10);
            this.settings.bestOf = parseInt(document.getElementById('bestOfSelect').value, 10);
            this.settings.roundTime = parseInt(document.getElementById('roundTimeSelect').value, 10);
            if (this.onUpdateSettings) this.onUpdateSettings(this.settings);
          });
        }
      });

      const p1DraftBtn = document.getElementById('p1DraftBtn');
      if (p1DraftBtn) p1DraftBtn.addEventListener('click', () => { if (this.onDraftRequest) this.onDraftRequest('p1'); });

      const p1ReadyBtn = document.getElementById('p1ReadyBtn');
      if (p1ReadyBtn) p1ReadyBtn.addEventListener('click', () => {
        this.p1.ready = !this.p1.ready;
        audio.play('click');
        if (this.onUpdateSettings) this.onUpdateSettings({ p1: this.p1 });
        this.render();
      });
    }

    if (isGuest) {
      const p2DraftBtn = document.getElementById('p2DraftBtn');
      if (p2DraftBtn) p2DraftBtn.addEventListener('click', () => { if (this.onDraftRequest) this.onDraftRequest('p2'); });

      const p2ReadyBtn = document.getElementById('p2ReadyBtn');
      if (p2ReadyBtn) p2ReadyBtn.addEventListener('click', () => {
        this.p2.ready = !this.p2.ready;
        audio.play('click');
        if (this.onUpdateSettings) this.onUpdateSettings({ p2: this.p2 });
        this.render();
      });
    }
  }
}
