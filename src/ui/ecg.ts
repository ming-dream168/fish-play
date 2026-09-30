// 心电图: 鱼的心电同样有 P 波 (心房), QRS 波群 (心室) 与 T 波 (复极), 与 3D 心脏的收缩相位同步.

export function ecgValue(phase: number) {
  const g = (c: number, w: number) => Math.exp(-Math.pow((phase - c) / w, 2));
  return 0.13 * g(0.2, 0.028) - 0.1 * g(0.372, 0.008) + 1.0 * g(0.39, 0.009) - 0.26 * g(0.41, 0.01) + 0.24 * g(0.63, 0.05);
}

export class EcgMonitor {
  private buf: Float32Array;
  private head = 0;
  private acc = 0;
  private ctx: CanvasRenderingContext2D | null;
  constructor(
    private canvas: HTMLCanvasElement,
    private color = '#f0436f',
    private rate = 120, // 采样/秒
  ) {
    this.buf = new Float32Array(360);
    this.ctx = canvas.getContext('2d');
  }

  push(dt: number, phaseAt: (tBack: number) => number) {
    this.acc += dt * this.rate;
    const n = Math.floor(this.acc);
    this.acc -= n;
    for (let i = n - 1; i >= 0; i--) {
      this.buf[this.head] = ecgValue(phaseAt(i / this.rate));
      this.head = (this.head + 1) % this.buf.length;
    }
  }

  draw() {
    const c = this.canvas;
    const ctx = this.ctx;
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = c.clientWidth;
    const H = c.clientHeight;
    if (c.width !== Math.round(W * dpr)) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // 网格
    ctx.strokeStyle = 'rgba(235,229,214,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
      ctx.stroke();
    }
    const N = this.buf.length;
    const mid = H * 0.62;
    const amp = H * 0.5;
    // 扫描式显示: 写指针处留一段空白
    ctx.lineWidth = 1.4;
    ctx.lineJoin = 'round';
    const gap = 10;
    ctx.beginPath();
    let pen = false;
    for (let i = 0; i < N; i++) {
      const idx = i;
      const age = (this.head - idx + N) % N;
      if (age < gap) {
        pen = false;
        continue;
      }
      const x = (idx / (N - 1)) * W;
      const y = mid - this.buf[idx] * amp;
      if (!pen) {
        ctx.moveTo(x, y);
        pen = true;
      } else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
    // 写指针亮点
    const hx = (this.head / (N - 1)) * W;
    const hv = this.buf[(this.head - 1 + N) % N];
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(hx, mid - hv * amp, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
