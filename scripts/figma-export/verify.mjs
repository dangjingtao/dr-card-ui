// 保真度校验：把生成的 SVG 渲染出来，与真实 React 页面做像素比对。
// 这里的 PNG 只是校验中间物，不是交付物；交付物是 SVG / Figma 图层。
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'out');
const DIFF_DIR = path.join(OUT_DIR, 'verify');
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5175';

const TARGETS = [
  { name: 'home', url: '/?newcomer=off' },
  { name: 'points', url: '/points' },
];

const W = 375;
const H = 812;

async function main() {
  await mkdir(DIFF_DIR, { recursive: true });
  const browser = await chromium.launch();
  const results = [];

  for (const t of TARGETS) {
    const ctx = await browser.newContext({
      viewport: { width: W, height: H },
      deviceScaleFactor: 2,
    });

    // --- A. 真实页面 ---
    const pageA = await ctx.newPage();
    await pageA.goto(BASE_URL + t.url, { waitUntil: 'networkidle' });
    await pageA.waitForTimeout(1200);
    const bufA = await pageA.screenshot();
    await pageA.close();

    // --- B. 生成的 SVG ---
    const svg = await readFile(path.join(OUT_DIR, `${t.name}.svg`), 'utf8');
    const pageB = await ctx.newPage();
    await pageB.setContent(
      `<!doctype html><html><body style="margin:0;width:${W}px;height:${H}px;overflow:hidden">${svg}</body></html>`,
      { waitUntil: 'load' },
    );
    await pageB.waitForTimeout(800);
    const bufB = await pageB.screenshot();
    await pageB.close();
    await ctx.close();

    // --- C. 像素比对（在浏览器里用 canvas 做，避免引入图像库依赖）---
    const ctx2 = await browser.newContext({ viewport: { width: 100, height: 100 } });
    const pageC = await ctx2.newPage();
    const stats = await pageC.evaluate(async ({ a, b, w, h }) => {
      async function load(dataUrl) {
        const img = new Image();
        img.src = dataUrl;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        g.drawImage(img, 0, 0, w, h);
        return { canvas: c, data: g.getImageData(0, 0, w, h).data };
      }
      const A = await load(a);
      const B = await load(b);
      const n = w * h;
      let diffPixels = 0;
      let sumDelta = 0;
      // 差异热力图：红色标出偏差大的像素
      const heat = document.createElement('canvas');
      heat.width = w; heat.height = h;
      const hg = heat.getContext('2d');
      const hd = hg.createImageData(w, h);
      for (let i = 0; i < n; i += 1) {
        const o = i * 4;
        const dr = Math.abs(A.data[o] - B.data[o]);
        const dg = Math.abs(A.data[o + 1] - B.data[o + 1]);
        const db = Math.abs(A.data[o + 2] - B.data[o + 2]);
        const d = (dr + dg + db) / 3;
        sumDelta += d;
        // 阈值 12：低于此视为渲染噪声（抗锯齿、亚像素）
        if (d > 12) {
          diffPixels += 1;
          hd.data[o] = 255; hd.data[o + 1] = 0; hd.data[o + 2] = 0;
          hd.data[o + 3] = Math.min(255, 80 + d);
        } else {
          const gray = (A.data[o] + A.data[o + 1] + A.data[o + 2]) / 3;
          const light = 200 + gray * 0.2;
          hd.data[o] = light; hd.data[o + 1] = light; hd.data[o + 2] = light;
          hd.data[o + 3] = 255;
        }
      }
      hg.putImageData(hd, 0, 0);
      return {
        diffRatio: diffPixels / n,
        meanDelta: sumDelta / n,
        heat: heat.toDataURL('image/png'),
      };
    }, {
      a: 'data:image/png;base64,' + bufA.toString('base64'),
      b: 'data:image/png;base64,' + bufB.toString('base64'),
      w: W * 2,
      h: H * 2,
    });
    await pageC.close();
    await ctx2.close();

    await writeFile(path.join(DIFF_DIR, `${t.name}-react.png`), bufA);
    await writeFile(path.join(DIFF_DIR, `${t.name}-svg.png`), bufB);
    await writeFile(
      path.join(DIFF_DIR, `${t.name}-diff.png`),
      Buffer.from(stats.heat.split(',')[1], 'base64'),
    );

    results.push({ name: t.name, ...stats, heat: undefined });
    console.log(
      `[${t.name}] 差异像素 ${(stats.diffRatio * 100).toFixed(2)}%  平均色差 ${stats.meanDelta.toFixed(2)}/255`,
    );
  }

  await browser.close();
  console.log('\n对照图：' + DIFF_DIR);
  return results;
}

main().catch((e) => { console.error(e); process.exit(1); });
