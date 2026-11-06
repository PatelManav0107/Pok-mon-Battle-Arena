/**
 * Interactive Team Draft Screen
 * Allows players to draft balanced teams from 22 Pokémon with live stat & move previews.
 */
import { POKEMON_POOL, TYPE_COLORS, getFrontSpriteUrl } from '../sim/constants.js';
import { audio } from '../render/audio.js';

export class DraftScreen {
  constructor(containerId, onDraftComplete) {
    this.container = document.getElementById(containerId);
    this.onDraftComplete = onDraftComplete;
    this.teamSize = 4;
    this.myDraftedIds = [];
    this.oppDraftedIds = [];
    this.selectedTypeFilter = 'All';
    this.isOnline = false;
  }

  init({ teamSize = 4, isOnline = false, initialTeam = [] } = {}) {
    this.teamSize = teamSize;
    this.isOnline = isOnline;
    this.myDraftedIds = [...initialTeam];
    this.oppDraftedIds = [];
    this.selectedTypeFilter = 'All';
    this.render();
  }

  setOpponentDraft(oppIds) {
    this.oppDraftedIds = [...oppIds];
    this.render();
  }

  selectPokemon(pokeId) {
    audio.play('click');
    if (this.myDraftedIds.includes(pokeId)) {
      // Unselect
      this.myDraftedIds = this.myDraftedIds.filter(id => id !== pokeId);
    } else {
      if (this.myDraftedIds.length >= this.teamSize) return;
      this.myDraftedIds.push(pokeId);
    }
    this.render();
  }

  autoPickBalanced() {
    audio.play('pick');
    const myTypes = new Set(
      this.myDraftedIds.map(id => POKEMON_POOL.find(p => p.id === id)).flatMap(p => p?.types || [])
    );

    while (this.myDraftedIds.length < this.teamSize) {
      const available = POKEMON_POOL.filter(p => !this.myDraftedIds.includes(p.id));
      let bestChoice = available[0];
      let bestScore = -1;

      for (const p of available) {
        let score = 0;
        p.types.forEach(t => { if (!myTypes.has(t)) score += 20; });
        score += Math.random() * 10;
        if (score > bestScore) {
          bestScore = score;
          bestChoice = p;
        }
      }

      this.myDraftedIds.push(bestChoice.id);
      bestChoice.types.forEach(t => myTypes.add(t));
    }
    this.render();
  }

  confirmDraft() {
    if (this.myDraftedIds.length !== this.teamSize) return;
    audio.play('pick');
    if (this.onDraftComplete) {
      this.onDraftComplete(this.myDraftedIds);
    }
  }

