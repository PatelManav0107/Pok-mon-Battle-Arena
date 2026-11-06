/**
 * Custom Move FX Canvas Animation Engine
 * Handles 53 bespoke move animations categorized into PROJECTILE, BEAM, AREA, and CONTACT styles.
 */
import { TYPE_COLORS } from '../sim/constants.js';
import { audio } from './audio.js';

export const MOVE_ANIMATIONS = {
  // Charizard
  "Flamethrower": { style: "BEAM", type: "Fire", duration: 950, beamWidth: 28, streamParticles: "fire", afterEffect: "burn", sfx: "beam_fire" },
  "Air Slash": { style: "PROJECTILE", type: "Flying", duration: 780, shape: "crescent", count: 3, color: "#ffffff", secondaryColor: "#a5f3fc", impactEffect: "wind_slices", sfx: "slash" },
  "Dragon Claw": { style: "CONTACT", type: "Dragon", duration: 780, dashType: "lunge", impactEffect: "claws_indigo", color: "#6366f1", secondaryColor: "#a5b4fc", sfx: "claw" },
  "Slash": { style: "CONTACT", type: "Normal", duration: 700, dashType: "lunge", impactEffect: "scratches_white", color: "#ffffff", secondaryColor: "#e2e8f0", sfx: "slash" },

  // Blastoise
  "Hydro Pump": { style: "BEAM", type: "Water", duration: 960, beamWidth: 38, streamParticles: "water_jet", pushback: true, color: "#3b82f6", secondaryColor: "#e0f2fe", sfx: "hydro" },
  "Surf": { style: "AREA", type: "Water", duration: 1050, areaEffect: "tidal_wave", color: "#2563eb", secondaryColor: "#bae6fd", sfx: "surf" },
  "Ice Beam": { style: "BEAM", type: "Ice", duration: 1050, beamWidth: 18, streamParticles: "ice_crystals", afterEffect: "freeze_encase", color: "#38bdf8", secondaryColor: "#e0f2fe", sfx: "ice" },
  "Bite": { style: "CONTACT", type: "Dark", duration: 760, dashType: "lunge", impactEffect: "fangs_bite", color: "#1e293b", secondaryColor: "#94a3b8", sfx: "bite" },

  // Venusaur
  "Solar Beam": { style: "BEAM", type: "Grass", duration: 1700, chargeTime: 1000, beamWidth: 42, streamParticles: "solar_light", color: "#fde047", secondaryColor: "#4ade80", sfx: "solar" },
  "Razor Leaf": { style: "PROJECTILE", type: "Grass", duration: 880, shape: "spinning_leaf", count: 9, color: "#22c55e", secondaryColor: "#bbf7d0", impactEffect: "leaf_cuts", sfx: "slash" },
  "Sludge Bomb": { style: "PROJECTILE", type: "Poison", duration: 920, shape: "sludge_blob", count: 4, arcHeight: 65, color: "#9333ea", secondaryColor: "#d8b4fe", impactEffect: "sludge_splat", sfx: "sludge" },
  "Body Slam": { style: "CONTACT", type: "Normal", duration: 860, dashType: "high_jump", impactEffect: "heavy_slam", screenShake: "heavy", sfx: "slam" },

  // Pikachu
  "Thunderbolt": { style: "AREA", type: "Electric", duration: 920, areaEffect: "sky_lightning", color: "#facc15", secondaryColor: "#fef08a", screenShake: "light", sfx: "thunder" },
  "Quick Attack": { style: "CONTACT", type: "Normal", duration: 640, dashType: "speed_streak", impactEffect: "white_flash_burst", color: "#ffffff", secondaryColor: "#f8fafc", sfx: "quick" },
  "Iron Tail": { style: "CONTACT", type: "Steel", duration: 820, dashType: "lunge", impactEffect: "silver_tail_arc", color: "#cbd5e1", secondaryColor: "#ffffff", sfx: "steel" },
  "Brick Break": { style: "CONTACT", type: "Fighting", duration: 880, dashType: "lunge", impactEffect: "chop_glass_shatter", color: "#ef4444", secondaryColor: "#bae6fd", sfx: "shatter" },

  // Gengar
  "Shadow Ball": { style: "PROJECTILE", type: "Ghost", duration: 880, shape: "shadow_orb", count: 1, size: 28, color: "#581c87", secondaryColor: "#c084fc", impactEffect: "shadow_burst", sfx: "ghost" },
  "Dark Pulse": { style: "AREA", type: "Dark", duration: 950, areaEffect: "dark_rings", color: "#0f172a", secondaryColor: "#7e22ce", sfx: "dark_pulse" },

  // Dragonite
  "Outrage": { style: "CONTACT", type: "Dragon", duration: 1050, dashType: "fury_rush", impactEffect: "outrage_fury", color: "#ea580c", secondaryColor: "#ef4444", screenShake: "heavy", sfx: "outrage" },
  "Wing Attack": { style: "CONTACT", type: "Flying", duration: 780, dashType: "swoop", impactEffect: "wing_slashes", color: "#ffffff", secondaryColor: "#cbd5e1", sfx: "slash" },
  "Fire Punch": { style: "CONTACT", type: "Fire", duration: 820, dashType: "lunge", impactEffect: "flaming_fist", color: "#f97316", secondaryColor: "#fde047", sfx: "fire_hit" },

  // Lucario
  "Aura Sphere": { style: "PROJECTILE", type: "Fighting", duration: 860, shape: "aura_orb", count: 1, size: 30, color: "#0284c7", secondaryColor: "#7dd3fc", impactEffect: "aura_burst", sfx: "aura" },
  "Flash Cannon": { style: "BEAM", type: "Steel", duration: 900, beamWidth: 26, streamParticles: "metallic_sparkles", color: "#e2e8f0", secondaryColor: "#ffffff", sfx: "steel_beam" },
  "Dragon Pulse": { style: "BEAM", type: "Dragon", duration: 940, beamWidth: 32, streamParticles: "dragon_rings", color: "#4f46e5", secondaryColor: "#c084fc", sfx: "dragon" },
  "Close Combat": { style: "CONTACT", type: "Fighting", duration: 980, dashType: "flurry_rush", impactEffect: "punch_flurry", color: "#dc2626", secondaryColor: "#fef08a", screenShake: "light", sfx: "flurry" },

  // Gyarados
  "Waterfall": { style: "CONTACT", type: "Water", duration: 920, dashType: "water_cloak_rush", impactEffect: "water_crash", color: "#2563eb", secondaryColor: "#bae6fd", sfx: "surf" },
  "Crunch": { style: "CONTACT", type: "Dark", duration: 840, dashType: "lunge", impactEffect: "giant_crunch_fangs", color: "#0f172a", secondaryColor: "#a855f7", screenShake: "light", sfx: "bite" },
  "Ice Fang": { style: "CONTACT", type: "Ice", duration: 840, dashType: "lunge", impactEffect: "ice_fangs", color: "#06b6d4", secondaryColor: "#ecfeff", sfx: "ice" },
  "Thunder Fang": { style: "CONTACT", type: "Electric", duration: 840, dashType: "lunge", impactEffect: "thunder_fangs", color: "#eab308", secondaryColor: "#fef9c3", sfx: "thunder" },

  // Alakazam
  "Psychic": { style: "AREA", type: "Psychic", duration: 1000, areaEffect: "psychic_waves", color: "#ec4899", secondaryColor: "#f472b6", sfx: "psychic" },
  "Focus Blast": { style: "PROJECTILE", type: "Fighting", duration: 960, shape: "focus_orb", count: 1, size: 36, color: "#ea580c", secondaryColor: "#fde047", impactEffect: "massive_explosion", screenShake: "heavy", sfx: "explosion" },
  "Energy Ball": { style: "PROJECTILE", type: "Grass", duration: 880, shape: "nature_orb", count: 1, size: 28, color: "#22c55e", secondaryColor: "#bef264", impactEffect: "emerald_burst", sfx: "aura" },

  // Snorlax
  "Hammer Arm": { style: "CONTACT", type: "Fighting", duration: 900, dashType: "lunge", impactEffect: "giant_hammer_fist", color: "#d97706", secondaryColor: "#fef08a", screenShake: "heavy", sfx: "slam" },
  "Earthquake": { style: "AREA", type: "Ground", duration: 1050, areaEffect: "ground_cracks", color: "#b45309", secondaryColor: "#fde68a", screenShake: "heavy", sfx: "earthquake" },

  // Garchomp
  "Stone Edge": { style: "AREA", type: "Rock", duration: 940, areaEffect: "stone_spikes", color: "#78350f", secondaryColor: "#d6d3d1", screenShake: "light", sfx: "rock" },

  // Gardevoir
  "Moonblast": { style: "PROJECTILE", type: "Fairy", duration: 980, shape: "moon_orb", count: 1, size: 34, arcHeight: 45, color: "#f472b6", secondaryColor: "#fdf2f8", impactEffect: "starlight_burst", sfx: "moonblast" },

  // Mewtwo
  "Psystrike": { style: "AREA", type: "Psychic", duration: 1080, areaEffect: "psystrike_pillars", color: "#a855f7", secondaryColor: "#f472b6", screenShake: "heavy", sfx: "psychic" },

  // Rayquaza
  "Dragon Ascent": { style: "CONTACT", type: "Flying", duration: 1050, dashType: "emerald_skydive", impactEffect: "dragon_ascent_burst", color: "#10b981", secondaryColor: "#fde047", screenShake: "heavy", sfx: "outrage" },
  "Extreme Speed": { style: "CONTACT", type: "Normal", duration: 680, dashType: "sonic_afterimage", impactEffect: "mach_sonic_ring", color: "#ffffff", secondaryColor: "#fde047", screenShake: "light", sfx: "quick" },

  // Umbreon
  "Foul Play": { style: "CONTACT", type: "Dark", duration: 840, dashType: "lunge", impactEffect: "foul_play_slashes", color: "#1e1b4b", secondaryColor: "#e11d48", screenShake: "light", sfx: "bite" },

  // Blaziken
  "Blaze Kick": { style: "CONTACT", type: "Fire", duration: 860, dashType: "high_jump", impactEffect: "blaze_kick_arc", color: "#f97316", secondaryColor: "#fde047", screenShake: "light", sfx: "fire_hit" },
  "Brave Bird": { style: "CONTACT", type: "Flying", duration: 980, dashType: "raptor_aura_rush", impactEffect: "brave_bird_impact", color: "#0284c7", secondaryColor: "#e0f2fe", screenShake: "heavy", sfx: "outrage" },
  "Thunder Punch": { style: "CONTACT", type: "Electric", duration: 820, dashType: "lunge", impactEffect: "thunder_fist", color: "#facc15", secondaryColor: "#ffffff", screenShake: "light", sfx: "thunder" },

  // Metagross
  "Meteor Mash": { style: "CONTACT", type: "Steel", duration: 940, dashType: "meteor_rush", impactEffect: "meteor_mash_impact", color: "#94a3b8", secondaryColor: "#38bdf8", screenShake: "heavy", sfx: "slam" },
  "Zen Headbutt": { style: "CONTACT", type: "Psychic", duration: 820, dashType: "psychic_ram", impactEffect: "zen_headbutt_rings", color: "#ec4899", secondaryColor: "#67e8f9", screenShake: "light", sfx: "psychic" },
  "Ice Punch": { style: "CONTACT", type: "Ice", duration: 820, dashType: "lunge", impactEffect: "ice_fist_freeze", color: "#06b6d4", secondaryColor: "#ecfeff", sfx: "ice" },

  // Scizor
  "X-Scissor": { style: "CONTACT", type: "Bug", duration: 800, dashType: "lunge", impactEffect: "x_scissor_cross", color: "#84cc16", secondaryColor: "#ecfccb", sfx: "slash" },
  "Bullet Punch": { style: "CONTACT", type: "Steel", duration: 720, dashType: "speed_streak", impactEffect: "bullet_punch_barrage", color: "#cbd5e1", secondaryColor: "#f8fafc", sfx: "flurry" },
  "Night Slash": { style: "CONTACT", type: "Dark", duration: 780, dashType: "lunge", impactEffect: "night_slash_katana", color: "#0f172a", secondaryColor: "#c084fc", sfx: "slash" },

  // Lapras
  "Blizzard": { style: "AREA", type: "Ice", duration: 1100, areaEffect: "blizzard_storm", color: "#38bdf8", secondaryColor: "#ffffff", screenShake: "light", sfx: "ice" },

  // Arcanine
  "Flare Blitz": { style: "CONTACT", type: "Fire", duration: 1020, dashType: "fireball_vortex_rush", impactEffect: "flare_blitz_detonation", color: "#ef4444", secondaryColor: "#fde047", screenShake: "heavy", sfx: "explosion" },
  "Wild Charge": { style: "CONTACT", type: "Electric", duration: 920, dashType: "electric_volt_rush", impactEffect: "wild_charge_burst", color: "#eab308", secondaryColor: "#fef08a", screenShake: "heavy", sfx: "thunder" },

  // Sceptile
  "Leaf Blade": { style: "CONTACT", type: "Grass", duration: 820, dashType: "lunge", impactEffect: "leaf_blade_slash", color: "#16a34a", secondaryColor: "#bbf7d0", sfx: "slash" }
};

