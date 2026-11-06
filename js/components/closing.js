// Финальная часть страницы: формы, штрихи в блоке брони, появление плашки в финале
const TICKS = 24;

// Формы пока макет: данные никуда не отправляются и нигде не хранятся.
// Браузер сам проверяет обязательные поля, после этого показываем благодарность
function initForms() {
  document.querySelectorAll('[data-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const success = form.querySelector('[data-form-success]');
      form.reset();
      form.classList.add('is-sent');
      success.hidden = false;
      success.focus({ preventScroll: true });
      ScrollTrigger.refresh();
    });
  });
}

function initReserve({ reduced }) {
  const ticks = document.querySelector('[data-reserve-ticks]');
  if (!ticks) return;

  // По одному штриху на дом в году
  for (let i = 0; i < TICKS; i++) ticks.appendChild(document.createElement('i'));
  if (reduced) return;

  gsap.from(ticks.children, {
    scaleY: 0,
    ease: 'none',
    stagger: 0.1,
    scrollTrigger: {
      trigger: ticks,
      start: 'top 90%',
      end: 'top 55%',
      scrub: 0.5,
    },
  });
}

function initFinal({ reduced }) {
  const section = document.querySelector('[data-final]');
  if (!section || reduced) return;

  // Фото медленно приближается, пока блок заезжает на экран; плашка поднимается снизу
  gsap.fromTo(section.querySelector('[data-final-photo]'), { scale: 1.12 }, {
    scale: 1,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top bottom', end: 'top top', scrub: 0.5 },
  });
  gsap.fromTo(section.querySelector('[data-final-panel]'), { y: 80, opacity: 0 }, {
    y: 0,
    opacity: 1,
    ease: 'power3.out',
    scrollTrigger: { trigger: section, start: 'top 55%', end: 'top 5%', scrub: 0.5 },
  });
}

export function initClosing({ reduced }) {
  initForms();
  initReserve({ reduced });
  initFinal({ reduced });
}
