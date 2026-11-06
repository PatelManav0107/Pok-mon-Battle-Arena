/**
 * Battle HUD & Command Deck Manager
 * Renders 4-quadrant stadium status cards, move grids, ultimate banner,
 * switch drawer, floating combat log, and disconnect/rematch dialogs.
 */
import { TYPE_COLORS, getTypeEffectiveness, getFrontSpriteUrl, getBackSpriteUrl } from '../sim/constants.js';
import { audio } from '../render/audio.js';

export class BattleHud {
  constructor({ onMoveSelected, onUltSelected, onSwitchSelected, onRematchRequest, onReturnMenu }) {
    this.onMoveSelected = onMoveSelected;
    this.onUltSelected = onUltSelected;
    this.onSwitchSelected = onSwitchSelected;
    this.onRematchRequest = onRematchRequest;
    this.onReturnMenu = onReturnMenu;

    this.isSwitchMenuOpen = false;
    this.isForcedSwitch = false;
    this.isSpectator = false;
  }

  update(state, isLocalP1 = true) {
    if (!state) return;

    // Perspective mapping: Local player is ALWAYS shown in Quadrant 3 (Bottom-Left) & Quadrant 4 (Bottom-Right HUD)
    const mySide = isLocalP1 ? state.p1 : state.p2;
    const oppSide = isLocalP1 ? state.p2 : state.p1;

    const myPoke = mySide.team[mySide.activeIdx];
    const oppPoke = oppSide.team[oppSide.activeIdx];

    if (!myPoke || !oppPoke) return;

    // 1. Update Opponent HUD (Quadrant 1 - Top Left)
    const enemyName = document.getElementById('enemyName');
    const enemyHpBar = document.getElementById('enemyHpBar');
    const enemyHpText = document.getElementById('enemyHpText');
    const enemyTypes = document.getElementById('enemyTypes');
    const enemyOwner = document.getElementById('enemyOwnerLabel');
    const enemyLowHp = document.getElementById('enemyLowHpBadge');

    if (enemyName) enemyName.textContent = oppPoke.name;
    if (enemyOwner) enemyOwner.textContent = oppSide.name;
    if (enemyTypes) enemyTypes.innerHTML = oppPoke.types.map(t => this.typeBadgeHTML(t)).join('');
    if (enemyHpText) enemyHpText.textContent = `${oppPoke.hp} / ${oppPoke.maxHp} HP`;

    const oppRatio = Math.max(0, Math.min(1, oppPoke.hp / oppPoke.maxHp));
    if (enemyHpBar) {
      enemyHpBar.style.width = `${oppRatio * 100}%`;
      enemyHpBar.className = `hp-bar-fill h-full rounded-full ${this.getHpColorClass(oppRatio)}`;
    }
    if (enemyLowHp) {
      if (oppRatio < 0.25 && oppPoke.hp > 0) enemyLowHp.classList.remove('hidden');
      else enemyLowHp.classList.add('hidden');
    }

    this.renderBalls('enemyBalls', oppSide.team, oppSide.activeIdx);
    this.updateSprite('enemySprite', 'enemyFallback', getFrontSpriteUrl(oppPoke.id), oppPoke);
    this.updateIdleState('enemyIdleActor', oppPoke);

    // 2. Update Player HUD (Quadrant 4 - Bottom Right)
    const playerName = document.getElementById('playerName');
    const playerHpBar = document.getElementById('playerHpBar');
    const playerHpText = document.getElementById('playerHpText');
    const playerTypes = document.getElementById('playerTypes');
    const playerOwner = document.getElementById('playerOwnerLabel');
    const playerLowHp = document.getElementById('playerLowHpBadge');

    if (playerName) playerName.textContent = myPoke.name;
    if (playerOwner) playerOwner.textContent = mySide.name;
    if (playerTypes) playerTypes.innerHTML = myPoke.types.map(t => this.typeBadgeHTML(t)).join('');
    if (playerHpText) playerHpText.textContent = `${myPoke.hp} / ${myPoke.maxHp} HP`;

    const myRatio = Math.max(0, Math.min(1, myPoke.hp / myPoke.maxHp));
    if (playerHpBar) {
      playerHpBar.style.width = `${myRatio * 100}%`;
      playerHpBar.className = `hp-bar-fill h-full rounded-full ${this.getHpColorClass(myRatio)}`;
    }
    if (playerLowHp) {
      if (myRatio < 0.25 && myPoke.hp > 0) playerLowHp.classList.remove('hidden');
      else playerLowHp.classList.add('hidden');
    }

    this.renderBalls('playerBalls', mySide.team, mySide.activeIdx);
    this.updateSprite('playerSprite', 'playerFallback', getBackSpriteUrl(myPoke.id), myPoke);
    this.updateIdleState('playerIdleActor', myPoke);

    // Round timer & counter
    const roundBadge = document.getElementById('turnCounterBadge');
    if (roundBadge) {
      roundBadge.textContent = state.battleTimer > 0
        ? `Round ${state.round} • ⏱️ ${Math.ceil(state.battleTimer)}s`
        : `Round ${state.round}`;
    }

    // Command deck moves
    if (!this.isSpectator) {
      this.renderMoveDeck(mySide, oppSide);
    }
  }

