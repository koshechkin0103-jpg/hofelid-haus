import { compact, narrow, sceneTrigger } from '../utils/mode.js?v=218f62ec';

// Как мы строим: секция закреплена; большая плашка поднимается снизу и сжимается в полосу,
// первое фото этапа открывается снизу вверх, следующие плавно проявляются
const EASE = 'power3.inOut';
const DIMMED = 0.6;   // яркость неактивных колонок шкалы

export function initProcess({ reduced }) {
  const section = document.querySelector('[data-process]');
  if (!section || reduced) return;

  const pin = section.querySelector('[data-process-pin]');
  const photos = [...section.querySelectorAll('[data-process-photo]')];
  const panel = section.querySelector('[data-process-panel]');
  const intro = section.querySelector('[data-process-intro]');
  const heading = section.querySelector('[data-process-heading]');
  const timeline = section.querySelector('[data-timeline]');
  const steps = [...section.querySelectorAll('[data-step]')];
  const bars = [...section.querySelectorAll('[data-step-bar]')];
  // На узких экранах виден один этап за раз, на широких — все пять, текущий ярче
  const targets = narrow ? [...section.querySelectorAll('[data-step-body]')] : steps;
  const idle = narrow ? 0 : DIMMED;

  // Высота полосы = высота шкалы + поля плашки
  const stripHeight = () => timeline.offsetHeight + parseFloat(getComputedStyle(timeline).bottom) * 2;

  // Стартовое состояние: плашка за нижним краем, этапы ждут своей очереди
  gsap.set(panel, { yPercent: 115 });
  // В компактном режиме большая плашка — по содержимому
  if (compact) gsap.set(panel, { height: intro.offsetTop * 2 + intro.offsetHeight });
  gsap.set(photos[0].firstElementChild, { scale: 1.1 });
  gsap.set(photos[1], { yPercent: 100 });
  gsap.set(photos[1].firstElementChild, { yPercent: -100 });
  gsap.set(photos.slice(2), { autoAlpha: 0 });
  gsap.set(photos.slice(2).map((p) => p.firstElementChild), { scale: 1.05 });
  gsap.set(targets, { opacity: idle });
  gsap.set(heading, { opacity: 0, y: 24 });

  const tl = gsap.timeline({
    defaults: { ease: EASE },
    scrollTrigger: sceneTrigger(section, pin, 850),
  });

  const SHRINK = 2.2;     // когда плашка сжимается в полосу
  const STAGES = 3.3;     // когда шкала полностью на месте
  const STEP = 1.7;       // сколько длится один этап
  const FADE = 0.6;       // смена фото между этапами

  // Вступление: готовый дом медленно приближается, снизу поднимается большая плашка
  tl.to(photos[0].firstElementChild, { scale: 1, duration: SHRINK + 1.1, ease: 'none' }, 0)
    .to(panel, { yPercent: 0, duration: 1.1 }, 0.3);

  // Плашка сжимается в полосу, снизу вверх открывается первый этап
  tl.to(intro, { opacity: 0, duration: 0.35, ease: 'power2.out' }, SHRINK)
    .to(panel, { height: stripHeight, duration: 1.1 }, SHRINK)
    .to(photos[1], { yPercent: 0, duration: 1.1 }, SHRINK)
    .to(photos[1].firstElementChild, { yPercent: 0, duration: 1.1 }, SHRINK)
    .to(heading, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, SHRINK + 0.6)
    .to(timeline, { autoAlpha: 1, duration: 0.45, ease: 'power2.out' }, SHRINK + 0.75)
    .to(targets[0], { opacity: 1, duration: 0.45, ease: 'power2.out' }, SHRINK + 0.75);

  // Начало смены на этап i (i = 1…4); для первого этапа — появление шкалы
  const switchAt = (i) => STAGES + STEP * i - FADE;

  steps.forEach((step, i) => {
    if (i > 0) {
      const at = switchAt(i);
      // Фото плавно проявляется поверх предыдущего, колонка становится активной
      tl.to(photos[i + 1], { autoAlpha: 1, duration: FADE, ease: 'power1.inOut' }, at)
        .to(photos[i + 1].firstElementChild, { scale: 1, duration: STEP, ease: 'none' }, at)
        .to(targets[i - 1], { opacity: idle, duration: narrow ? FADE / 2 : FADE, ease: 'power1.inOut' }, at)
        .to(targets[i], { opacity: 1, duration: FADE, ease: 'power1.inOut' }, narrow ? at + FADE / 2 : at);
    }
    // Полоска заполняется, пока этап активен, и доходит до конца к началу следующей смены
    const start = i ? switchAt(i) + FADE / 2 : SHRINK + 0.75;
    tl.to(bars[i], { scaleX: 1, duration: switchAt(i + 1) - start, ease: 'none' }, start);
  });

  // Пауза на готовой комнате перед выходом из блока
  tl.to({}, { duration: 0.4 });
}
