import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 720 } });

test('verify all dashboard tabs', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Login
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'admin');
  await page.click('button[type="submit"]');

  // Wait for dashboard
  await page.waitForSelector('nav.left');
  await page.screenshot({ path: 'verification/screenshots/tab_dashboard.png' });

  // Messages Tab
  await page.click('a:has-text("Messages")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'verification/screenshots/tab_messages.png' });

  // Groups Tab
  await page.click('a:has-text("Groups")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'verification/screenshots/tab_groups.png' });

  // OSINT Tools Tab
  await page.click('a:has-text("OSINT Tools")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'verification/screenshots/tab_tools.png' });

  // Owner Panel Tab
  await page.click('a:has-text("Owner Panel")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'verification/screenshots/tab_owner.png' });

  // Settings Tab
  await page.click('a:has-text("Settings")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'verification/screenshots/tab_settings.png' });
});
