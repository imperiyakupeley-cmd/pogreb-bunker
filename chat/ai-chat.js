/* ИИ-консультант сайта погребов — инжект виджета deep-chat.
 * Разметку строит сам: в index.html только <link> на css и <script type="module"> сюда.
 *
 * Вариант мобильной кнопки — константа ниже (на десктопе всегда пилюля справа внизу):
 *   'A' — плавающая пилюля «💬 Спросить» над липкой панелью (утверждённый вариант А)
 *   'B' — кнопка 💬 третьей в липкой панели (вариант Б)
 * Бандл deep-chat грузится лениво — при первом открытии панели.
 *
 * Логика лида: после 3 вопросов пользователя — ворота «укажите телефон»; телефон в
 * тексте сообщения (10+ цифр) засчитывается сразу. Каждый телефон → один лид Б24
 * «из чата с ИИ» с выжимкой диалога (дедуп через sessionStorage).
 */
const BTN = window.AI_BTN || 'A';
const ENDPOINT = window.AI_ENDPOINT || 'https://ai.imperia-kupeley.ru/';
const GATE_AFTER = 3;          // вопросов до ворот телефона

document.body.classList.add(BTN === 'B' ? 'ai-btn-b' : 'ai-btn-a');

/* ── Кнопки ── */
const fab = document.createElement('button');
fab.id = 'ai-fab';
fab.type = 'button';
fab.innerHTML = '💬 Спросить';
document.body.appendChild(fab);

if (BTN === 'B') {
  const mini = document.createElement('button');
  mini.className = 'ai-mini';
  mini.type = 'button';
  mini.setAttribute('aria-label', 'Спросить ИИ');
  mini.textContent = '💬';
  const sticky = document.getElementById('stickyCta');
  if (sticky) sticky.appendChild(mini);
  mini.addEventListener('click', () => openPanel());
}
fab.addEventListener('click', () => openPanel());

/* ── Панель ── */
const panel = document.createElement('div');
panel.id = 'ai-panel';
panel.setAttribute('role', 'dialog');
panel.setAttribute('aria-label', 'Чат с ИИ-консультантом');
panel.innerHTML =
  '<div id="ai-head"><span class="ai-dot"></span><div><div class="t">ИИ-консультант</div>' +
  '<div class="s">погреба и бункеры · онлайн 24/7</div></div>' +
  '<button id="ai-close" type="button" aria-label="Закрыть">×</button></div>' +
  '<div id="ai-body"><div id="ai-loading">Загружаю чат…</div></div>';
document.body.appendChild(panel);

const bodyEl = panel.querySelector('#ai-body');
panel.querySelector('#ai-close').addEventListener('click', () => closePanel());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
});

/* ── Ворота телефона (врезка v2, без альт-ссылки) ── */
const gate = document.createElement('div');
gate.id = 'ai-gate';
gate.innerHTML =
  '<div class="g-title">Для продолжения диалога укажите телефон</div>' +
  '<div class="g-row"><input id="ai-gate-phone" type="tel" inputmode="tel" autocomplete="tel" ' +
  'placeholder="+7 ___ ___-__-__"><button id="ai-gate-btn" type="button">Продолжить</button></div>' +
  '<div class="g-err" id="ai-gate-err">Похоже, в номере не хватает цифр — проверьте, пожалуйста.</div>' +
  '<div class="g-note">Менеджер свяжется: днём — в течение часа, вечером — с 9:00. ' +
  'Отправляя номер, вы соглашаетесь с <a href="/privacy" target="_blank" rel="noopener">политикой конфиденциальности</a>.</div>';
bodyEl.appendChild(gate);

const gatePhone = gate.querySelector('#ai-gate-phone');
const gateErr = gate.querySelector('#ai-gate-err');
gate.querySelector('#ai-gate-btn').addEventListener('click', submitGate);
gatePhone.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitGate(); });

