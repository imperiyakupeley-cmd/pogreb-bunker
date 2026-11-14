'use strict';
const menuButton=document.querySelector('.menu-toggle');
const navigation=document.querySelector('#navigation');
function closeMenu(){navigation.classList.remove('open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Открыть меню');}
menuButton.addEventListener('click',()=>{const open=navigation.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');});
navigation.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
const select=document.querySelector('#model-select');
function chooseModel(model){select.value=model;document.querySelector('#request').scrollIntoView({behavior:'instant'});}
document.querySelectorAll('[data-model]').forEach(b=>b.addEventListener('click',()=>chooseModel(b.dataset.model)));
document.querySelectorAll('[data-format]').forEach(b=>b.addEventListener('click',()=>chooseModel(b.dataset.format)));
const dialog=document.querySelector('#image-dialog');
const image=document.querySelector('#large-image');
let lastImageButton=null;
document.querySelectorAll('.zoom-photo').forEach(b=>b.addEventListener('click',()=>{lastImageButton=b;image.src=b.dataset.image;image.alt=b.dataset.caption;document.querySelector('#image-caption').textContent=b.dataset.caption;dialog.showModal();}));
function closeImage(){dialog.close();lastImageButton?.focus();}
document.querySelector('#close-image').addEventListener('click',closeImage);
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeImage();}});
const maxToggle=document.querySelector('#max-contact-toggle');
maxToggle.addEventListener('click',()=>{const panel=document.querySelector('#max-contact');const open=panel.hidden;panel.hidden=!open;maxToggle.setAttribute('aria-expanded',String(open));});
/* Telegram: честная панель «по номеру» (прямой ссылки на личный чат нет) — как у MAX */
const tgToggle=document.querySelector('#tg-contact-toggle');
if(tgToggle){tgToggle.addEventListener('click',()=>{const panel=document.querySelector('#tg-contact');const open=panel.hidden;panel.hidden=!open;tgToggle.setAttribute('aria-expanded',String(open));});}
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
const channelChoice=document.querySelector('#channel-choice');
function updateContactMethod(){const writing=document.querySelector('input[name="contact"]:checked').value==='Написать';channelChoice.hidden=!writing;channelChoice.disabled=!writing;channelChoice.querySelectorAll('input').forEach(input=>input.required=writing);const result=document.querySelector('#form-result');if(result)result.hidden=true;}
document.querySelectorAll('input[name="contact"]').forEach(input=>input.addEventListener('change',updateContactMethod));
updateContactMethod();
channelChoice.querySelectorAll('input').forEach(input=>input.addEventListener('change',()=>{const result=document.querySelector('#form-result');if(result)result.hidden=true;}));
const pageFormats={"/vinnye-pogreba/":"Винный погреб","/pogreb-ukrytie/":"Погреб-укрытие"};if(pageFormats[location.pathname])select.value=pageFormats[location.pathname];

/* ── Лиды в Битрикс24 (мост без сервера: sendBeacon напрямую) — прод-схема сайта ──
   B24 = URL узкого вебхука …/crm.lead.add.json. Пустая строка = интеграция
   выключена. Полный доступ сюда НЕ пойдёт никогда — только узкий ключ crm.lead.add. */
var B24="https://b24-z45kgu.bitrix24.ru/rest/1/s3wpr4vj16oscmv7/crm.lead.add.json";
var SVETA="11898"; /* Светлана Иванова — ответственная за лиды с сайта */
var IS_MOBILE=/Android|iPhone|iPad|Mobi/i.test(navigator.userAgent);
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
/* Форма: лид уходит в Б24, экран успеха текстом в #form-result */
function isNight(h){ if(h===undefined) h=new Date().getHours(); return h>=20||h<9; }
var NIGHT=isNight();
document.querySelector('#request-form').addEventListener('submit',e=>{
  e.preventDefault();
  const form=e.currentTarget;
  const phone=form.elements.phone;
  const digits=phone.value.replace(/\D/g,'');
  phone.setCustomValidity(digits.length<7?'Укажите телефон: не менее 7 цифр.':'');
  if(!form.reportValidity())return;
  const data=new FormData(form);
  const model=String(data.get('model')||'');
  const city=String(data.get('city')||'');
  const contact=String(data.get('contact')||'');
  const messenger=String(data.get('messenger')||'');
  const notes=String(data.get('project_notes')||'');
  const marketing=data.get('marketing_consent')==='yes'?'да':'нет';
  const answer=contact==='Позвонить'?'позвонить':('написать в '+messenger);
  const page=location.pathname==='/'?'главная':'страница «Для продуктов»';
  var f=b24common();
  f["fields[TITLE]"]="Сайт погребов — заявка с формы ("+page+")";
  f["fields[PHONE][0][VALUE]"]=String(data.get('phone')||'');
  f["fields[PHONE][0][VALUE_TYPE]"]="WORK";
  var c="Интересует: "+model+
    "\nГород установки: "+city+
    "\nКак ответить: "+answer+
    (notes?("\nПожелания: "+notes):"")+
    "\nРекламная рассылка: "+marketing+
    "\nСтраница: "+location.pathname+location.search+
    "\nПлатформа: "+(IS_MOBILE?"мобильный":"десктоп")+
    (NIGHT?"\n⏰ Оставлено в нерабочее время — связаться утром, с 9:00":"");
  f["fields[COMMENTS]"]=c;
  if(NIGHT) f["fields[TITLE]"]="Сайт погребов — заявка с формы ("+page+", ночь, связаться с 9:00)";
  b24send(f);
  const result=document.querySelector('#form-result');
  form.reset();
  updateContactMethod(); /* восстановит channel-choice и спрячет result — показываем ПОСЛЕ */
  result.textContent=NIGHT
    ?"Сейчас нерабочее время. Заявка у нас — с 9:00 утра сами выйдем с вами на связь ("+answer+")."
    :"Заявка принята! Перезвоним или напишем в течение часа (9:00–20:00 МСК), ответим "+answer+".";
  result.hidden=false;
  result.scrollIntoView({behavior:'smooth',block:'nearest'});
});
document.querySelector('input[name="phone"]').addEventListener('input',e=>e.target.setCustomValidity(''));
