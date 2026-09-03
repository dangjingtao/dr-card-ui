#!/usr/bin/env node
/**
 * to-svg.mjs —— 把 figma-export 产出的 IR JSON 转成单文件 SVG
 *
 * 目标：生成的 SVG 直接拖进 Figma 后能被解析成干净的图层树
 *（Frame/Group -> <g>，矢量 -> <path>，文本 -> <text>，图片 -> <image>）。
 *
 * 设计约束：
 * - 纯 Node ESM，零新增 npm 依赖。
 * - 不使用嵌套 <svg>（Figma 对嵌套 svg 解析很差），一律用 <g transform="translate(x,y)">。
 * - 不生成 <filter>（Figma 导入 filter 会栅格化），阴影一律跳过并计数。
 *
 * 运行：node scripts/figma-export/to-svg.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'out');

/** 图标 currentColor 兜底色（IR 里 SVG 节点不带继承的文字颜色，
 *  独立 SVG 文件中 currentColor 会解析成黑色，必须替换成确定值） */
const ICON_FALLBACK_COLOR = '#292722';

/**
 * 文本基线近似比例。
 * IR 的 y 是文本盒 top，SVG <text> 的 y 是基线。
 * dominant-baseline 在 Figma 导入时不可靠，所以显式换算：
 *   baseline = (lineHeight - size) / 2 + size * ASCENT_RATIO
 * 前半段是 half-leading（行高与字号的差平摊到上下），
 * 后半段是从 em box 顶部到基线的距离。
 * 0.8 是常见西文/中文字体 ascent 的近似值，不是精确度量值。
 */
const ASCENT_RATIO = 0.8;

// ---------------------------------------------------------------------------
// 基础工具
// ---------------------------------------------------------------------------

/** 数字格式化：保留 3 位小数并去掉多余的 0，避免 SVG 里出现 12.340000000000001 */
function num(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '0';
  const r = Math.round(v * 1000) / 1000;
  return String(r);
}

