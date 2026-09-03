// React 页面 → Figma IR 抽取器
//
// 为什么不用截图：外部原生端（iOS/Android/小程序）需要在稿子里量间距、取色、复制文案，
// 位图做不到。这里从跑着的真实 DOM 里抽出结构化图层树，交给 Figma 插件重建为真节点。
//
// 运行：BASE_URL=http://127.0.0.1:5174 node scripts/figma-export/extract.mjs
// 产物：scripts/figma-export/out/<name>.json

import { chromium } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5174';
const OUT_DIR = path.resolve('scripts/figma-export/out');

const TARGETS = [
  { name: 'home', url: '/?newcomer=off' },
  { name: 'points', url: '/points' },
];

// ---------------------------------------------------------------------------
// 以下函数整体注入浏览器执行，不能引用 Node 作用域的任何变量
// ---------------------------------------------------------------------------
function extractIR() {
  const EPS = 0.01;
  const warnings = [];
  let seq = 0;

  const round = (n) => Math.round(n * 100) / 100;

  // rgb/rgba 字符串 → { hex, opacity }
  // allowTransparent=true 时，透明色不再丢弃，而是返回 alpha=0 的占位（渐变色标需要它来正确淡出）
  function parseColor(input, allowTransparent) {
    if (!input) return null;
    const s = String(input).trim();
    if (s === 'transparent' || s === 'none') {
      return allowTransparent ? { hex: null, opacity: 0 } : null;
    }
    const m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.%]+))?/i);
    if (!m) return null;
    const [r, g, b] = [m[1], m[2], m[3]].map((v) => Math.max(0, Math.min(255, Math.round(Number(v)))));
    let a = 1;
    if (m[4] != null) a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : Number(m[4]);
    const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    if (!(a > 0)) {
      // 全透明：作为 fill 无意义直接丢弃；作为渐变色标要保留，且保留其 RGB 以免淡出时串色
      return allowTransparent ? { hex, opacity: 0 } : null;
    }
    return { hex, opacity: round(a) };
  }

  // 从渐变参数串里按顶层逗号切分（括号内的逗号不算分隔符）
  function splitTop(str) {
    const parts = [];
    let depth = 0;
    let cur = '';
    for (const ch of str) {
      if (ch === '(') depth += 1;
      if (ch === ')') depth -= 1;
      if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    if (cur.trim()) parts.push(cur.trim());
    return parts;
  }

  // 解析色标列表；缺省位置按等距补齐，这是 CSS 的默认行为
  function parseStops(items) {
    const raw = items.map((item) => {
      const posMatch = item.match(/\s(-?[\d.]+)%\s*$/);
      let pos = null;
      let colorPart = item;
      if (posMatch) {
        pos = Number(posMatch[1]) / 100;
        colorPart = item.slice(0, posMatch.index).trim();
      }
      const c = parseColor(colorPart, true);
      return c ? { pos, hex: c.hex, opacity: c.opacity } : null;
    }).filter(Boolean);

    if (!raw.length) return null;
    // CSS 用预乘 alpha 插值，transparent 会继承邻近色相；Figma 是非预乘，
    // 若照搬 computed 出来的 rgba(0,0,0,0) 会朝黑色淡出，边缘发脏。这里补回色相。
    for (let i = 0; i < raw.length; i += 1) {
      const needHue = !raw[i].hex || (raw[i].opacity === 0 && raw[i].hex === '#000000');
      if (!needHue) continue;
      let donor = null;
      for (let k = i - 1; k >= 0 && !donor; k -= 1) if (raw[k].opacity > 0) donor = raw[k].hex;
      for (let k = i + 1; k < raw.length && !donor; k += 1) if (raw[k].opacity > 0) donor = raw[k].hex;
      raw[i].hex = donor || '#FFFFFF';
    }
    if (raw[0].pos == null) raw[0].pos = 0;
    if (raw[raw.length - 1].pos == null) raw[raw.length - 1].pos = 1;
    // 中间未标位置的，在两个已知锚点之间线性插值
    for (let i = 1; i < raw.length - 1; i += 1) {
      if (raw[i].pos != null) continue;
      let next = i;
      while (next < raw.length && raw[next].pos == null) next += 1;
      const span = next - (i - 1);
      for (let k = i; k < next; k += 1) {
        raw[k].pos = raw[i - 1].pos + ((raw[next].pos - raw[i - 1].pos) * (k - (i - 1))) / span;
      }
    }
    return raw.map((s) => ({ pos: round(Math.max(0, Math.min(1, s.pos))), hex: s.hex, opacity: s.opacity }));
  }

  // CSS 的 `to bottom` 等关键字方向 → 角度
  const SIDE_ANGLE = {
    'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270,
    'to top right': 45, 'to right top': 45,
    'to bottom right': 135, 'to right bottom': 135,
    'to bottom left': 225, 'to left bottom': 225,
    'to top left': 315, 'to left top': 315,
  };

  function parseLinear(body) {
    const parts = splitTop(body);
    let angle = 180; // CSS 默认自上而下
    if (parts.length && /^(to\s|[-\d.]+deg|[-\d.]+turn|[-\d.]+rad)/i.test(parts[0])) {
      const head = parts.shift().trim().toLowerCase();
      if (head.startsWith('to ')) angle = SIDE_ANGLE[head] ?? 180;
      else if (head.endsWith('turn')) angle = parseFloat(head) * 360;
      else if (head.endsWith('rad')) angle = (parseFloat(head) * 180) / Math.PI;
      else angle = parseFloat(head);
    }
    const stops = parseStops(parts);
    if (!stops) return null;
    return { type: 'GRADIENT_LINEAR', angle: round(((angle % 360) + 360) % 360), stops };
  }

  // 径向渐变只取圆心与半径的归一化近似；CSS 的 farthest-corner 等关键字按包围盒估算
  function parseRadial(body, w, h) {
    const parts = splitTop(body);
    let cx = 0.5; let cy = 0.5; let rx = 0.5; let ry = 0.5;
    if (parts.length && /(circle|ellipse|at\s|closest|farthest|^\s*[\d.]+(px|%))/i.test(parts[0])) {
      const head = parts.shift().trim();
      const atIdx = head.toLowerCase().indexOf(' at ');
      const shapePart = atIdx >= 0 ? head.slice(0, atIdx) : head;
      const posPart = atIdx >= 0 ? head.slice(atIdx + 4) : '';

      if (posPart) {
        const pos = posPart.trim().split(/\s+/);
        const toRatio = (v, total, kw) => {
          if (kw[v] != null) return kw[v];
          if (v.endsWith('%')) return parseFloat(v) / 100;
          if (v.endsWith('px')) return total ? parseFloat(v) / total : 0.5;
          return 0.5;
        };
        cx = toRatio(pos[0] || '50%', w, { left: 0, center: 0.5, right: 1 });
        cy = toRatio(pos[1] || '50%', h, { top: 0, center: 0.5, bottom: 1 });
      }

      // 显式尺寸形如 `90% 34%`
      const sizeTokens = shapePart.replace(/circle|ellipse/gi, '').trim().split(/\s+/).filter(Boolean);
      if (sizeTokens.length) {
        const toR = (v, total) => {
          if (v.endsWith('%')) return parseFloat(v) / 100;
          if (v.endsWith('px')) return total ? parseFloat(v) / total : 0.5;
          return 0.5;
        };
        rx = toR(sizeTokens[0], w);
        ry = toR(sizeTokens[1] || sizeTokens[0], h);
      } else if (/farthest-corner|farthest-side/i.test(shapePart) || !sizeTokens.length) {
        // 默认 farthest-corner：半径取到最远角
        rx = Math.max(cx, 1 - cx) * 1.414;
        ry = Math.max(cy, 1 - cy) * 1.414;
      }
    } else {
      rx = 0.707; ry = 0.707;
    }
    const stops = parseStops(parts);
    if (!stops) return null;
    return {
      type: 'GRADIENT_RADIAL',
      cx: round(cx), cy: round(cy),
      rx: round(Math.max(rx, 0.01)), ry: round(Math.max(ry, 0.01)),
      stops,
    };
  }

  // backgroundImage 可能是多层逗号并列，CSS 中先写的在上层，Figma fills 先给的在下层，所以要反转
  function parseBackgroundImage(bg, w, h) {
    if (!bg || bg === 'none') return [];
    const layers = splitTop(bg);
    const out = [];
    for (const layer of layers) {
      const lin = layer.match(/^(?:repeating-)?linear-gradient\((.*)\)$/is);
      if (lin) { const p = parseLinear(lin[1]); if (p) out.push(p); continue; }
      const rad = layer.match(/^(?:repeating-)?radial-gradient\((.*)\)$/is);
      if (rad) { const p = parseRadial(rad[1], w, h); if (p) out.push(p); continue; }
      if (/^url\(/i.test(layer)) continue; // 背景图单独走 IMAGE 节点
      warnings.push('未识别的背景层: ' + layer.slice(0, 80));
    }
    return out.reverse();
  }

  // box-shadow 可能多条并列
  function parseShadows(bs) {
    if (!bs || bs === 'none') return [];
    return splitTop(bs).map((one) => {
      const inset = /\binset\b/i.test(one);
      const c = parseColor(one);
      const nums = (one.match(/-?[\d.]+px/g) || []).map(parseFloat);
      if (nums.length < 2) return null;
      return {
        type: inset ? 'INNER_SHADOW' : 'DROP_SHADOW',
        hex: c ? c.hex : '#000000',
        opacity: c ? c.opacity : 0.15,
        x: round(nums[0]), y: round(nums[1]),
        blur: round(nums[2] || 0), spread: round(nums[3] || 0),
      };
    }).filter(Boolean);
  }

  function radiusTuple(cs, w, h) {
    const toPx = (v) => {
      if (!v) return 0;
      const f = parseFloat(v);
      if (Number.isNaN(f)) return 0;
      // 百分比圆角按短边折算，Figma 只接受绝对值
      return v.includes('%') ? (Math.min(w, h) * f) / 100 : f;
    };
    const t = [
      toPx(cs.borderTopLeftRadius), toPx(cs.borderTopRightRadius),
      toPx(cs.borderBottomRightRadius), toPx(cs.borderBottomLeftRadius),
    ].map(round);
    return t.some((v) => v > 0) ? t : null;
  }

  const WEIGHT_STEPS = [300, 400, 500, 600, 700, 800, 900];
  function normWeight(w) {
    const n = Number(w) || 400;
    return WEIGHT_STEPS.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));
  }

  const ALIGN = { start: 'LEFT', left: 'LEFT', center: 'CENTER', right: 'RIGHT', end: 'RIGHT', justify: 'JUSTIFIED' };

  // 元素是否只包含文本（没有元素子节点），这类直接产出 TEXT 节点
  function isTextLeaf(el) {
    if (!el.childNodes.length) return false;
    let hasText = false;
    for (const n of el.childNodes) {
      if (n.nodeType === 1) return false;
      if (n.nodeType === 3 && n.textContent.trim()) hasText = true;
    }
    return hasText;
  }

  // 把一段样式抽成 TEXT 节点的 text 字段，元素文本与裸文本共用
  function textStyle(cs, chars) {
    const color = parseColor(cs.color) || { hex: '#000000', opacity: 1 };
    const lh = cs.lineHeight === 'normal'
      ? round(parseFloat(cs.fontSize) * 1.4)
      : round(parseFloat(cs.lineHeight));
    return {
      characters: chars,
      family: 'Inter',
      size: round(parseFloat(cs.fontSize)),
      weight: normWeight(cs.fontWeight),
      lineHeight: lh,
      letterSpacing: cs.letterSpacing === 'normal' ? 0 : round(parseFloat(cs.letterSpacing)),
      hex: color.hex,
      opacity: color.opacity,
      align: ALIGN[cs.textAlign] || 'LEFT',
      // 含中日韩字符时插件切到中文字体，否则 Inter 会渲染成豆腐块
      cjk: /[\u3400-\u9FFF\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF]/.test(chars),
    };
  }

  // 混排节点（如「图标 + 文字」）里夹着的裸文本，用 Range 量出真实位置单独成层。
  // 不这样做的话 FRAME 只会遍历元素子节点，这些文字会被整段吞掉。
  function buildTextRun(textNode, parentCs, parentRect) {
    const chars = textNode.textContent.replace(/\s+/g, ' ').trim();
    if (!chars) return null;
    const range = document.createRange();
    range.selectNodeContents(textNode);
    const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
    if (!rects.length) return null;
    // 多行时取并集包围盒，保证不裁切
    const left = Math.min(...rects.map((r) => r.left));
    const top = Math.min(...rects.map((r) => r.top));
    const right = Math.max(...rects.map((r) => r.right));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    return {
      id: 'n' + (seq += 1),
      name: 'text',
      x: round(left - parentRect.left),
      y: round(top - parentRect.top),
      w: round(Math.max(right - left, EPS)),
      h: round(Math.max(bottom - top, EPS)),
      opacity: 1,
      type: 'TEXT',
      text: textStyle(parentCs, chars),
      lines: rects.length,
    };
  }

  // input/textarea 的 placeholder 与 value 不在 childNodes 里，抽取器看不见，需单独补
  function buildFieldText(el, cs, parentRect) {
    const chars = (el.value || '').trim() || (el.placeholder || '').trim();
    if (!chars) return null;
    const isPh = !((el.value || '').trim());
    const rect = el.getBoundingClientRect();
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    const size = parseFloat(cs.fontSize) || 14;
    const lh = cs.lineHeight === 'normal' ? size * 1.4 : parseFloat(cs.lineHeight);
    const style = textStyle(cs, chars);
    if (isPh) {
      // placeholder 的实际颜色来自 ::placeholder 伪元素，取不到时按惯例降透明度
      const ph = getComputedStyle(el, '::placeholder');
      const pc = parseColor(ph && ph.color);
      if (pc) { style.hex = pc.hex; style.opacity = pc.opacity; }
      else style.opacity = round(style.opacity * 0.45);
    }
    return {
      id: 'n' + (seq += 1),
      name: isPh ? 'placeholder' : 'value',
      x: round(rect.left - parentRect.left + padL),
      y: round(rect.top - parentRect.top + (rect.height - lh) / 2),
      w: round(Math.max(rect.width - padL - padR, EPS)),
      h: round(Math.max(lh, EPS)),
      opacity: 1,
      type: 'TEXT',
      text: style,
    };
  }

  function hasOwnPaint(cs) {
    const bg = parseColor(cs.backgroundColor);
    if (bg) return true;
    if (cs.backgroundImage && cs.backgroundImage !== 'none') return true;
    if (cs.boxShadow && cs.boxShadow !== 'none') return true;
    if (parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0
      || parseFloat(cs.borderLeftWidth) > 0 || parseFloat(cs.borderRightWidth) > 0) return true;
    return false;
  }

  // 元素自身的绘制属性（底色/渐变/描边/圆角/阴影/裁剪）
  // FRAME 分支与「带背景的文本叶子」共用，避免两处逻辑漂移
  function paintOf(cs, w, h, nameForWarn) {
    const fills = [];
    const solid = parseColor(cs.backgroundColor);
    if (solid) fills.push({ type: 'SOLID', hex: solid.hex, opacity: solid.opacity });
    fills.push(...parseBackgroundImage(cs.backgroundImage, w, h));

    // 四边宽度/颜色一致时才转成 Figma 描边，否则 Figma 无法表达
    let stroke = null;
    const bw = parseFloat(cs.borderTopWidth) || 0;
    const uniform = ['borderRightWidth', 'borderBottomWidth', 'borderLeftWidth']
      .every((k) => Math.abs((parseFloat(cs[k]) || 0) - bw) < 0.51);
    if (bw > 0 && uniform && cs.borderTopStyle !== 'none') {
      const bc = parseColor(cs.borderTopColor);
      if (bc) stroke = { hex: bc.hex, opacity: bc.opacity, weight: round(bw) };
    } else if (bw > 0 && !uniform) {
      warnings.push('非等宽边框已忽略: ' + nameForWarn);
    }

    return {
      clip: cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.overflowY === 'hidden',
      cornerRadius: radiusTuple(cs, w, h),
      fills,
      stroke,
      effects: parseShadows(cs.boxShadow),
    };
  }

  const imageQueue = [];

  function build(el, parentRect) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return null;
    const opacity = parseFloat(cs.opacity);
    if (opacity === 0) return null;

    const rect = el.getBoundingClientRect();
    const w = Math.max(rect.width, EPS);
    const h = Math.max(rect.height, EPS);
    // 完全在视口外且无尺寸的节点直接丢，避免导入一堆空壳
    if (rect.width <= 0 && rect.height <= 0) return null;

    const tag = el.tagName.toLowerCase();
    const id = 'n' + (seq += 1);
    const base = {
      id,
      name: tag + (el.className && typeof el.className === 'string' && el.className.trim()
        ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
        : ''),
      x: round(rect.left - parentRect.left),
      y: round(rect.top - parentRect.top),
      w: round(w),
      h: round(h),
      opacity: round(opacity),
    };

    // --- SVG：整段序列化交给 Figma 的矢量解析，图标保持可缩放可改色 ---
    if (tag === 'svg') {
      return { ...base, type: 'SVG', svg: new XMLSerializer().serializeToString(el) };
    }

    // --- IMAGE ---
    if (tag === 'img') {
      const src = el.currentSrc || el.src;
      // src 直接挂在节点上，Node 侧按 src 绑定字节，不依赖遍历顺序
      const node = { ...base, type: 'IMAGE', image: { dataUrl: null, fit: 'FILL', src } };
      imageQueue.push({ node, src });
      return node;
    }

    // --- TEXT ---
    if (isTextLeaf(el)) {
      const chars = el.textContent.replace(/\s+/g, ' ').trim();
      if (!chars) return null;
      const style = textStyle(cs, chars);
      // 文本叶子自身可能带底色/描边/圆角（药丸标签、日历格、导航栏白条）。
      // 直接返回裸 TEXT 会把这些绘制属性整个丢掉，必须包一层 FRAME 承载。
      if (hasOwnPaint(cs)) {
        return {
          ...base,
          type: 'FRAME',
          ...paintOf(cs, w, h, base.name),
          children: [{
            id: 'n' + (seq += 1),
            name: 'text',
            x: 0,
            y: 0,
            w: base.w,
            h: base.h,
            opacity: 1,
            type: 'TEXT',
            text: style,
          }],
        };
      }
      return { ...base, type: 'TEXT', text: style };
    }

    // --- FRAME ---
    const node = {
      ...base,
      type: 'FRAME',
      ...paintOf(cs, w, h, base.name),
      children: [],
    };

    // 按 childNodes 遍历而不是 children：混排节点里夹着的裸文本必须单独成层，
    // 否则「图标 + 文字」这类结构的文字会被整段吞掉
    let bareTextCount = 0;
    for (const child of el.childNodes) {
      if (child.nodeType === 1) {
        const c = build(child, rect);
        if (c) node.children.push(c);
      } else if (child.nodeType === 3 && child.textContent.trim()) {
        const c = buildTextRun(child, cs, rect);
        if (c) { node.children.push(c); bareTextCount += 1; }
      }
    }

    // input/textarea 的 placeholder / value 补成文本层（坐标已相对自身 rect）
    if (tag === 'input' || tag === 'textarea') {
      const f = buildFieldText(el, cs, rect);
      if (f) node.children.push(f);
    }

    // 无绘制属性、无裁剪、且只有一个子节点的纯布局壳，压掉一层，
    // 否则 Figma 里会出现大量嵌套空 Frame，开发根本没法看。
    // 含裸文本的节点不压，位置基准已经绑在自身 rect 上
    if (node.children.length === 1 && bareTextCount === 0
      && !hasOwnPaint(cs) && !node.clip && !node.cornerRadius) {
      const only = node.children[0];
      only.x = round(only.x + node.x);
      only.y = round(only.y + node.y);
      return only;
    }

    return node;
  }

  const rootEl = document.body;
  const rootRect = rootEl.getBoundingClientRect();
  const root = build(rootEl, rootRect);

  // 收集 :root Token 作为 Figma Variables 的来源
  const variables = [];
  const seen = new Set();
  for (const sheet of Array.from(document.styleSheets)) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    if (!rules) continue;
    for (const rule of Array.from(rules)) {
      if (!rule.style || !rule.selectorText || !/:root/.test(rule.selectorText)) continue;
      for (const prop of Array.from(rule.style)) {
        if (!prop.startsWith('--')) continue;
        const val = rule.style.getPropertyValue(prop).trim();
        const hex = val.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
        if (!hex) continue;
        let h = hex[1];
        if (h.length === 3) h = h.split('').map((c) => c + c).join('');
        // --brand-500 → brand/500，让 Figma 自动分组
        const name = prop.replace(/^--/, '').replace(/-(?=[^-]*$)/, '/');
        if (seen.has(name)) continue;
        seen.add(name);
        variables.push({ name, hex: ('#' + h).toUpperCase() });
      }
    }
  }

  return { root, variables, warnings, images: imageQueue.map((i) => i.src) };
}

