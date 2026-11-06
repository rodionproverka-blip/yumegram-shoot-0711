'use strict';
const plan = window.SHOOT_PLAN;
const main = document.querySelector('main');
const viewer = document.querySelector('#viewer');
const storageKey = 'yumegram-shoot-0711-checklist-v1';
const videos = new Map(plan.videos.map(video => [video.id, video]));
const shoot = plan.videos.filter(video => video.category === 'shoot');
const edit = plan.videos.filter(video => video.category === 'edit');
const formatCount = (n, words) => n + ' ' + (n % 100 >= 11 && n % 100 <= 14 ? words[2] : n % 10 === 1 ? words[0] : [2,3,4].includes(n % 10) ? words[1] : words[2]);
const frameCount = n => formatCount(n, ['сцена','сцены','сцен']);
const visualCount = n => formatCount(n, ['визуал','визуала','визуалов']);
const pad = n => String(n).padStart(2, '0');
const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const link = (href, label, type = '') => '<a class="btn '+ type +'" href="' + escape(href) + '">' + escape(label) + '</a>';
const external = (href, label) => '<a class="btn" href="' + escape(href) + '" target="_blank" rel="noopener">' + escape(label) + ' ↗</a>';
const route = (id, tab = 'frames') => '#/video/' + id + '/' + tab;
const countVisuals = video => video.frames.reduce((total, frame) => total + frame.visuals.length, 0);
let checked = new Set();
try { checked = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]')); } catch {}
let propFilter = 'all';
let spoilerOrder = false;
document.querySelector('#source-sheet').href = plan.sheet;

const universalChecks = [
  'Включить верхний, левый и правый источники. Левый выставить на 50–60%, правый на белый 5000–5600 К. Снять тест с картой в точке лица.',
  'Зафиксировать баланс белого, экспозицию и фокус. На тесте проверить цвет кожи, белую футболку и самые светлые детали фигурок.',
  'Поставить 9:16. Протереть объектив, проверить заряд и свободное место. Включить сетку и отметки камеры и пола.',
  'Записать 5 секунд теста, прослушать в наушниках. Убедиться, что нет перегруза, гула приборов и шороха одежды.',
  'Просмотреть тестовый дубль на телефоне: глаза резкие, кисти и нужный реквизит в рамке, вверху и внизу есть место для графики.',
  'Отметить удачный дубль по каждому плану. Перед перестановкой сохранить фото расположения реквизита и проверить склейку.',
];

