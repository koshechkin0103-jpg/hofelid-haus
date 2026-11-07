// Режимы страницы, как на сайте YORU:
//   полный   — композиция из макета, от 1200 px;
//   компактный — телефон и планшет, до 1200 px: колонка, липкие секции вместо закрепления
export const compact = matchMedia('(max-width: 1199.98px)').matches;

// Узкий планшет и телефон: шкала этапов показывает один этап за раз
export const narrow = matchMedia('(max-width: 999.98px)').matches;

// Вертикальный экран — отдельный комплект кадров, обрезанных под него
export const portraitFrames = compact && matchMedia('(orientation: portrait)').matches;

// Настройки прокрутки сцены. В компактном режиме секция сама длинная, а экран внутри
// липкий (CSS): это не дёргается при появлении панели браузера и инерции на телефоне
export function sceneTrigger(section, pin, length) {
  if (compact) {
    return { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.3, invalidateOnRefresh: true };
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
        sessionStorage.setItem(KEY, String(window.scrollY / document.documentElement.scrollHeight));
      } catch (_) { /* без хранилища просто начнём сверху */ }
      location.reload();
    });
  });
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved !== null) {
      sessionStorage.removeItem(KEY);
      window.scrollTo(0, Number(saved) * document.documentElement.scrollHeight);
    }
  } catch (_) { /* см. выше */ }
}