/** XML 文本内容转义 */
function escText(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** XML 属性值转义 */
function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 把节点 name 变成合法且可读的 id。
 * Figma 导入 SVG 时用元素 id 作为图层名，所以这里要尽量保留语义。
 * 空格 -> 下划线；其余非法字符（XML Name 之外的）剔除。
 */
function sanitizeId(raw) {
  let s = String(raw ?? 'node').trim();
  s = s.replace(/\s+/g, '_');
  // 只保留字母数字与 _ - . ，其他一律换成 _
  s = s.replace(/[^A-Za-z0-9_.\-\u4e00-\u9fa5]/g, '_');
  s = s.replace(/_{2,}/g, '_').replace(/^[._-]+/, '');
  if (!s) s = 'node';
  // XML id 不能以数字开头
  if (/^[0-9]/.test(s)) s = 'n_' + s;
  return s;
}

// ---------------------------------------------------------------------------
// 圆角矩形 path（SVG rect 的 rx 只能四角统一，四角不同必须用 path 保真）
// ---------------------------------------------------------------------------

/**
 * 生成圆角矩形 path。
 * @param {number} x 左上角 x
 * @param {number} y 左上角 y
 * @param {number} w 宽
 * @param {number} h 高
 * @param {number[]} radii [tl, tr, br, bl]
 * 每个角半径都会被 clamp 到 min(w,h)/2，避免 9999（pill）这种值画出错误路径。
 */
function roundedRectPath(x, y, w, h, radii) {
  const lim = Math.min(w, h) / 2;
  const cl = (v) => Math.max(0, Math.min(Number(v) || 0, lim));
  const [tl, tr, br, bl] = [cl(radii[0]), cl(radii[1]), cl(radii[2]), cl(radii[3])];

  const p = [];
  p.push(`M${num(x + tl)},${num(y)}`);
  // 上边 -> 右上角
  p.push(`H${num(x + w - tr)}`);
  if (tr > 0) p.push(`A${num(tr)},${num(tr)} 0 0 1 ${num(x + w)},${num(y + tr)}`);
  // 右边 -> 右下角
  p.push(`V${num(y + h - br)}`);
  if (br > 0) p.push(`A${num(br)},${num(br)} 0 0 1 ${num(x + w - br)},${num(y + h)}`);
  // 下边 -> 左下角
  p.push(`H${num(x + bl)}`);
  if (bl > 0) p.push(`A${num(bl)},${num(bl)} 0 0 1 ${num(x)},${num(y + h - bl)}`);
  // 左边 -> 左上角
  p.push(`V${num(y + tl)}`);
  if (tl > 0) p.push(`A${num(tl)},${num(tl)} 0 0 1 ${num(x + tl)},${num(y)}`);
  p.push('Z');
  return p.join(' ');
}

/** 判断 cornerRadius 是否是「四角相同」，相同就能用 rect 的 rx（更利于 Figma 识别为矩形） */
function normalizeRadii(cornerRadius) {
  if (cornerRadius == null) return null;
  if (typeof cornerRadius === 'number') {
    if (cornerRadius <= 0) return null;
    return [cornerRadius, cornerRadius, cornerRadius, cornerRadius];
  }
  if (Array.isArray(cornerRadius)) {
    const a = cornerRadius.map((v) => Number(v) || 0);
    while (a.length < 4) a.push(0);
    if (a.every((v) => v <= 0)) return null;
    return a.slice(0, 4);
  }
  return null;
}

function radiiUniform(r) {
  return r[0] === r[1] && r[1] === r[2] && r[2] === r[3];
}

// ---------------------------------------------------------------------------
// 生成器
// ---------------------------------------------------------------------------

class SvgBuilder {
  constructor(pageName) {
    this.pageName = pageName;
    this.defs = [];        // <defs> 内容
    this.body = [];        // 主体内容
    this.usedIds = new Map(); // 图层 id 去重
    this.gradSeq = 0;      // 渐变 id 序号
    this.clipSeq = 0;      // clipPath id 序号
    this.stats = {
      text: 0,
      image: 0,
      gradients: 0,
      skippedShadows: 0,
      frames: 0,
      icons: 0,
      clipPaths: 0,
      strokes: 0,
      radiusPaths: 0,
    };
  }

  /** 生成唯一图层 id：重名追加 _2 / _3。形如 home__div.checkin-card */
  uniqueId(name) {
    const base = `${sanitizeId(this.pageName)}__${sanitizeId(name)}`;
    const n = (this.usedIds.get(base) || 0) + 1;
    this.usedIds.set(base, n);
    return n === 1 ? base : `${base}_${n}`;
  }

  nextGradId() {
    this.gradSeq += 1;
    this.stats.gradients += 1;
    return `grad_${this.gradSeq}`;
  }

  nextClipId() {
    this.clipSeq += 1;
    this.stats.clipPaths += 1;
    return `clip_${this.pageName}_${this.clipSeq}`;
  }

  /**
   * 线性渐变。
   * CSS angle：0deg 向上，180deg 向下，顺时针。
   * 方向向量 dx = sin(rad)，dy = -cos(rad)（SVG y 轴向下，所以取负）。
   * 起点/终点沿该向量在单位包围盒中心对称展开。
   * 自检：angle=180 -> rad=PI -> dx=0, dy=1 -> x1=0.5,y1=0,x2=0.5,y2=1（从上到下）。
   */
  addLinearGradient(fill) {
    const id = this.nextGradId();
    const rad = ((Number(fill.angle) || 0) * Math.PI) / 180;
    const dx = Math.sin(rad);
    const dy = -Math.cos(rad);
    const x1 = 0.5 - dx / 2;
    const y1 = 0.5 - dy / 2;
    const x2 = 0.5 + dx / 2;
    const y2 = 0.5 + dy / 2;
    const stops = (fill.stops || []).map((s) => this.stopTag(s)).join('');
    this.defs.push(
      `<linearGradient id="${id}" gradientUnits="objectBoundingBox" ` +
        `x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}">${stops}</linearGradient>`
    );
    return id;
  }

  /**
   * 径向渐变（椭圆）。
   * IR 的 cx/cy/rx/ry 都是相对节点宽高的 0..1 归一化值，正好对应
   * gradientUnits="objectBoundingBox" 的坐标系（包围盒被归一化成单位正方形）。
   *
   * SVG 的 <radialGradient> 只能画正圆（单个 r），要表达 rx != ry 的椭圆，
   * 推导如下：先取 r = rx 画一个以 (cx,cy) 为心的正圆，再用 gradientTransform
   * 只在 y 方向把这个圆压缩/拉伸成椭圆，且缩放中心必须锚在 (cx,cy) 上，
   * 否则圆心会被一起平移。所以是「先把 cx,cy 平移到原点，缩放，再平移回去」：
   *
   *   gradientTransform="translate(cx, cy) scale(1, ry/rx) translate(-cx, -cy)"
   *
   * 验证（gradientTransform 把渐变坐标系映射到目标坐标系）：
   *   圆上点 (cx + rx, cy)  -> (rx, 0)  -> (rx, 0)  -> (cx + rx, cy)      x 半轴 = rx ✓
   *   圆上点 (cx, cy + rx)  -> (0, rx)  -> (0, ry)  -> (cx, cy + ry)      y 半轴 = ry ✓
   *   圆心   (cx, cy)       -> (0, 0)   -> (0, 0)   -> (cx, cy)           圆心不动 ✓
   */
  addRadialGradient(fill) {
    const id = this.nextGradId();
    const cx = Number(fill.cx) || 0;
    const cy = Number(fill.cy) || 0;
    const rx = Number(fill.rx) || 0;
    const ry = Number(fill.ry) || 0;
    const stops = (fill.stops || []).map((s) => this.stopTag(s)).join('');

    // rx 为 0 时无法作为基准圆，退化成 r = ry 且不做 y 缩放
    let r = rx;
    let sy = rx > 0 ? ry / rx : 1;
    if (rx <= 0) {
      r = ry > 0 ? ry : 0.5;
      sy = 1;
    }

    const needTransform = Math.abs(sy - 1) > 1e-6;
    const gt = needTransform
      ? ` gradientTransform="translate(${num(cx)},${num(cy)}) scale(1,${num(sy)}) translate(${num(-cx)},${num(-cy)})"`
      : '';

    this.defs.push(
      `<radialGradient id="${id}" gradientUnits="objectBoundingBox" ` +
        `cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}"${gt}>${stops}</radialGradient>`
    );
    return id;
  }

  stopTag(s) {
    const op = s.opacity == null ? 1 : Number(s.opacity);
    const opAttr = op === 1 ? '' : ` stop-opacity="${num(op)}"`;
    return `<stop offset="${num(Number(s.pos) || 0)}" stop-color="${escAttr(s.hex || '#000000')}"${opAttr}/>`;
  }

  /** 注册 clipPath（形状与背景一致，含圆角），返回 id */
  addClipPath(w, h, radii) {
    const id = this.nextClipId();
    let shape;
    if (radii && !radiiUniform(radii)) {
      shape = `<path d="${roundedRectPath(0, 0, w, h, radii)}"/>`;
      this.stats.radiusPaths += 1;
    } else if (radii) {
      const r = Math.min(radii[0], Math.min(w, h) / 2);
      shape = `<rect width="${num(w)}" height="${num(h)}" rx="${num(r)}" ry="${num(r)}"/>`;
    } else {
      shape = `<rect width="${num(w)}" height="${num(h)}"/>`;
    }
    this.defs.push(`<clipPath id="${id}">${shape}</clipPath>`);
    return id;
  }

  /** 一个背景形状：按 uniform 与否选择 rect 或 path */
  shapeTag(w, h, radii, paintAttrs, inset = 0) {
    const x = inset;
    const y = inset;
    const ww = Math.max(0, w - inset * 2);
    const hh = Math.max(0, h - inset * 2);
    if (radii && !radiiUniform(radii)) {
      // 四角不同：SVG rect 不支持，走 path 保真。内缩描边时圆角同步减小 inset。
      const adj = radii.map((r) => Math.max(0, r - inset));
      this.stats.radiusPaths += 1;
      return `<path d="${roundedRectPath(x, y, ww, hh, adj)}"${paintAttrs}/>`;
    }
    let rAttr = '';
    if (radii) {
      const r = Math.max(0, Math.min(radii[0] - inset, Math.min(ww, hh) / 2));
      if (r > 0) rAttr = ` rx="${num(r)}" ry="${num(r)}"`;
    }
    const pos = inset ? ` x="${num(x)}" y="${num(y)}"` : '';
    return `<rect${pos} width="${num(ww)}" height="${num(hh)}"${rAttr}${paintAttrs}/>`;
  }
}

// ---------------------------------------------------------------------------
// SVG 图标节点处理
// ---------------------------------------------------------------------------

/** 从 <svg ...> 根标签上提取要下放到 <g> 的 presentation 属性 */
const CARRY_ATTRS = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'fill-rule', 'clip-rule'];

