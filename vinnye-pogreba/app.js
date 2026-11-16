'use strict';
/* Страница «Винный погребок» — локальный скрипт. Общий /app.js не подключаем:
   у него своя схема формы (#model-select, одна метка заявки), здесь же форма
   с переключением вопроса/расчёта (lead_intent). Интерактив шапки и меню —
   как на действующих страницах. */
const menuButton=document.querySelector('.menu-toggle');
const navigation=document.querySelector('#navigation');
function closeMenu(){navigation.classList.remove('open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Открыть меню');}
menuButton.addEventListener('click',()=>{const open=navigation.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');});
navigation.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});

const form=document.querySelector('#request-form');
const request=document.querySelector('#request');
const requestTitle=document.querySelector('#request-title');
const requestDescription=document.querySelector('#request-description');
const calculationTitle=requestTitle.innerHTML;
const calculationDescription=requestDescription.innerHTML;

function openRequest(asking){
  form.elements.lead_intent.value=asking?'wine_question':'wine_calculation';
  requestTitle.innerHTML=asking?'Задайте вопрос о винном погребке':calculationTitle;
  requestDescription.innerHTML=asking
    ?'Напишите свой вопрос и выберите, в каком мессенджере вам ответить.'
    :calculationDescription;
  const notes=form.elements.project_notes;
  notes.setCustomValidity('');
  notes.required=asking;
  notes.placeholder=asking?'Например, можно ли сделать боковой вход?':'Например, отделка деревом или удобный вход';
  document.querySelector('#request-notes-label').textContent=asking?'Ваш вопрос':'Пожелания к погребку';
  document.querySelector('#request-notes-optional').hidden=asking;
  document.querySelector('#request-submit-label').textContent=asking?'Отправить вопрос':'Отправить запрос на расчёт';
  form.elements.city.required=!asking;
  form.querySelector('input[value="Позвонить"]').disabled=asking;
  if(asking)form.querySelector('input[value="Написать"]').checked=true;
  request.classList.toggle('is-question',asking);
  updateContactMethod();
  requestTitle.focus({preventScroll:true});
  request.scrollIntoView({behavior:'instant'});
}
document.querySelector('[data-ask-wine]').addEventListener('click',event=>{event.preventDefault();openRequest(true);});
document.querySelectorAll('[data-format]').forEach(button=>button.addEventListener('click',()=>openRequest(false)));

/* Просмотр фото */
const dialog=document.querySelector('#image-dialog');
const image=document.querySelector('#large-image');
let lastImageButton=null;
document.querySelectorAll('.zoom-photo').forEach(b=>b.addEventListener('click',()=>{lastImageButton=b;image.src=b.dataset.image;image.alt=b.dataset.caption;document.querySelector('#image-caption').textContent=b.dataset.caption;dialog.showModal();}));
function closeImage(){dialog.close();lastImageButton?.focus();}
document.querySelector('#close-image').addEventListener('click',closeImage);
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeImage();}});

/* Панели «по номеру» в блоке контактов: MAX и Telegram (прямой ссылки на
   личный чат нет — показываем номер, как на действующих страницах) */
document.querySelectorAll('#max-contact-toggle').forEach(button=>{
  const panel=document.getElementById(button.getAttribute('aria-controls'));
  button.addEventListener('click',()=>{
    const open=panel.hidden;
    panel.hidden=!open;
    button.setAttribute('aria-expanded',String(open));
  });
});
const tgContactToggle=document.querySelector('#tg-contact-toggle');
if(tgContactToggle){
  tgContactToggle.addEventListener('click',()=>{
    const panel=document.querySelector('#tg-contact');
    const open=panel.hidden;
    panel.hidden=!open;
    tgContactToggle.setAttribute('aria-expanded',String(open));
  });
}

