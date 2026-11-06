// Архитектура неизменна: сначала весь экран занимает бетон — «что зафиксировано»,
// по скроллу справа открывается дуб — «что выбираете вы»
const EASE = 'power3.out';

export function initArchitecture({ reduced }) {
  const section = document.querySelector('[data-arch]');
  if (!section || reduced) return;

  const pin = section.querySelector('[data-arch-pin]');
  const title = section.querySelector('[data-arch-title]');
  const plate = section.querySelector('[data-arch-plate]');
  const yours = section.querySelector('[data-arch-yours]');
  const titleYours = section.querySelector('[data-arch-title-yours]');
  const plateYours = section.querySelector('[data-arch-plate-yours]');

  gsap.set(yours, { clipPath: 'inset(0 0 0 100%)' });
  gsap.set([title, titleYours], { opacity: 0, y: 30 });
  gsap.set([plate, plateYours], { opacity: 0, y: 60 });

  const tl = gsap.timeline({
    defaults: { ease: EASE },
    scrollTrigger: {
      trigger: section,
      pin,
      start: 'top top',
      end: '+=320%',
      scrub: 0.6,
      anticipatePin: 1,
    },
  });

  const SWEEP = 1.7;   // когда открывается вторая половина

  tl.to(title, { opacity: 1, y: 0, duration: 0.6 }, 0.1)
    .to(plate, { opacity: 1, y: 0, duration: 0.7 }, 0.35)
    .to(yours, { clipPath: 'inset(0 0 0 50%)', duration: 1.1, ease: 'power3.inOut' }, SWEEP)
    .to(titleYours, { opacity: 1, y: 0, duration: 0.6 }, SWEEP + 0.65)
    .to(plateYours, { opacity: 1, y: 0, duration: 0.7 }, SWEEP + 0.85)
    .to({}, { duration: 0.7 });
}
