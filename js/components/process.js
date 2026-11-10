import { compact, narrow, sceneTrigger } from '../utils/mode.js?v=2bfb0872';

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
  // В компактном режиме плашка не меняет высоту: она сразу высотой с большую, а сжатие
  // в полосу — это обрезка сверху (--clip, см. adaptive.css)
  const bigHeight = () => intro.offsetTop * 2 + intro.offsetHeight;
  const fullHeight = () => Math.max(bigHeight(), stripHeight());
  if (compact) gsap.set(panel, { height: fullHeight, '--clip': () => `${fullHeight() - bigHeight()}px` });
  // На телефоне фото не приближаются: шесть полноэкранных слоёв с постоянной перерисовкой
  // iPhone не вытягивал и оставлял полупрозрачные полосы недорисованных кусков
  const ZOOM = !compact;
  if (ZOOM) gsap.set(photos[0].firstElementChild, { scale: 1.1 });
  gsap.set(photos[1], { yPercent: 100 });
  gsap.set(photos[1].firstElementChild, { yPercent: -100 });
  gsap.set(photos.slice(2), { autoAlpha: 0 });
  if (ZOOM) gsap.set(photos.slice(2).map((p) => p.firstElementChild), { scale: 1.05 });
  gsap.set(targets, { opacity: idle });
  gsap.set(heading, { opacity: 0, y: 24 });

  const tl = gsap.timeline({
    defaults: { ease: EASE },
    scrollTrigger: sceneTrigger(section, pin, 850, { steps: true }),
  });

  // На телефоне вступление держится дольше: иначе быстрый жест сразу проматывает к первому варианту
  const SHRINK = compact ? 3.4 : 2.2;     // когда плашка сжимается в полосу
  const STAGES = SHRINK + 1.1;   // когда шкала полностью на месте
  const STEP = 1.7;       // сколько длится один этап
  const FADE = 0.6;       // смена фото между этапами

  // Вступление: готовый дом медленно приближается, снизу поднимается большая плашка
  tl.addLabel('start', 0);
  if (ZOOM) tl.to(photos[0].firstElementChild, { scale: 1, duration: SHRINK + 1.1, ease: 'none' }, 0);
  tl.to(panel, { yPercent: 0, duration: 1.1 }, 0.3);
  // На телефоне сцена останавливается на большой плашке с заголовком
  tl.addLabel('intro', 1.6);

  // Плашка сжимается в полосу, снизу вверх открывается первый этап
  tl.to(intro, { opacity: 0, duration: 0.35, ease: 'power2.out' }, SHRINK)
    .add(compact
      ? gsap.fromTo(panel,
        { '--clip': () => `${fullHeight() - bigHeight()}px` },
        { '--clip': () => `${fullHeight() - stripHeight()}px`, duration: 1.1, ease: EASE, immediateRender: false })
      : gsap.to(panel, { height: stripHeight, duration: 1.1, ease: EASE }), SHRINK)
    .to(photos[1], { yPercent: 0, duration: 1.1 }, SHRINK)
    .to(photos[1].firstElementChild, { yPercent: 0, duration: 1.1 }, SHRINK)
    // Закрытое фото больше не рисуем — меньше слоёв в памяти телефона
    .set(photos[0], { visibility: 'hidden' }, SHRINK + 1.1)
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
        .set(photos[i], { visibility: 'hidden' }, at + FADE);
      if (ZOOM) tl.to(photos[i + 1].firstElementChild, { scale: 1, duration: STEP, ease: 'none' }, at);
      tl
        .to(targets[i - 1], { opacity: idle, duration: narrow ? FADE / 2 : FADE, ease: 'power1.inOut' }, at)
        .to(targets[i], { opacity: 1, duration: FADE, ease: 'power1.inOut' }, narrow ? at + FADE / 2 : at);
    }
    // Остановка на телефоне: этап полностью на экране
    tl.addLabel(`step${i}`, i ? switchAt(i) + FADE + 0.1 : STAGES + 0.1);
    // Полоска заполняется, пока этап активен, и доходит до конца к началу следующей смены.
    // На телефоне последняя короче: после переезда блок отпускает быстрее
    const start = i ? switchAt(i) + FADE / 2 : SHRINK + 0.75;
    const last = i === steps.length - 1;
    const duration = compact && last ? 0.8 : switchAt(i + 1) - start;
    tl.to(bars[i], { scaleX: 1, duration, ease: 'none' }, start);
  });

  // Пауза на готовой комнате перед выходом из блока
  tl.to({}, { duration: compact ? 0.1 : 0.4 });
  tl.addLabel('end');
}