/* Панель «Написать» в шапке */
const messageTrigger=document.querySelector('#header-message-trigger');
const messagePanel=document.querySelector('#header-messenger-panel');
const messengerControl=document.querySelector('.header-messenger-control');
function closeMessengerPanel(returnFocus=false){messagePanel.hidden=true;messageTrigger.setAttribute('aria-expanded','false');if(returnFocus)messageTrigger.focus();}
messageTrigger.addEventListener('click',()=>{const open=messagePanel.hidden;messagePanel.hidden=!open;messageTrigger.setAttribute('aria-expanded',String(open));if(open)closeMenu();});
messagePanel.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeMessengerPanel()));
document.addEventListener('click',e=>{if(!messengerControl.contains(e.target))closeMessengerPanel();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!messagePanel.hidden)closeMessengerPanel(true);});
menuButton.addEventListener('click',()=>closeMessengerPanel());
const headerMaxTrigger=document.querySelector('#header-max-trigger');
headerMaxTrigger.addEventListener('click',()=>{const info=document.querySelector('#header-max-info');const open=info.hidden;info.hidden=!open;headerMaxTrigger.setAttribute('aria-expanded',String(open));});
const headerTgTrigger=document.querySelector('#header-tg-trigger');
if(headerTgTrigger){headerTgTrigger.addEventListener('click',()=>{const info=document.querySelector('#header-tg-info');const open=info.hidden;info.hidden=!open;headerTgTrigger.setAttribute('aria-expanded',String(open));});}

/* Выбор способа ответа */
const channelChoice=document.querySelector('#channel-choice');
function updateContactMethod(){const writing=document.querySelector('input[name="contact"]:checked').value==='Написать';channelChoice.hidden=!writing;channelChoice.disabled=!writing;channelChoice.querySelectorAll('input').forEach(input=>input.required=writing);document.querySelector('#form-result').hidden=true;}
document.querySelectorAll('input[name="contact"]').forEach(input=>input.addEventListener('change',updateContactMethod));
updateContactMethod();
channelChoice.querySelectorAll('input').forEach(input=>input.addEventListener('change',()=>{document.querySelector('#form-result').hidden=true;}));

/* ── Лиды в Битрикс24: тот же обработчик, что у главной и «Для продуктов» ──
   B24 = URL узкого вебхука …/crm.lead.add.json (только создание лида).
   Отличие страницы: отправляем fetch-ом и показываем успех только по
   подтверждению обработчика; при ошибке введённые данные сохраняются. */
