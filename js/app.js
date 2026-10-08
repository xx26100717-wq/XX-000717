const families=['单身','恋爱中','已婚无孩','已婚有孩','房贷','子女教育','照顾老人','承担父母养老'];
const fears=['收入下降','失业','健康','家人健康','婚姻风险','子女教育','养老','时间不足','职业停滞','人生迷茫','财富不足'];

document.getElementById('family').innerHTML=families.map(x=>`<label class="option"><input name="family" value="${x}" type="checkbox">${x}</label>`).join('');
document.getElementById('fear').innerHTML=fears.map(x=>`<label class="option"><input name="fear" value="${x}" type="checkbox">${x}</label>`).join('');

async function generate(){
let db=await fetch('data/advice.json').then(r=>r.json());
let tags=[...document.querySelectorAll('input:checked')].map(x=>x.value);
let profile={age:age.value,income:income.value,career:career.value,health:health.value,wealth:wealth.value,tags};

let list=db.map(x=>({...x,score:(x.priority||0)+x.tags.filter(t=>tags.includes(t)).length*25}))
.sort((a,b)=>b.score-a.score).slice(0,10);

document.getElementById('result').innerHTML=`
<div class="card">
<h2>你的个人画像</h2>
<p>${profile.age}｜${profile.income}｜${profile.career}</p>
<h2>第一层：章节路线</h2>
${[...new Set(list.map(x=>x.chapter))].map(c=>`<div class="item"><b>${c}</b><br>为什么推荐：结合你的年龄、家庭责任、风险和资源状态。</div>`).join('')}

<h2>第二层：Top 10建议</h2>
${list.map((x,i)=>`<div class="item"><b>${i+1}. ${x.title}</b><p>为什么推荐：${x.reason}</p><p>成本：${x.cost}｜收益：${x.benefit}｜证据等级：${x.evidence}</p></div>`).join('')}

<h2>第三层：90天行动卡</h2>
${list.slice(0,6).map(x=>'□ '+x.title).join('<br>')}
</div>`;
}
