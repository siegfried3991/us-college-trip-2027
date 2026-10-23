let data,route='A',regionIndex=0;
const routePositions=new Map();
const names={A:'Amherst',B:'Cleveland',C:'Medill',D:'Williams',E:'UC Davis'};
const titles={A:'Route A · LA to Boston',B:'Route B · Eastbound drive',C:'Route C · Northwestern / Medill',D:'Route D · Williams + Wellesley',E:'Route E · UC Davis'};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plan=()=>data.plans.find(p=>p.code===route);
const phone=()=>window.matchMedia('(max-width:600px)').matches;
const motion=()=>window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth';
function embed(r){return 'https://maps.google.com/maps?'+new URLSearchParams({saddr:r.stops[0],daddr:r.stops.slice(1).join(' to:'),dirflg:r.mode==='transit'?'r':'d',hl:'en',output:'embed'});}
function readRoute(){const q=new URLSearchParams(location.hash.slice(1)),r=q.get('route');return r&&'ABCDE'.includes(r)?r:route;}
function savePosition(){routePositions.set(route,{y:Math.max(0,window.scrollY),region:regionIndex,mapOpen:document.querySelector('#route-map')?.open??!phone()});}
function selectRoute(r,push=true){
 if(r===route)return;
 savePosition();route=r;
 const saved=routePositions.get(route);regionIndex=saved?.region??0;
 if(push)history.pushState(null,'','#route='+route);
 render();window.scrollTo({top:saved?.y??0,behavior:'auto'});
}
function jumpToDay(value){const day=Number(value);if(!Number.isInteger(day)||day<0||day>16)return;document.querySelector('#day-'+day)?.scrollIntoView({behavior:motion(),block:'start'});}
function dayCard(d){
 const h=d.hotel;
 return `<article class="day" id="day-${d.day}"><div class="day-head"><span class="day-number">D${d.day}</span><div class="day-title"><h3>${esc(d.title)}</h3><div class="date">${esc(d.dateLabel)} · 2027</div></div></div><div class="day-body"><div class="activities">${d.activities.map(a=>`<div class="event ${a.time?'':'no-time'}"><span class="time">${esc(a.time)}</span><span>${esc(a.text)}</span></div>`).join('')}</div><div class="details"><div class="detail transport"><div class="label">Transport</div><div class="value">${esc(d.transport)}</div></div><div class="detail"><div class="label">Stay · ${esc(h.city)}</div><div class="value">${h.url?`<a href="${esc(h.url)}" target="_blank" rel="noopener">${esc(h.name)} ↗</a>`:esc(h.name)}</div>${h.status?`<div class="hotel-status">${esc(h.status)}</div>`:''}</div><div class="detail"><div class="label">Rest</div><div class="rest">${esc(d.restWindow)}</div></div></div></div><div class="links">${d.links.map(l=>`<a target="_blank" rel="noopener" href="${esc(l.url)}">${esc(l.label)} ↗</a>`).join('')}</div></article>`;
}
function render(){
 const p=plan(),r=p.regions[regionIndex]||p.regions[0];
 const mapOpen=routePositions.get(route)?.mapOpen??!phone();
 document.title=`Route ${route} · US trip 2027`;
 document.querySelector('#route-tabs').innerHTML=data.plans.map(p=>`<button id="tab-${p.code}" role="tab" tabindex="${p.code===route?'0':'-1'}" aria-label="Route ${p.code} · ${names[p.code]}" aria-selected="${p.code===route}" aria-controls="app" class="${p.code===route?'active':''}" data-route="${p.code}"><span class="route-letter">Route ${p.code}</span><span class="route-name"> · ${names[p.code]}</span></button>`).join('');
 const app=document.querySelector('#app');app.setAttribute('role','tabpanel');app.setAttribute('aria-labelledby','tab-'+route);
 app.innerHTML=`<div class="route-head"><h2>${titles[route]}</h2><div class="status">Proposed itinerary · flights and visits unbooked</div></div><p class="route-line">${esc(p.route.replace(/ > /g,' → '))}</p><details class="map" id="route-map" ${mapOpen?'open':''}><summary><span>Google Maps</span><span class="map-state"><span class="closed-label">Show map ＋</span><span class="open-label">Hide map −</span></span></summary><div class="map-bar"><div class="map-controls"><label for="map-region" style="position:absolute;left:-10000px">Map region</label><select id="map-region">${p.regions.map((r,i)=>`<option value="${i}" ${i===regionIndex?'selected':''}>${esc(r.label)}</option>`).join('')}</select><a id="open-map" href="${esc(r.url)}" target="_blank" rel="noopener">Open in Google Maps ↗</a></div></div><iframe id="map-frame" title="${esc(r.label)} · route ${route}" src="${esc(embed(r))}" loading="lazy" ${phone()?'tabindex="-1"':''} referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></details><div class="date-picker"><label for="day-select">Jump to date</label><select id="day-select">${p.days.map(d=>`<option value="${d.day}">D${d.day} · ${esc(d.dateLabel)}</option>`).join('')}</select></div>${p.days.map(dayCard).join('')}<div class="footer">All times local. Hotel names are suggestions; unnamed hotels are still to select.</div>`;
 document.querySelectorAll('[data-route]').forEach(b=>{
  b.onclick=()=>selectRoute(b.dataset.route);
  b.onkeydown=e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){
   e.preventDefault();const i='ABCDE'.indexOf(route);
   const next=e.key==='Home'?'A':e.key==='End'?'E':'ABCDE'[(i+(e.key==='ArrowRight'?1:4))%5];
   selectRoute(next);document.querySelector('#tab-'+route).focus({preventScroll:true});
  }};
 });
 document.querySelector('#map-region').onchange=e=>{
  regionIndex=Number(e.target.value);const r=plan().regions[regionIndex];
  document.querySelector('#map-frame').src=embed(r);document.querySelector('#map-frame').title=r.label+' · route '+route;document.querySelector('#open-map').href=r.url;
 };
 document.querySelector('#day-select').onchange=e=>jumpToDay(e.target.value);
 updateScrollUI();
}
let scrollFrame=false;
function updateScrollUI(){
 document.querySelector('#back-top').hidden=window.scrollY<500;
 const picker=document.querySelector('#day-select');if(!picker||document.activeElement===picker)return;
 const boundary=document.querySelector('.route-nav').getBoundingClientRect().bottom+100;
 let current=0;document.querySelectorAll('.day').forEach(el=>{if(el.getBoundingClientRect().top<=boundary)current=Number(el.id.slice(4));});
 picker.value=String(current);
}
window.addEventListener('scroll',()=>{if(!scrollFrame){scrollFrame=true;requestAnimationFrame(()=>{updateScrollUI();scrollFrame=false;});}},{passive:true});
document.querySelector('#back-top').onclick=()=>window.scrollTo({top:0,behavior:motion()});
window.addEventListener('hashchange',()=>{const r=readRoute();if(data&&r!==route)selectRoute(r,false);});
window.addEventListener('pagehide',()=>{if(data)savePosition();});
fetch('data.json').then(r=>{if(!r.ok)throw Error('data');return r.json();}).then(d=>{
 data=d;route=readRoute();render();
 const params=new URLSearchParams(location.hash.slice(1));if(params.has('day'))requestAnimationFrame(()=>jumpToDay(params.get('day')));
}).catch(()=>{document.querySelector('#app').innerHTML='<p class="error">Please refresh to load the itinerary. <a href="trip-report.pdf">Open PDF ↗</a></p>';});
