import { compact, sceneTrigger } from '../utils/mode.js?v=4a204662';

// Комплектации: секция закреплена; большая плашка поднимается снизу, затем сжимается в карточку,
// а фото комплектаций открываются снизу вверх поверх дома
const EASE = 'power3.inOut';

// Ширина большой плашки и отступ от края считаются от секции: они зависят от полосы прокрутки

export function initPackages({ reduced }) {
  const section = document.querySelector('[data-packages]');
  if (!section || reduced) return;

  const pin = section.querySelector('[data-packages-pin]');
  const photos = [...section.querySelectorAll('[data-package-photo]')];
  const panel = section.querySelector('[data-panel]');
  const intro = section.querySelector('[data-panel-intro]');
  const card = section.querySelector('[data-panel-card]');
  const packages = [...section.querySelectorAll('[data-package]')];
  const bars = [...section.querySelectorAll('[data-package-bar]')];

  const edge = () => parseFloat(getComputedStyle(panel).right);
  const bigWidth = () => pin.clientWidth - edge() * 2;

  // Размеры карточки: в полном режиме от кадра 1920, в компактном — по содержимому
  const cardWidth = () => {
    if (!compact) return Math.max(380, (620 * window.innerWidth) / 1920);
    return pin.clientWidth < 700 ? bigWidth() : Math.min(440, bigWidth());
  };
  const cardHeight = () => {
    if (compact) return card.offsetHeight;
    const u = window.innerWidth / 1920;
    return Math.min(Math.max(460, 720 * u), window.innerHeight - Math.max(100, 130 * u));
  };
  // Большая плашка: в компактном режиме по содержимому, чтобы текст точно поместился
  const bigHeight = () => (compact ? intro.offsetTop + intro.offsetHeight : window.innerHeight * 0.5);

  // Ширина текста карточки задаётся заранее и обновляется при изменении окна
  const setCardWidth = () => panel.style.setProperty('--card-width', `${cardWidth()}px`);
  setCardWidth();
  ScrollTrigger.addEventListener('refreshInit', setCardWidth);

  // Стартовое состояние: плашка за нижним краем, комплектации ждут снизу
  gsap.set(panel, { yPercent: 115 });
  if (compact) gsap.set(panel, { height: bigHeight() });
  gsap.set(packages.slice(1), { opacity: 0, y: 28 });
  photos.slice(1).forEach((photo) => {
    gsap.set(photo, { yPercent: 100 });
    gsap.set(photo.firstElementChild, { yPercent: -100, scale: 1.06 });
  });

  const tl = gsap.timeline({
    defaults: { ease: EASE },
    scrollTrigger: sceneTrigger(section, pin, 700, { steps: true }),
  });

  // Открытие фото снизу вверх: обёртка и картинка движутся навстречу, кадр стоит на месте
  const revealPhoto = (i, at, duration) => {
    tl.to(photos[i], { yPercent: 0, duration }, at)
      .to(photos[i].firstElementChild, { yPercent: 0, scale: 1, duration }, at);
  };

  // Шаг 1 — дом снаружи, снизу поднимается большая плашка
  tl.addLabel('start', 0);
  tl.to(panel, { yPercent: 0, duration: 1.1 }, 0.3);
  // На телефоне сцена останавливается на большой плашке, пока её не пролистают дальше
  tl.addLabel('intro', 1.6);

  // Шаг 2 — плашка сжимается в карточку, открывается коробка
  // На телефоне вступление держится дольше: иначе быстрый жест сразу проматывает к первому варианту
  const SHRINK = compact ? 3.4 : 2.2;
  tl.to(intro, { opacity: 0, duration: 0.35, ease: 'power2.out' }, SHRINK)
    .fromTo(panel, {
      width: bigWidth,
      height: bigHeight,
    }, {
      width: cardWidth,
      height: cardHeight,
      duration: 1.1,
      immediateRender: false,
    }, SHRINK)
    .to(card, { autoAlpha: 1, duration: 0.45, ease: 'power2.out' }, SHRINK + 0.75);
  revealPhoto(1, SHRINK, 1.1);

  // Смена комплектации: старая уезжает вверх и гаснет, новая появляется снизу
  const STEP = 2.1;
  const PACKAGE_START = SHRINK + 1.1;
  [1, 2].forEach((i) => {
    const at = PACKAGE_START + STEP * i - 0.9;
    revealPhoto(i + 1, at, 0.9);
    tl.to(packages[i - 1], { opacity: 0, y: -28, duration: 0.35, ease: 'power2.out' }, at + 0.05)
      .to(packages[i], { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, at + 0.4);
  });

  // Остановки на телефоне: каждая комплектация целиком на экране
  tl.addLabel('shell', PACKAGE_START + 0.2);
  [1, 2].forEach((i) => tl.addLabel(`package${i}`, PACKAGE_START + STEP * i + 0.2));

  // Полоска заполняется, пока её комплектация на экране, и доходит до конца к началу следующей смены.
  // На телефоне последняя полоска короче: после Turnkey блок отпускает быстрее
  bars.forEach((bar, i) => {
    const start = i ? PACKAGE_START + STEP * i - 0.9 + 0.5 : SHRINK + 0.75;
    const last = i === bars.length - 1;
    const duration = compact && last ? 1 : PACKAGE_START + STEP * (i + 1) - 0.9 - start;
    tl.to(bar, { scaleX: 1, duration, ease: 'none' }, start);
  });

  // Пауза на последней комплектации перед выходом из блока
  tl.to({}, { duration: compact ? 0.1 : 0.4 });
  tl.addLabel('end');
}
