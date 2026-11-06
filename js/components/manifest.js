// Манифест: текст разбивается на слова, слова по скроллу проявляются из серого в чёрный
function splitWords(p) {
  const nodes = [...p.childNodes];
  p.textContent = '';
  nodes.forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE) {
      p.appendChild(node); // <br> и прочие теги оставляем как есть
      return;
    }
    node.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        p.appendChild(document.createTextNode(' '));
      } else {
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = part;
        p.appendChild(span);
      }
    });
  });
  return [...p.querySelectorAll('.word')];
}

export function initManifest({ reduced }) {
  const section = document.querySelector('[data-manifest]');
  if (!section) return;

  section.querySelectorAll('.manifest__p').forEach((p) => {
    const words = splitWords(p);
    if (reduced) return;

    gsap.to(words, {
      opacity: 1,
      ease: 'none',
      stagger: 0.1,
      scrollTrigger: {
        trigger: p,
        start: 'top 82%',
        end: 'bottom 52%',
        scrub: 0.5,
      },
    });
  });
}
