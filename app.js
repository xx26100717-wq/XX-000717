'use strict';
const $=id=>document.getElementById(id);
let database=[];
const themes={
'健康问题':[[2,40],[24,32],[1,18],[28,14],[34,13],[16,15]],
'失业或收入下降':[[19,45],[7,34],[5,27],[23,24],[8,12]],
'没钱或债务':[[5,42],[7,40],[8,19],[19,15],[15,13]],
'婚姻与家庭问题':[[10,44],[8,20],[18,15],[17,10],[29,9]],
'父母养老':[[17,49],[24,23],[13,17],[25,16],[8,11]],
'孩子教育':[[30,46],[18,22],[20,15],[5,11],[23,8]],
'时间不够':[[4,46],[3,37],[22,18],[23,12]],
'法律与财产风险':[[8,45],[9,36],[14,20],[13,14]],
'个人信息泄露':[[14,55],[8,24],[9,17],[26,10]],
'不知道未来方向':[[23,47],[31,33],[19,20],[4,15],[3,12]]
};
const chapterNum=x=>Number.parseInt(x.chapter,10);
const nameOf=n=>(database.find(x=>chapterNum(x)===n)||{}).chapter||`第${n}章`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function profile(){return {age:+$('age').value,income:+$('income').value,family:$('family').value,fear:$('fear').value,time:+$('time').value}}
function boosts(p){const b=new Map([[1,7],[2,9],[3,5],[4,5],[5,6],[13,4],[14,3]]);const reasons=new Map();function add(n,score,reason){b.set(n,(b.get(n)||0)+score);if(!reasons.has(n))reasons.set(n,[]);reasons.get(n).push(reason)}
for(const [n,s] of themes[p.fear]||[])add(n,s,`你最担心“${p.fear}”，这一章能优先覆盖相关风险和行动。`);
if(p.age<30){add(23,18,'你处于30岁以前，技能与职业选择仍有较长的回报期。');add(19,9,'职业早期先理解劳动权益和工作风险。');add(31,10,'这一阶段适合系统比较未来的发展路径。')}
else if(p.age<40){add(5,13,'30多岁通常更需要审视持续性支出与财务缓冲。');add(2,10,'在这个年龄阶段，长期健康习惯值得提前建立。')}
else{add(2,18,'随着年龄增长，慢性健康风险更值得优先管理。');add(17,12,'这一阶段更可能需要关注家庭照护安排。')}
if(p.family==='未婚'||p.family==='恋爱中'){add(10,24,'你目前未婚或处于恋爱阶段，适合先了解亲密关系与婚姻的长期决策。');add(23,9,'当前也适合投入可迁移技能，增加个人选择空间。')}
if(p.family.includes('已婚')||p.family==='单亲育儿'){add(8,22,'你已有家庭责任，财产、合同和风险隔离值得提前规划。');add(10,9,'婚姻中的责任分工和重大决定也值得定期复盘。')}
if(p.family==='已婚有孩子'||p.family==='单亲育儿'){add(18,26,'你需要承担育儿责任，相关成本与选择直接影响家庭。');add(30,23,'孩子成长与教育规划对你更有现实相关性。');add(20,12,'有孩子的家庭也可检查儿童照护与安全事项。')}
if(p.income<5000){add(7,25,'你的月收入相对有限，先保证基本生活与现金缓冲更实际。');add(5,18,'控制高频支出有助于降低现金流压力。')}
else if(p.income>=15000){add(8,17,'收入较高时，更值得系统管理合同、财产与潜在损失。');add(5,10,'有一定收入基础后，可审视较大额的长期消费决策。')}
else add(5,12,'你的收入处于中间区间，优先优化支出和储蓄安排可能更实用。');
if(p.time<=2){add(3,18,'你每周可投入时间较少，优先减少精力浪费更容易坚持。');add(4,17,'可先选择低耗时、高回报的行动。')}
else if(p.time>=6){add(23,15,'你每周有较充足的投入时间，适合持续学习与积累技能。')}
return {b,reasons}}
function score(x,p,b){let n=chapterNum(x),s=b.get(n)||0;const cost=String(x.cost||'');if(cost.includes('钱=0'))s+=5;if(cost.includes('时间=少'))s+=p.time<=2?9:4;if(cost.includes('时间=多')&&p.time<=2)s-=13;if(x.evidence==='A')s+=7;else if(x.evidence==='B')s+=4;const t=x.title+' '+x.description;for(const k of String(p.fear).split(/[或与、 ]/))if(k.length>=2&&t.includes(k))s+=12;return s}
function reason(n,p,reasons){let r=reasons.get(n)||[];return r.length?r.slice(0,2).join(' '):'这部分涉及基础安全、健康或日常决策，适合作为普遍性的防风险补充。'}
function itemReason(x,p,reasons){let c=chapterNum(x);return `${reason(c,p,reasons)} 具体推荐“${x.title.replace(/^\d+[.、]\s*/,'')}”，因为它提供了可以落实的做法${x.evidence==='A'?'，且原书标注的证据等级为 A':x.evidence==='B'?'，且原书标注的证据等级为 B':''}。`}
function render(p){const {b,reasons}=boosts(p);const chapters=[...b.entries()].sort((a,z)=>z[1]-a[1]).filter(([n])=>database.some(x=>chapterNum(x)===n)).slice(0,5);const picks=[];const used=new Set();for(const [n] of chapters){const items=database.filter(x=>chapterNum(x)===n).sort((a,z)=>score(z,p,b)-score(a,p,b));for(const x of items.slice(0,2)){if(!used.has(x.title)){picks.push(x);used.add(x.title)}}}if(picks.length<10){for(const x of [...database].sort((a,z)=>score(z,p,b)-score(a,p,b))){if(!used.has(x.title)){picks.push(x);used.add(x.title)}if(picks.length===10)break}}const top=picks.slice(0,10);const persona=`${p.age}岁 · ${p.family} · 月收入${p.income.toLocaleString('zh-CN')}元 · 每周${p.time}小时`;
const chapterHtml=chapters.map(([n],i)=>`<article class="item"><h3>${i+1}. ${esc(nameOf(n))}</h3><p class="reason"><strong>为什么推荐：</strong>${esc(reason(n,p,reasons))}</p></article>`).join('');
const adviceHtml=top.map((x,i)=>`<article class="item"><span class="tag">${esc(x.chapter)}</span><h3>${i+1}. ${esc(x.title)}</h3><p>${esc(x.description)}</p><p class="reason"><strong>为什么推荐：</strong>${esc(itemReason(x,p,reasons))}</p><div class="meta"><b>成本：</b>${esc(x.cost||'未标注')}<br><b>收益依据：</b>${esc(x.benefit||'未标注')}<br><b>证据等级：</b>${esc(x.evidence||'未标注')}（沿用原书标注）</div></article>`).join('');
const short=top.slice(0,6).map(x=>`<li><strong>${esc(x.title)}</strong><div>${esc(reason(chapterNum(x),p,reasons))}</div></li>`).join('');
$('results').innerHTML=`<div class="panel"><h2>你的画像</h2><p>${esc(persona)}<br>当前最担心：${esc(p.fear)}</p><p>以下推荐按你的五项输入动态计算，改变年龄、家庭状态或担忧后可重新生成并对比。</p></div><section class="panel"><h2>第一层｜优先阅读的 5 个章节</h2>${chapterHtml}</section><section class="panel"><h2>第二层｜跨章节 Top 10 行动建议</h2>${adviceHtml}</section><section class="onepage"><h2>第三层｜${esc(persona)} 的一页行动清单</h2><p>优先关注：${esc(p.fear)}。先完成下面 6 条，再根据时间继续执行 Top 10。</p><ol>${short}</ol><button class="printbtn" onclick="window.print()">打印 / 保存 PDF</button></section>`;$('results').hidden=false;$('results').scrollIntoView({behavior:'smooth',block:'start'})}
fetch('data/advice.json').then(r=>{if(!r.ok)throw Error('数据文件无法读取');return r.json()}).then(d=>{if(!Array.isArray(d)||d.length<10)throw Error('建议数据不完整');database=d}).catch(e=>{$('status').textContent=`加载失败：${e.message}。请确认 data/advice.json 已上传。`});
$('profile').addEventListener('submit',e=>{e.preventDefault();if(!database.length){$('status').textContent='建议数据正在加载，请稍后重试。';return}const p=profile();$('status').textContent='';render(p)});
