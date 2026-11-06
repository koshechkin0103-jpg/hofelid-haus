import { waitForImages } from './utils/preload.js?v=14aa2bea';
import { initHeader } from './components/header.js?v=14aa2bea';
import { initHero } from './components/hero.js?v=14aa2bea';
import { initAssembly } from './components/assembly.js?v=14aa2bea';
import { initManifest } from './components/manifest.js?v=14aa2bea';
import { initRooms } from './components/rooms.js?v=14aa2bea';
import { initPackages } from './components/packages.js?v=14aa2bea';
import { initProcess } from './components/process.js?v=14aa2bea';
import { initGuarantees } from './components/guarantees.js?v=14aa2bea';
import { initClosing } from './components/closing.js?v=14aa2bea';

// Точка входа: предзагрузка → плавный скролл → компоненты → показ интерфейса
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) document.documentElement.classList.add('is-reduced');

gsap.registerPlugin(ScrollTrigger);

// Плавный скролл Lenis, синхронизированный с ScrollTrigger
function initSmoothScroll() {
  if (reduced) return null;
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

async function boot() {
  // Браузер не должен восстанавливать позицию посреди закреплённых секций
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  const lenis = initSmoothScroll();
  lenis?.stop();

  // Все слои дома, шрифт и первые кадры видео — до старта анимаций, чтобы ничего не мигало
  const layerImgs = [...document.querySelectorAll('.house__layer img')];
  const [, , hero] = await Promise.all([
    waitForImages(layerImgs),
    document.fonts ? document.fonts.ready : Promise.resolve(),
    initHero({ reduced }),
  ]);

  // Сначала запускаем скролл: остановленный Lenis скрывает полосу прокрутки,
  // и закреплённые блоки иначе запомнили бы ширину вместе с местом под неё
  lenis?.start();

  // ScrollTrigger-ы создаём в порядке секций на странице
  initAssembly({ reduced });
  initManifest({ reduced });
  initRooms({ reduced, after: hero.loaded });
  initPackages({ reduced });
  initProcess({ reduced });
  initGuarantees({ reduced });
  initClosing({ reduced });
  initHeader({ lenis });

  ScrollTrigger.refresh();
  document.body.classList.remove('is-loading');
}

boot();
