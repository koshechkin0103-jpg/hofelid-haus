// Режимы страницы, как на сайте YORU:
//   полный   — композиция из макета, от 1200 px;
//   компактный — телефон и планшет, до 1200 px: колонка, липкие секции вместо закрепления
export const compact = matchMedia('(max-width: 1199.98px)').matches;

// Узкий планшет и телефон: шкала этапов показывает один этап за раз
export const narrow = matchMedia('(max-width: 999.98px)').matches;

// Что прокручивается: на телефоне и планшете — слой .scroller, на компьютере — окно
export const scroller = (compact && document.querySelector('[data-scroller]')) || window;
const scrollEl = scroller === window ? document.documentElement : scroller;
export const scrollTop = () => (scroller === window ? window.scrollY : scroller.scrollTop);
export const scrollToY = (y) => scroller.scrollTo(0, y);

// Вертикальный экран — отдельный комплект кадров, обрезанных под него
export const portraitFrames = compact && matchMedia('(orientation: portrait)').matches;

// Настройки прокрутки сцены. В компактном режиме секция сама длинная, а экран внутри
// липкий (CSS): это не дёргается при появлении панели браузера и инерции на телефоне
// steps: на телефоне сцена листается шагами — после жеста дотягивается до ближайшей метки
// таймлайна в сторону прокрутки. Так короткий жест не проскакивает состояние,
// а длинный не застревает посреди перехода
export function sceneTrigger(section, pin, length, { steps = false } = {}) {
  if (compact) {
    const trigger = { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.3, invalidateOnRefresh: true };
    if (steps) {
      trigger.snap = {
        snapTo: 'labelsDirectional',
        duration: { min: 0.3, max: 0.9 },
        delay: 0.08,
        ease: 'power2.inOut',
        inertia: false,
      };
    }
    return trigger;
  }
  return { trigger: section, pin, start: 'top top', end: `+=${length}%`, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true };
}

const KEY = 'hof-scroll';

// Страницу перезагрузили из-за смены режима — заставка в этот раз не нужна
export const resuming = (() => {
  try {
    return sessionStorage.getItem(KEY) !== null;
  } catch (_) {
    return false;
  }
})();

// При переходе через границу режимов страницу нужно собрать заново: другая раскладка и кадры.
// Положение на странице сохраняем, чтобы человек не оказался наверху
export function watchModeChange() {
  ['(max-width: 1199.98px)', '(max-width: 999.98px)', '(orientation: portrait)'].forEach((query) => {
    matchMedia(query).addEventListener('change', () => {
      try {
        sessionStorage.setItem(KEY, String(scrollTop() / scrollEl.scrollHeight));
      } catch (_) { /* без хранилища просто начнём сверху */ }
      location.reload();
    });
  });
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved !== null) {
      sessionStorage.removeItem(KEY);
      scrollToY(Number(saved) * scrollEl.scrollHeight);
    }
  } catch (_) { /* см. выше */ }
}
