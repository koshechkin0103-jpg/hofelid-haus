import { waitForImages } from './utils/preload.js?v=218f62ec';
import { watchModeChange } from './utils/mode.js?v=218f62ec';
import { initHeader } from './components/header.js?v=218f62ec';
import { initHero } from './components/hero.js?v=218f62ec';
import { initAssembly } from './components/assembly.js?v=218f62ec';
import { initManifest } from './components/manifest.js?v=218f62ec';
import { initRooms } from './components/rooms.js?v=218f62ec';
import { initPackages } from './components/packages.js?v=218f62ec';
import { initProcess } from './components/process.js?v=218f62ec';
import { initGuarantees } from './components/guarantees.js?v=218f62ec';
import { initClosing } from './components/closing.js?v=218f62ec';

// Точка входа: предзагрузка → плавный скролл → компоненты → показ интерфейса
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) document.documentElement.classList.add('is-reduced');

gsap.registerPlugin(ScrollTrigger);
// Появление панели браузера на телефоне не должно пересчитывать всю страницу
ScrollTrigger.config({ ignoreMobileResize: true });

// Плавный скролл Lenis, синхронизированный с ScrollTrigger
function initSmoothScroll() {
  // Только на десктопе с мышью: на телефоне и планшете родная инерция браузера лучше
  if (reduced || !matchMedia('(min-width: 1200px) and (hover: hover) and (pointer: fine)').matches) return null;
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
  watchModeChange();
}

boot();
