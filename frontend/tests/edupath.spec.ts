import { test, expect } from '@playwright/test';

test.describe('EduPath End-to-End System Tests', () => {
  test('should navigate to the landing page and display correct titles', async ({ page }) => {
    // 1. Visit landing page
    await page.goto('/');

    // 2. Check title contains EduPath
    await expect(page).toHaveTitle(/EduPath/i);

    // 3. Check for FPT University header text
    const heroHeading = page.locator('h1:has-text("FPT University")');
    await expect(heroHeading).toBeVisible();

    // 4. Verify presence of student role card entry button
    const studentBtn = page.locator('button:has-text("Vào học ngay")');
    await expect(studentBtn).toBeVisible();
  });

  test('should allow a student to log in and access the dashboard', async ({ page }) => {
    // 1. Visit landing page
    await page.goto('/');

    // 2. Click login navbar button
    const loginLink = page.locator('header a button:has-text("Đăng nhập")');
    await loginLink.click();

    // 3. Verify landing on login page
    await expect(page).toHaveURL(/\/login/);

    // 4. Fill in student login credentials
    await page.locator('input[type="email"]').fill('student1@edupath.edu');
    await page.locator('input[type="password"]').fill('password123');

    // 5. Submit form
    await page.locator('form button[type="submit"]').click();

    // 6. Verify transition to student dashboard
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // 7. Verify dashboard elements are loaded
    // Goal text section
    const goalSection = page.locator('span:has-text("Mục tiêu của bạn")');
    await expect(goalSection).toBeVisible();

    // Stats widgets (Study time, Completed tasks, Streak, Skills tracking)
    const focusTimeWidget = page.locator('span:has-text("Thời gian học")');
    await expect(focusTimeWidget).toBeVisible();

    const tasksWidget = page.locator('span:has-text("Hoàn thành")');
    await expect(tasksWidget).toBeVisible();

    const streakWidget = page.locator('span:has-text("Học tập liên tục")');
    await expect(streakWidget).toBeVisible();

    const skillsWidget = page.locator('span:has-text("Theo dõi kỹ năng")');
    await expect(skillsWidget).toBeVisible();
  });
});
