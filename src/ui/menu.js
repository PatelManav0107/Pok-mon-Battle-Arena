/**
 * Main Title Menu & Online Mode Selector
 * Directs players to Single Player AI, Watch CPU, or Online Host/Join.
 */
import { audio } from '../render/audio.js';

export class MainMenu {
  constructor(containerId, { onStart1P, onStartCpu, onHostOnline, onJoinOnline }) {
    this.container = document.getElementById(containerId);
    this.onStart1P = onStart1P;
    this.onStartCpu = onStartCpu;
    this.onHostOnline = onHostOnline;
    this.onJoinOnline = onJoinOnline;
  }

  init() {
    this.render();
    this.checkUrlForRoomCode();
  }

  checkUrlForRoomCode() {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      this.openJoinModal(roomParam.toUpperCase());
    }
  }

  openJoinModal(prefilledCode = '') {
    audio.play('click');
    let modal = document.getElementById('joinRoomModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'joinRoomModal';
      modal.className = 'fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-slate-900 border-4 border-cyan-400 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl relative">
        <h3 class="font-display font-black text-2xl text-white mb-2">JOIN ONLINE ROOM</h3>
        <p class="text-xs text-slate-300 mb-4">
          Enter the 5-character room code from your friend to battle or watch.
        </p>

        ${prefilledCode ? `
          <div class="bg-amber-500/15 border border-amber-400/60 rounded-2xl p-3 mb-4 text-center">
            <span class="text-[11px] text-amber-300 font-extrabold uppercase tracking-wider">🎮 Battle Invitation</span>
            <div class="font-display font-black text-3xl text-amber-400 tracking-widest my-1">${prefilledCode}</div>
            <span class="text-[10px] text-amber-200/90 font-medium">Click "Join as Player" below to connect with your friend!</span>
          </div>
        ` : ''}

        <div id="joinErrorBanner" class="hidden mb-4 bg-rose-950/90 border border-rose-500 text-rose-200 text-xs p-3 rounded-xl font-bold text-left animate-pulse"></div>

        <div class="space-y-4 mb-6">
          <div>
            <label class="block text-left text-xs font-bold text-slate-400 mb-1">Room Code (5 letters):</label>
            <input id="joinCodeInput" type="text" maxlength="5" value="${prefilledCode}" placeholder="ABCDE"
                   class="w-full bg-slate-950 border-2 border-cyan-500 rounded-2xl px-4 py-3 text-center text-2xl font-display font-bold text-white tracking-widest uppercase focus:outline-none focus:border-cyan-300" />
          </div>

          <div class="flex items-center gap-3">
            <button id="joinAsPlayerBtn" class="btn-3d flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 text-white font-display font-bold text-sm border-2 border-cyan-200 shadow-[0_4px_0_#1e3a8a] flex items-center justify-center">
              ⚔️ Join as Player
            </button>
            <button id="joinAsSpectatorBtn" class="btn-3d flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-display font-bold text-sm border-2 border-slate-600">
              👁️ Watch (Spectate)
            </button>
          </div>
        </div>

        <button id="closeJoinModalBtn" class="text-xs font-bold text-slate-400 hover:text-white transition">
          ✕ Cancel
        </button>
      </div>
    `;
    modal.classList.remove('hidden');

    const input = document.getElementById('joinCodeInput');
    const playerBtn = document.getElementById('joinAsPlayerBtn');
    const specBtn = document.getElementById('joinAsSpectatorBtn');
    const errBanner = document.getElementById('joinErrorBanner');

    if (input) {
      input.focus();
      input.oninput = () => {
        input.value = input.value.toUpperCase();
        input.classList.remove('border-rose-500');
        if (errBanner) errBanner.classList.add('hidden');
      };
    }

    const executeJoin = async (isSpectator) => {
      const code = input.value.trim().toUpperCase();
      if (code.length !== 5) {
        input.classList.add('border-rose-500');
        if (errBanner) {
          errBanner.textContent = 'Please enter a valid 5-character room code.';
          errBanner.classList.remove('hidden');
        }
        return;
      }

      audio.play('click');
      if (errBanner) errBanner.classList.add('hidden');

      const activeBtn = isSpectator ? specBtn : playerBtn;
      const originalText = activeBtn.innerHTML;
      activeBtn.disabled = true;
      (isSpectator ? playerBtn : specBtn).disabled = true;
      activeBtn.innerHTML = '<span class="inline-block animate-spin mr-1.5">⏳</span> Connecting to host...';

      try {
        if (this.onJoinOnline) {
          await this.onJoinOnline(code, isSpectator);
        }
        modal.classList.add('hidden');
      } catch (err) {
        if (errBanner) {
          errBanner.textContent = err.message || 'Failed to connect to room. Please check the code.';
          errBanner.classList.remove('hidden');
        }
      } finally {
        activeBtn.disabled = false;
        (isSpectator ? playerBtn : specBtn).disabled = false;
        activeBtn.innerHTML = originalText;
      }
    };

    playerBtn.onclick = () => executeJoin(false);
    specBtn.onclick = () => executeJoin(true);

    document.getElementById('closeJoinModalBtn').onclick = () => {
      modal.classList.add('hidden');
    };
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="flex-1 w-full p-6 sm:p-12 flex flex-col items-center justify-center text-center bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 relative overflow-hidden">
        <!-- Floating Sprites Showcase -->
        <div class="flex items-center justify-center gap-3 sm:gap-5 mb-5 flex-wrap">
          <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png" class="w-16 h-16 sm:w-20 sm:h-20 poke-sprite idle-6" alt="Charizard" />
          <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png" class="w-16 h-16 sm:w-20 sm:h-20 poke-sprite idle-150" alt="Mewtwo" />
          <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png" class="w-16 h-16 sm:w-20 sm:h-20 poke-sprite idle-25" alt="Pikachu" />
          <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/384.png" class="w-16 h-16 sm:w-20 sm:h-20 poke-sprite idle-384" alt="Rayquaza" />
          <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/448.png" class="w-16 h-16 sm:w-20 sm:h-20 poke-sprite idle-448" alt="Lucario" />
        </div>

        <div class="inline-block px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-black uppercase tracking-widest mb-3">
          22 Pokémon • P2P WebRTC Online Multiplayer • 60Hz Sim
        </div>

        <h2 class="font-display text-4xl sm:text-7xl font-bold text-white tracking-tight mb-3 drop-shadow-lg">
          CHOOSE YOUR <span class="text-amber-400">BATTLE</span>
        </h2>
        <p class="text-slate-300 max-w-xl text-sm sm:text-base mb-8 leading-relaxed">
          Challenge friends online over the internet with zero server lag, draft balanced teams, and unleash 22 cinematic Anime Ultimate Overdrives!
        </p>

        <!-- 3 MODE SELECTION CARDS -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-5xl">
          <!-- 1P vs AI -->
          <button id="menu1PBtn" class="btn-3d flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 border-4 border-amber-200 shadow-[0_7px_0_#b45309]">
            <div class="text-4xl mb-2">🎮</div>
            <span class="font-display text-xl sm:text-2xl font-bold">1P vs Computer</span>
            <span class="text-xs font-bold text-amber-950/80 mt-1">Practice offline against AI</span>
          </button>

          <!-- Online Multiplayer (FEATURED) -->
          <button id="menuOnlineBtn" class="btn-3d flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white border-4 border-rose-200 shadow-[0_7px_0_#991b1b] ring-4 ring-rose-400/40 animate-pulse">
            <div class="text-4xl mb-2">🌐</div>
            <span class="font-display text-xl sm:text-2xl font-bold">Play Online</span>
            <span class="text-xs font-semibold text-rose-100 mt-1">Host room or join via code</span>
          </button>

          <!-- Watch CPU vs CPU -->
          <button id="menuCpuBtn" class="btn-3d flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-white border-4 border-cyan-200 shadow-[0_7px_0_#1e3a8a]">
            <div class="text-4xl mb-2">🤖</div>
            <span class="font-display text-xl sm:text-2xl font-bold">Watch AI vs AI</span>
            <span class="text-xs font-semibold text-cyan-100 mt-1">Spectator coach simulation</span>
          </button>
        </div>

        <!-- Online Submenu Modal Trigger / Prompt -->
        <div id="onlineChoiceBar" class="hidden mt-6 bg-slate-800/90 border-2 border-rose-400 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-xl shadow-xl">
          <div class="text-left">
            <div class="font-display font-bold text-white text-base">Online Multiplayer Mode</div>
            <div class="text-xs text-slate-300">Create a room to invite an opponent or join with a room code.</div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button id="hostRoomBtn" class="btn-3d px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs uppercase shadow">
              👑 Host Room
            </button>
            <button id="joinRoomBtn" class="btn-3d px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-display font-bold text-xs uppercase shadow">
              ⚔️ Join Room
            </button>
          </div>
        </div>

        <div class="mt-8 text-xs text-slate-500 flex items-center gap-4">
          <span>⌨️ Keyboard: [1-4] Moves</span>
          <span>• [U / Space] Ultimate</span>
          <span>• [S] Switch</span>
          <span>• [F3] Debug Ping</span>
        </div>
      </div>
    `;

    document.getElementById('menu1PBtn').onclick = () => {
      audio.play('click');
      if (this.onStart1P) this.onStart1P();
    };

    document.getElementById('menuCpuBtn').onclick = () => {
      audio.play('click');
      if (this.onStartCpu) this.onStartCpu();
    };

    const onlineBtn = document.getElementById('menuOnlineBtn');
    const choiceBar = document.getElementById('onlineChoiceBar');
    onlineBtn.onclick = () => {
      audio.play('click');
      if (choiceBar) choiceBar.classList.toggle('hidden');
    };

    const hostBtn = document.getElementById('hostRoomBtn');
    if (hostBtn) hostBtn.onclick = () => {
      audio.play('click');
      if (this.onHostOnline) this.onHostOnline();
    };

    const joinBtn = document.getElementById('joinRoomBtn');
    if (joinBtn) joinBtn.onclick = () => {
      this.openJoinModal();
    };
  }
}