export class FxEngine {
  constructor(canvasId, sceneContainerId) {
    this.canvas = document.getElementById(canvasId);
    this.sceneContainer = document.getElementById(sceneContainerId);
    this.ctx = this.canvas?.getContext('2d');
  }

  resize() {
    if (!this.canvas || !this.sceneContainer) return;
    const rect = this.sceneContainer.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  getSpriteCenter(wrapperId) {
    const wrap = document.getElementById(wrapperId);
    if (!wrap || !this.sceneContainer) return { x: 0, y: 0 };
    const sceneRect = this.sceneContainer.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    return {
      x: (wrapRect.left - sceneRect.left) + wrapRect.width * 0.5,
      y: (wrapRect.top - sceneRect.top) + wrapRect.height * 0.52
    };
  }

  async playMoveAnimation(move, isAttackerP1) {
    if (!this.canvas || !this.ctx || !this.sceneContainer) return;
    this.resize();

    const custom = MOVE_ANIMATIONS[move.name] || {};
    const baseTypeStyle = TYPE_COLORS[move.type] || TYPE_COLORS.Normal;
    const cfg = {
      style: custom.style || "PROJECTILE",
      type: move.type,
      duration: custom.duration || 850,
      chargeTime: custom.chargeTime || 0,
      color: custom.color || baseTypeStyle.bg,
      secondaryColor: custom.secondaryColor || baseTypeStyle.border,
      beamWidth: custom.beamWidth || 24,
      streamParticles: custom.streamParticles || "default",
      afterEffect: custom.afterEffect || null,
      pushback: custom.pushback || false,
      shape: custom.shape || "orb",
      count: custom.count || 1,
      size: custom.size || 24,
      arcHeight: custom.arcHeight || 0,
      impactEffect: custom.impactEffect || "burst",
      areaEffect: custom.areaEffect || "rings",
      dashType: custom.dashType || "lunge",
      screenShake: custom.screenShake || null,
      sfx: custom.sfx || "attack"
    };

    audio.playMoveSfx(cfg.sfx);

    const attackerWrapId = isAttackerP1 ? 'playerSpriteWrap' : 'enemySpriteWrap';
    const defenderWrapId = isAttackerP1 ? 'enemySpriteWrap' : 'playerSpriteWrap';
    const attackerEl = document.getElementById(attackerWrapId);
    const defenderEl = document.getElementById(defenderWrapId);

    const startPos = this.getSpriteCenter(attackerWrapId);
    const endPos = this.getSpriteCenter(defenderWrapId);
    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    const angle = Math.atan2(dy, dx);

    const seeds = Array.from({ length: 40 }, () => ({
      r1: Math.random(), r2: Math.random(), r3: Math.random(), r4: Math.random()
    }));

    if (cfg.screenShake && this.sceneContainer) {
      const cls = cfg.screenShake === 'heavy' ? 'scene-shake-heavy' : 'scene-shake-light';
      this.sceneContainer.classList.remove('scene-shake-heavy', 'scene-shake-light');
      void this.sceneContainer.offsetWidth;
      this.sceneContainer.classList.add(cls);
    }

    // Lean-back cast pose for special moves
    const applySpecialCastPose = (progress) => {
      if (!attackerEl) return;
      const dirSign = isAttackerP1 ? 1 : -1;
      if (progress < 0.26) {
        const p = Math.sin((progress / 0.26) * (Math.PI / 2));
        attackerEl.style.transform = `translate(${-14 * dirSign * p}px, ${8 * dirSign * p}px) rotate(${-12 * dirSign * p}deg)`;
        attackerEl.style.filter = `drop-shadow(0 0 18px ${cfg.color}) brightness(${1 + 0.45 * p})`;
      } else if (progress < 0.62) {
        const p = Math.sin(((progress - 0.26) / 0.36) * Math.PI);
        attackerEl.style.transform = `translate(${12 * dirSign * p}px, ${-6 * dirSign * p}px) rotate(${7 * dirSign * p}deg)`;
        attackerEl.style.filter = `drop-shadow(0 0 22px ${cfg.color}) brightness(1.3)`;
      } else {
        attackerEl.style.transform = '';
        attackerEl.style.filter = '';
      }
    };

    await new Promise(resolve => {
      const startTime = performance.now();
      const renderFrame = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / cfg.duration);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (cfg.style === 'PROJECTILE') {
          applySpecialCastPose(progress);
          this.drawProjectile(cfg, progress, startPos, endPos, angle, seeds);
        } else if (cfg.style === 'BEAM') {
          applySpecialCastPose(progress);
          this.drawBeam(cfg, elapsed, progress, startPos, endPos, seeds, defenderEl, isAttackerP1);
        } else if (cfg.style === 'AREA') {
          applySpecialCastPose(progress);
          this.drawArea(cfg, progress, startPos, endPos, seeds, defenderEl);
        } else if (cfg.style === 'CONTACT') {
          this.drawContact(cfg, progress, startPos, endPos, dx, dy, attackerEl, defenderEl, seeds);
        }

        if (progress < 1) {
          requestAnimationFrame(renderFrame);
        } else {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          if (attackerEl) { attackerEl.style.transform = ''; attackerEl.style.filter = ''; }
          if (defenderEl) { defenderEl.style.transform = ''; defenderEl.style.filter = ''; }
          resolve();
        }
      };
      requestAnimationFrame(renderFrame);
    });
  }

  drawProjectile(cfg, progress, startPos, endPos, angle, seeds) {
    const ctx = this.ctx;
    const impactStart = 0.72;
    if (progress < impactStart) {
      const travelP = progress / impactStart;
      const count = cfg.count || 1;
      for (let i = 0; i < count; i++) {
        const windowSpan = count === 1 ? 1 : 0.55;
        const delay = count === 1 ? 0 : (i / (count - 1)) * (1 - windowSpan);
        const localP = (travelP - delay) / windowSpan;
        if (localP < 0 || localP > 1) continue;

        const spreadOffset = count > 1 ? (seeds[i].r1 - 0.5) * 28 : 0;
        const arcY = cfg.arcHeight ? -Math.sin(localP * Math.PI) * cfg.arcHeight : 0;
        const px = startPos.x + (endPos.x - startPos.x) * localP;
        const py = startPos.y + (endPos.y - startPos.y) * localP + arcY + spreadOffset;

        ctx.save();
        ctx.translate(px, py);
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = 18;
        ctx.fillStyle = cfg.color;
        ctx.beginPath();
        ctx.arc(0, 0, cfg.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else {
      // Impact burst
      const impP = (progress - impactStart) / (1 - impactStart);
      ctx.save();
      ctx.translate(endPos.x, endPos.y);
      ctx.strokeStyle = cfg.secondaryColor;
      ctx.lineWidth = 4 * (1 - impP);
      ctx.beginPath();
      ctx.arc(0, 0, impP * 65, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawBeam(cfg, elapsed, progress, startPos, endPos, seeds, defenderEl, isAttackerP1) {
    const ctx = this.ctx;
    const extendP = Math.min(1, progress * 2.8);
    const currEndX = startPos.x + (endPos.x - startPos.x) * extendP;
    const currEndY = startPos.y + (endPos.y - startPos.y) * extendP;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = cfg.color;
    ctx.shadowColor = cfg.color;
    ctx.shadowBlur = 22;
    ctx.lineWidth = cfg.beamWidth * (0.9 + Math.sin(progress * 30) * 0.15);
    ctx.beginPath();
    ctx.moveTo(startPos.x, startPos.y);
    ctx.lineTo(currEndX, currEndY);
    ctx.stroke();

    // Bright core
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = cfg.beamWidth * 0.45;
    ctx.beginPath();
    ctx.moveTo(startPos.x, startPos.y);
    ctx.lineTo(currEndX, currEndY);
    ctx.stroke();
    ctx.restore();
  }

  drawArea(cfg, progress, startPos, endPos, seeds, defenderEl) {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.save();

    if (cfg.areaEffect === 'sky_lightning') {
      // Flash
      if (progress < 0.25 || (progress > 0.45 && progress < 0.6)) {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.32)';
        ctx.fillRect(0, 0, W, H);
      }
      for (let b = -1; b <= 1; b++) {
        ctx.strokeStyle = b === 0 ? '#ffffff' : '#facc15';
        ctx.lineWidth = 4;
        ctx.beginPath();
        let currX = endPos.x + b * 24;
        ctx.moveTo(currX, 0);
        for (let s = 1; s <= 6; s++) {
          ctx.lineTo(endPos.x + Math.sin(progress * 50 + s * 3) * 30, (endPos.y + 15) * (s / 6));
        }
        ctx.stroke();
      }
    } else {
      // Expanding elemental wave
      for (let r = 0; r < 4; r++) {
        const ringP = (progress * 1.5 - r * 0.18);
        if (ringP > 0 && ringP < 1) {
          ctx.strokeStyle = cfg.color;
          ctx.lineWidth = 6 * (1 - ringP);
          ctx.beginPath();
          ctx.arc(endPos.x, endPos.y, ringP * 85, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  drawContact(cfg, progress, startPos, endPos, dx, dy, attackerEl, defenderEl, seeds) {
    const ctx = this.ctx;
    let moveRatio = progress < 0.35 ? progress / 0.35 : progress < 0.78 ? 1 : 1 - (progress - 0.78) / 0.22;
    const tx = dx * 0.76 * moveRatio;
    const ty = dy * 0.76 * moveRatio;
    if (attackerEl) attackerEl.style.transform = `translate(${tx}px, ${ty}px)`;

    if (progress >= 0.32 && progress <= 0.88) {
      const impP = (progress - 0.32) / 0.56;
      ctx.save();
      ctx.translate(endPos.x, endPos.y);
      ctx.strokeStyle = cfg.color;
      ctx.shadowColor = cfg.secondaryColor;
      ctx.shadowBlur = 18;
      ctx.lineWidth = 7 * (1 - impP * 0.5);
      ctx.beginPath();
      ctx.moveTo(-35, -35); ctx.lineTo(35, 35);
      ctx.moveTo(35, -35); ctx.lineTo(-35, 35);
      ctx.stroke();
      ctx.restore();
    }
  }
}