function parseIconSvg(svgStr) {
  const open = svgStr.match(/<svg\b([^>]*)>/i);
  if (!open) return null;
  const attrsRaw = open[1];
  const inner = svgStr.slice(open.index + open[0].length).replace(/<\/svg\s*>\s*$/i, '');

  const getAttr = (name) => {
    const m = attrsRaw.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i'));
    return m ? m[1] : null;
  };

  const vbRaw = getAttr('viewBox');
  let vb = [0, 0, 24, 24];
  if (vbRaw) {
    const parts = vbRaw.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every(Number.isFinite)) vb = parts;
  } else {
    const w = Number(getAttr('width'));
    const h = Number(getAttr('height'));
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) vb = [0, 0, w, h];
  }

  const carried = [];
  for (const a of CARRY_ATTRS) {
    const v = getAttr(a);
    if (v != null) carried.push([a, v]);
  }
  return { inner, vb, carried };
}

/**
 * 解析图标颜色：IR 的 SVG 节点没有携带继承的文字颜色，
 * 所以沿祖先链向上找最近的 TEXT 后代（第一层即同级兄弟），拿它的 hex；
 * 找不到就用 ICON_FALLBACK_COLOR。
 */
function resolveIconColor(ancestors) {
  for (let i = ancestors.length - 1; i >= 0; i -= 1) {
    const hex = findFirstTextHex(ancestors[i]);
    if (hex) return hex;
  }
  return ICON_FALLBACK_COLOR;
}

