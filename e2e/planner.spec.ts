import { test, expect } from '@playwright/test';

test.describe('플랜Bot', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows header and date', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('플랜Bot');
    await expect(page.locator('header')).toBeVisible();
  });

  test('shows mode selector with 3 options', async ({ page }) => {
    const buttons = page.locator('.apple-card button').filter({ hasText: /짧게|중간|길게/ });
    await expect(buttons).toHaveCount(3);
  });

  test('shows schedule input textarea', async ({ page }) => {
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute('placeholder', /일정을 자유롭게/);
  });

  test('parses schedule text in real-time', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('9시 투자자미팅');
    await expect(page.locator('text=인식된 일정')).toBeVisible();
    await expect(page.locator('text=투자자미팅')).toBeVisible();
    await expect(page.locator('text=09:00~10:00')).toBeVisible();
  });

  test('parse multiple schedules', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('9시 미팅\n11시 팀회의\n14시 프로젝트');
    await expect(page.locator('text=인식된 일정 (3개)')).toBeVisible();
  });

  test('shows error for invalid input', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('아무거나');
    await expect(page.locator('text=시간을 인식하지 못했어요')).toBeVisible();
  });

  test('analyze button is disabled when no schedule', async ({ page }) => {
    const btn = page.locator('button', { hasText: 'AI 분석하기' });
    await expect(btn).toBeDisabled();
  });

  test('analyze button enables with valid input', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('9시 미팅');
    const btn = page.locator('button', { hasText: 'AI 분석하기' });
    await expect(btn).toBeEnabled();
  });

  test('shows settings modal on gear click', async ({ page }) => {
    await page.locator('button[aria-label="설정"]').click();
    await expect(page.locator('text=API 설정')).toBeVisible();
  });

  test('theme toggle works', async ({ page }) => {
    const themeBtn = page.locator('button[aria-label="테마 전환"]');
    await themeBtn.click();
    const html = page.locator('html');
    const theme = await html.getAttribute('data-theme');
    expect(theme).toBeTruthy();
  });

  test('energy level selector exists', async ({ page }) => {
    const select = page.locator('select').filter({ hasText: /좋음|보통|낮음/ });
    await expect(select).toBeVisible();
  });

  test('mode selection persists', async ({ page }) => {
    // Click "길게"
    await page.locator('button', { hasText: '길게' }).click();
    // Check description
    await expect(page.locator('text=전체 브리핑')).toBeVisible();
  });

  test('drag handle visible on parsed items', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('9시 미팅\n11시 회의');
    await expect(page.locator('.drag-handle').first()).toBeVisible();
  });
});
