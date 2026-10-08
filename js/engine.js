(function (root) {
  'use strict';
  const weights = { age: 4, income: 5, family: 12, career: 10, concern: 16, health: 12, wealth: 7, time: 2 };
  const labels = { age: '年龄', income: '收入', family: '家庭', career: '职业', concern: '关注', health: '健康', wealth: '财务', time: '时间' };
  const gates = {
    11: p => p.career === '技术工作者',
    12: p => ['创业者','自由职业'].includes(p.career),
    16: p => p.health === '慢性问题',
    17: p => p.family.some(x => ['照顾老人','承担父母养老'].includes(x)) || p.age === '56岁以上' || p.concern.includes('养老'),
    18: p => p.family.some(x => ['已婚有孩','养育婴幼儿','备孕 / 怀孕'].includes(x)),
    20: p => p.family.includes('养育婴幼儿') || p.concern.includes('孕产育儿'),
    21: p => p.concern.includes('留学 / 出行'),
    25: p => p.concern.includes('重大变故'),
    26: p => ['技术工作者','创业者'].includes(p.career),
    27: p => p.family.includes('备孕 / 怀孕') || p.concern.includes('孕产育儿'),
    30: p => p.family.includes('子女教育') || p.concern.includes('子女教育'),
    32: p => p.concern.includes('留学 / 出行'),
    33: p => p.health === '残疾 / 康复期' || p.concern.includes('照护与康复'),
  };
  function scoreItem(item, profile) {
    let score = 0;
    const reasons = [];
    for (const [key, weight] of Object.entries(weights)) {
      const values = Array.isArray(profile[key]) ? profile[key] : [profile[key]];
      const matches = values.filter(value => item.tags[key].includes(value));
      if (matches.length) {
        score += weight * Math.min(matches.length, 2);
        reasons.push(`${labels[key]}：${matches.join('、')}`);
      }
    }
    // Keep specialized life situations out of a generic profile's action plan.
    if (gates[item.chapter] && !gates[item.chapter](profile)) score -= 90;
    score += ({ A: 3, B: 2, C: 1 }[item.evidence.trim()[0]] || 0);
    if (item.costTags['钱'] === '0') score += 1;
    if (item.costTags['收益'] === '大') score += 1;
    if (['没有积蓄','有负债'].includes(profile.wealth) && item.costTags['钱'] === '多') score -= 8;
    if (profile.time === '30分钟以内' && item.costTags['时间'] === '多') score -= 8;
    return { ...item, score, reasons: reasons.length ? reasons : ['通用生活防护；结合原文条件自行判断是否适用'] };
  }
  function recommend(data, profile) {
    const scored = data.items.map(item => scoreItem(item, profile));
    const compare = (a,b) => b.score-a.score || a.chapter-b.chapter || a.section-b.section;
    const ranked = data.chapters.map(chapter => {
      const items = scored.filter(item => item.chapter === chapter.id).sort(compare);
      const sample = items.slice(0, Math.min(3,items.length));
      return { ...chapter, score: sample.reduce((sum,x) => sum+x.score,0)/sample.length,
        reasons: [...new Set(sample.flatMap(item => item.reasons))].slice(0,4), items };
    }).sort((a,b) => b.score-a.score || a.id-b.id);
    const priority = ranked.slice(0,5);
    const backup = ranked.slice(5,10);
    // Two per chapter gives ten unique recommendations from five distinct chapters.
    const pick = chapters => chapters.flatMap(chapter => chapter.items.slice(0,2)).sort(compare);
    const primaryItems = pick(priority), backupItems = pick(backup);
    const first = priority.slice(0,3).flatMap(chapter => chapter.items.slice(0,2));
    return { profile, priority, backup, primaryItems, backupItems, first, createdAt: new Date().toISOString() };
  }
  root.LiveBetterEngine = { recommend, scoreItem };
  if (typeof module !== 'undefined') module.exports = root.LiveBetterEngine;
})(typeof window === 'undefined' ? globalThis : window);
