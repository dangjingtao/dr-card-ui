// Figma 转换可行性评估 —— 两屏样本截图
// 用途：给用户看画面质量，同时复采样式统计数据
// 运行：BASE_URL=http://127.0.0.1:5174 node scripts/capture-figma-probe.mjs

import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5174';
const OUT_DIR = path.resolve('docs/design/figma-probe');

// 两屏样本：首页为基线（newcomer=off 避免新人弹窗遮挡），泡泡页为样式压力测试
const TARGETS = [
  { name: 'home', url: '/?newcomer=off', label: '首页（基线）' },
  { name: 'points', url: '/points', label: '泡泡值页（压力）' },
];

// 页面内采样：收集所有计算样式中的颜色/渐变/阴影/圆角/字号，并与 :root Token 比对
function collectStyleStats() {
  const nodes = document.querySelectorAll('*');
  const colors = new Set();
  const gradients = new Set();
  const shadows = new Set();
  const radii = new Set();
  const fonts = new Set();
  let maxDepth = 0;

  for (const el of nodes) {
    const cs = getComputedStyle(el);
    for (const prop of ['backgroundColor', 'color', 'borderTopColor']) {
      const v = cs[prop];
      if (v && v !== 'rgba(0, 0, 0, 0)' && v !== 'transparent') colors.add(v);
    }
    if (cs.backgroundImage && cs.backgroundImage !== 'none') gradients.add(cs.backgroundImage);
    if (cs.boxShadow && cs.boxShadow !== 'none') shadows.add(cs.boxShadow);
    if (cs.borderRadius && cs.borderRadius !== '0px') radii.add(cs.borderRadius);
    if (cs.fontSize) fonts.add(`${cs.fontSize}/${cs.fontWeight}`);

    let d = 0;
    let p = el;
    while (p.parentElement) { d += 1; p = p.parentElement; }
    if (d > maxDepth) maxDepth = d;
  }

  // 抽取 :root 上的全部自定义属性作为 Token 字典
  const tokenMap = {};
  for (const sheet of Array.from(document.styleSheets)) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    if (!rules) continue;
    for (const rule of Array.from(rules)) {
      if (!rule.style || !rule.selectorText) continue;
      if (!/:root|^html$/.test(rule.selectorText)) continue;
      for (const prop of Array.from(rule.style)) {
        if (prop.startsWith('--')) tokenMap[prop] = rule.style.getPropertyValue(prop).trim();
      }
    }
  }

  return {
    domNodes: nodes.length,
    maxDepth,
    colors: [...colors],
    gradients: [...gradients],
    shadows: [...shadows],
    radii: [...radii],
    fonts: [...fonts],
    tokenMap,
    images: document.querySelectorAll('img').length,
    inlineSvg: document.querySelectorAll('svg').length,
  };
}

// 颜色归一化：hex -> "r,g,b"；rgb/rgba -> 取 rgb 主体
function normalize(input) {
  const s = String(input).trim();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',');
  }
  const m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (m) return [m[1], m[2], m[3]].map((n) => Math.round(Number(n))).join(',');
  return null;
}

const browser = await chromium.launch();
await mkdir(OUT_DIR, { recursive: true });
const report = {};

for (const t of TARGETS) {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 3, // 参照稿需要 3x，方便开发放大看细节
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(BASE_URL + t.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200); // 等字体与首屏动画落定

  await page.screenshot({ path: path.join(OUT_DIR, `${t.name}-viewport.png`) });
  await page.screenshot({ path: path.join(OUT_DIR, `${t.name}-full.png`), fullPage: true });

  const raw = await page.evaluate(collectStyleStats);
  const tokenValues = new Set(
    Object.values(raw.tokenMap).map(normalize).filter(Boolean)
  );
  const hit = [];
  const bare = [];
  for (const c of raw.colors) {
    const n = normalize(c);
    if (n && tokenValues.has(n)) hit.push(c); else bare.push(c);
  }

  report[t.name] = {
    label: t.label,
    url: t.url,
    domNodes: raw.domNodes,
    maxDepth: raw.maxDepth,
    colorTotal: raw.colors.length,
    tokenHit: hit.length,
    tokenHitRate: `${Math.round((hit.length / raw.colors.length) * 100)}%`,
    bareValues: bare,
    gradients: raw.gradients.length,
    gradientSamples: raw.gradients.slice(0, 8),
    shadows: raw.shadows.length,
    radii: raw.radii.length,
    fontCombos: raw.fonts.length,
    images: raw.images,
    inlineSvg: raw.inlineSvg,
  };

  console.log(`[done] ${t.label}  Token 覆盖 ${report[t.name].tokenHitRate}  裸值 ${bare.length}`);
  await ctx.close();
}

await writeFile(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
await browser.close();
console.log(`\n输出目录：${OUT_DIR}`);
