/**
 * Snapshot Interpolation Buffer & Client-Side Prediction
 * Interpolates remote state ~100ms in the past while predicting local player state.
 */
export class SnapshotBuffer {
  constructor(interpolationDelayMs = 100) {
    this.buffer = []; // Array of { time, snapshot }
    this.interpolationDelayMs = interpolationDelayMs;
    this.maxBufferSize = 60; // Keep last 2 seconds of snapshots
    this.predictedActions = []; // Queue of predicted local inputs
  }

  addSnapshot(snapshot, receiveTime = performance.now()) {
    this.buffer.push({ time: receiveTime, snapshot });
    // Keep buffer bounded
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }
  }

  clear() {
    this.buffer = [];
    this.predictedActions = [];
  }

  // Record a local action predicted by the client
  predictAction(frame, action) {
    this.predictedActions.push({ frame, action });
    if (this.predictedActions.length > 120) {
      this.predictedActions.shift();
    }
  }

  // Get interpolated snapshot at render time
  getInterpolatedState(now = performance.now()) {
    if (this.buffer.length === 0) return null;
    if (this.buffer.length === 1) return this.buffer[0].snapshot;

    const renderTime = now - this.interpolationDelayMs;

    // If render time is older than the oldest snapshot in buffer, return oldest
    if (renderTime <= this.buffer[0].time) {
      return this.buffer[0].snapshot;
    }

    // If render time is newer than latest snapshot, extrapolate or return latest
    const latest = this.buffer[this.buffer.length - 1];
    if (renderTime >= latest.time) {
      return latest.snapshot;
    }

    // Find the two snapshots surrounding renderTime
    let s0 = this.buffer[0];
    let s1 = latest;
    for (let i = 0; i < this.buffer.length - 1; i++) {
      if (this.buffer[i].time <= renderTime && renderTime <= this.buffer[i + 1].time) {
        s0 = this.buffer[i];
        s1 = this.buffer[i + 1];
        break;
      }
    }

    const span = s1.time - s0.time;
    const alpha = span > 0 ? (renderTime - s0.time) / span : 1;

    return this.interpolateSnapshots(s0.snapshot, s1.snapshot, alpha);
  }

  // Smoothly interpolate between snapshot 0 and snapshot 1
  interpolateSnapshots(s0, s1, alpha) {
    // Structural state generally takes the latest snapshot
    const result = {
      f: s1.f,
      rs: s1.rs,
      r: s1.r,
      st: s1.st,
      bt: s1.bt,
      p1s: s1.p1s,
      p2s: s1.p2s,
      cin: s1.cin,
      p1: this.interpolatePlayer(s0.p1, s1.p1, alpha),
      p2: this.interpolatePlayer(s0.p2, s1.p2, alpha)
    };
    return result;
  }

  interpolatePlayer(p0, p1, alpha) {
    if (!p0 || !p1) return p1 || p0;
    return {
      activeIdx: p1.activeIdx,
      ultCharge: Math.round(p0.ultCharge + (p1.ultCharge - p0.ultCharge) * alpha),
      team: p1.team.map((poke1, idx) => {
        const poke0 = p0.team[idx] || poke1;
        return {
          id: poke1.id,
          maxHp: poke1.maxHp,
          fainted: poke1.fainted,
          cooldowns: poke1.cooldowns,
          ultCd: poke1.ultCd,
          // Smoothly lerp HP to avoid abrupt jumps
          hp: Math.round(poke0.hp + (poke1.hp - poke0.hp) * alpha)
        };
      })
    };
  }
}
