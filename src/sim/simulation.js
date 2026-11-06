/**
 * 60Hz Fixed-Timestep Authoritative Game Simulation Engine
 * Runs completely decoupled from rendering, DOM, or Phaser.
 */
import { SeededRNG } from './rng.js';
import { getTypeEffectiveness, POKEMON_POOL } from './constants.js';
import { ROUND_STATES } from './state.js';

export class BattleSimulation {
  constructor(state, seed = 1337) {
    this.state = state;
    this.rng = new SeededRNG(seed);
    this.dt = 1 / 60; // 60 FPS
    this.pendingActions = { p1: null, p2: null };
  }

  setSeed(seed) {
    this.rng.setSeed(seed);
  }

  // Submit player input command (move, ult, switch)
  queueAction(playerKey, action) {
    if (!action) return;
    this.pendingActions[playerKey] = action;
  }

  // Smart AI decision helper (runs inside simulation for AI players)
  computeAiAction(aiSide, oppSide) {
    const myActive = aiSide.team[aiSide.activeIdx];
    const oppActive = oppSide.team[oppSide.activeIdx];
    if (!myActive || myActive.fainted || !oppActive || oppActive.fainted) return null;

    // 1. Tactical switch check if active is low HP or bad matchup
    const myBestDmg = Math.max(...myActive.moves.map(m => m.power * getTypeEffectiveness(m.type, oppActive.types)));
    const oppBestDmg = Math.max(...oppActive.moves.map(m => m.power * getTypeEffectiveness(m.type, myActive.types)));
    const isBadMatchup = (oppBestDmg > myBestDmg * 1.5) && (myActive.hp / myActive.maxHp < 0.4);

    if (isBadMatchup && aiSide.turnsSinceSwitch >= 2 && this.rng.random() < 0.6) {
      let bestReserveIdx = -1;
      let highestDef = -1;
      aiSide.team.forEach((poke, idx) => {
        if (idx !== aiSide.activeIdx && !poke.fainted) {
          const dmgTaken = Math.max(...oppActive.moves.map(m => m.power * getTypeEffectiveness(m.type, poke.types)));
          if (bestReserveIdx === -1 || dmgTaken < highestDef) {
            highestDef = dmgTaken;
            bestReserveIdx = idx;
          }
        }
      });
      if (bestReserveIdx !== -1) {
        return { type: 'switch', targetIdx: bestReserveIdx };
      }
    }

    // 2. Ultimate check
    if (aiSide.ultCharge >= 100 && myActive.ultCooldown === 0 && myActive.ult) {
      const ultEff = getTypeEffectiveness(myActive.ult.type, oppActive.types);
      if (ultEff > 0 && this.rng.random() < 0.85) {
        return { type: 'ult' };
      }
    }

    // 3. Move selection
    const readyMoves = myActive.moves
      .map((m, idx) => ({ idx, move: m, cd: myActive.moveCooldowns[idx] || 0 }))
      .filter(item => item.cd === 0);

    const validMoves = readyMoves.length > 0
      ? readyMoves
      : myActive.moves.map((m, idx) => ({ idx, move: m, cd: 0 }));

    // Score moves by effectiveness
    validMoves.sort((a, b) => {
      const scoreA = a.move.power * getTypeEffectiveness(a.move.type, oppActive.types);
      const scoreB = b.move.power * getTypeEffectiveness(b.move.type, oppActive.types);
      return scoreB - scoreA;
    });

    const chosen = (this.rng.random() < 0.8 || validMoves.length === 1)
      ? validMoves[0]
      : validMoves[this.rng.range(0, validMoves.length - 1)];

    return { type: 'move', moveIdx: chosen.idx };
  }

  // Damage calculation matching official formula + Seeded RNG
  calculateDamage(attacker, defender, move) {
    const effectiveness = getTypeEffectiveness(move.type, defender.types);
    if (effectiveness === 0) {
      return { damage: 0, effectiveness: 0, isCrit: false };
    }

    const statRatio = Math.max(0.5, Math.min(2.0, attacker.atk / defender.def));
    const stab = attacker.types.includes(move.type) ? 1.5 : 1.0;
    const randomFactor = 0.85 + this.rng.random() * 0.15;
    const isCrit = this.rng.random() < 0.06;
    const critMultiplier = isCrit ? 1.5 : 1.0;

    const rawDamage = move.power * statRatio * 0.5 * stab * effectiveness * randomFactor * critMultiplier;
    return {
      damage: Math.max(1, Math.round(rawDamage)),
      effectiveness,
      isCrit
    };
  }

