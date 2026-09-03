// 诊断：对比真实 DOM 与抽取出的 IR，找出「页面上看得见但稿子里没有」的内容
// 运行：BASE_URL=http://127.0.0.1:5175 node scripts/figma-export/diag.mjs
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5175';
const OUT_DIR = path.resolve('scripts/figma-export/out');
const TARGETS = [
  { name: 'home', url: '/?newcomer=off' },
  { name: 'points', url: '/points' },
];

const norm = (s) => s.replace(/\s+/g, ' ').trim();

const browser = await chromium.launch();

for (const t of TARGETS) {
  const doc = JSON.parse(await readFile(path.join(OUT_DIR, `${t.name}.json`), 'utf8'));

  // IR 侧：收集所有文本
  const irTexts = [];
  (function walk(n) {
    if (n.type === 'TEXT') irTexts.push(norm(n.text.characters));
    if (n.children) n.children.forEach(walk);
  })(doc.root);

  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(BASE_URL + t.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // DOM 侧：收集所有可见文本叶子 + placeholder + 有背景色的元素
  const dom = await page.evaluate(() => {
    const nm = (s) => s.replace(/\s+/g, ' ').trim();
    const texts = [];
    const placeholders = [];
    const painted = [];
    const all = document.body.querySelectorAll('*');
    for (const el of all) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 && r.height <= 0) continue;
      const tag = el.tagName.toLowerCase();

      if ((tag === 'input' || tag === 'textarea')) {
        if (el.placeholder) placeholders.push({ tag, ph: nm(el.placeholder) });
        if (el.value) placeholders.push({ tag, value: nm(el.value) });
      }
      // 伪元素文本
      for (const pe of ['::before', '::after']) {
        const p = getComputedStyle(el, pe);
        const c = p.content;
        if (c && c !== 'none' && c !== 'normal' && /^["']/.test(c)) {
          const v = nm(c.slice(1, -1));
          if (v) texts.push({ tag: tag + pe, chars: v, src: 'pseudo' });
        }
      }
      // 文本叶子
      let hasEl = false; let hasTxt = false;
      for (const n of el.childNodes) {
        if (n.nodeType === 1) hasEl = true;
        if (n.nodeType === 3 && n.textContent.trim()) hasTxt = true;
      }
      if (hasTxt) {
        // 混排节点比对其「直接裸文本」而非整段 textContent，
        // 因为抽取器现在会把裸文本拆成独立图层
        if (hasEl) {
          for (const n of el.childNodes) {
            if (n.nodeType !== 3) continue;
            const v = nm(n.textContent);
            if (v) texts.push({ tag, chars: v, src: 'mixed', cls: (typeof el.className === 'string' ? el.className : '').slice(0, 60) });
          }
        } else {
          texts.push({
            tag, chars: nm(el.textContent), src: 'leaf',
            cls: (typeof el.className === 'string' ? el.className : '').slice(0, 60),
          });
        }
      }
      // 有自身绘制的元素（用于排查底色丢失）
      const bg = cs.backgroundColor;
      const hasBg = bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
      if (hasBg) {
        painted.push({
          tag, cls: (typeof el.className === 'string' ? el.className : '').slice(0, 50),
          bg, w: Math.round(r.width), h: Math.round(r.height),
          childEls: el.children.length,
        });
      }
    }
    return { texts, placeholders, painted };
  });

  // 差集：DOM 有、IR 没有
  const irSet = new Set(irTexts);
  const missing = dom.texts.filter((d) => d.chars && !irSet.has(d.chars));
  // mixed 型（既有元素子节点又有裸文本）是 isTextLeaf 的已知盲区
  const missingLeaf = missing.filter((m) => m.src === 'leaf');
  const missingMixed = missing.filter((m) => m.src === 'mixed');
  const missingPseudo = missing.filter((m) => m.src === 'pseudo');

  console.log(`\n=========== ${t.name} ===========`);
  console.log(`IR 文本 ${irTexts.length} 条 / DOM 文本节点 ${dom.texts.length} 条`);

  console.log(`\n[A] 纯文本叶子却没进 IR（${missingLeaf.length}）`);
  missingLeaf.slice(0, 20).forEach((m) => console.log(`   <${m.tag}> "${m.chars.slice(0, 40)}"  .${m.cls}`));

  console.log(`\n[B] 混排节点：元素+裸文本，裸文本会被吞掉（${missingMixed.length}）`);
  missingMixed.slice(0, 20).forEach((m) => console.log(`   <${m.tag}> "${m.chars.slice(0, 50)}"  .${m.cls}`));

  console.log(`\n[C] 伪元素文本（IR 完全不支持）（${missingPseudo.length}）`);
  missingPseudo.slice(0, 10).forEach((m) => console.log(`   <${m.tag}> "${m.chars.slice(0, 40)}"`));

  console.log(`\n[D] placeholder / input value（IR 完全不支持）（${dom.placeholders.length}）`);
  dom.placeholders.forEach((p) => console.log(`   <${p.tag}> ${JSON.stringify(p)}`));

  // 底色丢失排查：DOM 里有背景色、且只有 1 个子元素的（压层优化的嫌疑范围）
  console.log(`\n[E] 有背景色的元素共 ${dom.painted.length} 个（抽样）`);
  dom.painted.slice(0, 12).forEach((p) => console.log(`   <${p.tag}>.${p.cls} ${p.bg} ${p.w}x${p.h} 子元素${p.childEls}`));

  await ctx.close();
}

await browser.close();
