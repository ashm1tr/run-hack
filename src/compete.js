const CK='run-league-competition';const comp=JSON.parse(localStorage.getItem(CK)||'{"myTeam":null,"efforts":[]}');const saveComp=()=>localStorage.setItem(CK,JSON.stringify(comp));
const SEED_TEAMS=[{name:'North Ridge Runners',icon:'⛰️',members:['Maya','Theo']},{name:'River Rats',icon:'🐀',members:['Jordan','Ava']},{name:'Heath Hounds',icon:'🐕',members:['Priya','Sam']}];
const CHALLENGES=[{id:'km',title:'Distance Duel',desc:'Most combined km this week',metric:'km'},{id:'gain',title:'Summit Week',desc:'Most metres climbed this week',metric:'gain'},{id:'runs',title:'Course Blitz',desc:'Most courses completed this week',metric:'runs'}];
const CAPS={km:55,gain:1100,runs:11};
const weekStart=()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d};
const weekKey=()=>weekStart().toISOString().slice(0,10);
const dayFrac=()=>(((new Date().getDay()+6)%7)+1)/7;
const daysLeft=()=>{const end=new Date(weekStart());end.setDate(end.getDate()+7);return Math.max(1,Math.ceil((end-Date.now())/864e5))};
const hash=s=>{let h=9;for(const ch of s)h=Math.imul(h^ch.charCodeAt(0),387420489);return(h>>>0)/4294967295};
const rivalScore=(t,ch)=>(0.35+0.65*hash(t.name+ch.id+weekKey()))*CAPS[ch.metric]*t.members.length/2*dayFrac();
const weekEfforts=()=>{const ws=weekStart();return comp.efforts.filter(e=>new Date(e.date)>=ws)};
const myScore=ch=>{const ef=weekEfforts();return ch.metric==='km'?ef.reduce((n,e)=>n+e.km,0):ch.metric==='gain'?ef.reduce((n,e)=>n+e.gain,0):ef.length};
const fmt=(v,m)=>m==='km'?v.toFixed(1)+' km':m==='gain'?Math.round(v)+' m':Math.round(v)+' runs';
const toast=t=>{const n=document.createElement('div');n.className='toast';n.textContent=t;document.body.append(n);setTimeout(()=>n.remove(),2600)};
function allTeams(){const ts=SEED_TEAMS.map(t=>comp.myTeam?.name===t.name?{...comp.myTeam,mine:true}:{...t,mine:false});if(comp.myTeam&&!ts.some(t=>t.mine))ts.push({...comp.myTeam,mine:true});return ts}
function renderCrew(){const el=document.querySelector('#crew-panel');if(!el)return;const t=allTeams().find(x=>x.mine);
if(!t){el.innerHTML=`<p class="eyebrow">YOUR CREW</p><h2>Found a crew</h2><div class="create-team"><input id="team-name" placeholder="Crew name" maxlength="24"><div class="icon-row">${['🔥','⚡','🌊','🦊','🚀'].map((i,n)=>`<button class="icon-pick${n?'':' active'}" data-icon="${i}">${i}</button>`).join('')}</div><button id="team-create" class="lime-button">Create crew</button></div><p class="muted or-join">…or join a local crew:</p>${SEED_TEAMS.map(s=>`<button class="join-row" data-team="${s.name}">${s.icon} ${s.name}<small>${s.members.join(', ')}</small></button>`).join('')}`;
el.querySelectorAll('.icon-pick').forEach(b=>b.onclick=()=>el.querySelectorAll('.icon-pick').forEach(x=>x.classList.toggle('active',x===b)));
el.querySelector('#team-create').onclick=()=>{const name=el.querySelector('#team-name').value.trim();if(!name)return el.querySelector('#team-name').focus();comp.myTeam={name,icon:el.querySelector('.icon-pick.active').dataset.icon,members:['You']};saveComp();toast('Crew created — challenges are live');renderCompete()};
el.querySelectorAll('.join-row').forEach(b=>b.onclick=()=>{const s=SEED_TEAMS.find(x=>x.name===b.dataset.team);comp.myTeam={name:s.name,icon:s.icon,members:[...s.members,'You']};saveComp();toast('Joined '+s.name);renderCompete()})}
else{const ef=weekEfforts(),km=ef.reduce((n,e)=>n+e.km,0),gm=ef.reduce((n,e)=>n+e.gain,0);
el.innerHTML=`<p class="eyebrow">YOUR CREW</p><h2>${t.icon} ${t.name}</h2><p class="muted">${t.members.join(' · ')}</p><div class="crew-stats"><div><span>THIS WEEK</span><strong>${km.toFixed(1)} km</strong></div><div><span>CLIMBED</span><strong>${Math.round(gm)} m</strong></div><div><span>RUNS</span><strong>${ef.length}</strong></div></div><button id="crew-invite-link" class="lime-button">Copy crew invite</button><button id="team-leave" class="ghost-button">Leave crew</button><p class="muted crew-hint">Every run you log on any course counts toward this week's challenges.</p>`;
el.querySelector('#crew-invite-link').onclick=()=>{const u=new URL(location.href.split('#')[0]);u.searchParams.set('team',t.name);u.searchParams.set('icon',t.icon);u.hash='compete';navigator.clipboard?.writeText(u.href);toast('Crew invite copied')};
el.querySelector('#team-leave').onclick=()=>{comp.myTeam=null;saveComp();renderCompete()}}}
function renderBoard(){const el=document.querySelector('#challenge-board');if(!el)return;const mine=comp.myTeam;
el.innerHTML=CHALLENGES.map(ch=>{const rows=allTeams().map(t=>({t,score:(t.mine?myScore(ch):0)+(SEED_TEAMS.some(s=>s.name===t.name)?rivalScore(t,ch):0)})).sort((a,b)=>b.score-a.score),top=rows[0]?.score||1;
return `<article class="challenge-card"><div class="challenge-head"><div><h3>${ch.title}</h3><p class="muted">${ch.desc}</p></div><span class="countdown">ENDS IN ${daysLeft()}D</span></div>${mine?'':'<p class="muted">Create or join a crew to enter.</p>'}${rows.map((r,i)=>`<div class="standing${r.t.mine?' mine':''}"><span>${['🥇','🥈','🥉'][i]||'·'} ${r.t.icon} ${r.t.name}${r.t.mine?' <b>(YOU)</b>':''}</span><div class="bar"><i style="width:${Math.max(3,r.score/top*100).toFixed(1)}%"></i></div><strong>${fmt(r.score,ch.metric)}</strong></div>`).join('')}</article>`}).join('')}
function renderCompete(){renderCrew();renderBoard()}
window.__renderCompete=renderCompete;
window.__logEffort=e=>{comp.efforts.push({...e,date:new Date().toISOString()});saveComp();renderCompete()};
const qp=new URLSearchParams(location.search);if(qp.has('team')&&!comp.myTeam){comp.myTeam={name:qp.get('team'),icon:qp.get('icon')||'🔥',members:['You']};saveComp();toast('Joined crew '+qp.get('team'))}
renderCompete();
