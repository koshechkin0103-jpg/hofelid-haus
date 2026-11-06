// decode() в неактивной вкладке может «висеть» — ждём его не дольше ms
const withTimeout = (promise, ms) =>
  Promise.race([promise.catch(() => {}), new Promise((r) => setTimeout(r, ms))]);

// Загрузка картинки: промис резолвится, когда изображение скачано
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      // decode() убирает подтормаживание при первой отрисовке, но не блокирует загрузку
      if (img.decode) withTimeout(img.decode(), 300).then(() => resolve(img));
      else resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

// Ждём картинки, которые уже стоят в DOM (<picture> сам выбирает WebP или PNG)
export function waitForImages(imgs) {
  return Promise.all(
    imgs.map((img) => {
      const loaded = img.complete
        ? Promise.resolve()
        : new Promise((r) => {
            img.addEventListener('load', r, { once: true });
            img.addEventListener('error', r, { once: true });
          });
      return loaded.then(() => (img.decode ? withTimeout(img.decode(), 1500) : null));
    })
  );
}
