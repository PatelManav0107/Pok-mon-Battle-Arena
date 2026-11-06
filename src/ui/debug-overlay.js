/**
 * F3 Debug Overlay
 * Displays live Ping (ms), Snapshot Rate (Hz), Packet Loss (%),
 * Current Simulation Frame, and WebRTC connection diagnostics.
 */

export class DebugOverlay {
  constructor(overlayId = 'debugOverlay') {
    this.el = document.getElementById(overlayId);
    this.visible = false;
    this.netManager = null;
    this.sim = null;
  }

  init(netManager, sim) {
    this.netManager = netManager;
    this.sim = sim;

    // Toggle on F3 key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F3') {
        e.preventDefault();
        this.toggle();
      }
    });

    // Update overlay at 10 Hz
    setInterval(() => this.update(), 100);
  }

  toggle() {
    this.visible = !this.visible;
    if (this.el) {
      if (this.visible) this.el.classList.remove('hidden');
      else this.el.classList.add('hidden');
    }
  }

  update() {
    if (!this.visible || !this.el) return;

    const ping = this.netManager?.ping || 0;
    const snapRate = this.netManager?.snapshotRate || 0;
    const loss = this.netManager?.packetLoss || 0;
    const role = this.netManager?.role || 'OFFLINE';
    const frame = this.sim?.state?.frame || 0;
    const roundState = this.sim?.state?.roundState || 'IDLE';

    let pingClass = 'text-emerald-400';
    if (ping > 120) pingClass = 'text-amber-400';
    if (ping > 250) pingClass = 'text-rose-400';

    this.el.innerHTML = `
      <div class="bg-slate-950/90 border-2 border-emerald-500/70 p-3 rounded-xl font-mono text-xs text-slate-200 shadow-2xl backdrop-blur-md pointer-events-none">
        <div class="flex items-center justify-between border-b border-slate-800 pb-1 mb-2 font-bold text-emerald-400">
          <span>⚡ F3 DEBUG MONITOR</span>
          <span class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-white">${role}</span>
        </div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-1">
          <div>Ping / Latency:</div>
          <div class="font-bold ${pingClass}">${ping} ms (RTT ${this.netManager?.rtt || 0}ms)</div>

          <div>Snapshot Rate:</div>
          <div class="font-bold text-sky-400">${snapRate} Hz</div>

          <div>Packet Loss:</div>
          <div class="font-bold ${loss > 5 ? 'text-rose-400' : 'text-slate-300'}">${loss}%</div>

          <div>Sim Frame / Tick:</div>
          <div class="font-bold text-amber-300">#${frame} (60Hz)</div>

          <div>Round State:</div>
          <div class="font-bold text-purple-300">${roundState}</div>

          <div>Interp Buffer:</div>
          <div class="font-bold text-slate-400">100 ms</div>
        </div>
      </div>
    `;
  }
}
