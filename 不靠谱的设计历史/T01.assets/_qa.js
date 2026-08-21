const { chromium } = require('/Users/tao/Desktop/personal/uichat-mira/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/Users/tao/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('console', m => console.log(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => console.log(`[error] ${e.message}`));

  const url = 'file://' + require('path').resolve('/Users/tao/Desktop/workspace/cardsUI/dist/T01.html');
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // 1) 基础态
  await page.screenshot({ path: '/Users/tao/Desktop/workspace/cardsUI/dist/T01.assets/qa-t01-375x812.png' });
  // 2) full page
  await page.screenshot({ path: '/Users/tao/Desktop/workspace/cardsUI/dist/T01.assets/qa-t01-fullpage.png', fullPage: true });

  // 3) 切换性别
  await page.click('.pf-radio[data-value="女"]');
  await page.waitForTimeout(150);
  await page.screenshot({ path: '/Users/tao/Desktop/workspace/cardsUI/dist/T01.assets/qa-t01-radio-female.png' });

  // 4) 填昵称
  await page.fill('#pf-nick', '诗得丽小芽');
  await page.waitForTimeout(150);

  // 5) 触发 pin 输入(点方块 → focus 容器 → keyboard.type)
  await page.click('#pf-pin');
  await page.waitForTimeout(100);
  await page.keyboard.type('123', { delay: 80 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/Users/tao/Desktop/workspace/cardsUI/dist/T01.assets/qa-t01-pin-123.png' });

  // 6) 全部填写 + submit
  await page.keyboard.type('456', { delay: 80 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/Users/tao/Desktop/workspace/cardsUI/dist/T01.assets/qa-t01-filled.png' });

  await browser.close();
  console.log('DONE');
})();
