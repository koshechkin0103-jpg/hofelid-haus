import { compact, sceneTrigger } from '../utils/mode.js?v=d6311f48';

// Гарантии: секция закреплена, обещания появляются по одному лесенкой,
// текущее становится белым, в конце их скрепляет росчерк-подпись
const EASE = 'power3.out';
const GLASS = { backgroundColor: 'rgba(58, 54, 48, 0.34)', color: '#ffffff' };
const ACTIVE = { backgroundColor: 'rgba(255, 255, 255, 0.96)', color: '#1c1b19' };

export function initGuarantees({ reduced }) {
  const section = document.querySelector('[data-guarantees]');
  if (!section || reduced) return;

  const pin = section.querySelector('[data-guarantees-pin]');
  const photo = section.querySelector('[data-guarantees-photo]');
  const intro = section.querySelector('[data-guarantees-intro]');
  const pledges = [...section.querySelectorAll('[data-pledge]')];
  const signature = section.querySelector('[data-signature]');
  const path = section.querySelector('[data-signature-path]');
  const caption = signature.querySelector('.signature__caption');
  const foot = section.querySelector('[data-guarantees-foot]');

  // На телефоне и планшете карточки идут друг за другом поверх липкого фото
  if (compact) {
    pledges.forEach((pledge) => {
      gsap.fromTo(pledge, { opacity: 0, y: 40 }, {
        opacity: 1,
        y: 0,
        ease: 'power3.out',
        scrollTrigger: { trigger: pledge, start: 'top 92%', end: 'top 70%', scrub: 0.3 },
      });
      // Карточка в середине экрана становится белой
      ScrollTrigger.create({ trigger: pledge, start: 'top 55%', end: 'bottom 45%', toggleClass: 'is-active' });
    });
    gsap.set(path, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.to(path, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: { trigger: signature, start: 'top 90%', end: 'top 55%', scrub: 0.3 },
    });
    return;
  }

  // Стартовое состояние: на экране только фото
  gsap.set(photo, { scale: 1.08 });
  gsap.set(intro, { opacity: 0, y: 24 });
  gsap.set(pledges, { opacity: 0, y: 70 });
  gsap.set(path, { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set(caption, { opacity: 0 });
  gsap.set(foot, { opacity: 0, y: 16 });

  const tl = gsap.timeline({
    defaults: { ease: EASE },
    scrollTrigger: sceneTrigger(section, pin, 550),
  });

  const FIRST = 1;     // когда появляется первая карточка
  const STEP = 1.3;    // пауза между карточками
  const SIGN = FIRST + STEP * pledges.length + 0.2;   // когда начинается подпись

  // Заголовок с подзаголовком
  tl.to(intro, { opacity: 1, y: 0, duration: 0.7 }, 0.1);

  // Карточки: каждая поднимается снизу и становится белой, предыдущая возвращается в стекло
  pledges.forEach((pledge, i) => {
    const at = FIRST + STEP * i;
    tl.to(pledge, { opacity: 1, y: 0, duration: 0.7 }, at)
      .to(pledge, { ...ACTIVE, duration: 0.35, ease: 'power1.inOut' }, at + 0.25);
    if (i > 0) tl.to(pledges[i - 1], { ...GLASS, duration: 0.35, ease: 'power1.inOut' }, at + 0.25);
  });

  // Подпись рисуется, последняя карточка возвращается в стекло; затем строка с кнопкой
  tl.to(pledges[pledges.length - 1], { ...GLASS, duration: 0.35, ease: 'power1.inOut' }, SIGN)
    .to(path, { strokeDashoffset: 0, duration: 1.4, ease: 'power1.inOut' }, SIGN)
    .to(caption, { opacity: 0.85, duration: 0.4 }, SIGN + 1.1)
    .to(foot, { opacity: 1, y: 0, duration: 0.5 }, SIGN + 1.3)
    .to({}, { duration: 0.8 });

  // Фото медленно приближается весь блок; длина подстраивается под таймлайн
  tl.to(photo, { scale: 1, duration: tl.duration(), ease: 'none' }, 0);
}
