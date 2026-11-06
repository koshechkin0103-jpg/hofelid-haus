import { FrameSequence } from '../utils/frames.js?v=8d0934fa';

// Первый экран: видео подлёта разложено на кадры и рисуется в canvas по прогрессу скролла
const FRAME_COUNT = 145;
const framePath = (i) => `assets/hero/frames/${String(i + 1).padStart(3, '0')}.webp`;

// Возвращает промис полной загрузки кадров — после него начинают грузиться комнаты
export async function initHero({ reduced }) {
  const section = document.querySelector('[data-hero]');
  const canvas = section.querySelector('[data-hero-canvas]');

  const seq = new FrameSequence(canvas, { count: FRAME_COUNT, path: framePath });
  await seq.loadFirst();

  if (reduced) {
    section.style.height = '100vh';
    return { loaded: Promise.resolve() };
  }

  const loaded = seq.loadAll();

  // Скролл → номер кадра; в конце видео останавливается на последнем кадре
  const playhead = { frame: 0 };
  gsap.to(playhead, {
    frame: FRAME_COUNT - 1,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.4,
    },
    onUpdate: () => seq.draw(playhead.frame),
  });

  return { loaded };
}