function checkbox(key, label) {
  return '<label class="checkbox"><input type="checkbox" data-check="' + escape(key) + '"' + (checked.has(key) ? ' checked' : '') + '><span>' + escape(label) + '</span></label>';
}
function checks(prefix, items) {
  const keys = items.map((_, i) => prefix + '-' + i);
  return progress(keys) + '<div class="check-list">' + items.map((item, i) => checkbox(keys[i], item)).join('') + '</div>';
}
function progress(keys, doneLabel = 'Готово') {
  const count = keys.filter(key => checked.has(key)).length;
  return '<div class="progress" data-progress="' + escape(keys.join(' ')) + '" aria-live="polite">' + escape(doneLabel) + ' <strong>' + count + ' / ' + keys.length + '</strong></div>';
}
function picture(src, alt, eager = false) {
  return '<img src="' + escape(src) + '" alt="' + escape(alt) + '" loading="' + (eager ? 'eager' : 'lazy') + '" decoding="async">';
}
function pageHead(label, title, intro = '', back = true) {
  return '<div class="page-head">' + (back ? '<a class="back" href="#/list">← Все ролики</a>' : '') + '<div class="eyebrow">' + escape(label) + '</div><h1>' + escape(title) + '</h1>' + (intro ? '<p class="page-intro">' + escape(intro) + '</p>' : '') + '</div>';
}
function videoCard(video) {
  const index = plan.videos.indexOf(video) + 1;
  const cover = {tifa:0, interview:0, tier:3, photo:1, spoiler:1, night:0}[video.id] ?? 0;
  const image = video.frames[cover].visuals[0].src;
  const completed = video.frames.filter((_, i) => checked.has(video.id + '-scene-' + i)).length;
  return '<a class="video-card" href="' + route(video.id) + '">' + picture(image, '') +
    '<div><small class="index">' + pad(index) + ' · ' + video.duration + '</small><h3>' + escape(video.title) + '</h3><span class="mono">' + frameCount(video.frames.length) + ' · ' + completed + '/' + video.frames.length + ' ✓</span></div></a>';
}
function home() {
  const total = plan.videos.reduce((n, v) => n + countVisuals(v), 0);
  const hero = [
    ['tifa-01','01 / ПРЕДМЕТКА'],
    ['interview-01','02 / СКЕТЧ'],
    ['tier-06','03 / ТИР-ЛИСТ'],
  ].map(([src, label]) => '<figure>' + picture('assets/frames/' + src + '.webp', '', true) + '<figcaption>' + label + '</figcaption></figure>').join('');
  return '<div class="shell"><section class="hero"><div><div class="eyebrow">Продакшн · Съёмочная смена</div><h1>Съёмка<br><span>07.11</span></h1><p class="intro">Сценарии, постановка кадра и чек-листы для команды YumeGram. Откройте ролик, сверьте свет и реквизит и отметьте готовые сцены.</p><div class="actions">' + link('#/list', 'К списку роликов ↓', 'primary') + link('#/props', 'Реквизит и печать') + '</div></div><div class="hero-film" aria-hidden="true">' + hero + '</div></section>' +
    '<div class="stats"><div class="stat"><strong>' + shoot.length + '</strong><span>съёмок в комнате</span></div><div class="stat"><strong>' + edit.length + '</strong><span>ролика на монтаж</span></div><div class="stat"><strong>' + total + '</strong><span>визуалов</span></div></div>' +
    '<section id="video-list" class="section"><div class="section-head"><div><h2>Снимаем в комнате</h2><p>Планы, реплики и проверка каждого дубля.</p></div>' + link('#/setup', 'Чек-лист смены') + '</div><div class="video-grid">' + shoot.map(videoCard).join('') + '</div></section>' +
    '<section class="section"><div class="section-head"><div><h2>Только монтаж</h2><p>Архив, графика и раскадровка для монтажёра.</p></div></div><div class="video-grid">' + edit.map(videoCard).join('') + '</div></section></div>';
}
function lightDiagram() {
  return '<figure class="light-diagram"><svg viewBox="0 0 520 338" role="img" aria-label="Схема сверху: полки за героем, камера напротив, левый и правый приборы по бокам камеры, верхний прибор над героем"><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#edc17b"/></marker></defs><rect x="20" y="13" width="480" height="309" rx="19" fill="#17131b" stroke="#4a4150"/><rect x="46" y="35" width="428" height="39" rx="8" fill="#302737"/><text x="260" y="60" text-anchor="middle" fill="#e7dbed" font-size="15">ПОЛКИ / ФОН</text><rect x="171" y="139" width="178" height="57" rx="8" fill="#3b303c" stroke="#8e728c"/><text x="260" y="174" text-anchor="middle" fill="#fff3ed" font-size="15">СТОЛ / ГЕРОЙ</text><circle cx="260" cy="109" r="20" fill="#655479"/><text x="260" y="113" text-anchor="middle" fill="#fff" font-size="12">В</text><text x="292" y="113" fill="#d3c1e9" font-size="12">верхний</text><path d="M113 214L172 178M405 214L349 178" stroke="#edc17b" stroke-width="2" marker-end="url(#arrow)"/><rect x="49" y="208" width="104" height="52" rx="8" fill="#674e32"/><text x="101" y="228" text-anchor="middle" fill="#fff4da" font-size="14">СЛЕВА</text><text x="101" y="246" text-anchor="middle" fill="#fff4da" font-size="12">50–60%</text><rect x="366" y="208" width="106" height="52" rx="8" fill="#4a4260"/><text x="419" y="228" text-anchor="middle" fill="#f2e8ff" font-size="14">СПРАВА</text><text x="419" y="246" text-anchor="middle" fill="#f2e8ff" font-size="12">5000–5600 К</text><rect x="206" y="248" width="108" height="43" rx="8" fill="#4a3950"/><text x="260" y="274" text-anchor="middle" fill="#f1def4" font-size="14">КАМЕРА</text><path d="M260 242V207" stroke="#edc17b" stroke-width="2" marker-end="url(#arrow)"/></svg><figcaption>Вид сверху. Слева и справа считаем от камеры, если она смотрит на героя.</figcaption></figure>';
}
function setupPage() {
  return '<div class="shell">' + pageHead('Чек-лист смены', 'Свет и камера', 'Одна комната с витринами, без окна. Перед первым дублем выставьте свет и снимите тест.') +
    '<section class="setup-grid">' + lightDiagram() + '<div class="panel light-spec"><h2>Три источника включены</h2>' +
    '<p><strong>Верхний.</strong> Включить. Смягчить или приглушить, если даёт глубокие тени под глазами и пересвет на макушке.</p>' +
    '<p><strong>Левый.</strong> 50–60% яркости. Поставить чуть выше лица и примерно под 45° к оси камеры; подобрать угол на тесте.</p>' +
    '<p><strong>Правый.</strong> Нейтральный белый 5000–5600 К. Начать с 5200 К. Если прибор в RGB, выбрать режим белого / CCT. Яркость подобрать так, чтобы щёки и фигурка сохраняли объём.</p>' +
    '<p><strong>Баланс белого.</strong> Снять серую или белую карту на месте героя со всеми приборами. Зафиксировать ручной WB по карте; избегать смешения оттенков на лице.</p>' +
    '<p><strong>Проверка.</strong> На белой футболке или акриле нет цветных пятен, светлые детали не клиппируют. Отдельно проверить мерцание. Для сети 50 Гц начать тест с 25 кадр/с и 1/50 с.</p></div></section>' +
    '<section class="section"><div class="section-head"><h2>Перед первым дублем</h2></div>' + checks('universal', universalChecks) + link('#/props','Перейти к реквизиту') + '</section></div>';
}
function propCard(key, name, description, file, used) {
  return '<article class="prop">' + checkbox('prop-' + key, name) + '<p>' + escape(description) + '</p>' +
    (used?.length ? '<span class="meta">' + used.map(v => '<a href="' + route(v.id,'props') + '">' + escape(v.title) + '</a>').join(' · ') + '</span>' : '') +
    (file ? '<a class="btn small" href="assets/print/' + escape(file) + '.doc" download="' + escape(file) + '.doc">↓ Скачать .doc</a>' : '') + '</article>';
}
function propsContent(video) {
  const scope = video ? [video] : plan.videos;
  const keys = [...new Set(scope.flatMap(v => v.props))];
  const sections = [];
  const printed = keys.filter(k => plan.props[k][2]);
  const materials = keys.filter(k => !plan.props[k][2]);
  const show = value => video || propFilter === 'all' || propFilter === value;
  if (show('print') && printed.length) {
    sections.push('<h2>Распечатать</h2><div class="prop-list">' + printed.map(k => propCard(k, ...plan.props[k], scope.filter(v => v.props.includes(k)))).join('') + '</div>');
  }
  if (show('materials')) {
    const materialGroups = [
      ['Съёмочный реквизит', materials.filter(k => scope.some(v => v.category === 'shoot' && v.props.includes(k)))],
      ['Материалы для монтажа', materials.filter(k => scope.some(v => v.category === 'edit' && v.props.includes(k)))],
    ];
    for (const [name, group] of materialGroups) {
      if (group.length) sections.push('<h2>' + name + '</h2><div class="prop-list">' +
        group.map(k => propCard(k, ...plan.props[k], undefined, scope.filter(v => v.props.includes(k)))).join('') + '</div>');
    }
  }
  if (show('materials') && (!video || video.category === 'shoot')) {
    sections.push('<h2>Общее для смены</h2><div class="prop-list">' + plan.shared.map(([key, name, description]) => propCard(key, name, description)).join('') + '</div>');
  }
  if (!sections.length) return '<p class="muted">В этой категории пока нет реквизита.</p>';
  const common = !video || video.category === 'shoot' ? plan.shared.map(([key]) => key) : [];
  const counted = video || propFilter === 'all' ? [...keys, ...common] : propFilter === 'print' ? printed : [...materials, ...common];
  return progress(counted.map(k => 'prop-' + k), 'Подготовлено') + sections.join('');
}
function propsPage() {
  const filters = [['all','Всё'],['print','Распечатать'],['materials','Реквизит и материалы']];
  return '<div class="shell">' + pageHead('Все ролики', 'Реквизит', 'Общий список на смену. Отметки видны и в карточках отдельных роликов. Кнопки скачивают готовые файлы Word.') +
    '<div class="filterbar" aria-label="Категория реквизита">' +
    filters.map(([k,label]) => '<button class="pill" type="button" data-filter="' + k + '" aria-pressed="' + (k === propFilter) + '">' + label + '</button>').join('') +
    '</div><div id="props-content">' + propsContent() + '</div></div>';
}
function visualCard(visual, key = '') {
  const alt = visual.label + '. ' + visual.setup;
  const badge = visual.kind === 'source' ? visual.label + ' · ' + visual.time : 'Мультяшный черновик · ' + visual.label;
  return '<div class="visual"><button type="button" data-frame="' + escape(visual.src) + '" data-caption="' + escape(badge + ' — ' + visual.setup) + '" aria-label="' + escape('Увеличить: ' + alt) + '">' +
    picture(visual.src, alt) + '<span class="zoom" aria-hidden="true">↗</span></button><div><span class="badge">' + escape(badge) +
    '</span><h4>Как поставить</h4><p>' + escape(visual.setup) + '</p><h4>Как проверить</h4><p>' + escape(visual.check) + '</p>' +
    (key ? checkbox(key, 'План проверен') : '') + '</div></div>';
}
function sceneCard(video, frame, index) {
  const sceneName = frame.code ? frame.code + ' · ' + frame.title : frame.title;
  const watchLabel = video.category === 'edit' ? 'Готово' : 'Дубль проверен';
  return '<article class="scene" id="scene-' + index + '"><div class="scene-head"><div class="scene-title"><span class="index">' + pad(index+1) + '</span><div><h3>' +
    escape(sceneName) + '</h3><small class="mono">' + escape(frame.time) + (frame.role ? ' · ' + escape(frame.role) : '') +
    '</small></div></div>' + checkbox(video.id + '-scene-' + index, watchLabel) + '</div><div class="scene-body"><div class="visual-grid ' +
    (frame.visuals.length === 1 ? 'one' : '') + '">' + frame.visuals.map((visual, i) => visualCard(visual,
      frame.visuals.length > 1 ? video.id + '-visual-' + index + '-' + i : '')).join('') + '</div><details class="scene-details"><summary>' +
    (video.category === 'edit' ? 'Текст и монтаж' : 'Действия и реплики') + '</summary><p>' + escape(frame.text) + '</p></details></div></article>';
}
function storyboard(video) {
  const frames = video.frames.map((frame, index) => ({frame,index}));
  if (video.id === 'spoiler' && spoilerOrder) frames.sort((a,b) => Number(a.frame.role === 'Фанат') - Number(b.frame.role === 'Фанат') || a.index - b.index);
  const sort = video.id === 'spoiler' ? '<button class="pill" data-order type="button" aria-pressed="' + spoilerOrder + '">Порядок съёмки</button>' : '';
  const sceneSelect = '<select class="scene-select" data-jump aria-label="Перейти к сцене"><option value="">Перейти к сцене</option>' +
    frames.map(({frame,index}) => '<option value="' + index + '">' + pad(index+1) + ' · ' + escape(frame.title) + '</option>').join('') + '</select>';
  return '<div class="storybar"><span class="muted">' + frameCount(frames.length) + ' · ' + visualCount(countVisuals(video)) + ' · нажмите на изображение для увеличения</span><div class="actions">' + sort + sceneSelect + '</div>' +
    '</div>' + progress(frames.map(({index}) => video.id + '-scene-' + index), video.category === 'edit' ? 'Готовые сцены' : 'Проверенные сцены') +
    '<div class="scenes">' + frames.map(({frame,index}) => sceneCard(video, frame, index)).join('') + '</div>';
}
function videoPage(video, tab) {
  const tabs = [['frames','Раскадровка'],['check','Чек-лист'],['props','Реквизит'],['script','Сценарий']];
  const heading = video.category === 'shoot' ? 'Съёмка в комнате' : 'Только монтаж';
  let content;
  if (tab === 'check') {
    content = '<h2>' + (video.category === 'shoot' ? 'Перед съёмкой' : 'Перед монтажом') + '</h2>' +
      checks(video.id + '-check', video.checks) + (video.category === 'shoot' ? link('#/setup', 'Общий чек-лист света и камеры') : '') +
      link(route(video.id, 'frames'), 'К раскадровке');
  } else if (tab === 'props') {
    content = propsContent(video) + link('#/props','Весь реквизит');
  } else if (tab === 'script') {
    content = '<section class="script-wrap"><h2>Текст сценария</h2><p class="muted">Версия со страницы 07.11. Световые указания на сайте приведены к схеме смены.</p>' +
      external(video.url, 'Исходный Google Doc') + '<div class="script-text">' + escape(video.script) + '</div></section>';
  } else {
    tab = 'frames';
    content = storyboard(video);
  }
  return '<div class="shell">' + pageHead(heading + ' · ' + video.duration, video.title, video.setup) +
    '<nav class="tabs" aria-label="Разделы ролика">' + tabs.map(([id, label]) => '<a href="' + route(video.id, id) + '"' +
      (id === tab ? ' aria-current="page"' : '') + '>' + label + '</a>').join('') +
    '</nav>' + (video.note ? '<p class="note">' + escape(video.note) + '</p>' : '') + '<div id="video-content">' + content + '</div></div>';
}
function render(keepScroll = false) {
  const [, page = '', id = '', tab = 'frames'] = (location.hash || '#/').split('/');
  const video = page === 'video' ? videos.get(id) : undefined;
  document.querySelectorAll('.masthead nav a').forEach(a => {
    const current = a.dataset.page === (page === 'setup' || page === 'props' ? page : 'home');
    if (current) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
  });
  if (video) main.innerHTML = videoPage(video, tab);
  else if (page === 'setup') main.innerHTML = setupPage();
  else if (page === 'props') main.innerHTML = propsPage();
  else main.innerHTML = home();
  document.title = (video?.title || (page === 'props' ? 'Реквизит' : page === 'setup' ? 'Свет и камера' : 'Съёмочная карта 07.11')) + ' · YumeGram';
  if (!keepScroll) {
    if (page === 'list') document.querySelector('#video-list').scrollIntoView();
    else window.scrollTo(0, 0);
  }
}
main.addEventListener('change', event => {
  if (event.target.matches('[data-jump]')) {
    if (event.target.value !== '') document.querySelector('#scene-' + event.target.value)?.scrollIntoView();
    return;
  }
  const input = event.target.closest('[data-check]');
  if (!input) return;
  if (input.checked) checked.add(input.dataset.check); else checked.delete(input.dataset.check);
  try { localStorage.setItem(storageKey, JSON.stringify([...checked])); } catch {}
  for (const indicator of main.querySelectorAll('[data-progress]')) {
    const keys = indicator.dataset.progress.split(' ').filter(Boolean);
    indicator.querySelector('strong').textContent = keys.filter(key => checked.has(key)).length + ' / ' + keys.length;
  }
});
main.addEventListener('click', event => {
  const control = event.target.closest('button');
  if (!control) return;
  if (control.dataset.frame) {
    const image = viewer.querySelector('img');
    image.src = control.dataset.frame;
    image.alt = control.dataset.caption;
    viewer.querySelector('figcaption').textContent = control.dataset.caption;
    viewer.showModal();
  } else if (control.dataset.filter) {
    propFilter = control.dataset.filter;
    main.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === propFilter)));
    main.querySelector('#props-content').innerHTML = propsContent();
  } else if (control.hasAttribute('data-order')) {
    spoilerOrder = !spoilerOrder;
    const host = main.querySelector('#video-content');
    host.innerHTML = storyboard(videos.get('spoiler'));
    host.querySelector('[data-order]').focus();
  }
});
viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
window.addEventListener('hashchange', () => render());
document.querySelector('.skip').addEventListener('click', event => { event.preventDefault(); main.focus(); });
render();
