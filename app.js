async function generate(){
const data=await fetch('data/advice.json').then(r=>r.json());
const tags=[...document.querySelectorAll('input:checked')].map(x=>x.value);
const age=Number(document.getElementById('age').value||0);

const result=data.map(x=>{
let score=x.priority||0;
x.tags.forEach(t=>{if(tags.includes(t)) score+=20});
if(age<35 && x.tags.includes('成长')) score+=15;
if(age>=35 && x.tags.includes('家庭')) score+=15;
return {...x,score};
}).sort((a,b)=>b.score-a.score).slice(0,10);

document.getElementById('result').innerHTML=`
<div class="card">
<h2>你的个性化报告</h2>
<h3>第一层：章节指引</h3>
${[...new Set(result.map(x=>x.chapter))].map(x=>`<p>${x}<br>为什么推荐：与你当前人生阶段和风险关注匹配。</p>`).join('')}

<h3>第二层：Top 10</h3>
${result.map((x,i)=>`<div class="item"><b>${i+1}.${x.title}</b><p>为什么推荐：${x.reason}</p><p>成本：${x.cost} | 收益：${x.benefit} | 证据：${x.evidence}</p></div>`).join('')}

<h3>第三层：90天行动卡</h3>
${result.slice(0,6).map(x=>`□ ${x.title}`).join('<br>')}

<br><button onclick="window.print()">保存/打印</button>
</div>`;
}