function findFirstTextHex(node) {
  const queue = [...(node.children || [])];
  while (queue.length) {
    const n = queue.shift();
    if (n.type === 'TEXT' && n.text && n.text.hex) return n.text.hex;
    if (n.children) queue.push(...n.children);
  }
  return null;
}

// ---------------------------------------------------------------------------
// 节点渲染
// ---------------------------------------------------------------------------

function renderNode(node, b, ancestors, indentLevel) {
  const pad = '  '.repeat(indentLevel);
  const id = b.uniqueId(node.name || node.type || node.id);
  const x = Number(node.x) || 0;
  const y = Number(node.y) || 0;
  const w = Number(node.w) || 0;
  const h = Number(node.h) || 0;

  const attrs = [`id="${escAttr(id)}"`];
  // 统一用 translate 定位（不用嵌套 svg）。translate(0,0) 也保留，
  // 便于 Figma 建立稳定的 Group 层级。
  attrs.push(`transform="translate(${num(x)},${num(y)})"`);

  const op = node.opacity == null ? 1 : Number(node.opacity);
  if (op < 1) attrs.push(`opacity="${num(op)}"`);

  const inner = [];

  if (node.type === 'FRAME') {
    b.stats.frames += 1;
    const radii = normalizeRadii(node.cornerRadius);

    // clip=true -> clipPath（形状与背景一致，含圆角）
    if (node.clip) {
      const cid = b.addClipPath(w, h, radii);
      attrs.push(`clip-path="url(#${cid})"`);
    }

    // 背景 fills：按数组顺序输出（先给的在下层，SVG 先写的也在下层）
    for (const fill of node.fills || []) {
      let paint = '';
      if (fill.type === 'SOLID') {
        const fo = fill.opacity == null ? 1 : Number(fill.opacity);
        if (fo <= 0) continue;
        paint = ` fill="${escAttr(fill.hex || '#000000')}"` + (fo === 1 ? '' : ` fill-opacity="${num(fo)}"`);
      } else if (fill.type === 'GRADIENT_LINEAR') {
        paint = ` fill="url(#${b.addLinearGradient(fill)})"`;
      } else if (fill.type === 'GRADIENT_RADIAL') {
        paint = ` fill="url(#${b.addRadialGradient(fill)})"`;
      } else {
        continue;
      }
      inner.push(pad + '  ' + b.shapeTag(w, h, radii, paint));
    }

    // stroke：CSS border 是内描边，SVG 是居中描边。
    // 所以把描边矩形向内缩 weight/2，宽高各减 weight，圆角同步减 weight/2。
    if (node.stroke && Number(node.stroke.weight) > 0) {
      b.stats.strokes += 1;
      const sw = Number(node.stroke.weight);
      const so = node.stroke.opacity == null ? 1 : Number(node.stroke.opacity);
      let paint = ` fill="none" stroke="${escAttr(node.stroke.hex || '#000000')}" stroke-width="${num(sw)}"`;
      if (so !== 1) paint += ` stroke-opacity="${num(so)}"`;
      inner.push(pad + '  ' + b.shapeTag(w, h, radii, paint, sw / 2));
    }

    // effects（box-shadow）：不生成 filter，Figma 导入会栅格化且效果很差，直接跳过并计数
    if (Array.isArray(node.effects) && node.effects.length) {
      b.stats.skippedShadows += node.effects.length;
    }

    for (const child of node.children || []) {
      inner.push(renderNode(child, b, [...ancestors, node], indentLevel + 1));
    }
  } else if (node.type === 'TEXT') {
    b.stats.text += 1;
    inner.push(pad + '  ' + renderText(node, w));
  } else if (node.type === 'SVG') {
    b.stats.icons += 1;
    const parsed = parseIconSvg(node.svg || '');
    if (parsed) {
      const [vx, vy, vw, vh] = parsed.vb;
      const sx = vw > 0 ? w / vw : 1;
      const sy = vh > 0 ? h / vh : 1;
      const tf = [];
      if (sx !== 1 || sy !== 1) tf.push(`scale(${num(sx)},${num(sy)})`);
      if (vx !== 0 || vy !== 0) tf.push(`translate(${num(-vx)},${num(-vy)})`);

      const color = resolveIconColor(ancestors);
      // currentColor 在独立 SVG 文件里会解析成黑色，全部换成确定颜色
      const innerSvg = parsed.inner.replace(/currentColor/g, color);
      const carried = parsed.carried
        .map(([k, v]) => ` ${k}="${escAttr(v.replace(/currentColor/g, color))}"`)
        .join('');

      const gAttrs = (tf.length ? ` transform="${tf.join(' ')}"` : '') + carried;
      inner.push(`${pad}  <g${gAttrs}>${innerSvg}</g>`);
    }
  } else if (node.type === 'IMAGE') {
    b.stats.image += 1;
    const img = node.image || {};
    // FILL / COVER 裁切填满 -> slice；CONTAIN 完整放入 -> meet
    const par = img.fit === 'CONTAIN' ? 'xMidYMid meet' : 'xMidYMid slice';
    const href = escAttr(img.dataUrl || img.src || '');
    // 同时写 href 与 xlink:href 以兼容不同解析器
    inner.push(
      `${pad}  <image x="0" y="0" width="${num(w)}" height="${num(h)}" ` +
        `preserveAspectRatio="${par}" href="${href}" xlink:href="${href}"/>`
    );
  }

  if (!inner.length) return `${pad}<g ${attrs.join(' ')}/>`;
  return `${pad}<g ${attrs.join(' ')}>\n${inner.join('\n')}\n${pad}</g>`;
}

