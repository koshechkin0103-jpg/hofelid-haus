// Комплектации: секция закреплена; большая плашка поднимается снизу, затем сжимается в карточку,
// а фото комплектаций открываются снизу вверх поверх дома
const EASE = 'power3.inOut';

// Размеры карточки в единицах кадра 1920, с ограничением по высоте экрана
const cardSize = () => {
  const u = window.innerWidth / 1920;
  return {
    width: Math.max(380, 620 * u),
    height: Math.min(Math.max(460, 720 * u), window.innerHeight - Math.max(100, 130 * u)),
  };
};

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

  // Ширина текста карточки задаётся заранее и обновляется при изменении окна
  const setCardWidth = () => panel.style.setProperty('--card-width', `${cardSize().width}px`);
  setCardWidth();
  ScrollTrigger.addEventListener('refreshInit', setCardWidth);

  // Стартовое состояние: плашка за нижним краем, комплектации ждут снизу
  gsap.set(panel, { yPercent: 115 });
  gsap.set(packages.slice(1), { opacity: 0, y: 28 });
  photos.slice(1).forEach((photo) => {
    gsap.set(photo, { yPercent: 100 });
    gsap.set(photo.firstElementChild, { yPercent: -100, scale: 1.06 });
  });

  const tl = gsap.timeline({
    defaults: { ease: EASE },
    scrollTrigger: {
      trigger: section,
      pin,
      start: 'top top',
      end: '+=700%',
      scrub: 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  // Открытие фото снизу вверх: обёртка и картинка движутся навстречу, кадр стоит на месте
  const revealPhoto = (i, at, duration) => {
    tl.to(photos[i], { yPercent: 0, duration }, at)
      .to(photos[i].firstElementChild, { yPercent: 0, scale: 1, duration }, at);
  };

  // Шаг 1 — дом снаружи, снизу поднимается большая плашка
  tl.to(panel, { yPercent: 0, duration: 1.1 }, 0.3);

  // Шаг 2 — плашка сжимается в карточку, открывается коробка
  const SHRINK = 2.2;
  tl.to(intro, { opacity: 0, duration: 0.35, ease: 'power2.out' }, SHRINK)
    .to(panel, { width: () => cardSize().width, height: () => cardSize().height, duration: 1.1 }, SHRINK)
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

  // Полоска заполняется, пока её комплектация на экране, и доходит до конца к началу следующей смены
  bars.forEach((bar, i) => {
    const start = i ? PACKAGE_START + STEP * i - 0.9 + 0.5 : SHRINK + 0.75;
    tl.to(bar, { scaleX: 1, duration: PACKAGE_START + STEP * (i + 1) - 0.9 - start, ease: 'none' }, start);
  });

  // Пауза на последней комплектации перед выходом из блока
  tl.to({}, { duration: 0.4 });
}
