/**
 * Arena & Stadium Renderer
 * Manages battle scene backgrounds, platforms, Pokéball animations,
 * hit knockbacks, floating damage numbers, and camera shake.
 */
import { ARENAS } from '../sim/constants.js';
import { audio } from './audio.js';

export class ArenaRenderer {
  constructor(sceneContainerId, canvasId, pokeballLayerId) {
    this.container = document.getElementById(sceneContainerId);
    this.canvas = document.getElementById(canvasId);
    this.pokeballLayer = document.getElementById(pokeballLayerId);
    this.activeArena = ARENAS[0];
  }

  setArena(arenaId) {
    const found = ARENAS.find(a => a.id === arenaId) || ARENAS[0];
    this.activeArena = found;
    if (this.container) {
      this.container.style.background = found.skyGradient;
      const enemyPlatform = this.container.querySelector('.platform-enemy');
      const playerPlatform = this.container.querySelector('.platform-player');
      if (enemyPlatform) enemyPlatform.style.background = found.platformEnemy;
      if (playerPlatform) playerPlatform.style.background = found.platformPlayer;
    }
  }

  getSpriteCenter(wrapperId) {
    const wrap = document.getElementById(wrapperId);
    if (!wrap || !this.container) return { x: 0, y: 0 };
    const sceneRect = this.container.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    return {
      x: (wrapRect.left - sceneRect.left) + wrapRect.width * 0.5,
      y: (wrapRect.top - sceneRect.top) + wrapRect.height * 0.52
    };
  }

  // Pokéball Throw Enter Animation
  async playPokeballEnter(isP1) {
    const wrapId = isP1 ? 'playerSpriteWrap' : 'enemySpriteWrap';
    const wrapEl = document.getElementById(wrapId);
    if (!this.container || !this.pokeballLayer || !wrapEl) return;

    wrapEl.classList.remove('anim-faint');
    wrapEl.style.opacity = '0';
    wrapEl.style.transform = 'scale(0.05)';

    const targetCenter = this.getSpriteCenter(wrapId);
    const sceneRect = this.container.getBoundingClientRect();
    const startX = isP1 ? -25 : sceneRect.width + 25;
    const startY = isP1 ? sceneRect.height - 30 : 30;
    const landX = targetCenter.x;
    const landY = targetCenter.y + 18;

    const ball = document.createElement('div');
    ball.className = 'pokeball-prop';
    this.pokeballLayer.appendChild(ball);

    audio.play('sendout');

    // Arc flight
    const flightDuration = 380;
    await new Promise(resolve => {
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / flightDuration);
        const x = startX + (landX - startX) * p;
        const y = startY + (landY - startY) * p - Math.sin(p * Math.PI) * 95;
        const rot = p * 720 * (isP1 ? 1 : -1);
        ball.style.left = `${x - 17}px`;
        ball.style.top = `${y - 17}px`;
        ball.style.transform = `rotate(${rot}deg)`;
        if (p < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });

    // Flash burst & Pokémon emergence
    const flashRing = document.createElement('div');
    flashRing.className = 'burst-ring';
    flashRing.style.left = `${landX}px`;
    flashRing.style.top = `${targetCenter.y}px`;
    flashRing.style.background = 'radial-gradient(circle, #ffffff 0%, rgba(255,255,255,0.85) 45%, rgba(186,230,253,0) 75%)';
    flashRing.style.border = '3px solid #ffffff';
    this.pokeballLayer.appendChild(flashRing);

    const emergeDuration = 460;
    await new Promise(resolve => {
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / emergeDuration);
        const ringSize = 20 + p * 165;
        flashRing.style.width = `${ringSize}px`;
        flashRing.style.height = `${ringSize}px`;
        flashRing.style.opacity = `${1 - p}`;

        ball.style.transform = `translateY(${-p * 30}px) scale(${1 + p * 0.4})`;
        ball.style.opacity = `${Math.max(0, 1 - p * 2.2)}`;

        const scale = p < 0.75 ? 0.05 + (p / 0.75) * 1.07 : 1.12 - ((p - 0.75) / 0.25) * 0.12;
        const whiteGlow = Math.max(1, 5 - p * 4);
        const dropGlow = Math.round((1 - p) * 28);
        wrapEl.style.opacity = '1';
        wrapEl.style.transform = `scale(${scale})`;
        wrapEl.style.filter = `brightness(${whiteGlow}) drop-shadow(0 0 ${dropGlow}px #ffffff)`;

        if (p < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });

    ball.remove();
    flashRing.remove();
    wrapEl.style.transform = '';
    wrapEl.style.filter = '';
    wrapEl.style.opacity = '1';
  }

