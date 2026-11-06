/**
 * Unified Keyboard & Mobile Touch Control System
 * Clears input state on window blur, supports input delay buffering,
 * and maintains continuous simulation when Esc menu is opened online.
 */

export class ControlsManager {
  constructor() {
    this.keysDown = new Set();
    this.inputDelayFrames = 1; // 0 to 6 frames
    this.isTabActive = true;
    this.onActionCallback = null;
    this.onMenuToggle = null;
    this.onTabVisibilityChange = null;

    this.setupListeners();
  }

  setInputDelay(frames) {
    this.inputDelayFrames = Math.max(0, Math.min(6, frames));
  }

  setupListeners() {
    // Keyboard Keydown
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

      const code = e.code;
      const key = e.key.toLowerCase();

      // Avoid repeat triggers for single-fire actions
      if (this.keysDown.has(code)) return;
      this.keysDown.add(code);

      // Number keys 1-4
      if (['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key, 10) - 1;
        this.triggerAction('number', index);
        return;
      }

      // Ultimate Move: U or Space
      if (key === 'u' || code === 'Space') {
        e.preventDefault();
        this.triggerAction('ultimate', 0);
        return;
      }

      // Switch Drawer: S
      if (key === 's') {
        e.preventDefault();
        this.triggerAction('switch_toggle', 0);
        return;
      }

      // Menu: Esc (never pauses online match)
      if (code === 'Escape') {
        e.preventDefault();
        if (this.onMenuToggle) this.onMenuToggle();
      }
    });

    // Keyboard Keyup
    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
    });

    // Window Blur: Immediately clear all held keys
    window.addEventListener('blur', () => {
      this.keysDown.clear();
      this.isTabActive = false;
      if (this.onTabVisibilityChange) this.onTabVisibilityChange(false);
    });

    // Window Focus
    window.addEventListener('focus', () => {
      this.isTabActive = true;
      if (this.onTabVisibilityChange) this.onTabVisibilityChange(true);
    });

    // Tab visibility change
    document.addEventListener('visibilitychange', () => {
      const active = !document.hidden;
      this.isTabActive = active;
      if (!active) this.keysDown.clear();
      if (this.onTabVisibilityChange) this.onTabVisibilityChange(active);
    });
  }

  triggerAction(type, index) {
    if (!this.onActionCallback) return;

    if (this.inputDelayFrames === 0) {
      this.onActionCallback(type, index);
    } else {
      // Buffer input with delay (each frame = 16.6ms)
      const delayMs = this.inputDelayFrames * (1000 / 60);
      setTimeout(() => {
        this.onActionCallback(type, index);
      }, delayMs);
    }
  }
}
