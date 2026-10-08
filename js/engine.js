async function generate(){
const db=await fetch('data/advice.json').then(r=>r.json());
const tags=[...document.querySelectorAll('input:checked')].map(x=>x.value);
const profile={age:age.value,income:income.value,career:career.value,health:health.value,wealth:wealth.value,time:time.value,tags};

let result=db.map(x=>{let score=x.priority||0; x.tags.forEach(t=>{if(tags.includes(t))score+=20}); return {...x,score}}).sort((a,b)=>b.score-a.score).slice(0,10);

resultDiv=`<section class="card"><h2>你的个人报告</h2>
<h3>第一层：章节路线</h3>${[...new Set(result.map(x=>x.chapter))].map(x=>`<div class="item"><b>${x}</b><br>为什么推荐：根据你的年龄、家庭、风险和资源状态匹配。</div>`).join('')}
<h3>第二层：Top10</h3>${result.map((x,i)=>`<div class="item"><b>${i+1}.${x.title}</b><p>为什么推荐：${x.reason}</p><p>成本：${x.cost}｜收益：${x.benefit}｜证据：${x.evidence}</p></div>`).join('')}
<h3>第三层：90天行动卡</h3>${result.slice(0,6).map(x=>'□ '+x.title).join('<br>')}
<br><button onclick="window.print()">保存报告</button></section>`;
document.getElementById('result').innerHTML=resultDiv;
}