  render() {
    if (!this.container) return;

    const allTypes = ['All', ...Array.from(new Set(POKEMON_POOL.flatMap(p => p.types)))];
    const visiblePool = this.selectedTypeFilter === 'All'
      ? POKEMON_POOL
      : POKEMON_POOL.filter(p => p.types.includes(this.selectedTypeFilter));

    const isReadyToStart = this.myDraftedIds.length === this.teamSize;

    this.container.innerHTML = `
      <div class="p-4 sm:p-6 bg-slate-900 flex flex-col gap-4 max-w-5xl mx-auto w-full">
        <!-- Draft Header -->
        <div class="bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div>
            <h2 class="font-display text-xl sm:text-2xl font-bold text-white">
              Draft Your Team (${this.myDraftedIds.length} / ${this.teamSize})
            </h2>
            <p class="text-xs sm:text-sm text-slate-300">
              Pick ${this.teamSize} Pokémon for your battle squad. Each Pokémon brings signature attacks and an Anime Ultimate Overdrive!
            </p>
          </div>
          <div class="flex items-center gap-2.5">
            <button id="draftAutoPickBtn" class="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs sm:text-sm border border-slate-500 transition shadow">
              🎲 Auto-Pick Balanced
            </button>
            <button id="draftConfirmBtn" ${!isReadyToStart ? 'disabled' : ''} class="btn-3d px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-display font-extrabold text-sm sm:text-base border-2 border-emerald-200 shadow-[0_4px_0_#15803d] disabled:opacity-40 disabled:cursor-not-allowed">
              ✓ LOCK IN SQUAD!
            </button>
          </div>
        </div>

        <!-- Team Draft Slots Preview -->
        <div class="bg-slate-800/90 border-2 border-amber-500/60 rounded-2xl p-3">
          <div class="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-amber-400 mb-2">
            👤 Your Battle Squad (${this.myDraftedIds.length} / ${this.teamSize})
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            ${Array.from({ length: this.teamSize }).map((_, idx) => {
              const id = this.myDraftedIds[idx];
              if (id) {
                const poke = POKEMON_POOL.find(p => p.id === id);
                return `
                  <div class="bg-slate-900 border-2 border-amber-400/80 rounded-xl p-2 flex items-center gap-2.5">
                    <img src="${getFrontSpriteUrl(poke.id)}" alt="${poke.name}" class="w-10 h-10 object-contain poke-sprite shrink-0" />
                    <div class="min-w-0">
                      <div class="text-[10px] font-bold text-amber-300">#${idx + 1} ${idx === 0 ? '• LEAD' : ''}</div>
                      <div class="font-display font-bold text-white text-xs truncate">${poke.name}</div>
                    </div>
                  </div>
                `;
              }
              return `
                <div class="bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-xl p-2 h-14 flex items-center justify-center text-slate-500 text-xs font-bold">
                  Slot ${idx + 1}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Type Filter Pills -->
        <div class="bg-slate-800/70 border border-slate-700 rounded-2xl p-2 flex items-center gap-1.5 overflow-x-auto">
          <span class="text-[11px] font-extrabold uppercase text-slate-400 px-2 shrink-0">Filter:</span>
          ${allTypes.map(t => {
            const isActive = this.selectedTypeFilter === t;
            const tc = TYPE_COLORS[t] || { bg: '#f59e0b', text: '#0f172a', border: '#fde68a' };
            if (t === 'All') {
              return `<button data-type="All" class="type-filter-btn px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition shrink-0 ${isActive ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-200' : 'bg-slate-900 text-slate-300 hover:bg-slate-700'}">All (22)</button>`;
            }
            return `<button data-type="${t}" class="type-filter-btn px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase transition shrink-0 ${isActive ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-100'}" style="background:${tc.bg}; color:${tc.text}; border:1px solid ${tc.border};">${t}</button>`;
          }).join('')}
        </div>

        <!-- 22 Pokémon Pool Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[460px] overflow-y-auto pr-1">
          ${visiblePool.map(p => {
            const isPicked = this.myDraftedIds.includes(p.id);
            const pickNum = this.myDraftedIds.indexOf(p.id) + 1;
            return `
              <div data-poke-id="${p.id}" class="poke-card-btn relative rounded-2xl border-2 p-2.5 transition cursor-pointer flex flex-col justify-between ${
                isPicked
                  ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/50 shadow-lg'
                  : 'border-slate-700 hover:border-slate-500 bg-slate-800/90'
              }">
                ${isPicked ? `<span class="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] shadow">PICK #${pickNum}</span>` : ''}
                <div class="flex items-center gap-2">
                  <img src="${getFrontSpriteUrl(p.id)}" alt="${p.name}" class="w-12 h-12 object-contain poke-sprite shrink-0" />
                  <div class="min-w-0">
                    <div class="font-display font-bold text-white text-sm truncate">${p.name}</div>
                    <div class="flex gap-1 mt-0.5">
                      ${p.types.map(t => {
                        const tc = TYPE_COLORS[t] || TYPE_COLORS.Normal;
                        return `<span class="px-1.5 py-0.2 rounded text-[9px] font-black uppercase" style="background:${tc.bg}; color:${tc.text}">${t}</span>`;
                      }).join('')}
                    </div>
                  </div>
                </div>

                <!-- Stats summary -->
                <div class="grid grid-cols-4 gap-1 text-center bg-slate-950/70 rounded-lg p-1 my-1.5 text-[10px] font-mono">
                  <div><span class="text-slate-400 block text-[8px]">HP</span><strong class="text-emerald-400">${p.hp}</strong></div>
                  <div><span class="text-slate-400 block text-[8px]">ATK</span><strong class="text-rose-400">${p.atk}</strong></div>
                  <div><span class="text-slate-400 block text-[8px]">DEF</span><strong class="text-sky-400">${p.def}</strong></div>
                  <div><span class="text-slate-400 block text-[8px]">SPD</span><strong class="text-amber-400">${p.spd}</strong></div>
                </div>

                <div class="text-[10px] text-amber-300 font-extrabold truncate">
                  ★ ${p.ult.name}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Attach event listeners
    this.container.querySelectorAll('.type-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedTypeFilter = btn.dataset.type;
        this.render();
      });
    });

    this.container.querySelectorAll('.poke-card-btn').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.pokeId, 10);
        this.selectPokemon(id);
      });
    });

    const autoBtn = document.getElementById('draftAutoPickBtn');
    if (autoBtn) autoBtn.addEventListener('click', () => this.autoPickBalanced());

    const confirmBtn = document.getElementById('draftConfirmBtn');
    if (confirmBtn) confirmBtn.addEventListener('click', () => this.confirmDraft());
  }
}