function renderText(node, w) {
  const t = node.text || {};
  const size = Number(t.size) || 12;
  const lineHeight = Number(t.lineHeight) || size * 1.2;
  // 基线换算（见 ASCENT_RATIO 注释）
  const baseline = (lineHeight - size) / 2 + size * ASCENT_RATIO;

  const align = t.align || 'LEFT';
  let anchor = 'start';
  let tx = 0;
  if (align === 'CENTER') {
    anchor = 'middle';
    tx = w / 2;
  } else if (align === 'RIGHT') {
    anchor = 'end';
    tx = w;
  }

  const parts = [
    `x="${num(tx)}"`,
    `y="${num(baseline)}"`,
    `font-family="${escAttr(t.family || 'Inter')}"`,
    `font-size="${num(size)}"`,
  ];
  if (t.weight != null) parts.push(`font-weight="${num(Number(t.weight))}"`);
  parts.push(`fill="${escAttr(t.hex || '#000000')}"`);
  const fo = t.opacity == null ? 1 : Number(t.opacity);
  if (fo !== 1) parts.push(`fill-opacity="${num(fo)}"`);
  const ls = Number(t.letterSpacing) || 0;
  if (ls !== 0) parts.push(`letter-spacing="${num(ls)}"`);
  if (anchor !== 'start') parts.push(`text-anchor="${anchor}"`);
  // 注意：不输出 textLength，否则 Figma 里文本会被强行拉伸变形

  const raw = String(t.characters ?? '');
  const lines = raw.split('\n');
  if (lines.length === 1) {
    return `<text ${parts.join(' ')}>${escText(raw)}</text>`;
  }
  // 多行：拆成多个 tspan，第一行 dy=0，后续每行下移一个 lineHeight
  const spans = lines
    .map((ln, i) => `<tspan x="${num(tx)}" dy="${i === 0 ? '0' : num(lineHeight)}">${escText(ln)}</tspan>`)
    .join('');
  return `<text ${parts.join(' ')}>${spans}</text>`;
}

