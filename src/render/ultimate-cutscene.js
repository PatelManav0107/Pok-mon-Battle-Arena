/**
 * Full-Screen Anime Ultimate Cutscene & 22 Arena Ultimate Moves
 * Synchronizes freeze frames and slow motion across Host, Guest, and Spectators.
 */
import { getFrontSpriteUrl, TYPE_COLORS } from '../sim/constants.js';
import { audio } from './audio.js';

export class UltimateCutsceneEngine {
  constructor(overlayId, canvasId, fxCanvasId) {
    this.overlay = document.getElementById(overlayId);
    this.cutsceneCanvas = document.getElementById(canvasId);
    this.arenaFxCanvas = document.getElementById(fxCanvasId);
  }

  async play(pokemon, trainerName, isP1) {
    const ult = pokemon.ult;
    if (!this.overlay || !this.cutsceneCanvas) return;

    audio.play('ult_cutin');

    // 1. Setup Cut-In Typography & Badges
    const trainerTag = document.getElementById('ultCutsceneTrainerTag');
    const quoteTag = document.getElementById('ultCutsceneQuoteTag');
    const powerTag = document.getElementById('ultCutscenePowerTag');
    const pokeName = document.getElementById('ultCutscenePokeName');
    const moveName = document.getElementById('ultCutsceneMoveName');
    const subtitle = document.getElementById('ultCutsceneSubtitle');
    const typeBadge = document.getElementById('ultCutsceneTypeBadge');
    const band = document.getElementById('ultCutsceneBand');
    const portraitWrap = document.getElementById('ultCutscenePortraitWrap');
    const titleWrap = document.getElementById('ultCutsceneTitleWrap');

    if (trainerTag) trainerTag.textContent = `${trainerName.toUpperCase()} • ULTIMATE OVERDRIVE`;
    if (quoteTag) quoteTag.textContent = `"${ult.subtitle} — Unleash ${ult.name}!"`;
    if (powerTag) powerTag.textContent = `ULTIMATE PWR ${ult.power}`;
    if (pokeName) pokeName.textContent = pokemon.name.toUpperCase();
    if (moveName) moveName.textContent = ult.name;
    if (subtitle) subtitle.textContent = ult.subtitle;

    if (typeBadge) {
      const tc = TYPE_COLORS[ult.type] || TYPE_COLORS.Normal;
      typeBadge.textContent = ult.type.toUpperCase();
      typeBadge.style.background = tc.bg;
      typeBadge.style.color = tc.text;
    }

    if (band) {
      band.style.background = `linear-gradient(135deg, #090d16 0%, ${ult.color1} 52%, ${ult.color2} 100%)`;
      band.classList.remove('ult-cutin-band-anim');
    }
    if (portraitWrap) portraitWrap.classList.remove('ult-cutin-portrait-anim');
    if (titleWrap) titleWrap.classList.remove('ult-cutin-title-anim');

    const spriteEl = document.getElementById('ultCutsceneSprite');
    const shadowEl = document.getElementById('ultCutsceneSpriteShadow');
    const spriteUrl = getFrontSpriteUrl(pokemon.id);
    if (spriteEl) spriteEl.src = spriteUrl;
    if (shadowEl) shadowEl.src = spriteUrl;

    // Show Cutscene Overlay
    this.overlay.classList.remove('hidden');
    void this.overlay.offsetWidth;
    if (band) band.classList.add('ult-cutin-band-anim');
    if (portraitWrap) portraitWrap.classList.add('ult-cutin-portrait-anim');
    if (titleWrap) titleWrap.classList.add('ult-cutin-title-anim');

    // Render Anime Speedlines Canvas
    this.cutsceneCanvas.width = window.innerWidth;
    this.cutsceneCanvas.height = window.innerHeight;
    const ctx = this.cutsceneCanvas.getContext('2d');

    const speedLines = Array.from({ length: 44 }, () => ({
      x: Math.random() * this.cutsceneCanvas.width,
      y: Math.random() * this.cutsceneCanvas.height,
      len: 120 + Math.random() * 260,
      thick: 2 + Math.random() * 5,
      speed: 28 + Math.random() * 35,
      color: Math.random() > 0.35 ? ult.color2 : '#ffffff'
    }));

    const duration = 1880;
    await new Promise(resolve => {
      const t0 = performance.now();
      const frame = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        ctx.clearRect(0, 0, this.cutsceneCanvas.width, this.cutsceneCanvas.height);

        // Darkened anime gradient
        const grad = ctx.createRadialGradient(
          this.cutsceneCanvas.width * 0.5, this.cutsceneCanvas.height * 0.5, 20,
          this.cutsceneCanvas.width * 0.5, this.cutsceneCanvas.height * 0.5, this.cutsceneCanvas.width * 0.65
        );
        grad.addColorStop(0, ult.color1 + '77');
        grad.addColorStop(1, 'rgba(2, 6, 23, 0.92)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.cutsceneCanvas.width, this.cutsceneCanvas.height);

        // Speedlines
        ctx.save();
        for (const sl of speedLines) {
          sl.x += sl.speed;
          sl.y -= sl.speed * 0.28;
          if (sl.x > this.cutsceneCanvas.width + 200) sl.x = -200;
          if (sl.y < -100) sl.y = this.cutsceneCanvas.height + 100;
          ctx.strokeStyle = sl.color;
          ctx.globalAlpha = 0.5 * Math.sin(p * Math.PI);
          ctx.lineWidth = sl.thick;
          ctx.beginPath();
          ctx.moveTo(sl.x, sl.y);
          ctx.lineTo(sl.x - sl.len, sl.y + sl.len * 0.28);
          ctx.stroke();
        }
        ctx.restore();

        if (p > 0.86) {
          const flashAlpha = (p - 0.86) / 0.14;
          ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.9})`;
          ctx.fillRect(0, 0, this.cutsceneCanvas.width, this.cutsceneCanvas.height);
        }

        if (p < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });

    this.overlay.classList.add('hidden');

    // 2. Play Arena Ultimate Attack Visual
    await this.playArenaUltAttack(ult, isP1);
  }

  async playArenaUltAttack(ult, isAttackerP1) {
    if (!this.arenaFxCanvas) return;
    audio.play('ult_blast');

    const sceneEl = document.getElementById('battleSceneContainer');
    if (sceneEl) {
      sceneEl.classList.remove('scene-shake-heavy');
      void sceneEl.offsetWidth;
      sceneEl.classList.add('scene-shake-heavy');
    }

    const ctx = this.arenaFxCanvas.getContext('2d');
    const W = this.arenaFxCanvas.width;
    const H = this.arenaFxCanvas.height;

    const attackerWrapId = isAttackerP1 ? 'playerSpriteWrap' : 'enemySpriteWrap';
    const defenderWrapId = isAttackerP1 ? 'enemySpriteWrap' : 'playerSpriteWrap';
    const attackerEl = document.getElementById(attackerWrapId);
    const defenderEl = document.getElementById(defenderWrapId);

    const getCenter = (elId) => {
      const el = document.getElementById(elId);
      if (!el || !sceneEl) return { x: W * 0.5, y: H * 0.5 };
      const sRect = sceneEl.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { x: r.left - sRect.left + r.width * 0.5, y: r.top - sRect.top + r.height * 0.5 };
    };

    const startPos = getCenter(attackerWrapId);
    const endPos = getCenter(defenderWrapId);
    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;

    const duration = 1450;
    await new Promise(resolve => {
      const t0 = performance.now();
      const frame = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        ctx.clearRect(0, 0, W, H);

        // Darkened stage
        const darkAlpha = Math.sin(p * Math.PI) * 0.65;
        ctx.fillStyle = `rgba(2, 6, 23, ${darkAlpha})`;
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        // Colossal elemental blast expanding onto defender
        const blastRad = 20 + p * 120;
        const grad = ctx.createRadialGradient(endPos.x, endPos.y, 5, endPos.x, endPos.y, blastRad);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, ult.color2);
        grad.addColorStop(0.8, ult.color1);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(endPos.x, endPos.y, blastRad, 0, Math.PI * 2);
        ctx.fill();

        // 8 Energy pillars
        ctx.strokeStyle = ult.color2;
        ctx.lineWidth = 6 * (1 - p);
        for (let b = 0; b < 8; b++) {
          const ang = (b * Math.PI) / 4 + p * 4;
          ctx.beginPath();
          ctx.moveTo(endPos.x, endPos.y);
          ctx.lineTo(endPos.x + Math.cos(ang) * p * 140, endPos.y + Math.sin(ang) * p * 140);
          ctx.stroke();
        }
        ctx.restore();

        if (defenderEl) {
          defenderEl.style.transform = `scale(${1 - 0.2 * Math.sin(p * Math.PI)})`;
        }

        if (p < 1) requestAnimationFrame(frame);
        else {
          ctx.clearRect(0, 0, W, H);
          if (attackerEl) attackerEl.style.transform = '';
          if (defenderEl) defenderEl.style.transform = '';
          resolve();
        }
      };
      requestAnimationFrame(frame);
    });
  }
}
