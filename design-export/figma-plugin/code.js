/**
 * DR Card UI → Figma
 * 把抽取器产出的 IR JSON 在 Figma 中重建为真实可编辑图层。
 *
 * 设计取向：保真优先。接收方是 iOS / Android / 小程序原生开发，
 * 他们要在 Figma 里量尺寸、吸色、复制文案，所以这里刻意不做
 * auto layout 推断，一律绝对定位还原，宁可图层「笨」也不能位移。
 */

// ---------------------------------------------------------------------------
// 全局运行时状态
// ---------------------------------------------------------------------------

// 警告集中收集，最后一次性汇报。逐个节点弹 notify 会把 Figma 卡死。
var warnings = [];
// 已创建节点计数，用于最终提示。
var createdCount = 0;
// hex(大写，含 #) -> Variable 实例。SOLID fill 命中即绑定变量。
var hexToVariable = {};

var UI_WIDTH = 420;
var UI_HEIGHT = 520;

figma.showUI(__html__, { width: UI_WIDTH, height: UI_HEIGHT, themeColors: true });

// ---------------------------------------------------------------------------
// 日志 / 警告
// ---------------------------------------------------------------------------

/** 往 UI 日志区推一条消息。UI 侧负责滚动。 */
function log(text, level) {
  figma.ui.postMessage({ type: 'log', level: level || 'info', text: String(text) });
}

/** 记录警告：只入队，不打断导入。 */
function warn(text) {
  warnings.push(String(text));
  log('⚠ ' + text, 'warn');
}

/** 更新 UI 进度条。 */
function progress(done, total, label) {
  figma.ui.postMessage({ type: 'progress', done: done, total: total, label: label || '' });
}

// ---------------------------------------------------------------------------
// 颜色与数值工具
// ---------------------------------------------------------------------------

/**
 * "#RRGGBB" / "#RGB" / "RRGGBB" -> { r, g, b }（0~1）。
 * Figma 的 Paint.color 是归一化浮点，所以必须除以 255。
 */
function hexToRgb(hex) {
  if (typeof hex !== 'string') return null;
  var h = hex.trim().replace(/^#/, '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (h.length === 8) {
    // 容忍 #RRGGBBAA，alpha 交给 opacity 字段处理，这里丢掉。
    h = h.slice(0, 6);
  }
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255
  };
}

/** 归一化 hex 作为 variables 映射的 key，避免大小写 / 缩写导致命不中。 */
function normalizeHex(hex) {
  if (typeof hex !== 'string') return null;
  var h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length === 8) h = h.slice(0, 6);
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
  return '#' + h.toUpperCase();
}

function isNum(v) {
  return typeof v === 'number' && isFinite(v);
}

