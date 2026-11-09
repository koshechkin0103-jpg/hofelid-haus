// Появление текста, как на kononenkogroup.com: текст делится на строки, каждая строка — в окошке.
// В заголовках снизу выезжают слова, в абзацах — строки целиком.
// Делим текст только в момент появления, а по окончании возвращаем исходную разметку:
// так переносы строк остаются правильными при любом размере окна

// Заголовки — по словам, абзацы — по строкам
const WORDS = ['.hero__name-line', '.assembly__title', '.reserve__title', '.final__title', '.footer__brand'];
const LINES = ['.hero__since', '.hero__lead', '.reserve__lead', '.final__text', '.footer__text'];
// Внутри гарантий на компьютере заголовок проявляется вместе со всей сценой — там своё движение
const COMPACT_WORDS = ['.guarantees__title'];
const COMPACT_LINES = ['.guarantees__eyebrow', '.guarantees__lead'];

// Обернуть каждое слово в span, сохранив переносы <br> и вложенные теги
function wrapWords(node) {
  [...node.childNodes].forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      child.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(' '));
        } else {
          const span = document.createElement('span');
          span.className = 'rv-word';
          span.textContent = part;
          frag.appendChild(span);
        }
      });
      child.replaceWith(frag);
    } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
      wrapWords(child);
    }
  });
}

// Разбить на строки по фактическому положению слов
function split(el) {
  wrapWords(el);
  const words = [...el.querySelectorAll('.rv-word')];
  const lines = [];
  let top = null;
  words.forEach((word) => {
    const t = Math.round(word.offsetTop);
    if (top === null || Math.abs(t - top) > 2) {
      lines.push([]);
      top = t;
    }
    lines[lines.length - 1].push(word);
  });
  // Каждую строку — в окошко с обрезкой, внутрь — сами слова
  el.textContent = '';
  return lines.map((lineWords) => {
    const mask = document.createElement('span');
    mask.className = 'rv-mask';
    const line = document.createElement('span');
    line.className = 'rv-line';
    lineWords.forEach((w, i) => {
      if (i) line.appendChild(document.createTextNode(' '));
      line.appendChild(w);
    });
    mask.appendChild(line);
    el.appendChild(mask);
    return line;
  });
}

function play(el, byWords, delay = 0) {
  const original = el.innerHTML;
  const lines = split(el);
  el.classList.add('is-revealing');
  const targets = byWords ? lines.flatMap((l) => [...l.children]) : lines;
  gsap.fromTo(targets, { yPercent: 105 }, {
    yPercent: 0,
    duration: byWords ? 0.9 : 1,
    ease: 'power3.out',
    stagger: byWords ? 0.05 : 0.09,
    delay,
    onComplete: () => {
      el.innerHTML = original;
      el.classList.remove('is-revealing', 'rv-pending');
    },
  });
}

export function initReveal({ reduced, compact }) {
  if (reduced) return { playHero() {} };

  const collect = (selectors) => selectors.flatMap((s) => [...document.querySelectorAll(s)]);
  const words = collect([...WORDS, ...(compact ? COMPACT_WORDS : [])]);
  const lines = collect([...LINES, ...(compact ? COMPACT_LINES : [])]);
  const isHero = (el) => !!el.closest('[data-hero]');

  [...words, ...lines].forEach((el) => el.classList.add('rv-pending'));

  // Всё, кроме первого экрана, появляется один раз, когда доходит до экрана
  [[words, true], [lines, false]].forEach(([list, byWords]) => {
    list.filter((el) => !isHero(el)).forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 92%',
        once: true,
        onEnter: () => play(el, byWords),
      });
    });
  });

  // Первый экран — сразу после заставки
  return {
    playHero() {
      words.filter(isHero).forEach((el) => play(el, true, 0.05));
      lines.filter(isHero).forEach((el, i) => play(el, false, 0.25 + i * 0.12));
    },
  };
}
