import { loadImage } from './preload.js?v=18d07d70';
import { compact } from './mode.js?v=18d07d70';

// Последовательность кадров видео, которая рисуется в canvas (object-fit: cover)
export class FrameSequence {
  constructor(canvas, { count, path }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.count = count;
    this.path = path;           // (i) => url кадра, i с нуля
    this.frames = new Array(count);
    this.current = 0;
    this.loading = null;

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
  }

  // Размер canvas = размер на экране × плотность пикселей (не больше 2)
  resize() {
    // На телефонах холст с плотностью экрана до ×3, как на YORU: иначе картинка заметно мягче
    const dpr = Math.min(window.devicePixelRatio || 1, compact ? 3 : 2);
    const w = Math.round(this.canvas.clientWidth * dpr);
    const h = Math.round(this.canvas.clientHeight * dpr);
    // Панель браузера на телефоне меняет окно, но не холст: лишняя очистка дала бы мигание
    if (w !== this.canvas.width || h !== this.canvas.height) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.draw(this.current, true);
  }

  // Ближайший уже загруженный кадр — если нужный ещё качается
  nearest(i) {
    for (let d = 0; d < this.count; d++) {
      if (this.frames[i - d]) return this.frames[i - d];
      if (this.frames[i + d]) return this.frames[i + d];
    }
    return null;
  }

  draw(i, force = false) {
    i = Math.max(0, Math.min(this.count - 1, Math.round(i)));
    if (i === this.current && !force) return;
    this.current = i;
    const img = this.nearest(i);
    if (!img || !this.canvas.width) return;
    const { width: cw, height: ch } = this.canvas;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    this.ctx.imageSmoothingQuality = 'high';  // сбрасывается при изменении размера холста
    this.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  // Первый кадр — до показа сцены
  async loadFirst() {
    if (!this.frames[0]) this.frames[0] = await loadImage(this.path(0));
    this.resize();
  }

  // Остальные кадры «прореживанием»: каждый 16-й, потом 8-й, 4-й…
  // прокрутка работает сразу, плавность догружается. upTo — остановиться на этом шаге
  // (например, 4 — каждый четвёртый кадр), повторный вызов догрузит остальное
  loadAll(concurrency = 6, upTo = 1) {
    if (upTo === 1 && this.loading) return this.loading;
    const order = [];
    const seen = new Set();
    for (let step = 16; step >= upTo; step /= 2) {
      for (let i = 0; i < this.count; i += step) {
        if (!seen.has(i)) { seen.add(i); order.push(i); }
      }
    }
    let cursor = 0;
    const worker = async () => {
      while (cursor < order.length) {
        const i = order[cursor++];
        if (this.frames[i]) continue;
        try {
          this.frames[i] = await loadImage(this.path(i));
          if (Math.abs(i - this.current) < 3) this.draw(this.current, true);
        } catch (_) { /* пропущенный кадр заменится соседним */ }
      }
    };
    const done = Promise.all(Array.from({ length: concurrency }, worker));
    if (upTo === 1) this.loading = done;
    return done;
  }
}
