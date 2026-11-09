// Прелоадер: из точки вырастает квадрат, в нём сменяются фото стройки, внизу катится счётчик.
// Когда страница готова, первый кадр видео раскрывается на весь экран и становится первым экраном
const MIN_INTRO = 2.3;   // сколько длится смена фото, даже если всё загрузилось мгновенно

// Прокрутку блокируем событиями, а не overflow: иначе исчезнет полоса прокрутки
// и закреплённые блоки измерят неверную ширину
function lockScroll() {
  const stop = (e) => e.preventDefault();
  const keys = (e) => {
    if ([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) e.preventDefault();
  };
  const options = { passive: false, capture: true };
  window.addEventListener('wheel', stop, options);
  window.addEventListener('touchmove', stop, options);
  window.addEventListener('keydown', keys, true);
  return () => {
    window.removeEventListener('wheel', stop, options);
    window.removeEventListener('touchmove', stop, options);
    window.removeEventListener('keydown', keys, true);
  };
}

export function initPreloader({ skip }) {
  const root = document.querySelector('[data-preloader]');
  if (!root) return { progress() {}, finish: async () => {} };
  if (skip) {
    root.remove();
    return { progress() {}, finish: async () => {} };
  }

  const unlock = lockScroll();
  const square = root.querySelector('[data-preloader-square]');
  const frames = [...root.querySelectorAll('.preloader__frame')];
  const final = root.querySelector('[data-preloader-final]');
  const counter = root.querySelector('[data-preloader-counter]');
  const digits = [...root.querySelectorAll('[data-preloader-digit]')];

  // Счётчик идёт за реальной загрузкой, но не быстрее смены фото
  let target = 0;
  let shown = 0;
  const started = performance.now();
  const paint = () => {
    gsap.set(digits[0], { yPercent: -10 * Math.floor(shown / 10) });
    gsap.set(digits[1], { yPercent: -(shown % 10) * 10 });
  };
  const tick = () => {
    const pace = Math.min(1, (performance.now() - started) / (MIN_INTRO * 1000));
    const goal = Math.min(target, pace * 99);
    // Догоняем цель с одной и той же скоростью при любой частоте кадров
    const now = performance.now();
    shown += (goal - shown) * (1 - Math.exp(-(now - (tick.last || now)) / 120));
    tick.last = now;
    paint();
  };
  gsap.ticker.add(tick);

  // Смена фото: квадрат вырастает из точки, каждое следующее фото открывается снизу вверх
  const intro = gsap.timeline();
  intro.to(square, { clipPath: 'inset(0%)', duration: 0.7, ease: 'power3.inOut' }, 0);
  frames.slice(1).forEach((frame, i) => {
    intro.to(frame, { clipPath: 'inset(0% 0 0 0)', duration: 0.5, ease: 'power3.inOut' }, 0.5 + i * 0.45);
  });

  // Положение квадрата на экране в виде обрезки полноэкранного кадра
  const crop = (top) => {
    const r = square.getBoundingClientRect();
    return `inset(${top ? r.top : r.bottom}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px)`;
  };

  return {
    progress(fraction) {
      target = Math.max(target, Math.min(99, fraction * 99));
    },
    async finish() {
      target = 99;
      await intro.then();
      // Даём счётчику дойти до конца
      await new Promise((resolve) => {
        const wait = () => (shown >= 98 ? resolve() : setTimeout(wait, 40));
        wait();
      });
      gsap.ticker.remove(tick);
      shown = 99;
      paint();
      unlock();

      // Последний кадр занимает квадрат, затем раскрывается на весь экран
      await gsap.timeline()
        .fromTo(final, { clipPath: crop(false) }, { clipPath: crop(true), duration: 0.5, ease: 'power3.inOut' })
        .to(counter, { opacity: 0, duration: 0.3 }, 0.2)
        .to(final, { clipPath: 'inset(0px 0px 0px 0px)', duration: 1.1, ease: 'power3.inOut' }, 0.6)
        .then();
      root.remove();
    },
  };
}