  // Pokéball Red-Light Recall Animation
  async playPokeballRecall(isP1) {
    const wrapId = isP1 ? 'playerSpriteWrap' : 'enemySpriteWrap';
    const wrapEl = document.getElementById(wrapId);
    if (!this.container || !this.pokeballLayer || !wrapEl) return;

    const targetCenter = this.getSpriteCenter(wrapId);
    const sceneRect = this.container.getBoundingClientRect();
    const retreatX = isP1 ? -25 : sceneRect.width + 25;
    const retreatY = isP1 ? sceneRect.height - 30 : 30;

    audio.play('recall');

    const redRing = document.createElement('div');
    redRing.className = 'burst-ring';
    redRing.style.left = `${targetCenter.x}px`;
    redRing.style.top = `${targetCenter.y}px`;
    redRing.style.background = 'radial-gradient(circle, rgba(254,202,202,0.95) 0%, rgba(239,68,68,0.75) 50%, rgba(239,68,68,0) 75%)';
    redRing.style.border = '3px solid #f87171';
    this.pokeballLayer.appendChild(redRing);

    const ball = document.createElement('div');
    ball.className = 'pokeball-prop';
    ball.style.left = `${targetCenter.x - 17}px`;
    ball.style.top = `${targetCenter.y - 17}px`;
    this.pokeballLayer.appendChild(ball);

    // Shrink into ball
    const shrinkDuration = 380;
    await new Promise(resolve => {
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / shrinkDuration);
        const scale = Math.max(0.04, 1 - p * 0.96);
        wrapEl.style.transform = `scale(${scale})`;
        wrapEl.style.filter = `brightness(2.2) sepia(1) hue-rotate(-50deg) saturate(7) drop-shadow(0 0 22px #ef4444)`;
        wrapEl.style.opacity = `${1 - p * 0.85}`;

        const ringSize = (1 - p) * 140 + 20;
        redRing.style.width = `${ringSize}px`;
        redRing.style.height = `${ringSize}px`;
        redRing.style.opacity = `${1 - p * 0.5}`;

        ball.style.transform = `scale(${0.6 + p * 0.45})`;
        if (p < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });

    wrapEl.style.opacity = '0';
    redRing.remove();

    // Ball returns
    const returnDuration = 280;
    await new Promise(resolve => {
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / returnDuration);
        const x = targetCenter.x + (retreatX - targetCenter.x) * p;
        const y = targetCenter.y + (retreatY - targetCenter.y) * p - Math.sin(p * Math.PI) * 65;
        ball.style.left = `${x - 17}px`;
        ball.style.top = `${y - 17}px`;
        ball.style.transform = `rotate(${p * -540}deg)`;
        if (p < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });

    ball.remove();
    wrapEl.style.filter = '';
  }

