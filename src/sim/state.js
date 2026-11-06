/**
 * Battle State Management & Snapshot Serialization
 * Host-authoritative snapshot generation and compact delta representation.
 */
import { POKEMON_POOL, clonePokemonForBattle } from './constants.js';

export const ROUND_STATES = {
  LOBBY: 'LOBBY',
  COUNTDOWN: 'COUNTDOWN',
  ACTIVE_COMBAT: 'ACTIVE_COMBAT',
  CINEMATIC_FREEZE: 'CINEMATIC_FREEZE',
  FORCED_SWITCH: 'FORCED_SWITCH',
  ROUND_END: 'ROUND_END',
  MATCH_END: 'MATCH_END'
};

export function createInitialBattleState(config = {}) {
  const seed = config.seed || (Date.now() & 0xFFFFFFFF);
  const p1Team = (config.p1?.teamIds || [25, 6, 9, 3]).map(id => {
    const tmpl = POKEMON_POOL.find(p => p.id === id) || POKEMON_POOL[0];
    return clonePokemonForBattle(tmpl);
  });
  const p2Team = (config.p2?.teamIds || [150, 448, 130, 94]).map(id => {
    const tmpl = POKEMON_POOL.find(p => p.id === id) || POKEMON_POOL[1];
    return clonePokemonForBattle(tmpl);
  });

  return {
    frame: 0,
    seed,
    arena: config.arena || 'stadium',
    bestOf: config.bestOf || 1,
    p1Score: 0,
    p2Score: 0,
    round: 1,
    roundState: ROUND_STATES.COUNTDOWN,
    stateTimer: 3.0, // 3-2-1 countdown
    battleTimer: config.roundTime || 90,
    cinematic: null, // If active: { type: 'ult', pokemonId, move, duration, elapsed, attackerIsP1 }
    p1: {
      id: config.p1?.id || 'p1',
      name: config.p1?.name || 'Player 1',
      isAI: !!config.p1?.isAI,
      activeIdx: 0,
      ultCharge: 50,
      turnsSinceSwitch: 99,
      team: p1Team
    },
    p2: {
      id: config.p2?.id || 'p2',
      name: config.p2?.name || 'Player 2',
      isAI: !!config.p2?.isAI,
      activeIdx: 0,
      ultCharge: 50,
      turnsSinceSwitch: 99,
      team: p2Team
    },
    events: [] // Ephemeral gameplay events generated in this tick
  };
}

/**
 * Creates a serializable snapshot of the simulation state
 */
export function serializeSnapshot(state) {
  const packPlayer = (p) => ({
    activeIdx: p.activeIdx,
    ultCharge: Math.round(p.ultCharge),
    team: p.team.map(poke => ({
      id: poke.id,
      hp: poke.hp,
      maxHp: poke.maxHp,
      fainted: poke.fainted,
      cooldowns: [...poke.moveCooldowns],
      ultCd: poke.ultCooldown
    }))
  });

  return {
    f: state.frame,
    rs: state.roundState,
    r: state.round,
    st: Math.round(state.stateTimer * 10) / 10,
    bt: Math.round(state.battleTimer * 10) / 10,
    p1s: state.p1Score,
    p2s: state.p2Score,
    cin: state.cinematic ? {
      type: state.cinematic.type,
      pokeId: state.cinematic.pokemonId,
      name: state.cinematic.move.name,
      p1: state.cinematic.attackerIsP1,
      dur: state.cinematic.duration,
      el: Math.round(state.cinematic.elapsed * 10) / 10
    } : null,
    p1: packPlayer(state.p1),
    p2: packPlayer(state.p2)
  };
}

/**
 * Applies a snapshot to an existing state (used on Guest/Spectator)
 */
export function applySnapshot(targetState, snapshot) {
  if (!snapshot || !targetState) return;
  targetState.frame = snapshot.f;
  targetState.roundState = snapshot.rs;
  targetState.round = snapshot.r;
  targetState.stateTimer = snapshot.st;
  targetState.battleTimer = snapshot.bt;
  targetState.p1Score = snapshot.p1s;
  targetState.p2Score = snapshot.p2s;

  if (snapshot.cin) {
    targetState.cinematic = {
      type: snapshot.cin.type,
      pokemonId: snapshot.cin.pokeId,
      move: { name: snapshot.cin.name },
      attackerIsP1: snapshot.cin.p1,
      duration: snapshot.cin.dur,
      elapsed: snapshot.cin.el
    };
  } else {
    targetState.cinematic = null;
  }

  const unpackPlayer = (targetP, snapP) => {
    targetP.activeIdx = snapP.activeIdx;
    targetP.ultCharge = snapP.ultCharge;
    snapP.team.forEach((snapPoke, idx) => {
      if (targetP.team[idx]) {
        targetP.team[idx].hp = snapPoke.hp;
        targetP.team[idx].fainted = snapPoke.fainted;
        targetP.team[idx].moveCooldowns = [...snapPoke.cooldowns];
        targetP.team[idx].ultCooldown = snapPoke.ultCd;
      }
    });
  };

  unpackPlayer(targetState.p1, snapshot.p1);
  unpackPlayer(targetState.p2, snapshot.p2);
}
