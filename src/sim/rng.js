/**
 * Deterministic Seeded Pseudo-Random Number Generator (Mulberry32)
 * Ensures 100% deterministic combat simulations across Host and Guest.
 */
export class SeededRNG {
  constructor(seed = 1337) {
    this.initialSeed = seed;
    this.state = seed >>> 0;
  }

  setSeed(seed) {
    this.initialSeed = seed;
    this.state = seed >>> 0;
  }

  // Returns pseudo-random float in [0, 1)
  random() {
    let t = (this.state += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Returns integer in range [min, max] inclusive
  range(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  // Returns random element from array
  choice(array) {
    if (!array || array.length === 0) return null;
    const index = Math.floor(this.random() * array.length);
    return array[index];
  }

  // Save / restore state for replay or rollback verification
  getState() {
    return this.state;
  }

  setState(state) {
    this.state = state >>> 0;
  }
}
