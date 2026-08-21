import asyncio
from playwright.async_api import async_playwright
import os, sys

async def main():
    html_path = os.path.abspath("/Users/tao/Desktop/workspace/cardsUI/dist/T01.html")
    url = "file://" + html_path
    out_dir = "/Users/tao/Desktop/workspace/cardsUI/dist/T01.assets"
    os.makedirs(out_dir, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(
            viewport={"width": 375, "height": 812},
            device_scale_factor=2,
        )
        page = await ctx.new_page()
        await page.goto(url, wait_until="networkidle")
        await page.wait_for_timeout(500)
        # 1) 375x812 视口截图(基础态)
        await page.screenshot(path=os.path.join(out_dir, "qa-t01-375x812.png"))
        # 2) full_page 看是否有滚动
        await page.screenshot(path=os.path.join(out_dir, "qa-t01-fullpage.png"), full_page=True)
        # 3) 调试:打印 console 错误
        page.on("console", lambda m: print(f"[{m.type}] {m.text}"))
        # 4) 模拟"女"被点击,确认 radio 视觉切换
        await page.click('.pf-radio[data-value="女"]')
        await page.wait_for_timeout(200)
        await page.screenshot(path=os.path.join(out_dir, "qa-t01-radio-female.png"))
        # 5) 在 pin 输入 123
        await page.click('.pf-pin')
        await page.keyboard.type("123", delay=80)
        await page.wait_for_timeout(200)
        await page.screenshot(path=os.path.join(out_dir, "qa-t01-pin-123.png"))
        # 6) 填昵称
        await page.fill("#pf-nick", "诗得丽小芽🌱")
        await page.wait_for_timeout(200)
        await page.screenshot(path=os.path.join(out_dir, "qa-t01-filled.png"))
        await browser.close()
        print("DONE")

asyncio.run(main())