var B24="https://b24-z45kgu.bitrix24.ru/rest/1/s3wpr4vj16oscmv7/crm.lead.add.json";
var SVETA="11898"; /* Светлана — ответственная за лиды с сайта */
var IS_MOBILE=/Android|iPhone|iPad|Mobi/i.test(navigator.userAgent);
function isNight(h){ if(h===undefined) h=new Date().getHours(); return h>=20||h<9; }
var NIGHT=isNight();
function b24common(){
  var f={"fields[SOURCE_ID]":"UC_POgreb","fields[ASSIGNED_BY_ID]":SVETA,
         "fields[SOURCE_DESCRIPTION]":"Сайт погребов · pogreb.imperia-kupeley.ru"};
  try{
    new URLSearchParams(location.search).forEach(function(v,k){
      if(/^utm_/i.test(k)) f["fields["+k.toUpperCase()+"]"]=v;
    });
  }catch(e){}
  return f;
}
function b24send(fields){
  if(!B24||!navigator.sendBeacon) return false;
  try{
    var s=Object.keys(fields).map(function(k){
      return encodeURIComponent(k)+"="+encodeURIComponent(fields[k]);
    }).join("&");
    return navigator.sendBeacon(B24,new Blob([s],{type:"application/x-www-form-urlencoded"}));
  }catch(e){ return false; }
}
/* Клик по ссылке WhatsApp → лид-факт (дедуп: раз за сессию на кнопку) */
document.querySelectorAll('a[href^="https://wa.me/"]').forEach(function(el,i){
  var key="wa-sent-v2-"+i;
  el.addEventListener("click",function(){
    try{
      if(sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key,"1");
    }catch(e){}
    var where=el.closest("#header-messenger-panel")?"панель «Написать» в шапке":(el.closest("#messengers")?"блок контактов":"ссылка");
    var f=b24common();
    f["fields[TITLE]"]="Сайт погребов — клик WhatsApp («"+where+"»)";
    f["fields[COMMENTS]"]="Клик по кнопке WhatsApp («"+where+"») — клиент ушёл писать в мессенджер.\nСтраница: "+location.pathname+location.search+"\nПлатформа: "+(IS_MOBILE?"мобильный":"десктоп");
    b24send(f);
  });
});
/* Отправка с подтверждением: числовой result = ID созданного лида */
async function b24fetch(fields){
  const body=Object.keys(fields).map(k=>encodeURIComponent(k)+"="+encodeURIComponent(fields[k])).join("&");
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),15000);
  try{
    const res=await fetch(B24,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:body,keepalive:true,signal:ctrl.signal});
    clearTimeout(timer);
    if(!res.ok) return null;
    const json=await res.json();
    return (json&&typeof json.result==="number")?json.result:null;
  }catch(e){ clearTimeout(timer); return null; }
}
form.addEventListener('submit',async event=>{
  event.preventDefault();
  const phone=form.elements.phone;
  const notes=form.elements.project_notes;
  const asking=form.elements.lead_intent.value==='wine_question';
  const noteText=notes.value.trim();
  phone.setCustomValidity(phone.value.replace(/\D/g,'').length<7?'Укажите телефон: не менее 7 цифр.':'');
  notes.setCustomValidity(asking&&!noteText?'Напишите ваш вопрос.':'');
  if(!form.reportValidity())return;
  const data=new FormData(form);
  const messenger=String(data.get('messenger')||'');
  const contact=String(data.get('contact')||'');
  const answer=contact==='Позвонить'?'позвонить':('написать в '+messenger);
  const city=String(data.get('city')||'').trim();
  const marketing=data.get('marketing_consent')==='yes'?'да':'нет';
  var f=b24common();
  f["fields[PHONE][0][VALUE]"]=String(data.get('phone')||'');
  f["fields[PHONE][0][VALUE_TYPE]"]="WORK";
  if(asking){
    f["fields[TITLE]"]="Вопрос с сайта — Винный погребок";
    f["fields[COMMENTS]"]="Вопрос: "+noteText+
      (city?("\nГород: "+city):"")+
      "\nКак ответить: "+answer+
      "\nРекламная рассылка: "+marketing+
      "\nСтраница: "+location.pathname+location.search+
      "\nПлатформа: "+(IS_MOBILE?"мобильный":"десктоп")+
      (NIGHT?"\n⏰ Оставлено в нерабочее время — связаться утром, с 9:00":"");
  }else{
    f["fields[TITLE]"]="Расчёт — Винный погребок";
    f["fields[COMMENTS]"]="Интересует: "+String(data.get('model')||'')+
      (city?("\nГород установки: "+city):"")+
      "\nКак ответить: "+answer+
      (noteText?("\nПожелания: "+noteText):"")+
      "\nРекламная рассылка: "+marketing+
      "\nСтраница: "+location.pathname+location.search+
      "\nПлатформа: "+(IS_MOBILE?"мобильный":"десктоп")+
      (NIGHT?"\n⏰ Оставлено в нерабочее время — связаться утром, с 9:00":"");
  }
  const submitButton=form.querySelector('button[type="submit"]');
  const result=document.querySelector('#form-result');
  submitButton.disabled=true;
  const leadId=await b24fetch(f);
  submitButton.disabled=false;
  if(leadId===null){
    result.textContent="Не получилось отправить. Проверьте связь и нажмите кнопку ещё раз — введённые данные сохранены.";
    result.hidden=false;
    result.scrollIntoView({behavior:'smooth',block:'nearest'});
    return;
  }
  form.reset();
  openRequest(false); /* возвращает подписи и вид полей к режиму расчёта (заодно прячет result — покажем ниже) */
  result.textContent=NIGHT
    ?"Сейчас нерабочее время. Заявка у нас — с 9:00 утра сами выйдем с вами на связь ("+answer+")."
    :(asking
      ?"Вопрос принят! Ответим в течение часа (9:00–20:00 МСК) — "+answer+"."
      :"Заявка принята! Перезвоним или напишем в течение часа (9:00–20:00 МСК), ответим "+answer+".");
  result.hidden=false;
  result.scrollIntoView({behavior:'smooth',block:'nearest'});
});
form.elements.project_notes.addEventListener('input',event=>event.target.setCustomValidity(''));
document.querySelector('input[name="phone"]').addEventListener('input',e=>e.target.setCustomValidity(''));