  typeBadgeHTML(type) {
    const style = TYPE_COLORS[type] || TYPE_COLORS.Normal;
    return `<span class="inline-block px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider text-[10px] shadow-sm" style="background:${style.bg}; color:${style.text}; border:1px solid ${style.border};">${type}</span>`;
  }

  getHpColorClass(ratio) {
    if (ratio > 0.5) return 'bg-emerald-500';
    if (ratio >= 0.25) return 'bg-amber-400';
    return 'bg-rose-500 hp-bar-low-blink';
  }

  renderBalls(containerId, team, activeIdx) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = team.map((poke, idx) => {
      if (poke.fainted) {
        return `<div class="w-4 h-4 rounded-full bg-slate-400 border border-slate-600 opacity-45 flex items-center justify-center text-[9px] text-slate-900 font-black">✕</div>`;
      }
      const isCurrent = idx === activeIdx;
      return `
        <div class="w-4 h-4 rounded-full border border-slate-900 relative overflow-hidden shadow-sm ${isCurrent ? 'ring-2 ring-amber-400 scale-110' : ''}">
          <div class="absolute top-0 left-0 right-0 h-1/2 bg-red-500 border-b border-slate-900"></div>
          <div class="absolute bottom-0 left-0 right-0 h-1/2 bg-white"></div>
        </div>
      `;
    }).join('');
  }

  updateSprite(imgId, fallbackId, url, poke) {
    const img = document.getElementById(imgId);
    const fb = document.getElementById(fallbackId);
    if (!img) return;

    if (img.dataset.currSrc !== url) {
      img.dataset.currSrc = url;
      img.src = url;
      img.onerror = () => {
        img.classList.add('hidden');
        if (fb) {
          fb.classList.remove('hidden');
          fb.textContent = poke.name;
        }
      };
    }
  }

  updateIdleState(actorId, poke) {
    const actor = document.getElementById(actorId);
    if (!actor) return;
    const isLow = !poke.fainted && poke.hp > 0 && (poke.hp / poke.maxHp) < 0.25;
    actor.className = `poke-idle-actor idle-${poke.id}${isLow ? ' low-hp-slow' : ''}`;
  }

  renderMoveDeck(mySide, oppSide) {
    if (this.isSwitchMenuOpen) {
      this.renderSwitchDrawer(mySide);
      return;
    }

    const movePanel = document.getElementById('movePanel');
    const switchPanel = document.getElementById('switchPanel');
    if (movePanel) movePanel.classList.remove('hidden');
    if (switchPanel) { switchPanel.classList.add('hidden'); switchPanel.classList.remove('flex'); }

    const myPoke = mySide.team[mySide.activeIdx];
    const oppPoke = oppSide.team[oppSide.activeIdx];

    const grid = document.getElementById('moveButtonsGrid');
    if (!grid) return;

    grid.innerHTML = myPoke.moves.map((move, idx) => {
      const style = TYPE_COLORS[move.type] || TYPE_COLORS.Normal;
      const eff = getTypeEffectiveness(move.type, oppPoke.types);
      const hasStab = myPoke.types.includes(move.type);
      const cdLeft = myPoke.moveCooldowns[idx] || 0;
      const baseCd = move.cd || 0;
      const isDisabled = cdLeft > 0 || myPoke.fainted;

      let effTag = '';
      if (eff >= 2) effTag = `<span class="px-1.5 py-0.5 rounded bg-black/35 text-[10px] font-extrabold text-amber-200">${eff}× Super</span>`;
      else if (eff === 0) effTag = `<span class="px-1.5 py-0.5 rounded bg-black/45 text-[10px] font-extrabold text-rose-200">0× Immune</span>`;
      else if (eff < 1) effTag = `<span class="px-1.5 py-0.5 rounded bg-black/30 text-[10px] font-bold text-white/80">${eff}× Resist</span>`;

      return `
        <button id="moveBtn-${idx}" ${isDisabled ? 'disabled' : ''} class="btn-3d relative overflow-hidden rounded-2xl p-2.5 sm:p-3 text-left flex flex-col justify-between border-2 transition ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}"
                style="background:${style.bg}; color:${style.text}; border-color:${style.border}; box-shadow: 0 5px 0 ${style.shadow};">
          ${cdLeft > 0 ? `
            <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center p-2 z-10 border-2 border-rose-500/60">
              <span class="text-rose-300 font-display font-bold text-xs">⏳ CD: ${cdLeft}T LEFT</span>
            </div>
          ` : ''}
          <div class="flex items-center justify-between gap-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="keycap-badge shrink-0">${idx + 1}</span>
              <span class="font-display font-bold text-sm sm:text-base leading-tight truncate">${move.name}</span>
            </div>
            ${effTag}
          </div>
          <div class="flex items-center justify-between text-[11px] font-extrabold mt-1.5 opacity-95">
            <span class="uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/25">${move.type}${hasStab ? ' ★' : ''}</span>
            <span>PWR ${move.power}</span>
          </div>
        </button>
      `;
    }).join('');

    // Attach click events
    myPoke.moves.forEach((_, idx) => {
      const btn = document.getElementById(`moveBtn-${idx}`);
      if (btn) btn.addEventListener('click', () => {
        if (myPoke.moveCooldowns[idx] > 0) {
          audio.play('cooldown_warn');
          return;
        }
        audio.play('click');
        if (this.onMoveSelected) this.onMoveSelected(idx);
      });
    });

    // Ultimate Button
    const ultContainer = document.getElementById('ultimateButtonContainer');
    if (ultContainer && myPoke.ult) {
      const ult = myPoke.ult;
      const charge = Math.round(mySide.ultCharge || 0);
      const ultCd = myPoke.ultCooldown || 0;
      const isReady = charge >= 100 && ultCd === 0 && !myPoke.fainted;

      ultContainer.innerHTML = `
        <button id="ultMoveBtn" ${!isReady ? 'disabled' : ''} class="btn-3d w-full relative overflow-hidden rounded-2xl p-2.5 sm:px-4 sm:py-2.5 border-2 text-left transition flex flex-col gap-1.5 ${
          isReady
            ? 'ult-btn-ready bg-gradient-to-r from-amber-500 via-rose-600 to-purple-700 text-white cursor-pointer'
            : 'bg-slate-800/95 border-slate-700 text-slate-300 opacity-75'
        }">
          <div class="flex flex-wrap items-center justify-between gap-2 relative z-10">
            <div class="flex items-center gap-2 min-w-0">
              <span class="keycap-badge shrink-0">U / SPACE</span>
              <span class="font-display font-black text-sm sm:text-base tracking-wide truncate ${isReady ? 'text-white' : 'text-amber-300'}">
                🌟 ULTIMATE: ${ult.name}
              </span>
              <span class="hidden sm:inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/35 text-amber-100">
                ${ult.type} • PWR ${ult.power}
              </span>
            </div>
            <div>
              ${ultCd > 0
                ? `<span class="px-2 py-0.5 rounded-full bg-rose-950 border border-rose-400 text-rose-200 text-[10px] font-extrabold">⏳ CD: ${ultCd}T</span>`
                : isReady
                ? `<span class="px-2.5 py-0.5 rounded-full bg-amber-300 text-slate-950 text-[10px] font-black animate-bounce">★ READY!</span>`
                : `<span class="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-600 text-amber-300 text-[10px] font-extrabold">⚡ ${charge}%</span>`}
            </div>
          </div>
          <div class="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/15 relative z-10">
            <div class="h-full transition-all duration-300 bg-gradient-to-r from-amber-500 to-rose-500" style="width: ${charge}%"></div>
          </div>
        </button>
      `;

      const ultBtn = document.getElementById('ultMoveBtn');
      if (ultBtn) {
        ultBtn.addEventListener('click', () => {
          if (!isReady) {
            audio.play('cooldown_warn');
            return;
          }
          audio.play('click');
          if (this.onUltSelected) this.onUltSelected();
        });
      }
    }

    // Switch button in deck
    const switchBtn = document.getElementById('openSwitchBtn');
    if (switchBtn) {
      switchBtn.onclick = () => {
        this.openSwitchMenu(false, mySide);
      };
    }
  }

  openSwitchMenu(isForced, mySide) {
    audio.play('click');
    this.isSwitchMenuOpen = true;
    this.isForcedSwitch = isForced;
    this.renderSwitchDrawer(mySide);
  }

  closeSwitchMenu() {
    if (this.isForcedSwitch) return;
    audio.play('click');
    this.isSwitchMenuOpen = false;
    const movePanel = document.getElementById('movePanel');
    const switchPanel = document.getElementById('switchPanel');
    if (movePanel) movePanel.classList.remove('hidden');
    if (switchPanel) { switchPanel.classList.add('hidden'); switchPanel.classList.remove('flex'); }
  }

  renderSwitchDrawer(mySide) {
    const movePanel = document.getElementById('movePanel');
    const switchPanel = document.getElementById('switchPanel');
    if (movePanel) movePanel.classList.add('hidden');
    if (switchPanel) { switchPanel.classList.remove('hidden'); switchPanel.classList.add('flex'); }

    const promptTitle = document.getElementById('switchPromptTitle');
    const cancelBtn = document.getElementById('cancelSwitchBtn');
    if (promptTitle) {
      promptTitle.textContent = this.isForcedSwitch
        ? 'Your Pokémon fainted! Select next Pokémon [1-4]:'
        : 'Select an alive Pokémon to switch in [1-4]:';
    }
    if (cancelBtn) {
      if (this.isForcedSwitch) cancelBtn.classList.add('hidden');
      else {
        cancelBtn.classList.remove('hidden');
        cancelBtn.onclick = () => this.closeSwitchMenu();
      }
    }

    const grid = document.getElementById('switchTeamGrid');
    if (!grid) return;

    grid.innerHTML = mySide.team.map((poke, idx) => {
      const isCurrent = idx === mySide.activeIdx;
      const isDisabled = isCurrent || poke.fainted;
      const hpPercent = Math.max(0, Math.round((poke.hp / poke.maxHp) * 100));

      return `
        <button id="switchSlotBtn-${idx}" ${isDisabled ? 'disabled' : ''} class="btn-3d flex items-center justify-between p-2.5 rounded-xl border-2 text-left transition ${
          isCurrent
            ? 'bg-amber-500/20 border-amber-400 cursor-default'
            : poke.fainted
            ? 'bg-slate-800/40 border-slate-700 opacity-50 cursor-not-allowed'
            : 'bg-slate-800 hover:bg-slate-700 border-slate-600'
        }">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="keycap-badge shrink-0">${idx + 1}</span>
            <img src="${getFrontSpriteUrl(poke.id)}" alt="${poke.name}" class="w-10 h-10 object-contain poke-sprite shrink-0" />
            <div class="min-w-0">
              <div class="font-display font-bold text-white text-sm truncate">${poke.name}</div>
              <div class="flex gap-1 mt-0.5">
                ${poke.types.map(t => this.typeBadgeHTML(t)).join('')}
              </div>
            </div>
          </div>
          <div class="w-20 text-right shrink-0 ml-2">
            <div class="text-xs font-bold text-slate-200">${poke.hp}/${poke.maxHp}</div>
            <div class="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mt-1">
              <div class="h-full bg-emerald-500" style="width:${hpPercent}%"></div>
            </div>
          </div>
        </button>
      `;
    }).join('');

    // Attach switch click
    mySide.team.forEach((poke, idx) => {
      const btn = document.getElementById(`switchSlotBtn-${idx}`);
      if (btn && !btn.disabled) {
        btn.addEventListener('click', () => {
          this.isSwitchMenuOpen = false;
          audio.play('click');
          if (this.onSwitchSelected) this.onSwitchSelected(idx);
        });
      }
    });
  }

  appendLog(text, highlightClass = 'text-slate-200') {
    const headline = document.getElementById('battleHeadline');
    if (headline) headline.textContent = text;

    const logBox = document.getElementById('battleLogScroll');
    if (!logBox) return;
    const entry = document.createElement('div');
    entry.className = `leading-snug ${highlightClass}`;
    entry.textContent = `• ${text}`;
    logBox.appendChild(entry);
    logBox.scrollTop = logBox.scrollHeight;
  }

  showDisconnectNotice(countdown) {
    let el = document.getElementById('disconnectNoticeOverlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'disconnectNoticeOverlay';
      el.className = 'fixed top-14 left-1/2 transform -translate-x-1/2 bg-rose-950/95 border-2 border-rose-500 text-rose-200 px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-pulse';
      document.body.appendChild(el);
    }
    el.innerHTML = `
      <span class="text-2xl">⚠️</span>
      <div>
        <div class="font-bold">Opponent Disconnected</div>
        <div class="text-xs">Waiting for reconnect... (${countdown}s remaining)</div>
      </div>
    `;
    el.classList.remove('hidden');
  }

  hideDisconnectNotice() {
    const el = document.getElementById('disconnectNoticeOverlay');
    if (el) el.classList.add('hidden');
  }

  showGameOver({ winnerIsP1, p1Score, p2Score, isLocalP1, onRematch, onMenu }) {
    const modal = document.getElementById('gameOverModal');
    if (!modal) return;

    const won = (winnerIsP1 && isLocalP1) || (!winnerIsP1 && !isLocalP1);
    audio.play('win');

    const titleEl = document.getElementById('winnerTitle');
    const subEl = document.getElementById('winnerSubtitle');
    const trophyEl = document.getElementById('winnerTrophy');

    if (titleEl) {
      titleEl.textContent = won ? 'VICTORY!' : 'DEFEAT!';
      titleEl.className = won
        ? 'font-display text-4xl font-black text-amber-400 mb-2'
        : 'font-display text-4xl font-black text-rose-400 mb-2';
    }
    if (trophyEl) trophyEl.textContent = won ? '🏆' : '💀';
    if (subEl) subEl.textContent = won ? 'You triumphed over your opponent!' : 'Your squad was defeated in combat.';

    modal.classList.remove('hidden');
  }
}
