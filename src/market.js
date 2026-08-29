const MK='run-league-market';const mkt=JSON.parse(localStorage.getItem(MK)||'null')||{cash:100,efforts:[],positions:[],resolved:[],hist:{},settled:{},week:null};const saveM=()=>localStorage.setItem(MK,JSON.stringify(mkt));
const FRIENDS=['Amy','John','David','Olivia','Maya','Theo','Priya','Sam','Jordan'];
const hash=s=>{let h=9;for(const ch of s)h=Math.imul(h^ch.charCodeAt(0),387420489);return(h>>>0)/4294967295};
const weekStart=()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d};
const weekKey=()=>weekStart().toISOString().slice(0,10);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const paceStr=p=>Math.floor(p)+':'+String(Math.round(p%1*60)).padStart(2,'0');
const toast=t=>{const n=document.createElement('div');n.className='toast';n.textContent=t;document.body.append(n);setTimeout(()=>n.remove(),2600)};
let courseList=[];fetch('../data/courses.json').then(r=>r.json()).then(x=>{courseList=x;renderMarket()});
window.__logEffort=e=>{mkt.efforts.push({...e,date:new Date().toISOString()});saveM();renderMarket()};
function stats(name){const wk=weekKey();if(name==='You'){const ws=weekStart(),ef=mkt.efforts.filter(e=>new Date(e.date)>=ws),km=ef.reduce((n,e)=>n+e.km,0),secs=ef.reduce((n,e)=>n+e.seconds,0);return{name,km,pace:km>0?secs/60/km:5.6,runs:ef.length}}const r=n=>hash(name+wk+n);return{name,km:18+r(1)*38,pace:4.5+r(2)*2,runs:2+Math.floor(r(3)*7)}}
function markets(){const wk=weekKey(),fs=FRIENDS.map(stats).sort((a,b)=>b.km-a.km),km1=[fs[0],fs[1]],km2=[fs[2],fs[3]],rest=fs.slice(4).sort((a,b)=>a.pace-b.pace),cr=[rest[0],rest[1]],me=stats('You'),rival=rest[2];
const course=courseList[Math.floor(hash('course'+wk)*courseList.length)];
const kmP=(a,b)=>clamp(a.km**2/(a.km**2+b.km**2),.12,.88);
const t=(s,c)=>s.pace*c.distanceKm*(1+c.incline*.015);
return [
{id:'km1-'+wk,kind:'km',a:km1[0],b:km1[1],question:`Who will run more next week: ${km1[0].name} or ${km1[1].name}?`,modelP:kmP(km1[0],km1[1])},
{id:'crs-'+wk,kind:'course',a:cr[0],b:cr[1],course,question:`Who will complete ${course.name} quicker: ${cr[0].name} or ${cr[1].name}?`,modelP:clamp(1/(1+Math.exp((t(cr[0],course)-t(cr[1],course))/(t(cr[1],course)*.04))),.12,.88)},
{id:'km2-'+wk,kind:'km',a:km2[0],b:km2[1],question:`Who will run more next week: ${km2[0].name} or ${km2[1].name}?`,modelP:kmP(km2[0],km2[1])},
{id:'you-'+wk,kind:'km',a:me,b:rival,question:`Who will run more next week: You or ${rival.name}?`,modelP:clamp(kmP(me,rival),.08,.88)}]}
function ensureHist(m){if(mkt.hist[m.id])return;const pts=[];let p=clamp(m.modelP+(hash(m.id+'seed')-.5)*.24,.08,.92);const now=Date.now(),start=now-3*864e5;for(let i=0;i<=36;i++){p=clamp(p+(m.modelP-p)*.12+(hash(m.id+'w'+i)-.5)*.07,.05,.95);pts.push({t:start+(now-start)*i/36,p})}mkt.hist[m.id]=pts;saveM()}
const price=m=>mkt.hist[m.id][mkt.hist[m.id].length-1].p;
function pushP(m,p){mkt.hist[m.id].push({t:Date.now(),p:clamp(p,.03,.97)});if(mkt.hist[m.id].length>240)mkt.hist[m.id]=mkt.hist[m.id].slice(-240);saveM()}
function graph(m){const h=mkt.hist[m.id],n=h.length,X=i=>(i/(n-1)*300).toFixed(1),Y=p=>(60-p*52-4).toFixed(1),line=h.map((pt,i)=>`${X(i)},${Y(pt.p)}`).join(' ');return `<svg class="odds-graph" viewBox="0 0 300 60" preserveAspectRatio="none"><line x1="0" y1="${Y(.5)}" x2="300" y2="${Y(.5)}" class="mid"/><polygon points="0,60 ${line} 300,60" class="area"/><polyline points="${line}" class="line"/><circle cx="300" cy="${Y(price(m))}" r="3" class="dot"/></svg>`}
const myPos=m=>mkt.positions.filter(p=>p.id===m.id);
function bet(m,side,stake){const person=side==='a'?m.a.name:m.b.name;if(person==='You')return toast("You can't bet on yourself");if(mkt.cash<stake)return toast('Not enough balance');const p=price(m),pr=side==='a'?p:1-p,shares=stake/pr;mkt.cash-=stake;mkt.positions.push({id:m.id,q:m.question,side,person,shares,stake,price:pr});const impact=Math.min(.12,stake/200);pushP(m,p+(side==='a'?impact*(1-p):-impact*p));saveM();toast(`£${stake} on ${person} @ ${Math.round(pr*100)}p`);renderMarket()}
function settle(m){if(mkt.settled[m.id])return;let aWins;if(m.kind==='km'&&(m.a.name==='You'||m.b.name==='You'))aWins=m.a.km>=m.b.km;else aWins=hash(m.id+weekKey()+'res')<m.modelP;const winner=aWins?m.a.name:m.b.name;let pay=0;
mkt.positions=mkt.positions.filter(pos=>{if(pos.id!==m.id)return true;const won=(pos.side==='a')===aWins,payout=won?pos.shares:0;pay+=payout;mkt.cash+=payout;mkt.resolved.unshift({q:m.question,person:pos.person,won,pnl:payout-pos.stake,date:new Date().toISOString()});return false});
mkt.settled[m.id]={winner};pushP(m,aWins?.97:.03);saveM();toast(`Settled — ${winner} wins${pay?` · you collect £${pay.toFixed(2)}`:''}`);renderMarket()}
setInterval(()=>{if(!document.querySelector('#market-mode.active')||!courseList.length)return;const ms=markets();let moved=false;ms.forEach(m=>{if(mkt.settled[m.id])return;ensureHist(m);const p=price(m);let np=p+(m.modelP-p)*.03+(Math.random()-.5)*.045;if(Math.random()<.14){const side=Math.random()<p?'a':'b',who=FRIENDS[Math.floor(Math.random()*FRIENDS.length)],nm=side==='a'?m.a.name:m.b.name;if(who!==nm&&who!==m.a.name&&who!==m.b.name){np+=(side==='a'?.06*(1-p):-.06*p);toast(`${who} just bet on ${nm}`)}}pushP(m,np);moved=true});if(moved)renderMarket()},9000);
function renderMarket(){const list=document.querySelector('#market-list');if(!list||!courseList.length)return;
if(mkt.week!==weekKey()){mkt.positions.forEach(p=>mkt.cash+=p.stake);mkt.positions=[];mkt.hist={};mkt.settled={};mkt.week=weekKey();saveM()}
const ms=markets();ms.forEach(ensureHist);document.querySelector('#market-balance').textContent='£'+mkt.cash.toFixed(2);
list.innerHTML=ms.map(m=>{const p=price(m),st=mkt.settled[m.id],hasYou=m.a.name==='You'||m.b.name==='You';
const statLine=m.kind==='km'?`${m.a.name}: ${m.a.km.toFixed(0)} km last wk · ${paceStr(m.a.pace)}/km — ${m.b.name}: ${m.b.km.toFixed(0)} km · ${paceStr(m.b.pace)}/km`:`${m.a.name}: ${paceStr(m.a.pace)}/km — ${m.b.name}: ${paceStr(m.b.pace)}/km · ${m.course.distanceKm} km, incline ${m.course.incline}/10`;
const row=(side,person,prob)=>{const btns=st?'':person==='You'?'<span class="self-note">can\'t back yourself</span>':[5,10,25].map(v=>`<button class="bet-btn" data-id="${m.id}" data-side="${side}" data-stake="${v}">£${v}</button>`).join('');return `<div class="outcome-row${st&&st.winner===person?' won':''}"><span class="o-name">${person}</span><em>${Math.round(prob*100)}%</em><span class="o-odds">${(1/prob).toFixed(2)}x</span><div class="bet-btns">${btns}</div></div>`};
const pos=myPos(m).map(x=>`<div class="pos-note">You hold ${x.shares.toFixed(1)} shares on ${x.person} @ ${Math.round(x.price*100)}p → pays £${x.shares.toFixed(2)} if right</div>`).join('');
const vol=40+Math.round(hash(m.id+'vol')*140)+myPos(m).reduce((n,x)=>n+x.stake,0);
return `<article class="market-card${hasYou?' has-you':''}" data-id="${m.id}"><div class="market-q"><h3>${m.question}</h3>${st?`<span class="resolved-chip">RESOLVED · ${st.winner.toUpperCase()} WON</span>`:'<span class="countdown">CLOSES SUN 23:59</span>'}</div><p class="muted statline">${statLine}</p>${graph(m)}${row('a',m.a.name,p)}${row('b',m.b.name,1-p)}${pos}${st?'':`<button class="settle-btn" data-id="${m.id}">Fast-forward: settle market</button>`}<span class="vol">£${vol} traded</span></article>`}).join('');
list.querySelectorAll('.bet-btn').forEach(b=>b.onclick=()=>bet(ms.find(x=>x.id===b.dataset.id),b.dataset.side,Number(b.dataset.stake)));
list.querySelectorAll('.settle-btn').forEach(b=>b.onclick=()=>settle(ms.find(x=>x.id===b.dataset.id)));
const el=document.querySelector('#market-side'),wk=weekKey(),banks=[['You',mkt.cash],...FRIENDS.map(f=>[f,100+(hash(f+wk+'bank')-.5)*60])].sort((a,b)=>b[1]-a[1]);
el.innerHTML=`<div class="wallet-card"><span class="eyebrow">YOUR BALANCE</span><strong>£${mkt.cash.toFixed(2)}</strong><small>Started with £100 · play money</small></div><div class="side-block"><b>OPEN POSITIONS</b>${mkt.positions.length?mkt.positions.map(x=>`<div class="side-row"><span>${x.person}<small> £${x.stake} @ ${Math.round(x.price*100)}p</small></span><strong>→ £${x.shares.toFixed(2)}</strong></div>`).join(''):'<p class="muted">No bets yet — back a friend.</p>'}</div><div class="side-block"><b>SETTLED</b>${mkt.resolved.length?mkt.resolved.slice(0,6).map(r=>`<div class="side-row"><span>${r.person}</span><strong class="${r.pnl>=0?'up':'down'}">${r.pnl>=0?'+':''}£${r.pnl.toFixed(2)}</strong></div>`).join(''):'<p class="muted">Nothing settled yet.</p>'}</div><div class="side-block"><b>TOP PREDICTORS</b>${banks.map((r,i)=>`<div class="side-row${r[0]==='You'?' mine':''}"><span>${['🥇','🥈','🥉'][i]||'·'} ${r[0]}</span><strong>£${r[1].toFixed(2)}</strong></div>`).join('')}</div>`}
window.__renderMarket=renderMarket;