  // Advance simulation by 1 tick (1/60s)
  update() {
    this.state.frame++;
    const events = [];

    // 1. COUNTDOWN STATE
    if (this.state.roundState === ROUND_STATES.COUNTDOWN) {
      this.state.stateTimer -= this.dt;
      if (this.state.stateTimer <= 0) {
        this.state.roundState = ROUND_STATES.ACTIVE_COMBAT;
        this.state.stateTimer = 0;
        events.push({
          type: 'ROUND_START',
          round: this.state.round,
          frame: this.state.frame
        });
      }
      return events;
    }

    // 2. CINEMATIC FREEZE (Ultimate Anime Cut-In Sync)
    if (this.state.roundState === ROUND_STATES.CINEMATIC_FREEZE) {
      if (this.state.cinematic) {
        this.state.cinematic.elapsed += this.dt;
        if (this.state.cinematic.elapsed >= this.state.cinematic.duration) {
          // Resolve ultimate impact
          const isP1 = this.state.cinematic.attackerIsP1;
          const attackerSide = isP1 ? this.state.p1 : this.state.p2;
          const defenderSide = isP1 ? this.state.p2 : this.state.p1;
          const attacker = attackerSide.team[attackerSide.activeIdx];
          const defender = defenderSide.team[defenderSide.activeIdx];
          const ult = attacker.ult;

          const dmgResult = this.calculateDamage(attacker, defender, ult);
          defender.hp = Math.max(0, defender.hp - dmgResult.damage);
          if (defender.hp <= 0) defender.fainted = true;

          events.push({
            type: 'ULTIMATE_HIT',
            attackerIsP1: isP1,
            damage: dmgResult.damage,
            effectiveness: dmgResult.effectiveness,
            isCrit: dmgResult.isCrit,
            targetFainted: defender.fainted,
            frame: this.state.frame
          });

          this.state.cinematic = null;
          this.state.roundState = ROUND_STATES.ACTIVE_COMBAT;
          this.checkPostAttackState(events);
        }
      }
      return events;
    }

    // 3. FORCED SWITCH (Waiting for a player whose Pokémon fainted)
    if (this.state.roundState === ROUND_STATES.FORCED_SWITCH) {
      this.state.stateTimer -= this.dt;
      // Auto-switch on timeout
      ['p1', 'p2'].forEach(playerKey => {
        const side = this.state[playerKey];
        const active = side.team[side.activeIdx];
        if (active.fainted) {
          const action = this.pendingActions[playerKey];
          let chosenIdx = action?.type === 'switch' ? action.targetIdx : -1;
          if (chosenIdx === -1 || side.team[chosenIdx]?.fainted) {
            // Find first alive
            chosenIdx = side.team.findIndex(p => !p.fainted);
          }
          if (chosenIdx !== -1 && (this.state.stateTimer <= 0 || action?.type === 'switch')) {
            side.activeIdx = chosenIdx;
            side.turnsSinceSwitch = 0;
            this.pendingActions[playerKey] = null;
            events.push({
              type: 'SWITCH',
              playerKey,
              newIndex: chosenIdx,
              pokemon: side.team[chosenIdx],
              frame: this.state.frame
            });
          }
        }
      });

      const p1Alive = !this.state.p1.team[this.state.p1.activeIdx].fainted;
      const p2Alive = !this.state.p2.team[this.state.p2.activeIdx].fainted;
      if (p1Alive && p2Alive) {
        this.state.roundState = ROUND_STATES.ACTIVE_COMBAT;
      }
      return events;
    }

    // 4. ACTIVE COMBAT STATE
    if (this.state.roundState === ROUND_STATES.ACTIVE_COMBAT) {
      if (this.state.battleTimer > 0) {
        this.state.battleTimer -= this.dt;
        if (this.state.battleTimer <= 0) {
          this.state.battleTimer = 0;
          this.resolveTimeOutWinner(events);
          return events;
        }
      }

      // Automatically compute AI actions if needed
      if (this.state.p1.isAI && !this.pendingActions.p1) {
        this.pendingActions.p1 = this.computeAiAction(this.state.p1, this.state.p2);
      }
      if (this.state.p2.isAI && !this.pendingActions.p2) {
        this.pendingActions.p2 = this.computeAiAction(this.state.p2, this.state.p1);
      }

      // If both actions are queued, execute the turn!
      if (this.pendingActions.p1 && this.pendingActions.p2) {
        this.executeTurn(events);
      }
    }

    return events;
  }