/** opacity 缺失时按 1 处理，并夹到 [0,1]，避免 API 抛错。 */
function safeOpacity(v) {
  if (!isNum(v)) return 1;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

/** resize 不接受 0 / 负数，用 0.01 兜底，宁可留个极细图层也不要中断整棵树。 */
function safeSize(v) {
  if (!isNum(v) || v <= 0) return 0.01;
  return v;
}

// ---------------------------------------------------------------------------
// 渐变换算
// ---------------------------------------------------------------------------
//
// Figma 的 gradientTransform 是一个 2x3 矩阵 [[a,b,c],[d,e,f]]，
// 它把「节点包围盒的归一化坐标 p=(px,py)∈[0,1]²」映射到「渐变空间 u」。
// 线性渐变取 u.x 作为色标参数 t；径向渐变取 t = 2*|u - (0.5,0.5)|。
// 换句话说：单位矩阵时，线性渐变是从左到右，径向渐变是以中心为圆心、半径 0.5。
//
// 我们要做的就是反推出这个矩阵。

/**
 * CSS linear-gradient 角度 -> Figma gradientTransform。
 *
 * CSS 语义：0deg = 从下往上（to top），90deg = 从左往右（to right），顺时针增大。
 * 在「x 向右、y 向下」的屏幕坐标系里，渐变方向单位向量为：
 *     d = (sin A, -cos A)
 *   验证：A=0   -> (0,-1) 向上   ✓
 *         A=90  -> (1, 0) 向右   ✓
 *         A=180 -> (0, 1) 向下   ✓
 *
 * CSS 的渐变线过盒子中心，长度（覆盖到四角投影）为：
 *     L = |W*sin A| + |H*cos A|
 * 起点 S = C - (L/2)*d，其中 C = (W/2, H/2)。
 *
 * 对任意像素点 q，色标参数：
 *     t = ((q - S) · d) / L
 * 代入 q = (px*W, py*H) 展开：
 *     t = (W*dx/L)*px + (H*dy/L)*py - (S·d)/L
 * 而 S·d = (W*dx + H*dy)/2 - L/2，于是常数项
 *     c = 0.5 - (W*dx + H*dy) / (2L)
 *
 * 所以第一行 = [ W*dx/L , H*dy/L , c ]。
 *
 * 关键点：先在「像素空间」算渐变线，再用 W/H 归一化。这样非正方形节点上
 * 的视觉角度才和 CSS 一致；直接在归一化方形里取角度会被宽高比拉歪。
 *
 * 第二行取像素空间的垂直方向 n = (-dy, dx) 做同样处理。线性渐变渲染只用第一行，
 * 但矩阵不能奇异，否则部分渲染路径会出问题；此写法行列式为 W*H/L² ≠ 0。
 */
function linearGradientTransform(angleDeg, w, h) {
  var A = isNum(angleDeg) ? angleDeg : 180; // CSS 默认 to bottom = 180deg
  var W = safeSize(w);
  var H = safeSize(h);
  var rad = (A * Math.PI) / 180;
  var dx = Math.sin(rad);
  var dy = -Math.cos(rad);

  var L = Math.abs(W * dx) + Math.abs(H * dy);
  if (!isNum(L) || L < 1e-6) L = 1e-6;

  var a = (W * dx) / L;
  var b = (H * dy) / L;
  var c = 0.5 - (W * dx + H * dy) / (2 * L);

  // 垂直轴：n = (-dy, dx)
  var d2 = (W * -dy) / L;
  var e2 = (H * dx) / L;
  var f2 = 0.5 - (W * -dy + H * dx) / (2 * L);

  return [
    [a, b, c],
    [d2, e2, f2]
  ];
}

/**
 * 径向渐变 -> Figma gradientTransform。
 *
 * 目标：t = sqrt( ((px-cx)/rx)² + ((py-cy)/ry)² )
 * 而 Figma 定义 t = 2*|u - (0.5,0.5)|，故需
 *     u.x = 0.5 + (px - cx) / (2*rx)
 *     u.y = 0.5 + (py - cy) / (2*ry)
 * 展开即：
 *     row0 = [ 1/(2rx), 0, 0.5 - cx/(2rx) ]
 *     row1 = [ 0, 1/(2ry), 0.5 - cy/(2ry) ]
 *
 * 自检：cx=cy=0.5, rx=ry=0.5 -> [[1,0,0],[0,1,0]]，正是单位矩阵。✓
 */
function radialGradientTransform(cx, cy, rx, ry) {
  var CX = isNum(cx) ? cx : 0.5;
  var CY = isNum(cy) ? cy : 0.5;
  var RX = isNum(rx) && Math.abs(rx) > 1e-6 ? rx : 0.5;
  var RY = isNum(ry) && Math.abs(ry) > 1e-6 ? ry : 0.5;

  return [
    [1 / (2 * RX), 0, 0.5 - CX / (2 * RX)],
    [0, 1 / (2 * RY), 0.5 - CY / (2 * RY)]
  ];
}

/** IR 的 stops -> Figma gradientStops。位置夹到 [0,1] 并按 pos 排序。 */
function buildGradientStops(stops) {
  var out = [];
  if (!stops || !stops.length) return out;
  for (var i = 0; i < stops.length; i++) {
    var s = stops[i];
    if (!s) continue;
    var rgb = hexToRgb(s.hex);
    if (!rgb) continue;
    var pos = isNum(s.pos) ? Math.min(1, Math.max(0, s.pos)) : i / Math.max(1, stops.length - 1);
    out.push({
      position: pos,
      color: { r: rgb.r, g: rgb.g, b: rgb.b, a: safeOpacity(s.opacity) }
    });
  }
  out.sort(function (m, n) {
    return m.position - n.position;
  });
  // Figma 至少需要两个 stop，否则赋值会被拒绝。
  if (out.length === 1) {
    out.push({ position: 1, color: out[0].color });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Paint 构建
// ---------------------------------------------------------------------------

/**
 * 单个 IR Paint -> Figma Paint。
 * w/h 只有线性渐变需要（做宽高比修正），其余类型忽略。
 * 无法识别时返回 null，由调用方跳过。
 */
function buildPaint(p, w, h) {
  if (!p || typeof p !== 'object') return null;
  var type = p.type;

  if (type === 'SOLID') {
    var rgb = hexToRgb(p.hex);
    if (!rgb) return null;
    var paint = { type: 'SOLID', color: rgb, opacity: safeOpacity(p.opacity) };
    return bindSolidToVariable(paint, p.hex);
  }

  if (type === 'GRADIENT_LINEAR') {
    var lstops = buildGradientStops(p.stops);
    if (!lstops.length) return null;
    return {
      type: 'GRADIENT_LINEAR',
      gradientTransform: linearGradientTransform(p.angle, w, h),
      gradientStops: lstops,
      opacity: safeOpacity(p.opacity)
    };
  }

  if (type === 'GRADIENT_RADIAL') {
    var rstops = buildGradientStops(p.stops);
    if (!rstops.length) return null;
    return {
      type: 'GRADIENT_RADIAL',
      gradientTransform: radialGradientTransform(p.cx, p.cy, p.rx, p.ry),
      gradientStops: rstops,
      opacity: safeOpacity(p.opacity)
    };
  }

  return null;
}

/** 构建整个 fills 数组。IR 与 Figma 的顺序语义一致（先给的在下），无需反转。 */
function buildFills(fills, w, h) {
  var out = [];
  if (!fills || !fills.length) return out;
  for (var i = 0; i < fills.length; i++) {
    try {
      var paint = buildPaint(fills[i], w, h);
      if (paint) out.push(paint);
    } catch (e) {
      warn('fill 构建失败：' + (e && e.message ? e.message : e));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Variables（设计 Token）
// ---------------------------------------------------------------------------

/**
 * 拿到（或新建）名为 dr-card-ui 的 Variable Collection。
 *
 * Figma 近年把 variables 相关读取 API 全面异步化，但不同版本桌面端
 * 仍可能只有旧的同步 API。这里统一「先异步、异常/缺失时回退同步」，
 * 避免在老客户端上直接白屏。
 */
async function getOrCreateCollection(name) {
  var collections = null;

  try {
    if (figma.variables && typeof figma.variables.getLocalVariableCollectionsAsync === 'function') {
      collections = await figma.variables.getLocalVariableCollectionsAsync();
    }
  } catch (e) {
    warn('异步读取变量集合失败，回退同步 API：' + (e && e.message ? e.message : e));
  }

  if (!collections) {
    try {
      if (figma.variables && typeof figma.variables.getLocalVariableCollections === 'function') {
        collections = figma.variables.getLocalVariableCollections();
      }
    } catch (e2) {
      warn('同步读取变量集合也失败：' + (e2 && e2.message ? e2.message : e2));
    }
  }

  if (collections && collections.length) {
    for (var i = 0; i < collections.length; i++) {
      if (collections[i] && collections[i].name === name) return collections[i];
    }
  }

  if (!figma.variables || typeof figma.variables.createVariableCollection !== 'function') {
    return null;
  }

  var created = figma.variables.createVariableCollection(name);
  // 集合创建时会自带一个 mode，重命名成约定的 default 而不是再加一个模式。
  try {
    if (created.modes && created.modes.length) {
      created.renameMode(created.modes[0].modeId, 'default');
    }
  } catch (e3) {
    warn('重命名默认模式失败（不影响导入）：' + (e3 && e3.message ? e3.message : e3));
  }
  return created;
}

/** 读取集合内已有变量，同样做异步优先 / 同步兜底。 */
async function getVariablesOfCollection(collection) {
  var result = [];
  if (!collection) return result;

  var ids = collection.variableIds || [];

  for (var i = 0; i < ids.length; i++) {
    var v = null;
    try {
      if (typeof figma.variables.getVariableByIdAsync === 'function') {
        v = await figma.variables.getVariableByIdAsync(ids[i]);
      }
    } catch (e) {
      v = null;
    }
    if (!v) {
      try {
        if (typeof figma.variables.getVariableById === 'function') {
          v = figma.variables.getVariableById(ids[i]);
        }
      } catch (e2) {
        v = null;
      }
    }
    if (v) result.push(v);
  }
  return result;
}

/**
 * 依据 IR 的 variables 数组建立 Token，并填充 hexToVariable 映射。
 * 同名变量复用，不重复创建，这样反复导入不会把变量表撑爆。
 */
async function setupVariables(variables) {
  hexToVariable = {};
  if (!variables || !variables.length) return;

  if (!figma.variables) {
    warn('当前 Figma 版本不支持 Variables API，颜色将不做变量绑定。');
    return;
  }

  var collection = null;
  try {
    collection = await getOrCreateCollection('dr-card-ui');
  } catch (e) {
    warn('创建变量集合失败：' + (e && e.message ? e.message : e));
  }
  if (!collection) {
    warn('未能获得变量集合，颜色将不做变量绑定。');
    return;
  }

  var modeId = collection.modes && collection.modes.length ? collection.modes[0].modeId : null;

  var existing = await getVariablesOfCollection(collection);
  var byName = {};
  for (var i = 0; i < existing.length; i++) {
    byName[existing[i].name] = existing[i];
  }

  var createdVars = 0;
  var reusedVars = 0;

  for (var j = 0; j < variables.length; j++) {
    var item = variables[j];
    if (!item || typeof item.name !== 'string') continue;
    var rgb = hexToRgb(item.hex);
    var key = normalizeHex(item.hex);
    if (!rgb || !key) {
      warn('变量 ' + item.name + ' 的 hex 非法，已跳过：' + item.hex);
      continue;
    }

    var variable = byName[item.name];
    try {
      if (!variable) {
        variable = figma.variables.createVariable(item.name, collection, 'COLOR');
        byName[item.name] = variable;
        createdVars++;
      } else {
        reusedVars++;
      }
      // 复用的变量也刷新一次值，保证与本次 IR 的 Token 一致。
      if (modeId) variable.setValueForMode(modeId, rgb);
    } catch (e2) {
      warn('创建/更新变量 ' + item.name + ' 失败：' + (e2 && e2.message ? e2.message : e2));
      continue;
    }

    // 同一 hex 被多个 Token 命名时，保留先出现的那个，避免绑定结果随机。
    if (!hexToVariable[key]) hexToVariable[key] = variable;
  }

  log('变量就绪：新建 ' + createdVars + ' 个，复用 ' + reusedVars + ' 个。');
}

/**
 * 若 SOLID 的 hex 命中 Token，就把这个 paint 绑到变量上。
 * setBoundVariableForPaint 返回的是新 paint 对象，必须用返回值。
 */
function bindSolidToVariable(paint, hex) {
  var key = normalizeHex(hex);
  if (!key) return paint;
  var variable = hexToVariable[key];
  if (!variable) return paint;
  try {
    if (figma.variables && typeof figma.variables.setBoundVariableForPaint === 'function') {
      return figma.variables.setBoundVariableForPaint(paint, 'color', variable);
    }
  } catch (e) {
    // 绑定失败不是致命问题，退回普通色值即可。
  }
  return paint;
}

// ---------------------------------------------------------------------------
// 字体
// ---------------------------------------------------------------------------

var WEIGHT_TO_STYLE = [
  [100, 'Thin'],
  [200, 'Extra Light'],
  [300, 'Light'],
  [400, 'Regular'],
  [500, 'Medium'],
  [600, 'Semi Bold'],
  [700, 'Bold'],
  [800, 'Extra Bold'],
  [900, 'Black']
];

/** weight 数值 -> Figma style 名。非标准值就近取，避免直接失败。 */
function weightToStyle(weight) {
  var w = isNum(weight) ? weight : 400;
  var best = WEIGHT_TO_STYLE[3];
  var bestDelta = Infinity;
  for (var i = 0; i < WEIGHT_TO_STYLE.length; i++) {
    var delta = Math.abs(WEIGHT_TO_STYLE[i][0] - w);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = WEIGHT_TO_STYLE[i];
    }
  }
  return best[1];
}

/** 依据 cjk 标记决定字族。中英分开是为了让中文字重能真正生效。 */
function familyOf(textSpec) {
  return textSpec && textSpec.cjk ? 'Noto Sans SC' : 'Inter';
}

function fontKey(font) {
  return font.family + '||' + font.style;
}

// 缓存：原始 fontName key -> 实际可用 fontName。递归里直接查表，不再 await。
var fontResolution = {};
// 系统兜底字体，只在所有优先级都失败时求助一次。
var systemFallbackFont = null;

/** 尝试加载一个字体，成功返回 true。 */
async function tryLoadFont(font) {
  try {
    await figma.loadFontAsync(font);
    return true;
  } catch (e) {
    return false;
  }
}

/** 找一个系统里确实存在的字体作为最后兜底。 */
async function resolveSystemFallback() {
  if (systemFallbackFont) return systemFallbackFont;
  try {
    var list = await figma.listAvailableFontsAsync();
    for (var i = 0; i < list.length; i++) {
      var f = list[i].fontName;
      if (await tryLoadFont(f)) {
        systemFallbackFont = f;
        return systemFallbackFont;
      }
    }
  } catch (e) {
    warn('枚举系统字体失败：' + (e && e.message ? e.message : e));
  }
  return null;
}

/**
 * 解析并加载单个字体，链路：
 *   目标 family+style → 目标 family Regular → Inter Regular → 系统首个可用字体
 * 任何一级降级都记警告，但只记一次（按 key 去重缓存）。
 */
async function resolveFont(font) {
  var key = fontKey(font);
  if (fontResolution[key]) return fontResolution[key];

  if (await tryLoadFont(font)) {
    fontResolution[key] = font;
    return font;
  }

  var sameFamilyRegular = { family: font.family, style: 'Regular' };
  if (await tryLoadFont(sameFamilyRegular)) {
    warn('字体 ' + key + ' 不可用，已降级为 ' + font.family + ' Regular。');
    fontResolution[key] = sameFamilyRegular;
    return sameFamilyRegular;
  }

  var interRegular = { family: 'Inter', style: 'Regular' };
  if (await tryLoadFont(interRegular)) {
    warn('字体 ' + key + ' 及其 Regular 均不可用，已降级为 Inter Regular。');
    fontResolution[key] = interRegular;
    return interRegular;
  }

  var sys = await resolveSystemFallback();
  if (sys) {
    warn('字体 ' + key + ' 全链路不可用，已降级为系统字体 ' + sys.family + ' ' + sys.style + '。');
    fontResolution[key] = sys;
    return sys;
  }

  warn('字体 ' + key + ' 无任何可用降级，文本可能创建失败。');
  return null;
}

/** 遍历整棵树收集用到的字体。 */
function collectFonts(node, acc) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'TEXT' && node.text) {
    var font = { family: familyOf(node.text), style: weightToStyle(node.text.weight) };
    acc[fontKey(font)] = font;
  }
  var children = node.children;
  if (children && children.length) {
    for (var i = 0; i < children.length; i++) collectFonts(children[i], acc);
  }
}

/**
 * 一次性预加载全树字体。
 * 递归里逐个 await 会让上千个文本节点串行等待，导入时间从秒级掉到分钟级。
 */
async function preloadFonts(roots) {
  var acc = {};
  for (var i = 0; i < roots.length; i++) collectFonts(roots[i], acc);
  var keys = Object.keys(acc);
  if (!keys.length) return;
  log('预加载字体 ' + keys.length + ' 种…');
  // Inter Regular 是最终降级目标，先备好，省得后面反复探测。
  await tryLoadFont({ family: 'Inter', style: 'Regular' });
  for (var j = 0; j < keys.length; j++) {
    await resolveFont(acc[keys[j]]);
  }
}

// ---------------------------------------------------------------------------
// base64 / 图片
// ---------------------------------------------------------------------------

var B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * base64 -> Uint8Array。
 * Figma 插件沙箱通常提供 atob，优先用它（C++ 实现，快得多）；
 * 但 QuickJS 版本的沙箱历史上出现过缺失，所以保留手写解码兜底。
 */
function base64ToBytes(b64) {
  var clean = String(b64).replace(/[\r\n\s]/g, '');

  if (typeof atob === 'function') {
    try {
      var bin = atob(clean);
      var arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return arr;
    } catch (e) {
      // 落到手写实现再试一次。
    }
  }

  var stripped = clean.replace(/=+$/, '');
  var len = stripped.length;
  var outLen = Math.floor((len * 3) / 4);
  var out = new Uint8Array(outLen);
  var buffer = 0;
  var bits = 0;
  var p = 0;
  for (var k = 0; k < len; k++) {
    var idx = B64_CHARS.indexOf(stripped.charAt(k));
    if (idx < 0) continue; // 忽略非法字符，尽量把能解的解出来
    buffer = (buffer << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[p++] = (buffer >> bits) & 0xff;
    }
  }
  return p === outLen ? out : out.slice(0, p);
}

/** 从 dataUrl 中剥出 base64 负载。非 dataUrl 时当作裸 base64 处理。 */
function dataUrlToBytes(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  var comma = dataUrl.indexOf(',');
  var payload = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  if (comma >= 0 && dataUrl.slice(0, comma).indexOf('base64') < 0) {
    // 非 base64 编码的 dataUrl（如 utf8 的 svg）不在本管线约定内。
    return null;
  }
  var bytes = base64ToBytes(payload);
  return bytes && bytes.length ? bytes : null;
}

var VALID_SCALE_MODES = { FILL: 1, FIT: 1, CROP: 1, TILE: 1 };

/** IR 的 fit 映射到 Figma scaleMode。COVER/CONTAIN 是 CSS 说法，需要翻译。 */
function toScaleMode(fit) {
  if (typeof fit !== 'string') return 'FILL';
  var f = fit.toUpperCase();
  if (f === 'COVER') return 'FILL';
  if (f === 'CONTAIN') return 'FIT';
  if (VALID_SCALE_MODES[f]) return f;
  return 'FILL';
}

// ---------------------------------------------------------------------------
// 通用属性应用
// ---------------------------------------------------------------------------

/** 圆角：四值相同用 cornerRadius，否则逐角设置。 */
function applyCornerRadius(figNode, radius) {
  if (!radius || !radius.length) return;
  var tl = isNum(radius[0]) ? radius[0] : 0;
  var tr = isNum(radius[1]) ? radius[1] : 0;
  var br = isNum(radius[2]) ? radius[2] : 0;
  var bl = isNum(radius[3]) ? radius[3] : 0;

  try {
    if (tl === tr && tr === br && br === bl) {
      if ('cornerRadius' in figNode) figNode.cornerRadius = tl;
      return;
    }
    if ('topLeftRadius' in figNode) figNode.topLeftRadius = tl;
    if ('topRightRadius' in figNode) figNode.topRightRadius = tr;
    if ('bottomRightRadius' in figNode) figNode.bottomRightRadius = br;
    if ('bottomLeftRadius' in figNode) figNode.bottomLeftRadius = bl;
  } catch (e) {
    warn('圆角设置失败：' + (e && e.message ? e.message : e));
  }
}

/** 描边：IR 只允许单条 SOLID，对齐固定 INSIDE（与 CSS border-box 语义一致）。 */
function applyStroke(figNode, stroke) {
  if (!stroke) return;
  var rgb = hexToRgb(stroke.hex);
  if (!rgb) return;
  try {
    var paint = bindSolidToVariable(
      { type: 'SOLID', color: rgb, opacity: safeOpacity(stroke.opacity) },
      stroke.hex
    );
    figNode.strokes = [paint];
    if (isNum(stroke.weight) && stroke.weight > 0) figNode.strokeWeight = stroke.weight;
    figNode.strokeAlign = 'INSIDE';
  } catch (e) {
    warn('描边设置失败：' + (e && e.message ? e.message : e));
  }
}

/** 阴影等效果。IR 只覆盖 DROP_SHADOW / INNER_SHADOW。 */
function applyEffects(figNode, effects) {
  if (!effects || !effects.length) return;
  var out = [];
  for (var i = 0; i < effects.length; i++) {
    var e = effects[i];
    if (!e) continue;
    var rgb = hexToRgb(e.hex);
    if (!rgb) continue;
    var type = e.type === 'INNER_SHADOW' ? 'INNER_SHADOW' : 'DROP_SHADOW';
    out.push({
      type: type,
      color: { r: rgb.r, g: rgb.g, b: rgb.b, a: safeOpacity(e.opacity) },
      offset: { x: isNum(e.x) ? e.x : 0, y: isNum(e.y) ? e.y : 0 },
      radius: isNum(e.blur) ? Math.max(0, e.blur) : 0,
      spread: isNum(e.spread) ? e.spread : 0,
      visible: true,
      blendMode: 'NORMAL'
    });
  }
  if (!out.length) return;
  try {
    figNode.effects = out;
  } catch (err) {
    warn('效果设置失败：' + (err && err.message ? err.message : err));
  }
}

/**
 * 应用与节点类型无关的公共属性。
 * 注意：调用时机必须在 appendChild 之后，见 buildNode 的说明。
 */
function applyCommon(figNode, irNode) {
  if (typeof irNode.name === 'string' && irNode.name) {
    try {
      figNode.name = irNode.name;
    } catch (e) {}
  }

  if (isNum(irNode.opacity) && 'opacity' in figNode) {
    try {
      figNode.opacity = safeOpacity(irNode.opacity);
    } catch (e) {}
  }

  applyCornerRadius(figNode, irNode.cornerRadius);
  applyStroke(figNode, irNode.stroke);
  applyEffects(figNode, irNode.effects);
}

/** 尺寸。SVG 容器也走这里，保证与 IR 声明的包围盒一致。 */
function applySize(figNode, irNode) {
  if (typeof figNode.resize !== 'function') return;
  try {
    figNode.resize(safeSize(irNode.w), safeSize(irNode.h));
  } catch (e) {
    warn('resize 失败（' + (irNode.name || irNode.id) + '）：' + (e && e.message ? e.message : e));
  }
}

/** 位置。必须在 appendChild 之后调用。 */
function applyPosition(figNode, irNode) {
  try {
    figNode.x = isNum(irNode.x) ? irNode.x : 0;
    figNode.y = isNum(irNode.y) ? irNode.y : 0;
  } catch (e) {
    warn('定位失败（' + (irNode.name || irNode.id) + '）：' + (e && e.message ? e.message : e));
  }
}

// ---------------------------------------------------------------------------
// 各类型节点创建
// ---------------------------------------------------------------------------

var ALIGN_MAP = { LEFT: 'LEFT', CENTER: 'CENTER', RIGHT: 'RIGHT', JUSTIFIED: 'JUSTIFIED' };

/** FRAME：纯容器。子节点由 buildNode 递归处理。 */
function createFrame(irNode) {
  var frame = figma.createFrame();
  // createFrame 默认给一层白底，会盖住下层，必须显式清空再按 IR 赋值。
  frame.fills = [];
  frame.strokes = [];
  frame.clipsContent = irNode.clip === true;
  applySize(frame, irNode);
  var fills = buildFills(irNode.fills, irNode.w, irNode.h);
  if (fills.length) {
    try {
      frame.fills = fills;
    } catch (e) {
      warn('frame 填充失败（' + (irNode.name || irNode.id) + '）：' + (e && e.message ? e.message : e));
    }
  }
  return frame;
}

/**
 * TEXT：字体已在 preloadFonts 阶段加载完毕，这里同步查表即可。
 * 直接 await 会让长页面导入慢得离谱，所以此函数保持同步。
 */
function createText(irNode) {
  var spec = irNode.text || {};
  var node = figma.createText();

  var wanted = { family: familyOf(spec), style: weightToStyle(spec.weight) };
  var actual = fontResolution[fontKey(wanted)] || fontResolution[fontKey({ family: 'Inter', style: 'Regular' })];

  if (actual) {
    try {
      node.fontName = actual;
    } catch (e) {
      warn('字体应用失败（' + (irNode.name || irNode.id) + '）：' + (e && e.message ? e.message : e));
    }
  }

  // characters 必须在 fontName 生效后赋值，否则 Figma 会用未加载字体报错。
  try {
    node.characters = typeof spec.characters === 'string' ? spec.characters : '';
  } catch (e2) {
    warn('文案写入失败（' + (irNode.name || irNode.id) + '）：' + (e2 && e2.message ? e2.message : e2));
  }

  if (isNum(spec.size) && spec.size > 0) {
    try {
      node.fontSize = spec.size;
    } catch (e3) {}
  }

  if (isNum(spec.lineHeight) && spec.lineHeight > 0) {
    try {
      node.lineHeight = { unit: 'PIXELS', value: spec.lineHeight };
    } catch (e4) {}
  }

  if (isNum(spec.letterSpacing)) {
    try {
      node.letterSpacing = { unit: 'PIXELS', value: spec.letterSpacing };
    } catch (e5) {}
  }

  try {
    node.textAlignHorizontal = ALIGN_MAP[spec.align] || 'LEFT';
  } catch (e6) {}

  var rgb = hexToRgb(spec.hex);
  if (rgb) {
    try {
      node.fills = [
        bindSolidToVariable({ type: 'SOLID', color: rgb, opacity: safeOpacity(spec.opacity) }, spec.hex)
      ];
    } catch (e7) {}
  }

  // 先关掉自动尺寸，再按 IR 的包围盒定死，否则字体度量差异会把版面撑歪。
  try {
    node.textAutoResize = 'NONE';
  } catch (e8) {}
  applySize(node, irNode);

  return node;
}

/**
 * SVG：走 createNodeFromSvg 得到真矢量，这样开发能拿到路径、也能改色。
 * 解析失败时降级为同尺寸透明矩形，保住占位和布局。
 */
function createSvg(irNode) {
  var markup = irNode.svg;
  if (typeof markup === 'string' && markup.trim()) {
    try {
      var svgFrame = figma.createNodeFromSvg(markup);
      // createNodeFromSvg 返回 FrameNode，其内容会按容器缩放，resize 即可对齐 IR 尺寸。
      applySize(svgFrame, irNode);
      return svgFrame;
    } catch (e) {
      warn('SVG 解析失败，降级为占位矩形（' + (irNode.name || irNode.id) + '）：' + (e && e.message ? e.message : e));
    }
  } else {
    warn('SVG 内容缺失，降级为占位矩形（' + (irNode.name || irNode.id) + '）。');
  }

  var rect = figma.createRectangle();
  rect.fills = [];
  rect.strokes = [];
  applySize(rect, irNode);
  return rect;
}

/** IMAGE：矩形 + IMAGE fill。位图无法矢量化，只能作为参考底图。 */
function createImage(irNode) {
  var rect = figma.createRectangle();
  rect.fills = [];
  rect.strokes = [];
  applySize(rect, irNode);

  var spec = irNode.image || {};
  var bytes = null;
  try {
    bytes = dataUrlToBytes(spec.dataUrl);
  } catch (e) {
    bytes = null;
  }

  if (!bytes) {
    warn('图片数据无法解码，已留空矩形（' + (irNode.name || irNode.id) + '）。');
    return rect;
  }

  try {
    var image = figma.createImage(bytes);
    rect.fills = [
      {
        type: 'IMAGE',
        imageHash: image.hash,
        scaleMode: toScaleMode(spec.fit),
        opacity: 1
      }
    ];
  } catch (e2) {
    warn('图片写入失败（' + (irNode.name || irNode.id) + '）：' + (e2 && e2.message ? e2.message : e2));
  }
  return rect;
}

// ---------------------------------------------------------------------------
// 递归重建
// ---------------------------------------------------------------------------

/**
 * 依据 IR 节点创建 Figma 节点并挂到 parent 上。
 *
 * 关键顺序：创建 → appendChild → 设置 x/y。
 * Figma 在 appendChild 时会按父容器重新摆放子节点，
 * 若先设坐标再 append，坐标会被覆盖成 (0,0) 或父级布局位置。
 * 这是最常见的「导入后全部堆在左上角」的成因。
 */
function buildNode(irNode, parent) {
  if (!irNode || typeof irNode !== 'object') return null;

  var figNode = null;

  try {
    switch (irNode.type) {
      case 'TEXT':
        figNode = createText(irNode);
        break;
      case 'SVG':
        figNode = createSvg(irNode);
        break;
      case 'IMAGE':
        figNode = createImage(irNode);
        break;
      case 'FRAME':
      default:
        figNode = createFrame(irNode);
        break;
    }
  } catch (e) {
    warn('节点创建失败，已跳过该节点及其子树（' + (irNode.name || irNode.id || '?') + '）：' + (e && e.message ? e.message : e));
    return null;
  }

  try {
    parent.appendChild(figNode);
  } catch (e2) {
    warn('挂载失败（' + (irNode.name || irNode.id) + '）：' + (e2 && e2.message ? e2.message : e2));
    try {
      figNode.remove();
    } catch (e3) {}
    return null;
  }

  applyPosition(figNode, irNode);

  try {
    applyCommon(figNode, irNode);
  } catch (e4) {
    warn('公共属性设置失败（' + (irNode.name || irNode.id) + '）：' + (e4 && e4.message ? e4.message : e4));
  }

  createdCount++;

  // SVG 子树由 Figma 自己生成，不再递归 IR children，避免结构被污染。
  if (irNode.type !== 'SVG' && irNode.children && irNode.children.length) {
    if (typeof figNode.appendChild !== 'function') {
      warn('节点 ' + (irNode.name || irNode.id) + ' 类型为 ' + irNode.type + '，无法承载子节点，' + irNode.children.length + ' 个子节点被丢弃。');
      return figNode;
    }
    for (var i = 0; i < irNode.children.length; i++) {
      buildNode(irNode.children[i], figNode);
    }
  }

  return figNode;
}

// ---------------------------------------------------------------------------
// 导入编排
// ---------------------------------------------------------------------------

/** 统计 IR 子树节点数，仅用于进度显示。 */
function countNodes(node) {
  if (!node || typeof node !== 'object') return 0;
  var n = 1;
  // SVG 的 children 不会被重建，计数时也跳过，免得进度条永远走不满。
  if (node.type !== 'SVG' && node.children && node.children.length) {
    for (var i = 0; i < node.children.length; i++) n += countNodes(node.children[i]);
  }
  return n;
}

/**
 * 把一份 IR 文档重建为一个顶层 Frame。
 * offsetX 由调用方按「上一个 Frame 右边界 + 间距」算好，保证多文件不重叠。
 */
async function importDocument(ir, offsetX, fileLabel) {
  var meta = ir && ir.meta ? ir.meta : {};
  var name = typeof meta.name === 'string' && meta.name ? meta.name : fileLabel || 'untitled';

  log('▶ 开始导入 ' + name + (meta.url ? '（' + meta.url + '）' : ''));

  // 变量先建，后面 SOLID fill 才能在 buildNode 里同步命中映射表。
  await setupVariables(ir && ir.variables);

  var root = ir && ir.root;
  if (!root || typeof root !== 'object') {
    warn('文件 ' + name + ' 缺少 root 节点，已跳过。');
    return null;
  }

  var frame = figma.createFrame();
  frame.name = name;
  frame.fills = [];
  frame.strokes = [];
  // 顶层画板固定裁切，等价于浏览器视口边界，方便开发对照。
  frame.clipsContent = true;

  // 顶层尺寸优先用 meta，缺失时退回 root 自身包围盒。
  var W = isNum(meta.width) && meta.width > 0 ? meta.width : root.w;
  var H = isNum(meta.height) && meta.height > 0 ? meta.height : root.h;
  try {
    frame.resize(safeSize(W), safeSize(H));
  } catch (e) {
    warn('顶层画板 resize 失败：' + (e && e.message ? e.message : e));
  }

  // 先挂到 page 再定位，理由与 buildNode 相同。
  figma.currentPage.appendChild(frame);
  frame.x = offsetX;
  frame.y = 0;

  var total = countNodes(root);
  var before = createdCount;

  // root 本身作为顶层画板的唯一子节点重建，保留 IR 原始层级不做压平，
  // 这样开发在 Figma 里看到的结构与 DOM 结构一一对应，好定位。
  buildNode(root, frame);

  var made = createdCount - before;
  progress(made, total, name);
  log('✔ ' + name + ' 完成，创建 ' + made + ' / ' + total + ' 个节点。');

  return frame;
}

/**
 * 批量导入入口。
 * 全程不 throw：单个文件失败只记警告，其余文件照常导入。
 */
async function runImport(files) {
  warnings = [];
  createdCount = 0;

  if (!files || !files.length) {
    figma.notify('没有选择任何 JSON 文件。');
    figma.ui.postMessage({ type: 'done', ok: false });
    return;
  }

  log('共 ' + files.length + ' 个文件待导入。');

  // 解析放在最前面，任何 JSON 语法错误都在动手建图层之前暴露出来。
  var docs = [];
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    try {
      var ir = typeof f.json === 'string' ? JSON.parse(f.json) : f.json;
      if (!ir || typeof ir !== 'object') throw new Error('顶层不是对象');
      docs.push({ ir: ir, label: f.name || '文件' + (i + 1) });
    } catch (e) {
      warn('解析失败，已跳过 ' + (f && f.name ? f.name : '文件' + (i + 1)) + '：' + (e && e.message ? e.message : e));
    }
  }

  if (!docs.length) {
    figma.notify('所有文件都解析失败，未创建任何图层。');
    figma.ui.postMessage({ type: 'done', ok: false });
    return;
  }

  // 字体一次性全量预加载：跨文件去重，避免同一字体被反复探测。
  var roots = [];
  for (var r = 0; r < docs.length; r++) {
    if (docs[r].ir.root) roots.push(docs[r].ir.root);
  }
  try {
    await preloadFonts(roots);
  } catch (e2) {
    warn('字体预加载异常：' + (e2 && e2.message ? e2.message : e2));
  }

  var created = [];
  var offsetX = 0;
  var GAP = 80; // 画板间距，避免相邻页面视觉粘连

  for (var d = 0; d < docs.length; d++) {
    var frame = null;
    try {
      frame = await importDocument(docs[d].ir, offsetX, docs[d].label);
    } catch (e3) {
      warn('导入 ' + docs[d].label + ' 时发生异常：' + (e3 && e3.message ? e3.message : e3));
    }
    if (frame) {
      created.push(frame);
      offsetX = frame.x + frame.width + GAP;
    }
  }

  if (!created.length) {
    figma.notify('导入失败：未创建任何画板。');
    figma.ui.postMessage({ type: 'done', ok: false, warnings: warnings });
    return;
  }

  try {
    figma.currentPage.selection = created;
    figma.viewport.scrollAndZoomIntoView(created);
  } catch (e4) {
    warn('视口定位失败：' + (e4 && e4.message ? e4.message : e4));
  }

  var msg = '导入完成：' + created.length + ' 个画板，' + createdCount + ' 个节点，' + warnings.length + ' 条警告。';
  figma.notify(msg);
  log('—— ' + msg);

  // 警告在这里一次性回传 UI，逐条 notify 会把界面刷爆。
  figma.ui.postMessage({
    type: 'done',
    ok: true,
    frames: created.length,
    nodes: createdCount,
    warnings: warnings
  });
}

// ---------------------------------------------------------------------------
// UI 消息入口
// ---------------------------------------------------------------------------

figma.ui.onmessage = async function (msg) {
  if (!msg || typeof msg !== 'object') return;

  if (msg.type === 'import') {
    try {
      await runImport(msg.files);
    } catch (e) {
      // 兜底：即便编排层自己炸了，也要让 UI 从「导入中」状态里解锁。
      figma.notify('导入过程中发生未捕获错误，详见插件日志。');
      log('✖ 未捕获错误：' + (e && e.message ? e.message : e), 'warn');
      figma.ui.postMessage({ type: 'done', ok: false, warnings: warnings });
    }
    return;
  }

  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};



