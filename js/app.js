(() => {
  'use strict';
  const data = window.LIVEBETTER_DATA;
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const chapters = new Map(data.chapters.map(chapter => [chapter.id, chapter]));
  const byId = new Map(data.items.map(item => [item.id, item]));
  const options = {
    age: ['18-25岁','26-35岁','36-45岁','46-55岁','56岁以上'],
    income: ['5000以下','5000-15000','15000-30000','30000-50000','50000以上'],
    career: ['学生','普通职员','专业人士','技术工作者','管理者','创业者','自由职业','待业 / 求职','退休'],
    health: ['很好','偶尔疲劳','长期压力大','睡眠问题','慢性问题','残疾 / 康复期'],
    wealth: ['没有积蓄','3-6个月储备','有资产','有投资经验','财务自由目标','有负债'],
    time: ['30分钟以内','1-3小时','3-5小时','5小时以上'],
    family: ['单身','恋爱中','已婚无孩','已婚有孩','房贷','租房','子女教育','养育婴幼儿','备孕 / 怀孕','照顾老人','承担父母养老'],
    concern: ['收入下降','失业','健康','家人健康','婚姻风险','子女教育','养老','时间不足','职业停滞','人生迷茫','财富不足','心理压力','人身安全','法律风险','信息安全','住房压力','照护与康复','孕产育儿','留学 / 出行','重大变故'],
  };
  const labels = { age:'年龄阶段', income:'月收入（人民币）', career:'职业状态', health:'健康状态', wealth:'财富状态', time:'每周可投入时间' };
  let report = null, page = 1, filtered = [], view = 'profile';
  const progressKey = 'livebetter-action-progress-v1';
  let progress = {};
  try { progress = JSON.parse(localStorage.getItem(progressKey) || '{}'); if (!progress || typeof progress !== 'object' || Array.isArray(progress)) progress = {}; } catch { progress = {}; }
  function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => $('#toast').classList.remove('show'), 3500); }
  function selectField(key) { return `<label for="${key}">${labels[key]}<select id="${key}" name="${key}" required><option value="" selected disabled>请选择</option>${options[key].map(value=>`<option>${esc(value)}</option>`).join('')}</select></label>`; }
  $('#basic-fields').innerHTML = ['age','income','career'].map(selectField).join('');
  $('#resource-fields').innerHTML = ['health','wealth','time'].map(selectField).join('');
  for (const key of ['family','concern']) $(`#${key}-options`).innerHTML = options[key].map((value,i) => `<label class="chip" for="${key}-${i}"><input id="${key}-${i}" type="checkbox" name="${key}" value="${esc(value)}"><span>${esc(value)}</span></label>`).join('');
  $('#concern-options').addEventListener('change', event => {
    const count = document.querySelectorAll('[name="concern"]:checked').length;
    if (count > 3) { event.target.checked = false; $('#concern-feedback').textContent = '最多选择 3 项，请先取消一项再选择。'; }
    else $('#concern-feedback').textContent = count ? `已选择 ${count} / 3 项` : '';
  });
  function navigate(next, scroll = true) {
    view = ['profile','report','library'].includes(next) ? next : 'profile';
    document.querySelectorAll('.view').forEach(section => section.hidden = section.id !== `view-${view}`);
    document.querySelectorAll('[data-view]').forEach(button => { button.classList.toggle('active', button.dataset.view === view); if (button.dataset.view === view) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current'); });
    if (view === 'report' && !report) $('#report-content').innerHTML = '<div class="empty panel"><h1>先从认识自己开始。</h1><p>填写个人画像后，这里会生成你的阅读路线与行动卡。</p><button class="button primary" data-view="profile">填写个人画像 ↗</button></div>';
    if (scroll) window.scrollTo({ top:0, behavior:'instant' });
  }
  document.addEventListener('click', event => {
    const nav = event.target.closest('[data-view]');
    if (nav) { event.preventDefault(); navigate(nav.dataset.view); return; }
    const read = event.target.closest('[data-read]');
    if (read) { openReader(read.dataset.read); return; }
    const chapter = event.target.closest('[data-chapter]');
    if (chapter) { $('#chapter-filter').value = chapter.dataset.chapter; $('#search').value = ''; $('#evidence-filter').value = ''; filterLibrary(); navigate('library'); return; }
    const paging = event.target.closest('[data-page]');
    if (paging) { page = Number(paging.dataset.page); renderLibrary(); $('#library-list').scrollIntoView({block:'start'}); }
  });
  $('.brand').addEventListener('click', event => { event.preventDefault(); navigate('profile'); });
  $('#profile-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(event.target);
    const profile = Object.fromEntries(Object.keys(labels).map(key => [key, form.get(key)]));
    profile.family = form.getAll('family'); profile.concern = form.getAll('concern');
    report = window.LiveBetterEngine.recommend(data, profile);
    renderReport(); navigate('report');
  });
  function location(item) { return `第 ${item.chapter} 章 · 第 ${item.section} 节`; }
  function evidence(item) { return `<span class="evidence evidence-${esc(item.evidence.trim()[0])}">证据 ${esc(item.evidence)}</span>`; }
  function card(item, index, withReason = true) {
    return `<article class="advice-card"><div class="card-meta"><span>${location(item)}${index === undefined ? '' : ` · ${String(index+1).padStart(2,'0')}`}</span>${evidence(item)}</div><h3>${esc(item.title)}</h3><p class="summary">${esc(item.summary)}</p>${withReason ? `<p class="reason"><b>为什么推荐</b> ${esc(item.reasons.join('；'))}</p>` : ''}<dl class="cost-benefit"><div><dt>成本</dt><dd>${esc(item.cost)}</dd></div><div><dt>收益</dt><dd>${esc(item.benefit)}</dd></div></dl><button class="text-button" data-read="${esc(item.id)}">阅读完整原文与出处 <span aria-hidden="true">↗</span></button></article>`;
  }
  function chapterCard(chapter, index) { return `<button class="chapter-card" data-chapter="${chapter.id}"><span class="chapter-number">${String(index+1).padStart(2,'0')}</span><div><span class="mini-label">第 ${chapter.id} 章 · ${chapter.count} 条</span><h3>${esc(chapter.title)}</h3><p>${esc(chapter.reasons.join('；'))}</p></div><span aria-hidden="true">↗</span></button>`; }
  function profileSummary(profile) { return [profile.age, `月收入 ${profile.income}`, profile.career, profile.health, profile.wealth, `每周 ${profile.time}`, ...profile.family, ...profile.concern]; }
  function renderReport() {
    const p = report.profile;
    $('#report-content').innerHTML = `<div class="page-heading report-heading"><div><span class="eyebrow">YOUR PERSONAL LIFE GUIDE</span><h1>把注意力，放回值得的事。</h1><p>这是一份阅读起点。你可以选择，也可以暂时放下。</p></div><div class="report-actions"><button class="button secondary" data-view="profile">调整画像</button><button class="button secondary" id="export-report">下载报告</button><button class="button primary" id="print-report">打印 / 保存 PDF</button></div></div>
      <section class="panel profile-card"><span class="eyebrow">你的个人画像</span><div class="profile-tags">${profileSummary(p).map(value=>`<span>${esc(value)}</span>`).join('')}</div><p>关注：${esc(p.concern.length ? p.concern.join('、') : '未选择特别担忧，优先通用建议')}。推荐由公开规则匹配，具体建议仍需核对原文适用条件。</p></section>
      <section class="report-section"><div class="section-heading"><span class="step">01</span><div><h2>你的章节路线</h2><p>先读与你当下更相关的，再为未来留一点准备。</p></div></div><div class="chapter-columns"><div><h3 class="column-title">优先阅读 <span>5 个章节</span></h3>${report.priority.map(chapterCard).join('')}</div><div><h3 class="column-title">后备阅读 <span>5 个章节</span></h3>${report.backup.map(chapterCard).join('')}</div></div></section>
      <section class="report-section"><div class="section-heading"><span class="step">02</span><div><h2>20 条值得了解的建议</h2><p>优先章节 10 条 + 后备章节 10 条；成本、收益与证据保留原作者表述。</p></div></div><h3 class="group-title">先看这些 <span>优先 10 条</span></h3><div class="advice-grid primary-advice">${report.primaryItems.map((item,i)=>card(item,i)).join('')}</div><h3 class="group-title">留作下一步 <span>后备 10 条</span></h3><div class="advice-grid backup-advice">${report.backupItems.map((item,i)=>card(item,i+10)).join('')}</div></section>
      <section class="report-section"><div class="section-heading"><span class="step">03</span><div><h2>你的 30 天行动卡</h2><p>不必做满。先读清楚、确认适用，再选择一件能开始的事。</p></div></div>
      <div class="panel start-three"><span class="eyebrow">最值得先看的 3 个章节</span><div>${report.priority.slice(0,3).map((chapter,i)=>`<button data-chapter="${chapter.id}"><span>${i+1}</span>第 ${chapter.id} 章 · ${esc(chapter.title)} ↗</button>`).join('')}</div></div>
      <div class="action-layout"><div class="panel"><div class="list-heading"><h3>第一批 6 条建议</h3><span id="progress-label"></span></div><div class="progress-track"><div id="progress-fill"></div></div><p class="muted">勾选表示已阅读并确认下一步，不表示已完成治疗或达到效果。</p>${report.first.map((item,i)=>`<div class="action-item"><label><input type="checkbox" data-progress="${item.id}" ${progress[item.id] ? 'checked' : ''}><span><small>${location(item)}</small><b>${i+1}. ${esc(item.title)}</b></span></label><button class="text-button" data-read="${item.id}">原文 ↗</button></div>`).join('')}<button class="text-button clear-progress" id="clear-progress">清除本机所有行动进度</button></div><div class="panel timeline"><h3>把 30 天拆成四小步</h3><div><span>第 1—3 天</span><h4>只读，不急着改变</h4><p>读完上面的 3 个章节，标记与自己有关的适用条件。记录一件最想改善的事。</p></div><div><span>第 4—10 天</span><h4>从六条中挑一条</h4><p>按你的每周时间（${esc(p.time)}），选一个负担小的起点。涉及诊疗、药物或法律事务，先问清专业意见。</p></div><div><span>第 11—20 天</span><h4>让下一步具体一点</h4><p>继续完成选定事项，记录花了多少时间与金钱；遇到不适用的条件就换一条，不强求。</p></div><div><span>第 21—30 天</span><h4>复盘，再做一次选择</h4><p>看哪件事真正帮到了你。保留一项能持续的行动，必要时调整画像，生成下一轮指南。</p></div></div></div></section>`;
    $('#print-report').addEventListener('click', () => window.print());
    $('#export-report').addEventListener('click', exportReport);
    $('#clear-progress').addEventListener('click', () => { progress = {}; saveProgress(); renderReport(); toast('本机行动进度已清除'); });
    document.querySelectorAll('[data-progress]').forEach(input => input.addEventListener('change', () => { if (input.checked) progress[input.dataset.progress] = true; else delete progress[input.dataset.progress]; saveProgress(); updateProgress(); }));
    updateProgress();
  }
  function saveProgress() { try { localStorage.setItem(progressKey, JSON.stringify(progress)); } catch { toast('浏览器不允许本地存储，进度仅在本次页面中保留'); } }
  function updateProgress() { const count = report.first.filter(item=>progress[item.id]).length; $('#progress-label').textContent = `${count} / 6 已阅读`; $('#progress-fill').style.width = `${count/6*100}%`; }
  function exportReport() {
    const lines = ['# LiveBetter · 我的人生指南', '', ...profileSummary(report.profile).map(x=>`- ${x}`), '', '## 1. 章节路线'];
    for (const [title, list] of [['优先章节',report.priority],['后备章节',report.backup]]) { lines.push(`### ${title}`); for (const chapter of list) lines.push(`- 第 ${chapter.id} 章 ${chapter.title}：${chapter.reasons.join('；')}`); }
    lines.push('', '## 2. TOP20');
    for (const [i,item] of [...report.primaryItems,...report.backupItems].entries()) lines.push(`### ${i+1}. ${item.title}`,location(item),'',`推荐理由：${item.reasons.join('；')}`,`摘要：${item.summary}`,`成本：${item.cost}`,`收益：${item.benefit}`,`证据：${item.evidence}`,`来源：${item.sources}`,`备注：${item.notes}`,'');
    lines.push('## 3. 30天行动卡','先读：'+report.priority.slice(0,3).map(c=>`第${c.id}章 ${c.title}`).join('；'),'');
    report.first.forEach(item=>lines.push(`- [${progress[item.id] ? 'x' : ' '}] ${location(item)} ${item.title}`));
    lines.push('', '第1—3天：阅读3章，核对适用条件。','第4—10天：挑选1项，必要时咨询专业人士。','第11—20天：记录成本与进展，不适用就调整。','第21—30天：复盘，选下一步。','','内容：eternity4719 / HowToLiveBetter《高性价比人生指南》，CC BY 4.0。','https://github.com/eternity4719/HowToLiveBetter','https://creativecommons.org/licenses/by/4.0/','原文快照：2026-10-05；标签、推荐与行动卡为本工具新增。','推荐不构成诊断、专业法律意见或收益承诺。');
    const url = URL.createObjectURL(new Blob([lines.join('\n')], {type:'text/markdown;charset=utf-8'}));
    const a = document.createElement('a'); a.href = url; a.download = 'LiveBetter-我的人生指南.md'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  // Render source as text, never execute source HTML. External links accept http(s) only.
  function sourceText(text) {
    const pieces = String(text).split(/(https?:\/\/[^\s<>"）)\]】]+[^\s<>"）)\]】。，；：])/g);
    return pieces.map((piece,i)=>i%2 ? `<a href="${esc(piece)}" target="_blank" rel="noopener noreferrer">${esc(piece)}</a>` : esc(piece)).join('');
  }
  function openReader(id) {
    const item = byId.get(id); if (!item) return;
    $('#reader-content').innerHTML = `<p class="eyebrow">${location(item)}（原文第 ${item.section} 条）</p><h2>${esc(item.title)}</h2><p>${esc(chapters.get(item.chapter).title)} · ${evidence(item)}</p><p class="reader-intro">${esc(item.summary)}</p>${[['成本',item.cost],['收益',item.benefit],['来源',item.sources],['备注与适用条件',item.notes]].map(([label,value])=>`<section><h3>${label}</h3><div class="source-text">${sourceText(value)}</div></section>`).join('')}<p class="reader-attribution">原文：eternity4719 / HowToLiveBetter · CC BY 4.0 · 2026-10-05 快照。<a href="${esc(chapters.get(item.chapter).source)}" target="_blank" rel="noopener">查看整章 Markdown</a></p><details><summary>查看本条结构化画像标签</summary><pre>${esc(JSON.stringify(item.tags,null,2))}</pre><p>以上为本工具新增的主题匹配标签，空数组表示未限定该维度。</p></details>`;
    $('#reader').showModal(); $('#reader').scrollTop = 0;
  }
  $('#close-reader').addEventListener('click',()=>$('#reader').close());
  $('#reader').addEventListener('click', event=>{ if (event.target === $('#reader')) { const r=$('#reader').getBoundingClientRect(); if (event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) $('#reader').close(); } });
  $('#chapter-filter').innerHTML += data.chapters.map(chapter=>`<option value="${chapter.id}">第 ${chapter.id} 章 · ${esc(chapter.title)}（${chapter.count}条）</option>`).join('');
  function filterLibrary() {
    page = 1; const query = $('#search').value.trim().toLowerCase(), chapter = $('#chapter-filter').value, evidence = $('#evidence-filter').value;
    filtered = data.items.filter(item => (!chapter || item.chapter === Number(chapter)) && (!evidence || item.evidence.trim()[0]===evidence) && (!query || [item.title,item.summary,item.cost,item.benefit,item.sources,item.notes].join(' ').toLowerCase().includes(query)));
    $('#chapter-context').innerHTML = chapter ? `<div class="panel chapter-intro"><h2>第 ${chapter} 章 · ${esc(chapters.get(Number(chapter)).title)}</h2><p>${esc(chapters.get(Number(chapter)).intro)}</p><a href="${esc(chapters.get(Number(chapter)).source)}" target="_blank" rel="noopener">下载 / 查看整章原文 ↗</a></div>` : '';
    renderLibrary();
  }
  function renderLibrary() {
    const pages = Math.ceil(filtered.length/12); $('#search-count').textContent = `找到 ${filtered.length} 条建议${pages ? ` · 第 ${page} / ${pages} 页` : ''}`;
    $('#library-list').innerHTML = filtered.length ? filtered.slice((page-1)*12,page*12).map(item=>card(item,undefined,false)).join('') : '<div class="empty panel"><h3>暂时没有匹配内容</h3><p>试试更短的关键词，或重置章节与证据筛选。</p></div>';
    $('#pagination').innerHTML = pages ? `<button class="button secondary" data-page="${page-1}" ${page===1 ? 'disabled' : ''}>上一页</button><span>${page} / ${pages}</span><button class="button secondary" data-page="${page+1}" ${page===pages ? 'disabled' : ''}>下一页</button>` : '';
  }
  $('#search').addEventListener('input',filterLibrary); $('#chapter-filter').addEventListener('change',filterLibrary); $('#evidence-filter').addEventListener('change',filterLibrary);
  $('#clear-filters').addEventListener('click',()=>{ $('#search').value=''; $('#chapter-filter').value=''; $('#evidence-filter').value=''; filterLibrary(); });
  filterLibrary(); navigate('profile',false);
})();