  executeTurn(events) {
    const act1 = this.pendingActions.p1;
    const act2 = this.pendingActions.p2;
    this.pendingActions.p1 = null;
    this.pendingActions.p2 = null;

    this.state.p1.turnsSinceSwitch++;
    this.state.p2.turnsSinceSwitch++;

    // Step A: Process switches first
    if (act1.type === 'switch' && !this.state.p1.team[act1.targetIdx]?.fainted) {
      this.state.p1.activeIdx = act1.targetIdx;
      this.state.p1.turnsSinceSwitch = 0;
      events.push({
        type: 'SWITCH',
        playerKey: 'p1',
        newIndex: act1.targetIdx,
        pokemon: this.state.p1.team[act1.targetIdx],
        frame: this.state.frame
      });
    }

    if (act2.type === 'switch' && !this.state.p2.team[act2.targetIdx]?.fainted) {
      this.state.p2.activeIdx = act2.targetIdx;
      this.state.p2.turnsSinceSwitch = 0;
      events.push({
        type: 'SWITCH',
        playerKey: 'p2',
        newIndex: act2.targetIdx,
        pokemon: this.state.p2.team[act2.targetIdx],
        frame: this.state.frame
      });
    }

    // Step B: Determine attack order by Pokémon Speed
    const p1Active = this.state.p1.team[this.state.p1.activeIdx];
    const p2Active = this.state.p2.team[this.state.p2.activeIdx];

    const p1Attacking = (act1.type === 'move' || act1.type === 'ult') && !p1Active.fainted;
    const p2Attacking = (act2.type === 'move' || act2.type === 'ult') && !p2Active.fainted;

    if (!p1Attacking && !p2Attacking) {
      this.endRoundTick(events);
      return;
    }

    let p1First = true;
    if (p1Attacking && p2Attacking) {
      if (p1Active.spd > p2Active.spd) p1First = true;
      else if (p2Active.spd > p1Active.spd) p1First = false;
      else p1First = this.rng.random() < 0.5;
    } else if (p2Attacking) {
      p1First = false;
    }

    const firstPlayerKey = p1First ? 'p1' : 'p2';
    const firstAction = p1First ? act1 : act2;
    const secondPlayerKey = p1First ? 'p2' : 'p1';
    const secondAction = p1First ? act2 : act1;

    // Execute First Action
    const firstIsUlt = firstAction.type === 'ult';
    if (firstIsUlt) {
      this.triggerUltimateCinematic(firstPlayerKey, events);
      return; // Simulation freezes during cinematic
    } else if (firstAction.type === 'move') {
      this.resolveSingleAttack(firstPlayerKey, firstAction.moveIdx, events);
    }

    // Execute Second Action (if target not fainted)
    const secondSide = this.state[secondPlayerKey];
    const secondActive = secondSide.team[secondSide.activeIdx];
    if (!secondActive.fainted) {
      if (secondAction.type === 'ult') {
        this.triggerUltimateCinematic(secondPlayerKey, events);
        return;
      } else if (secondAction.type === 'move') {
        this.resolveSingleAttack(secondPlayerKey, secondAction.moveIdx, events);
      }
    }

    this.endRoundTick(events);
    this.checkPostAttackState(events);
  }

  triggerUltimateCinematic(playerKey, events) {
    const isP1 = playerKey === 'p1';
    const attackerSide = isP1 ? this.state.p1 : this.state.p2;
    const attacker = attackerSide.team[attackerSide.activeIdx];

    attackerSide.ultCharge = 0;
    attacker.ultCooldown = (attacker.ult.cd || 3) + 1;

    this.state.roundState = ROUND_STATES.CINEMATIC_FREEZE;
    this.state.cinematic = {
      type: 'ult',
      pokemonId: attacker.id,
      move: attacker.ult,
      attackerIsP1: isP1,
      duration: 3.2, // Total cutscene + impact duration (s)
      elapsed: 0
    };

    events.push({
      type: 'ULTIMATE_CINEMATIC_START',
      attackerIsP1: isP1,
      pokemonId: attacker.id,
      ult: attacker.ult,
      frame: this.state.frame
    });
  }