function digitsOf(s) { return (s || '').replace(/\D/g, ''); }
function submitGate() {
  const v = gatePhone.value.trim();
  if (digitsOf(v).length < 10) { gateErr.classList.add('show'); gatePhone.focus(); return; }
  gateErr.classList.remove('show');
  passed = true;
  sendLead(v, 'ворота после ' + GATE_AFTER + ' вопросов');
  gate.classList.remove('show');
}

/* ── Состояние диалога ── */
let userTurns = 0, passed = false, loaded = false;
const transcript = []; // {role:'user'|'assistant', text}

function onMsg(ev) {
  const m = ev && ev.message;
  if (!m || ev.isHistory || ev.isInitial) return;
  transcript.push({ role: m.role, text: m.text });
  if (transcript.length > 30) transcript.shift();
  if (m.role === 'user') {
    userTurns++;
    const d = digitsOf(m.text);
    if (!passed && d.length >= 10) {           // телефон назван в сообщении
      passed = true;
      const mm = m.text.match(/[\d+()\-\s]{7,}/); // фрагмент «как написан» — в лид
      sendLead(mm ? mm[0].trim() : d, 'телефон в сообщении');
    } else if (!passed && userTurns >= GATE_AFTER) {
      gate.classList.add('show');
    }
  }
}

/* ── Лид в Б24 (мост уже есть на странице: b24common/b24send) ── */
function summarize() {
  return transcript.slice(-8).map(t =>
    (t.role === 'user' ? 'Клиент: ' : 'ИИ: ') + String(t.text).slice(0, 200)
  ).join('\n');
}
function sendLead(phoneDisplay, where) {
  const d = digitsOf(phoneDisplay);
  if (!window.b24send || !window.b24common || !d) return;
  try {
    if (sessionStorage.getItem('ai-lead-' + d)) return;
    sessionStorage.setItem('ai-lead-' + d, '1');
  } catch (e) { /* приватный режим — дедуп пропускаем, лид шлём */ }
  const f = window.b24common();
  f['fields[TITLE]'] = 'Сайт погреба — телефон из чата с ИИ';
  f['fields[PHONE][0][VALUE]'] = phoneDisplay;
  f['fields[PHONE][0][VALUE_TYPE]'] = 'WORK';
  f['fields[COMMENTS]'] = 'Клиент оставил телефон в ИИ-чате (' + where + ').\n' +
    'Выжимка диалога:\n' + summarize() + '\n' +
    'Страница: ' + location.pathname + location.search + '\n' +
    'Платформа: ' + (window.matchMedia('(max-width:600px)').matches ? 'мобильный' : 'десктоп');
  window.b24send(f);
}

/* ── Ленивая загрузка deep-chat и настройка элемента ── */
async function ensureChat() {
  if (loaded) return;
  loaded = true;
  await import('./deep-chat.min.js');
  await customElements.whenDefined('deep-chat');
  const el = document.createElement('deep-chat');
  el.connect = { url: ENDPOINT };
  // в deep-chat 2.x интро = history с одним сообщением ассистента
  // (верхнеуровневый introMessage в 2.5.1 не отрисовывается при connect)
  el.history = [{ role: 'assistant', text: 'Здравствуйте! Помогу выбрать погреб или бункер: ' +
    'спрошу про участок, подскажу по цене и монтажу. Что планируете хранить?' }];
  el.textInput = { placeholder: { text: 'Спросите про погреб или бункер…' }, characterLimit: 1000 };
  el.messageStyles = {
    default: { shared: { bubble: { fontSize: '15px', lineHeight: '1.5', maxWidth: '82%' } } },
    user: { bubble: { backgroundColor: '#007599', color: '#ffffff' } },
    ai: { bubble: { backgroundColor: '#ffffff', color: '#161d18' } }
  };
  el.onMessage = onMsg;
  bodyEl.insertBefore(el, gate);
  panel.querySelector('#ai-loading').remove();
}

function openPanel() {
  panel.classList.add('open');
  fab.hidden = true;
  const mob = window.matchMedia('(max-width:600px)').matches;
  if (mob) document.body.style.overflow = 'hidden';
  ensureChat();
}
function closePanel() {
  panel.classList.remove('open');
  fab.hidden = false;
  document.body.style.overflow = '';
}
