import { test, expect } from '@playwright/test';

test.describe('MedMath Solver E2E', () => {
  test('loads and shows preloaded cases', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#cases-grid [role="button"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /D10W/ })).toBeVisible();
  });

  test('solves D10W case and shows verified solution', async ({ page }) => {
    await page.goto('/');
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

  test('free mode 2x2 solves', async ({ page }) => {
    await page.goto('/');
    await page.click('#nav-free');
    await expect(page.locator('#view-free')).toBeVisible();
    await page.selectOption('#free-size', '2');
    await page.waitForTimeout(200);
    const cells = page.locator('#free-form input[type="number"]');
    const count = await cells.count();
    expect(count).toBe(6);
    await cells.nth(0).fill('2');
    await cells.nth(1).fill('1');
    await cells.nth(2).fill('1');
    await cells.nth(3).fill('-1');
    await cells.nth(4).fill('3');
    await cells.nth(5).fill('0');
    await page.click('button[data-i18n="free.solve"]');
    await expect(page.locator('#view-solver')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#verification-status')).toContainText(/Verificado|Verified/, {
      timeout: 10000,
    });
  });

  test('history view loads after calculation', async ({ page }) => {
    await page.goto('/');
    await page.locator('#cases-grid [role="button"]', { hasText: 'D10W' }).click();
    await expect(page.locator('#view-solver')).toBeVisible({ timeout: 10000 });
    await page.click('#nav-history');
    await expect(page.locator('#view-history')).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page.locator('#history-list [data-entry]').first()).toBeVisible({
      timeout: 10000,
    });
  });
});
