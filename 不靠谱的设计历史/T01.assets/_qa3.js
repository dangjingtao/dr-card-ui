const { chromium } = require('/Users/tao/Desktop/personal/uichat-mira/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/Users/tao/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const url = 'file://' + require('path').resolve('/Users/tao/Desktop/workspace/cardsUI/dist/T01.html');
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const info = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return {
      neutral200: root.getPropertyValue('--com-neutral-200'),
      warm50: root.getPropertyValue('--com-warm-50'),
      warm100: root.getPropertyValue('--com-warm-100'),
      premium200: root.getPropertyValue('--com-premium-200'),
      brand500: root.getPropertyValue('--com-brand-500'),
      brand200: root.getPropertyValue('--com-brand-200'),
      colorPrimary: root.getPropertyValue('--color-primary'),
      htmlClasses: document.documentElement.className,
      htmlDataTheme: document.documentElement.getAttribute('data-theme'),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
