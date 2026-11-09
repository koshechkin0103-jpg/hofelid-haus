import { waitForImages } from './utils/preload.js?v=d6311f48';
import { resuming, watchModeChange } from './utils/mode.js?v=d6311f48';
import { initPreloader } from './components/preloader.js?v=d6311f48';
import { initHeader } from './components/header.js?v=d6311f48';
import { initHero } from './components/hero.js?v=d6311f48';
import { initAssembly } from './components/assembly.js?v=d6311f48';
import { initManifest } from './components/manifest.js?v=d6311f48';
import { initRooms } from './components/rooms.js?v=d6311f48';
import { initPackages } from './components/packages.js?v=d6311f48';
import { initProcess } from './components/process.js?v=d6311f48';
import { initGuarantees } from './components/guarantees.js?v=d6311f48';
import { initClosing } from './components/closing.js?v=d6311f48';
import { initReveal } from './components/reveal.js?v=d6311f48';
import { compact } from './utils/mode.js?v=d6311f48';

// Точка входа: предзагрузка → плавный скролл → компоненты → показ интерфейса
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) document.documentElement.classList.add('is-reduced');

gsap.registerPlugin(ScrollTrigger);
// Появление панели браузера на телефоне не должно пересчитывать всю страницу
ScrollTrigger.config({ ignoreMobileResize: true });
// Время анимаций не «проседает», когда телефон занят загрузкой: заставка не затягивается
gsap.ticker.lagSmoothing(0);
// Прокрутку на телефоне не перехватываем: подменённая инерция гасла быстрее родной,
// и из блоков приходилось выбираться несколькими жестами. Сцены листаются шагами (sceneTrigger)

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

  // ?nointro — открыть без заставки (для проверки)
  const preloader = initPreloader({ skip: reduced || resuming || location.search.includes('nointro') });

  const lenis = initSmoothScroll();
  lenis?.stop();

  // Все слои дома, шрифт и первые кадры видео — до старта анимаций, чтобы ничего не мигало
  const layerImgs = [...document.querySelectorAll('.house__layer img')];
  // Каждая завершённая задача двигает счётчик прелоадера
  const tasks = [
    ...layerImgs.map((img) => waitForImages([img])),
    document.fonts ? document.fonts.ready : Promise.resolve(),
    initHero({ reduced }),
  ];
  let done = 0;
  tasks.forEach((task) => task.then(() => preloader.progress(++done / tasks.length)));
  const results = await Promise.all(tasks);
  const hero = results[results.length - 1];

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
  const reveal = initReveal({ reduced, compact });

  ScrollTrigger.refresh();
  await preloader.finish();
  document.body.classList.remove('is-loading');
  reveal.playHero();
  hero.startLoading();
  watchModeChange();
}

boot();