// ---------------------------------------------------------------------------

const browser = await chromium.launch();
await mkdir(OUT_DIR, { recursive: true });
const summary = [];

for (const t of TARGETS) {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(BASE_URL + t.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const ir = await page.evaluate(extractIR);

  // 图片单独抓成 base64。放在 Node 侧做，避免页面内 CORS 与 canvas 污染问题
  const cache = new Map();

  // 抓取所有出现过的 img src
  const imgUrls = [...new Set(ir.images.filter(Boolean))];
  for (const src of imgUrls) {
    try {
      const abs = new URL(src, BASE_URL).href;
      const resp = await page.request.get(abs);
      const buf = await resp.body();
      const mime = resp.headers()['content-type'] || 'image/png';
      cache.set(src, `data:${mime};base64,${buf.toString('base64')}`);
    } catch (e) {
      ir.warnings.push('图片抓取失败: ' + src);
    }
  }

  // 按节点自带的 src 绑定字节，与遍历顺序无关
  let imgCount = 0;
  (function attach(node) {
    if (node.type === 'IMAGE') {
      const src = node.image.src;
      const data = src ? cache.get(src) : null;
      if (data) { node.image.dataUrl = data; imgCount += 1; }
      else ir.warnings.push('图片无数据: ' + src);
    }
    if (node.children) node.children.forEach(attach);
  })(ir.root);

  // 统计图层构成，用来判断这份稿子够不够开发量
  const stat = { FRAME: 0, TEXT: 0, SVG: 0, IMAGE: 0 };
  let depth = 0;
  (function walk(n, d) {
    stat[n.type] = (stat[n.type] || 0) + 1;
    if (d > depth) depth = d;
    if (n.children) n.children.forEach((c) => walk(c, d + 1));
  })(ir.root, 1);

  const doc = {
    meta: { name: t.name, url: t.url, width: 375, height: Math.round(ir.root.h) },
    variables: ir.variables,
    root: ir.root,
  };
  await writeFile(path.join(OUT_DIR, `${t.name}.json`), JSON.stringify(doc), 'utf8');

  summary.push({ name: t.name, stat, depth, vars: ir.variables.length, images: imgCount, warnings: ir.warnings.length });
  console.log(`[${t.name}] 图层 ${Object.values(stat).reduce((a, b) => a + b, 0)}  文本 ${stat.TEXT}  矢量 ${stat.SVG}  图片 ${imgCount}  变量 ${ir.variables.length}  警告 ${ir.warnings.length}`);
  if (ir.warnings.length) {
    console.log('  ' + [...new Set(ir.warnings)].slice(0, 5).join('\n  '));
  }
  await ctx.close();
}

await writeFile(path.join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');
await browser.close();
console.log(`\n输出目录：${OUT_DIR}`);
