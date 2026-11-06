import { FrameSequence } from '../utils/frames.js?v=222254cc';

// Прогулка по дому: секция закреплена; в каждой комнате сначала появляется текст,
// потом по скроллу играет видео, по окончании следующее видео въезжает снизу шторкой
const EASE = 'power3.out';
const roomPath = (room, i) =>
  `assets/rooms/${String(room + 1).padStart(2, '0')}/${String(i + 1).padStart(3, '0')}.webp`;

export function initRooms({ reduced, after }) {
  const section = document.querySelector('[data-rooms]');
  if (!section) return;

  const pin = section.querySelector('[data-rooms-pin]');
  const scenes = [...section.querySelectorAll('[data-room-scene]')];
  const texts = [...section.querySelectorAll('[data-room-text]')];
  const counter = section.querySelector('[data-rooms-counter]');

  const seqs = scenes.map((scene, room) =>
    new FrameSequence(scene.querySelector('canvas'), {
      count: Number(scene.dataset.frames),
      path: (i) => roomPath(room, i),
    })
  );

  // Загрузка не блокирует показ страницы: после видео подлёта — первые кадры всех комнат
  // (шторка никогда не откроет пустоту), затем остальные кадры комната за комнатой
  (async () => {
    await after;
    await Promise.all(seqs.map((s) => s.loadFirst()));
    if (reduced) return;
    for (const s of seqs) await s.loadAll(4);
  })();

  if (reduced) return;

  // Стартовое состояние: текст первой комнаты спрятан, остальные ждут внизу
  gsap.set(texts, { opacity: 0, yPercent: 30 });
  gsap.set(scenes.slice(1), { yPercent: 100 });

  const PLAY = 3;       // длительность проигрывания видео (в условных единицах таймлайна)
  const CURTAIN = 1.1;  // длительность въезда шторки

  const tl = gsap.timeline({
    defaults: { ease: EASE },
    scrollTrigger: {
      trigger: section,
      pin,
      start: 'top top',
      end: '+=1500%',
      scrub: 0.6,
      anticipatePin: 1,
    },
  });

  let t = 0;
  seqs.forEach((seq, room) => {
    if (room === 0) {
      // Первая комната: сначала появляется текст, потом стартует видео
      tl.to(texts[0], { opacity: 1, yPercent: 0, duration: 0.7 }, t);
      t += 0.9;
    } else {
      // Шторка: следующая сцена въезжает снизу поверх текущей
      tl.to(scenes[room], { yPercent: 0, duration: CURTAIN, ease: 'power3.inOut' }, t)
        .to(texts[room - 1], { opacity: 0, yPercent: -30, duration: 0.5 }, t)
        .to(texts[room], { opacity: 1, yPercent: 0, duration: 0.7 }, t + CURTAIN * 0.55)
        .to(counter, { yPercent: -25 * room, duration: 0.6 }, t + CURTAIN * 0.4);
      t += CURTAIN + 0.3;
    }

    // Видео комнаты проигрывается по скроллу; текст остаётся на экране
    const playhead = { frame: 0 };
    tl.to(playhead, {
      frame: seq.count - 1,
      duration: PLAY,
      ease: 'none',
      onUpdate: () => seq.draw(playhead.frame),
    }, t);
    t += PLAY;
  });

  // Пауза на последнем кадре бассейна перед выходом из блока
  tl.to({}, { duration: 0.6 }, t);
}
