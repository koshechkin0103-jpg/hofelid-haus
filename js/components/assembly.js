import { sceneTrigger } from '../utils/mode.js?v=5ad267f4';

// Сборка дома: секция закреплена, слои выезжают по скроллу (scrub, работает в обе стороны)
const EASE = 'power3.out';

export function initAssembly({ reduced }) {
  const section = document.querySelector('[data-assembly]');
  if (!section) return;

  const pin = section.querySelector('[data-assembly-pin]');
  const layer = (name) => section.querySelector(`[data-layer="${name}"]`);
  const roof = layer('roof');
  const walls = layer('walls');
  const glass = layer('glass');
  const foundation = layer('foundation');
  const full = layer('full');
  const shadow = layer('shadow');
  const stages = [...section.querySelectorAll('[data-stage]')];
  const counter = section.querySelector('[data-counter]');

  // Без анимации: дом сразу собран, видны все тексты
  if (reduced) {
    gsap.set([roof, walls, glass, foundation], { opacity: 0 });
    gsap.set([full, shadow], { opacity: 1 });
    return;
  }

  // сдвиг по Y для деталей, въезжающих снизу; на телефоне вдвое меньше
  const shift = matchMedia('(max-width: 767.98px)').matches ? 150 : 300;

  // Стартовое состояние: на сцене пусто
  gsap.set(roof, { opacity: 0, y: 40 });
  gsap.set([walls, foundation], { opacity: 0, y: shift });
  gsap.set([glass, full], { opacity: 0 });
  gsap.set(shadow, { opacity: 0, scaleX: 0.8 });
  gsap.set(stages.slice(1), { opacity: 0, yPercent: 40 });

  const tl = gsap.timeline({
    defaults: { ease: EASE },
    scrollTrigger: sceneTrigger(section, pin, 420),
  });

  // Смена текста этапа: старый уезжает вверх и гаснет, новый появляется снизу
  const swapText = (from, to, at) => {
    tl.to(stages[from], { yPercent: -40, opacity: 0, duration: 0.5 }, at)
      .fromTo(stages[to], { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6 }, at + 0.25)
      .to(counter, { yPercent: -25 * to, duration: 0.6 }, at + 0.1);
  };

  // Этап 1 — крыша появляется и чуть поднимается на своё место
  tl.to(roof, { opacity: 1, y: 0, duration: 1 }, 0);

  // Этап 2 — стены выезжают снизу и встают под крышу
  swapText(0, 1, 1.6);
  tl.to(walls, { opacity: 1, y: 0, duration: 1.2 }, 1.6);

  // Этап 3 — стекло и интерьер проявляются поверх стен: «зажёгся свет»
  swapText(1, 2, 3.2);
  tl.to(glass, { opacity: 1, duration: 1 }, 3.2);

  // Этап 4 — фундамент поднимается снизу
  swapText(2, 3, 4.6);
  tl.to(foundation, { opacity: 1, y: 0, duration: 1.2 }, 4.6);

  // Финал — незаметный crossfade в цельный дом и тень
  tl.to(full, { opacity: 1, duration: 0.5 }, 6.2)
    .to([roof, walls, glass, foundation], { opacity: 0, duration: 0.3 }, 6.7)
    .to(shadow, { opacity: 1, scaleX: 1, duration: 0.8 }, 6.4);

  // Небольшая пауза на собранном доме перед следующим блоком
  tl.to({}, { duration: 0.8 });
}