  // Hit Knockback & Flash Reaction
  async playHitReaction(isDefenderP1, damage, maxHp, effectiveness, isCrit) {
    const wrapId = isDefenderP1 ? 'playerSpriteWrap' : 'enemySpriteWrap';
    const wrapEl = document.getElementById(wrapId);
    if (!wrapEl) return;

    this.showFloatingDamage(wrapId, damage, effectiveness, isCrit);

    const dmgRatio = damage / Math.max(1, maxHp);
    const isStrongHit = effectiveness >= 2 || isCrit || dmgRatio >= 0.35;
    const dirX = isDefenderP1 ? -1 : 1;
    const dirY = isDefenderP1 ? 0.55 : -0.55;
    const pushDist = isStrongHit ? Math.min(48, 30 + dmgRatio * 34) : Math.max(14, 12 + dmgRatio * 22);
    const shakeAmp = isStrongHit ? 14 : 8;
    const duration = isStrongHit ? 620 : 480;

    await new Promise(resolve => {
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        const pushCurve = p < 0.3 ? (p / 0.3) : 1 - ((p - 0.3) / 0.7);
        const shake = Math.sin(p * Math.PI * (isStrongHit ? 10 : 7)) * shakeAmp * (1 - p);
        const tx = dirX * pushDist * pushCurve + shake;
        const ty = dirY * pushDist * pushCurve;
        wrapEl.style.transform = `translate(${tx}px, ${ty}px) scale(${1 - 0.06 * pushCurve})`;

        if (p < 0.22 || (p > 0.38 && p < 0.52)) {
          wrapEl.style.filter = `brightness(4.5) contrast(0.2) drop-shadow(0 0 22px #ffffff)`;
        } else if (p < 0.7) {
          wrapEl.style.filter = `brightness(1.5) saturate(1.8) drop-shadow(0 0 14px #ef4444)`;
        } else {
          wrapEl.style.filter = '';
        }

        if (p < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });

    wrapEl.style.transform = '';
    wrapEl.style.filter = '';
  }

  // Floating Damage Numbers & Combat Floating Badges
  showFloatingDamage(wrapperId, damage, effectiveness, isCrit) {
    if (!this.container) return;
    const center = this.getSpriteCenter(wrapperId);
    const numEl = document.createElement('div');
    numEl.className = 'absolute font-display font-black text-xl sm:text-2xl z-40 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]';

    let color = 'text-white';
    let extraText = '';
    if (isCrit) {
      color = 'text-amber-400';
      extraText = '<div class="text-[10px] uppercase tracking-wider text-amber-200">CRITICAL!</div>';
    } else if (effectiveness >= 2) {
      color = 'text-emerald-400';
      extraText = '<div class="text-[10px] uppercase tracking-wider text-emerald-200">SUPER EFFECTIVE!</div>';
    } else if (effectiveness < 1 && effectiveness > 0) {
      color = 'text-slate-300';
      extraText = '<div class="text-[10px] uppercase tracking-wider text-slate-400">RESISTED</div>';
    } else if (effectiveness === 0) {
      color = 'text-rose-400';
      extraText = '<div class="text-[10px] uppercase tracking-wider text-rose-300">IMMUNE</div>';
    }

    numEl.innerHTML = `<span class="${color}">-${damage}</span>${extraText}`;
    numEl.style.left = `${center.x - 20}px`;
    numEl.style.top = `${center.y - 40}px`;
    this.container.appendChild(numEl);

    // Float upwards and fade out
    let startTime = performance.now();
    const anim = (now) => {
      const p = (now - startTime) / 950;
      if (p < 1) {
        numEl.style.transform = `translateY(${-p * 45}px) scale(${1 + 0.2 * Math.sin(p * Math.PI)})`;
        numEl.style.opacity = `${1 - p * p}`;
        requestAnimationFrame(anim);
      } else {
        numEl.remove();
      }
    };
    requestAnimationFrame(anim);
  }

  // Faint Animation
  async playFaintAnimation(isDefenderP1) {
    const wrapId = isDefenderP1 ? 'playerSpriteWrap' : 'enemySpriteWrap';
    const wrapEl = document.getElementById(wrapId);
    if (!wrapEl) return;
    wrapEl.classList.remove('anim-faint');
    void wrapEl.offsetWidth;
    wrapEl.classList.add('anim-faint');
    await new Promise(resolve => setTimeout(resolve, 760));
  }

  triggerShake(isHeavy = false) {
    if (!this.container) return;
    const cls = isHeavy ? 'scene-shake-heavy' : 'scene-shake-light';
    this.container.classList.remove('scene-shake-heavy', 'scene-shake-light');
    void this.container.offsetWidth;
    this.container.classList.add(cls);
  }
}