  resolveSingleAttack(playerKey, moveIdx, events) {
    const isP1 = playerKey === 'p1';
    const attackerSide = isP1 ? this.state.p1 : this.state.p2;
    const defenderSide = isP1 ? this.state.p2 : this.state.p1;
    const attacker = attackerSide.team[attackerSide.activeIdx];
    const defender = defenderSide.team[defenderSide.activeIdx];

    const move = attacker.moves[moveIdx] || attacker.moves[0];
    if (move.cd > 0) attacker.moveCooldowns[moveIdx] = move.cd + 1;

    // Ult charge accumulation
    attackerSide.ultCharge = Math.min(100, attackerSide.ultCharge + 35);

    const dmgResult = this.calculateDamage(attacker, defender, move);
    defender.hp = Math.max(0, defender.hp - dmgResult.damage);
    defenderSide.ultCharge = Math.min(100, defenderSide.ultCharge + 25);
    if (defender.hp <= 0) defender.fainted = true;

    events.push({
      type: 'HIT',
      attackerIsP1: isP1,
      moveName: move.name,
      moveType: move.type,
      damage: dmgResult.damage,
      effectiveness: dmgResult.effectiveness,
      isCrit: dmgResult.isCrit,
      targetFainted: defender.fainted,
      frame: this.state.frame
    });
  }

  endRoundTick(events) {
    this.state.round++;
    ['p1', 'p2'].forEach(playerKey => {
      const side = this.state[playerKey];
      side.ultCharge = Math.min(100, side.ultCharge + 15);
      side.team.forEach(poke => {
        poke.moveCooldowns = poke.moveCooldowns.map(cd => Math.max(0, cd - 1));
        if (poke.ultCooldown > 0) poke.ultCooldown = Math.max(0, poke.ultCooldown - 1);
      });
    });
  }

  checkPostAttackState(events) {
    const p1AliveCount = this.state.p1.team.filter(p => !p.fainted).length;
    const p2AliveCount = this.state.p2.team.filter(p => !p.fainted).length;

    if (p1AliveCount === 0 || p2AliveCount === 0) {
      const p1Won = p1AliveCount > 0;
      if (p1Won) this.state.p1Score++;
      else this.state.p2Score++;

      const matchEnded = (this.state.bestOf === 1) ||
                         (this.state.p1Score > this.state.bestOf / 2) ||
                         (this.state.p2Score > this.state.bestOf / 2);

      this.state.roundState = matchEnded ? ROUND_STATES.MATCH_END : ROUND_STATES.ROUND_END;
      events.push({
        type: 'MATCH_OVER',
        winnerIsP1: p1Won,
        p1Score: this.state.p1Score,
        p2Score: this.state.p2Score,
        matchEnded,
        frame: this.state.frame
      });
      return;
    }

    // If an active Pokémon fainted, request forced switch
    const p1ActiveFainted = this.state.p1.team[this.state.p1.activeIdx].fainted;
    const p2ActiveFainted = this.state.p2.team[this.state.p2.activeIdx].fainted;

    if (p1ActiveFainted || p2ActiveFainted) {
      this.state.roundState = ROUND_STATES.FORCED_SWITCH;
      this.state.stateTimer = 15.0; // 15 seconds to switch
      events.push({
        type: 'FORCED_SWITCH_PROMPT',
        p1Fainted: p1ActiveFainted,
        p2Fainted: p2ActiveFainted,
        frame: this.state.frame
      });
    }
  }

  resolveTimeOutWinner(events) {
    const p1HpSum = this.state.p1.team.reduce((acc, p) => acc + p.hp, 0);
    const p2HpSum = this.state.p2.team.reduce((acc, p) => acc + p.hp, 0);
    const p1Won = p1HpSum >= p2HpSum;
    if (p1Won) this.state.p1Score++;
    else this.state.p2Score++;

    this.state.roundState = ROUND_STATES.MATCH_END;
    events.push({
      type: 'MATCH_OVER',
      winnerIsP1: p1Won,
      reason: 'TIMEOUT',
      frame: this.state.frame
    });
  }
}
