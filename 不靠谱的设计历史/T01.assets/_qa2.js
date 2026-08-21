const { chromium } = require('/Users/tao/Desktop/personal/uichat-mira/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/Users/tao/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const url = 'file://' + require('path').resolve('/Users/tao/Desktop/workspace/cardsUI/dist/T01.html');
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  // 1) 检查 pin 容器渲染
  const info = await page.evaluate(() => {
    const pin = document.getElementById('pf-pin');
    const cells = pin.querySelectorAll('.pf-pin-cell');
    const styles = getComputedStyle(pin);
    const cellStyles = cells[0] ? getComputedStyle(cells[0]) : null;
    return {
      pinWidth: pin.offsetWidth,
      pinHeight: pin.offsetHeight,
      pinDisplay: styles.display,
      pinGridCols: styles.gridTemplateColumns,
      pinGap: styles.gap,
      cellCount: cells.length,
      cell0Width: cells[0]?.offsetWidth,
      cell0Height: cells[0]?.offsetHeight,
      cell0Border: cellStyles?.border,
      cell0Bg: cellStyles?.backgroundColor,
      cell0Class: cells[0]?.className,
      cell1Class: cells[1]?.className,
    };
  });
  console.log('PIN INFO:', JSON.stringify(info, null, 2));

  // 2) 试填 pin 看变化
  await page.click('.pf-pin');
  await page.keyboard.type('123456', { delay: 60 });
  await page.waitForTimeout(200);
  const info2 = await page.evaluate(() => {
    const cells = document.querySelectorAll('.pf-pin-cell');
    return Array.from(cells).map((c, i) => ({ i, cls: c.className, text: c.textContent, w: c.offsetWidth, h: c.offsetHeight }));
  });
  console.log('AFTER TYPE:', JSON.stringify(info2, null, 2));

  await browser.close();
})();
