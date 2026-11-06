# Версии для кэша + архив сайта.
#
# Зачем: Beget кэширует CSS и JS у посетителей на 7 дней. Версия в адресе
# (main.js?v=3f9a1c2b) заставляет браузер скачать свежий файл сразу после выгрузки.
# Версия — хеш кода CSS/JS: пока код не менялся, она тоже не меняется.
#
# Запуск из папки проекта:
#   python tools/release.py          — проставить версии и собрать _deploy/hofelid-site.zip
#   python tools/release.py --stamp  — только проставить версии (так его вызывает deploy)
import hashlib
import os
import re
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Что попадает на сайт (для архива; deploy.sh берёт тот же список)
INCLUDE = ['index.html', '.htaccess', 'css', 'js', 'assets/hero/frames', 'assets/assembly', 'assets/rooms', 'assets/packages', 'assets/process', 'assets/guarantees', 'assets/final']

# Ссылки на локальные .css/.js: href="css/x.css", src="js/main.js", from './x.js' — с версией или без
REF = re.compile(r'''((?:href|src)="(?:css|js)/[^"?]+\.(?:css|js)|from '\.{1,2}/[^'?]+\.js)(?:\?v=[\w-]+)?''')


def code_files():
    files = [os.path.join(ROOT, 'index.html')]
    for folder in ('css', 'js'):
        for d, _, names in os.walk(os.path.join(ROOT, folder)):
            files += [os.path.join(d, n) for n in names if n.endswith(('.css', '.js'))]
    return sorted(files)


def version():
    # хеш содержимого без самих версий — иначе версия зависела бы от себя же
    h = hashlib.sha1()
    for path in code_files():
        with open(path, encoding='utf-8') as f:
            h.update(REF.sub(lambda m: m.group(1), f.read()).encode('utf-8'))
    return h.hexdigest()[:8]


def stamp(ver):
    for path in code_files():
        if path.endswith('.css'):
            continue
        with open(path, encoding='utf-8') as f:
            text = f.read()
        new = REF.sub(lambda m: f'{m.group(1)}?v={ver}', text)
        if new != text:
            with open(path, 'w', encoding='utf-8', newline='') as f:
                f.write(new)
            print('  версия обновлена:', os.path.relpath(path, ROOT))


def build_zip():
    out = os.path.join(ROOT, '_deploy', 'hofelid-site.zip')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    count = 0
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_STORED) as z:
        for item in INCLUDE:
            full = os.path.join(ROOT, item)
            if os.path.isfile(full):
                z.write(full, item)
                count += 1
                continue
            for folder, _, files in os.walk(full):
                for name in files:
                    fp = os.path.join(folder, name)
                    z.write(fp, os.path.relpath(fp, ROOT).replace(os.sep, '/'))
                    count += 1
    print(f'Архив: {os.path.relpath(out, ROOT)} — {count} файлов, {os.path.getsize(out) / 1e6:.1f} МБ')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')  # русский вывод в консоли Windows
    ver = version()
    print('Версия кода', ver)
    stamp(ver)
    if '--stamp' not in sys.argv:
        build_zip()
