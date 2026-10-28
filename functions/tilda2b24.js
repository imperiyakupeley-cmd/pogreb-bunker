// Прослойка Тильда → Битрикс24 (коннектор rvspace).
// Задача: коннектор умеет подставлять в поля лида только простые имена без
// пробелов, а вопросы квиза — русские фразы с пробелами и «?». Здесь собираем
// все содержательные ответы в одно поле QuizConfig и постим всё в коннектор.
// Маршрут: https://pogreb.imperia-kupeley.ru/tilda2b24
// Не индексируется, секретной не является: спам-фильтр — требование formservices[].

const RVHOOK = 'https://tilda.rvspace.ru/n/h/1053d17338019c73210c8c410783429e';

// Служебные поля Тильды — в конфиг не включаем
const SKIP = new Set([
  'formid', 'tranid', 'ts', 'Name', 'name', 'Email', 'Email_2', 'Phone',
  'messenger-type', 'messenger-id', 'messenger-type;messenger-id',
  'form-spec-comments', 'tildaspec-formname', 'jurisdiction',
]);
const SKIP_PREFIXES = ['formservices', 'tildaspec-', '$$_', 'Checkbox', 'Cookie', 'Header'];

function isSkipped(key) {
  if (SKIP.has(key)) return true;
  return SKIP_PREFIXES.some((p) => key.startsWith(p));
}

function buildQuizConfig(fields) {
  const parts = [];
  const formname = fields['tildaspec-formname'];
  if (formname) parts.push('форма «' + formname + '»');
  for (const [k, v] of Object.entries(fields)) {
    if (isSkipped(k)) continue;
    const val = Array.isArray(v) ? v.filter(Boolean).join(', ') : String(v || '').trim();
    if (!val) continue;
    parts.push(k.replace(/\?+$/, '').trim() + ': ' + val);
  }
  const msg = fields['form-spec-comments'];
  if (msg && String(msg).trim()) parts.push('сообщение: ' + String(msg).trim());
  return parts.length ? 'Заявка с сайта — ' + parts.join('; ') : '';
}

async function readFields(request) {
  const ct = (request.headers.get('content-type') || '').toLowerCase();
  const fields = {};
  const add = (k, v) => {
    if (k in fields) {
      fields[k] = Array.isArray(fields[k]) ? fields[k].concat([v]) : [fields[k], v];
    } else fields[k] = v;
  };
  if (ct.includes('application/json')) {
    const j = await request.json().catch(() => ({}));
    for (const [k, v] of Object.entries(j)) add(k, Array.isArray(v) ? v.join(', ') : String(v));
  } else {
    const fd = await request.formData().catch(() => null);
    if (fd) for (const [k, v] of fd.entries()) add(k, typeof v === 'string' ? v : v.name);
  }
  return fields;
}

export async function onRequestPost(context) {
  const fields = await readFields(context.request);
  // спам-фильтр: настоящая отправка Тильды всегда несёт formservices[]
  const hasServices = Object.keys(fields).some((k) => k.startsWith('formservices'));
  if (!hasServices) return new Response('OK', { status: 200 });

  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) {
    if (Array.isArray(v)) v.forEach((x) => out.append(k, x));
    else out.append(k, v);
  }
  const cfg = buildQuizConfig(fields);
  if (cfg) out.append('QuizConfig', cfg);

  const resp = await fetch(RVHOOK, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: out.toString(),
  });
  console.log('tilda2b24', JSON.stringify({ cfg: cfg.slice(0, 300), rv: resp.status, phone: fields['messenger-id'] || '' }));
  return new Response('OK', { status: 200 });
}

export async function onRequestGet() {
  return new Response('tilda2b24 forwarder: OK', { status: 200 });
}
