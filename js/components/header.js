// Шапка: светлая над тёмными секциями (видео), тёмная над светлым фоном; якоря — плавно через Lenis
export function initHeader({ lenis }) {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  // Секции с data-theme="dark" — под ними шапка остаётся светлой
  const darkSections = [...document.querySelectorAll('[data-theme="dark"]')];
  const active = new Set();
  const update = () => header.classList.toggle('is-dark', active.size === 0);

  darkSections.forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top top+=40',
      end: 'bottom top+=40',
      onToggle: (self) => {
        self.isActive ? active.add(section) : active.delete(section);
        update();
      },
    });
  });
  // До первого обновления скролла шапка светлая — мы на первом экране
  header.classList.remove('is-dark');

  // Меню на весь экран по кнопке Menu (до 1200 px)
  const toggle = header.querySelector('[data-menu-toggle]');
  const setMenu = (open) => {
    header.classList.toggle('is-menu-open', open);
    document.documentElement.classList.toggle('is-menu-locked', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
  };
  toggle.addEventListener('click', () => setMenu(!header.classList.contains('is-menu-open')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  // Плавный переход по якорям; несуществующие якоря (блоки ещё не свёрстаны) игнорируем
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      const target = id.length > 1 && document.querySelector(id);
      e.preventDefault();
      setMenu(false);
      if (!target) return;
      if (lenis) lenis.scrollTo(target, { duration: 1.4 });
      else target.scrollIntoView();
    });
  });
}
