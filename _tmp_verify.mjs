import { chromium } from "playwright";

const BASE = "https://health-dashboard-navy-one.vercel.app";
const dir = "C:/Users/moony/AppData/Local/Temp/claude/c--landingpage/43d97589-128e-43d3-bbb8-b9de5f36ae3a/scratchpad";
const email = `verify_${Date.now()}@example.com`;
const password = "Test1234!";

const browser = await chromium.launch();
const desktop = { width: 1280, height: 900 };
const mobile = { width: 390, height: 844 };

async function shoot(page, name, viewport) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
}

const page = await browser.newPage({ viewport: mobile });
page.on("console", (m) => console.log("BROWSER:", m.type(), m.text()));

await page.goto(`${BASE}/register`);
await page.fill('#email', email);
await page.fill('#password', password);
await page.fill('#name', "검증");
await page.click('button[type="submit"]');
await page.waitForTimeout(2000);
console.log("after register:", page.url());

await page.goto(`${BASE}/login`);
await page.fill('#email', email);
await page.fill('#password', password);
console.log("login buttons:", await page.locator('button').allTextContents());
await page.click('button:has-text("로그인")');
await page.waitForTimeout(2000);
console.log("after login:", page.url());

// mobile nav: home page, hamburger closed then open
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await shoot(page, "v1_home_mobile_navclosed", mobile);
const hamburger = page.locator('button[aria-label="메뉴 열기"]');
const hamburgerCount = await hamburger.count();
console.log("hamburger count:", hamburgerCount);
if (hamburgerCount > 0) {
  await hamburger.click();
  await page.waitForTimeout(300);
  await shoot(page, "v2_home_mobile_navopen", mobile);
}

// exercise row checkbox fix - desktop (sm:grid-cols-7 only kicks in at sm+)
await page.setViewportSize(desktop);
await page.goto(`${BASE}/log/new`);
await page.waitForTimeout(600);
const addBtn = page.locator('text=Y-W-T 교정 운동').locator('xpath=..').locator('text=+');
if (await addBtn.count() > 0) await addBtn.first().click();
await page.waitForTimeout(300);
await shoot(page, "v3_log_new_exercise_row_desktop", desktop);

// tablet width (640-1024) where sm: breakpoint is active but narrower than full desktop
await shoot(page, "v4_log_new_exercise_row_tablet", { width: 700, height: 900 });

// routines/new copy fix
await page.goto(`${BASE}/routines/new`);
await page.waitForTimeout(600);
await shoot(page, "v5_routines_new_desktop", desktop);

// dashboard empty state
await page.goto(`${BASE}/dashboard`);
await page.waitForTimeout(800);
await shoot(page, "v6_dashboard_desktop", desktop);

await browser.close();
console.log("verify done");
