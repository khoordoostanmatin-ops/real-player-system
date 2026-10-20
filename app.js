'use strict';
const STORAGE_KEY = 'real-player-system-v1';
const statKeys = ['strength','stamina','speed','flexibility','knowledge','discipline'];
const statLabels = {strength:'قدرت',stamina:'استقامت',speed:'سرعت',flexibility:'انعطاف',knowledge:'دانش',discipline:'انضباط'};
const baseQuests = [
  {id:'strength',name:'تمرین قدرتی یا بدنی',desc:'تمرین متناسب با توان امروز؛ فرم صحیح مقدم بر تعداد است.',xp:25,stat:'strength'},
  {id:'move',name:'حرکت و هوازی',desc:'پیاده‌روی تند یا فعالیت هوازی سبک تا متوسط.',xp:20,stat:'stamina'},
  {id:'learn',name:'یادگیری یک مهارت',desc:'۲۰ دقیقه مطالعه، درس یا یادگیری مهارت فنی.',xp:20,stat:'knowledge'},
  {id:'discipline',name:'مأموریت انضباط',desc:'یک کار عقب‌افتاده را کامل کن و فردا را برنامه‌ریزی کن.',xp:15,stat:'discipline'},
  {id:'recovery',name:'ریکاوری هوشمند',desc:'کشش ملایم، آب کافی و استراحت مناسب؛ بدون فشار دردناک.',xp:20,stat:'flexibility'}
];
const defaultState = () => ({name:'بازیکن ۰۰۱',totalXp:0,level:1,stats:{strength:10,stamina:10,speed:10,flexibility:10,knowledge:10,discipline:10},completions:{},logs:[],createdAt:new Date().toISOString()});
let state = loadState();
let installPrompt = null;
function loadState(){try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return defaultState();const s=JSON.parse(raw);const d=defaultState();return {...d,...s,stats:{...d.stats,...(s.stats||{})},completions:s.completions||{},logs:Array.isArray(s.logs)?s.logs:[]};}catch(e){return defaultState();}}
function saveState(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch(e){showToast('ذخیره‌سازی در این مرورگر در دسترس نیست.');return false;}}
function todayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function todayCompletions(){return state.completions[todayKey()]||(state.completions[todayKey()]=[]);}
function levelFor(xp){let level=1,remaining=xp,need=100;while(remaining>=need){remaining-=need;level++;need=100+(level-1)*25;}return {level,into:remaining,need};}
function rankFor(level){if(level>=50)return ['S','شکارچی افسانه‌ای'];if(level>=30)return ['A','شکارچی نخبه'];if(level>=20)return ['B','شکارچی حرفه‌ای'];if(level>=10)return ['C','شکارچی باتجربه'];if(level>=5)return ['D','در حال رشد'];return ['E','تازه‌بیدارشده'];}
function fa(n){return Number(n).toLocaleString('fa-IR');}
function render(){
 const lev=levelFor(state.totalXp),rank=rankFor(lev.level);state.level=lev.level;
 document.getElementById('playerName').textContent=state.name||'بازیکن ۰۰۱';document.getElementById('levelText').textContent=fa(lev.level);document.getElementById('rankPill').textContent=`RANK ${rank[0]}`;document.getElementById('rankName').textContent=rank[1];
 document.getElementById('xpText').textContent=`${fa(lev.into)} / ${fa(lev.need)}`;document.getElementById('xpBar').style.width=`${Math.min(100,lev.into/lev.need*100)}%`;document.getElementById('totalXpText').textContent=`مجموع تجربه: ${fa(state.totalXp)}`;document.getElementById('nextLevelText').textContent=`تا سطح بعد: ${fa(lev.need-lev.into)} XP`;
 statKeys.forEach(k=>{const el=document.querySelector(`[data-stat="${k}"]`);if(el)el.textContent=fa(state.stats[k]||10)});
 const done=todayCompletions();document.getElementById('todayText').textContent=new Intl.DateTimeFormat('fa-IR',{weekday:'short',month:'short',day:'numeric'}).format(new Date());document.getElementById('questCount').textContent=`${fa(done.length)} / ${fa(baseQuests.length)}`;document.getElementById('questBar').style.width=`${done.length/baseQuests.length*100}%`;
 const list=document.getElementById('questList');list.innerHTML='';baseQuests.forEach(q=>{const isDone=done.includes(q.id);const row=document.createElement('label');row.className='quest-item'+(isDone?' done':'');const cb=document.createElement('input');cb.type='checkbox';cb.className='quest-check';cb.checked=isDone;cb.setAttribute('aria-label',q.name);cb.addEventListener('change',()=>toggleQuest(q.id));const copy=document.createElement('span');copy.className='quest-copy';const name=document.createElement('span');name.className='quest-name';name.textContent=q.name;const desc=document.createElement('span');desc.className='quest-desc';desc.textContent=q.desc;copy.append(name,document.createElement('br'),desc);const xp=document.createElement('span');xp.className='xp-reward';xp.textContent=`+${q.xp} XP`;row.append(cb,copy,xp);list.append(row);});
 const logs=document.getElementById('logPanel');logs.innerHTML='';if(!state.logs.length){const e=document.createElement('div');e.className='empty-log';e.textContent='هنوز گزارشی ثبت نشده. اولین مأموریتت را انجام بده.';logs.append(e);}else{state.logs.slice(0,6).forEach(log=>{const row=document.createElement('div');row.className='log-entry';const mark=document.createElement('span');mark.className='log-mark';mark.textContent=log.type==='level'?'⬆':'✓';const text=document.createElement('span');text.textContent=log.text;row.append(mark,text);logs.append(row);});}
}
function addLog(text,type='quest'){state.logs.unshift({text,type,at:new Date().toISOString()});state.logs=state.logs.slice(0,30);}
function toggleQuest(id){const q=baseQuests.find(x=>x.id===id);if(!q)return;const done=todayCompletions();if(done.includes(id)){showToast('این مأموریت امروز تکمیل شده است.');render();return;}const oldLevel=levelFor(state.totalXp).level;done.push(id);state.totalXp+=q.xp;state.stats[q.stat]=Math.min(999,(Number(state.stats[q.stat])||10)+1);addLog(`${q.name} تکمیل شد؛ ${q.xp} XP دریافت کردی.`);const newLevel=levelFor(state.totalXp).level;if(newLevel>oldLevel){addLog(`ارتقای سطح! اکنون سطح ${newLevel} هستی.`, 'level');showToast(`LEVEL UP! به سطح ${fa(newLevel)} رسیدی ⚡`);}else{showToast(`مأموریت تکمیل شد؛ +${fa(q.xp)} XP`);}saveState();render();}
function showToast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>el.classList.remove('show'),2600);}
const settingsDialog=document.getElementById('settingsDialog'),statsDialog=document.getElementById('statsDialog');
document.getElementById('settingsBtn').addEventListener('click',()=>{document.getElementById('nameInput').value=state.name;settingsDialog.showModal();});
document.getElementById('editStatsBtn').addEventListener('click',()=>{statKeys.forEach(k=>document.getElementById('stat-'+k).value=state.stats[k]||10);statsDialog.showModal();});
document.getElementById('saveSettingsBtn').addEventListener('click',e=>{e.preventDefault();const name=document.getElementById('nameInput').value.trim();state.name=name||'بازیکن ۰۰۱';saveState();render();settingsDialog.close();showToast('تنظیمات ذخیره شد.');});
document.getElementById('saveStatsBtn').addEventListener('click',e=>{e.preventDefault();statKeys.forEach(k=>{const v=Number(document.getElementById('stat-'+k).value);state.stats[k]=Number.isFinite(v)?Math.max(1,Math.min(999,Math.round(v))):10;});saveState();render();statsDialog.close();showToast('آمار شخصیت به‌روزرسانی شد.');});
document.getElementById('resetBtn').addEventListener('click',()=>{if(confirm('همه XP، مأموریت‌ها و تنظیمات این دستگاه پاک شود؟ این کار برگشت‌پذیر نیست.')){state=defaultState();saveState();render();settingsDialog.close();showToast('سیستم از ابتدا شروع شد.');}});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;document.getElementById('installBtn').classList.remove('hidden');});
document.getElementById('installBtn').addEventListener('click',async()=>{if(!installPrompt){showToast('برای نصب، سایت را در Chrome باز کن و از منوی مرورگر «Install app» را بزن.');return;}installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;document.getElementById('installBtn').classList.add('hidden');});
if('serviceWorker' in navigator && location.protocol!=='file:'){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
render();