// ---------------------------------------------------------------------------
// 文档组装
// ---------------------------------------------------------------------------

function buildSvg(ir, pageName) {
  const b = new SvgBuilder(pageName);
  const root = ir.root;
  const w = Number(root.w) || Number(ir.meta?.width) || 375;
  const h = Number(root.h) || Number(ir.meta?.height) || 812;

  const bodyXml = renderNode(root, b, [], 1);

  const defsXml = b.defs.length ? `  <defs>\n    ${b.defs.join('\n    ')}\n  </defs>\n` : '';

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${num(w)}" height="${num(h)}" viewBox="0 0 ${num(w)} ${num(h)}">\n` +
    defsXml +
    bodyXml +
    '\n</svg>\n';

  return { svg, stats: b.stats, uniqueIds: b.usedIds.size, totalIds: [...b.usedIds.values()].reduce((a, c) => a + c, 0) };
}

// ---------------------------------------------------------------------------
// 质量校验
// ---------------------------------------------------------------------------

/**
 * 轻量 XML 良构检查：手写标签扫描器（不引入依赖）。
 * 处理：注释、CDATA、自闭合标签、属性值中的 < >。
 * 返回 { ok, error }
 */
function checkWellFormed(xml) {
  const stack = [];
  let i = 0;
  const n = xml.length;
  while (i < n) {
    const lt = xml.indexOf('<', i);
    if (lt === -1) break;

    if (xml.startsWith('<!--', lt)) {
      const end = xml.indexOf('-->', lt + 4);
      if (end === -1) return { ok: false, error: '未闭合的注释' };
      i = end + 3;
      continue;
    }
    if (xml.startsWith('<![CDATA[', lt)) {
      const end = xml.indexOf(']]>', lt + 9);
      if (end === -1) return { ok: false, error: '未闭合的 CDATA' };
      i = end + 3;
      continue;
    }
    if (xml.startsWith('<?', lt) || xml.startsWith('<!', lt)) {
      const end = xml.indexOf('>', lt);
      if (end === -1) return { ok: false, error: '未闭合的处理指令/声明' };
      i = end + 1;
      continue;
    }

    // 扫描标签结束位置，跳过引号内的 >
    let j = lt + 1;
    let quote = null;
    while (j < n) {
      const c = xml[j];
      if (quote) {
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'") {
        quote = c;
      } else if (c === '>') {
        break;
      }
      j += 1;
    }
    if (j >= n) return { ok: false, error: `位置 ${lt} 处标签未闭合` };

    const body = xml.slice(lt + 1, j);
    const selfClosing = body.endsWith('/');
    const isEnd = body.startsWith('/');
    const nameMatch = body.replace(/^\//, '').match(/^([A-Za-z_][\w.\-:]*)/);
    if (!nameMatch) return { ok: false, error: `位置 ${lt} 处标签名非法: <${body.slice(0, 30)}>` };
    const tag = nameMatch[1];

    if (isEnd) {
      const top = stack.pop();
      if (top !== tag) {
        return { ok: false, error: `标签不匹配：期望 </${top}>，实际 </${tag}>（位置 ${lt}）` };
      }
    } else if (!selfClosing) {
      stack.push(tag);
    }
    i = j + 1;
  }
  if (stack.length) return { ok: false, error: `以下标签未闭合: ${stack.join(' > ')}` };
  return { ok: true, error: null };
}

/** 统计 IR 中各类型节点数 */
function countIrNodes(root) {
  const c = { FRAME: 0, TEXT: 0, SVG: 0, IMAGE: 0 };
  const walk = (n) => {
    c[n.type] = (c[n.type] || 0) + 1;
    (n.children || []).forEach(walk);
  };
  walk(root);
  return c;
}

function countTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}\\b`, 'g'));
  return m ? m.length : 0;
}

function countUniqueIds(xml) {
  const ids = xml.match(/\sid="([^"]*)"/g) || [];
  const set = new Set(ids.map((s) => s.slice(5, -1)));
  return { total: ids.length, unique: set.size };
}

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

function selfTestGradientMath() {
  // 自检：CSS angle=180（向下）应得到 x1=0.5,y1=0,x2=0.5,y2=1
  const rad = (180 * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const v = [0.5 - dx / 2, 0.5 - dy / 2, 0.5 + dx / 2, 0.5 + dy / 2].map((x) => Math.round(x * 1000) / 1000);
  const ok = v[0] === 0.5 && v[1] === 0 && v[2] === 0.5 && v[3] === 1;
  console.log(`[自检] 线性渐变 angle=180 -> x1=${v[0]} y1=${v[1]} x2=${v[2]} y2=${v[3]}  ${ok ? 'PASS' : 'FAIL'}`);
  if (!ok) process.exitCode = 1;

  // 自检：angle=0（向上）应得到 x1=0.5,y1=1,x2=0.5,y2=0
  const rad0 = 0;
  const dx0 = Math.sin(rad0);
  const dy0 = -Math.cos(rad0);
  const v0 = [0.5 - dx0 / 2, 0.5 - dy0 / 2, 0.5 + dx0 / 2, 0.5 + dy0 / 2].map((x) => Math.round(x * 1000) / 1000);
  const ok0 = v0[0] === 0.5 && v0[1] === 1 && v0[2] === 0.5 && v0[3] === 0;
  console.log(`[自检] 线性渐变 angle=0   -> x1=${v0[0]} y1=${v0[1]} x2=${v0[2]} y2=${v0[3]}  ${ok0 ? 'PASS' : 'FAIL'}`);
  if (!ok0) process.exitCode = 1;
}

function main() {
  selfTestGradientMath();

  if (!fs.existsSync(OUT_DIR)) {
    console.error(`[错误] 输入目录不存在: ${OUT_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(OUT_DIR)
    .filter((f) => f.endsWith('.json') && f !== 'summary.json')
    .sort();

  if (!files.length) {
    console.error('[错误] out 目录下没有可转换的 JSON');
    process.exit(1);
  }

  // 已知期望值（用于回归校验），没有登记的页面跳过比对
  // 基线更新：补齐混排裸文本与 input placeholder 后，home 80→93、points 38→55
  const EXPECT = { home: { text: 93, image: 6 }, points: { text: 55, image: 3 } };

  let anyWarn = false;

  for (const f of files) {
    const pageName = path.basename(f, '.json');
    const ir = JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), 'utf8'));
    const { svg, stats } = buildSvg(ir, pageName);

    const outPath = path.join(OUT_DIR, `${pageName}.svg`);
    fs.writeFileSync(outPath, svg, 'utf8');

    const irCount = countIrNodes(ir.root);
    const wf = checkWellFormed(svg);
    const idInfo = countUniqueIds(svg);
    const bytes = Buffer.byteLength(svg, 'utf8');

    const nText = countTag(svg, 'text');
    const nImage = countTag(svg, 'image');
    const nPath = countTag(svg, 'path');
    const nGrad = countTag(svg, 'linearGradient') + countTag(svg, 'radialGradient');
    const nRect = countTag(svg, 'rect');
    const nG = countTag(svg, 'g');

    console.log('');
    console.log(`=== ${pageName}.svg ===`);
    console.log(`  路径              : ${outPath}`);
    console.log(`  字节大小          : ${bytes} (${fmtBytes(bytes)})`);
    console.log(`  XML 良构          : ${wf.ok ? 'PASS' : 'FAIL -> ' + wf.error}`);
    console.log(`  <text> 数量       : ${nText}`);
    console.log(`  <image> 数量      : ${nImage}`);
    console.log(`  <path> 数量       : ${nPath}`);
    console.log(`  <rect> 数量       : ${nRect}`);
    console.log(`  <g> 数量          : ${nG}`);
    console.log(`  渐变定义数量      : ${nGrad} (线性 ${countTag(svg, 'linearGradient')} / 径向 ${countTag(svg, 'radialGradient')})`);
    console.log(`  clipPath 数量     : ${countTag(svg, 'clipPath')}`);
    console.log(`  描边数量          : ${stats.strokes}`);
    console.log(`  圆角 path 数量    : ${stats.radiusPaths}`);
    console.log(`  跳过阴影          : ${stats.skippedShadows} 处`);
    console.log(`  id 总数 / 唯一数  : ${idInfo.total} / ${idInfo.unique}`);
    console.log(`  IR 节点           : FRAME ${irCount.FRAME} / TEXT ${irCount.TEXT} / SVG ${irCount.SVG} / IMAGE ${irCount.IMAGE}`);

    if (!wf.ok) {
      anyWarn = true;
      console.log(`  [警告] XML 不良构: ${wf.error}`);
    }
    if (idInfo.total !== idInfo.unique) {
      anyWarn = true;
      console.log(`  [警告] 存在重复 id（${idInfo.total - idInfo.unique} 个）`);
    }
    if (nText !== irCount.TEXT) {
      anyWarn = true;
      console.log(`  [警告] <text> 数量 ${nText} != IR TEXT 节点数 ${irCount.TEXT}`);
    } else {
      console.log(`  [校验] <text> 数量与 IR TEXT 节点数一致 (${nText}) PASS`);
    }
    if (nImage !== irCount.IMAGE) {
      anyWarn = true;
      console.log(`  [警告] <image> 数量 ${nImage} != IR IMAGE 节点数 ${irCount.IMAGE}`);
    } else {
      console.log(`  [校验] <image> 数量与 IR IMAGE 节点数一致 (${nImage}) PASS`);
    }

    const exp = EXPECT[pageName];
    if (exp) {
      const tOk = nText === exp.text;
      const iOk = nImage === exp.image;
      console.log(`  [校验] 期望 text=${exp.text} image=${exp.image} -> 实际 text=${nText} image=${nImage} ${tOk && iOk ? 'PASS' : 'FAIL'}`);
      if (!tOk || !iOk) anyWarn = true;
    }
  }

  console.log('');
  console.log(anyWarn ? '[结果] 完成，但存在警告，请检查上面的 [警告] 行。' : '[结果] 全部通过，无警告。');
}

main();
