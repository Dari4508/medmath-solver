import { test, expect } from '@playwright/test';

test.describe('MedMath Solver E2E', () => {
  test('loads home by default and shows preloaded cases', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#view-home')).toBeVisible();
    await expect(page.locator('#nav-home')).toHaveClass(/active/);
    await expect(page.locator('[data-i18n="home.title"]')).toHaveText('MedMath Solver');
    await page.click('#nav-cases');
    await expect(page.locator('#view-cases')).toBeVisible();
    await expect(page.locator('#cases-grid [role="button"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /D10W/ })).toBeVisible();
    await expect(page.locator('#cases-grid [role="button"]')).toHaveCount(5);
  });

  test('solves D10W case and shows verified solution', async ({ page }) => {
    await page.goto('/');
    await page.click('#nav-cases');
    await page.locator('#cases-grid [role="button"]', { hasText: 'D10W' }).click();
    await expect(page.locator('#view-solver')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#verification-status')).toContainText(/Verificado|Verified/, {
      timeout: 10000,
    });
    await expect(page.locator('#solution-panel')).toBeVisible();
    await expect(page.locator('#solution-values')).toContainText('55.55');
  });

  test('switches language ES <-> EN', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-i18n="nav.cases"]')).toHaveText('Casos');
    await page.selectOption('#lang-select', 'en');
    await expect(page.locator('[data-i18n="nav.cases"]')).toHaveText('Cases');
    await expect(page.locator('[data-i18n="tagline"]')).toContainText('Gaussian');
    await page.selectOption('#lang-select', 'es');
    await expect(page.locator('[data-i18n="nav.cases"]')).toHaveText('Casos');
  });

  test('free mode 2x2 solves inline with Gauss animation', async ({ page }) => {
    await page.goto('/');
    await page.click('#nav-free');
    await expect(page.locator('#view-free')).toBeVisible();
    await page.selectOption('#free-size', '2');
    await page.waitForTimeout(200);
    const cells = page.locator('#free-form input[type="number"]');
    expect(await cells.count()).toBe(6);
    // Order: a00, a01, b0, a10, a11, b1  (row-major with b after each row)
    await cells.nth(0).fill('2');
    await cells.nth(1).fill('1');
    await cells.nth(2).fill('3');
    await cells.nth(3).fill('1');
    await cells.nth(4).fill('-1');
    await cells.nth(5).fill('0');
    await page.click('#free-solve-btn');
    await expect(page.locator('#view-free')).toBeVisible();
    await expect(page.locator('#free-result-panel')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#free-badge')).toContainText(/Verificado|Verified/);
    await expect(page.locator('#free-matrix-canvas')).toBeVisible();
    await expect(page.locator('#free-solution-values')).toContainText('1.0000');
  });

  test('free mode loads example and solves verified', async ({ page }) => {
    await page.goto('/');
    await page.click('#nav-free');
    await page.selectOption('#free-size', '2');
    await page.waitForTimeout(200);
    await page.click('#free-example-btn');
    await expect(page.locator('#fm-0-0')).toHaveValue('1');
    await expect(page.locator('#fm-0-1')).toHaveValue('1');
    await expect(page.locator('#fm-1-0')).toHaveValue('0.9');
    await expect(page.locator('#fm-1-1')).toHaveValue('0');
    await expect(page.locator('#fv-0')).toHaveValue('1000');
    await expect(page.locator('#fv-1')).toHaveValue('450');
    await expect(page.locator('#free-context-panel')).toBeVisible();
    await expect(page.locator('#free-context-text')).toContainText('NaCl 0.45%');
    await page.click('#free-solve-btn');
    await expect(page.locator('#free-result-panel')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#free-badge')).toContainText(/Verificado|Verified/);
    await expect(page.locator('#free-solution-values')).toContainText('500.0000');
  });

  test('history view loads after calculation', async ({ page }) => {
    await page.goto('/');
    await page.click('#nav-cases');
    await page.locator('#cases-grid [role="button"]', { hasText: 'D10W' }).click();
    await expect(page.locator('#view-solver')).toBeVisible({ timeout: 10000 });
    await page.click('#nav-history');
    await expect(page.locator('#view-history')).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page.locator('#history-list [data-entry]').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('rate-limit badge updates and shows cooldown on 429', async ({ page }) => {
    await page.goto('/');
    await page.click('#nav-free');
    await page.selectOption('#free-size', '2');
    await page.waitForTimeout(200);
    await page.click('#free-example-btn');
    await page.click('#free-solve-btn');
    await expect(page.locator('#rate-badge')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#rate-badge')).toContainText(/(\d+\/\d+|Rate limit)/);

    const hit429 = await page.evaluate(async () => {
      let saw429 = false;
      for (let i = 0; i < 40; i++) {
        try {
          await api.calculateCustom([[1, 0], [0, 1]], [1, 1]);
        } catch (e) {
          if (e && e.name === 'RateLimitError') {
            saw429 = true;
            break;
          }
        }
      }
      return saw429;
    });
    expect(hit429).toBe(true);
    await expect(page.locator('#rate-badge')).toContainText(/Rate limit|0\/\d+/);
  });
});
