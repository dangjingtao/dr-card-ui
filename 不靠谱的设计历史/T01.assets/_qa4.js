const { chromium } = require('/Users/tao/Desktop/personal/uichat-mira/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/Users/tao/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('console', m => console.log(`[${m.type()}] ${m.text()}`));
  const url = 'file://' + require('path').resolve('/Users/tao/Desktop/workspace/cardsUI/dist/T01.html');
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  // 1) 试 fill 隐藏 input
  await page.evaluate(() => {
    const el = document.getElementById('pf-pin-input');
    el.removeAttribute('readonly');
    el.style.pointerEvents = 'auto';
    el.style.opacity = '1';
    el.style.width = '300px';
    el.style.height = '40px';
    el.style.position = 'static';
  });
  await page.fill('#pf-pin-input', '123456');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/Users/tao/Desktop/workspace/cardsUI/dist/T01.assets/qa-t01-pin-via-fill.png' });

  // 2) 再用 keyboard.type 直接打到 pin 容器(用 focus + 真实 input)
  const after = await page.evaluate(() => {
    const cells = document.querySelectorAll('.pf-pin-cell');
    return Array.from(cells).map(c => c.textContent || '').join(',');
  });
  console.log('AFTER FILL:', after);

  await browser.close();
})();
