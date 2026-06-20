import { test, expect } from '@playwright/test';

test.describe('EduPath Comprehensive Use Case Tests', () => {

  test('Student Workspace & Kanban Use Cases', async ({ page }) => {
    // 1. Login as Student
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('student1@edupath.edu');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // 2. Navigate to Workspace (Kanban Board)
    await page.goto('/student/workspace');
    await expect(page).toHaveURL(/\/student\/workspace/);

    // Check Kanban columns are visible
    await expect(page.locator('span:has-text("Cần Làm")')).toBeVisible();
    await expect(page.locator('span:has-text("Đang Làm")')).toBeVisible();
    await expect(page.locator('span:has-text("Đã Xong")')).toBeVisible();

    // Open Create Task modal
    await page.locator('button:has-text("Tạo Task")').click();
    await expect(page.locator('h3:has-text("Tạo Nhiệm Vụ Mới")')).toBeVisible();

    // Fill in task info
    await page.locator('input[placeholder="Ví dụ: Thiết kế cơ sở dữ liệu MongoDB"]').fill('Viết E2E Test Playwright cho SWP');
    await page.locator('select').first().selectOption({ label: 'HTML5 Basics' });
    await page.locator('input[type="number"]').fill('45');
    
    // Close modal
    await page.locator('button:has-text("Hủy")').click();
    await expect(page.locator('h3:has-text("Tạo Nhiệm Vụ Mới")')).not.toBeVisible();
  });

  test('Student Pomodoro Timer Use Cases', async ({ page }) => {
    // 1. Login as Student
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('student1@edupath.edu');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // 2. Navigate to Pomodoro Focus page
    await page.goto('/student/pomodoro');
    await expect(page).toHaveURL(/\/student\/pomodoro/);

    // Verify Pomodoro elements
    await expect(page.locator('button:has-text("Tập trung")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Bắt đầu")')).toBeVisible();
    await expect(page.locator('h4:has-text("Phiên học tập gần đây")')).toBeVisible();
  });

  test('Student Leaderboard Use Cases', async ({ page }) => {
    // 1. Login as Student
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('student1@edupath.edu');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // 2. Navigate to Leaderboard
    await page.goto('/student/achievements/leaderboard');
    await expect(page).toHaveURL(/\/student\/achievements\/leaderboard/);

    // Verify Leaderboard podium and columns
    await expect(page.locator('h2:has-text("Bảng Xếp Hạng Học Tập")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('span:has-text("Xếp hạng các vị trí tiếp theo")')).toBeVisible();
    await expect(page.locator('span:has-text("Chuỗi học")').first()).toBeVisible();
  });

  test('Student Profile & Settings Use Cases', async ({ page }) => {
    // 1. Login as Student
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('student1@edupath.edu');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // 2. Navigate to Profile Settings
    await page.goto('/student/profile');
    await expect(page).toHaveURL(/\/student\/profile/);

    // Verify Profile settings forms
    await expect(page.locator('h1:has-text("Hồ sơ & Thiết lập tài khoản")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('label:has-text("Họ và tên")')).toBeVisible();
    await expect(page.locator('label:has-text("Mục tiêu học tập dài hạn")')).toBeVisible();
    await expect(page.locator('h3:has-text("Người hướng dẫn (Mentor)")')).toBeVisible();
  });

  test('Mentor Portal Use Cases', async ({ page }) => {
    // 1. Login as Mentor
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('mentor1@edupath.edu');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/mentor\/dashboard/);

    // 2. Verify Mentor Dashboard content
    await expect(page.locator('h2:has-text("Sinh viên phụ trách học thuật")')).toBeVisible();
    await expect(page.locator('span:has-text("Trường hợp cảnh báo đỏ")')).toBeVisible();
    await expect(page.locator('span:has-text("Mức rủi ro trung bình")')).toBeVisible();

    // 3. Navigate to Knowledge Bank
    await page.goto('/mentor/knowledge-bank');
    await expect(page).toHaveURL(/\/mentor\/knowledge-bank/);
    await expect(page.locator('h1:has-text("Ngân hàng tài liệu học tập")')).toBeVisible({ timeout: 15000 });

    // 4. Navigate to Quiz Bank
    await page.goto('/mentor/quiz-bank');
    await expect(page).toHaveURL(/\/mentor\/quiz-bank/);
    await expect(page.locator('h1:has-text("Ngân hàng câu hỏi trắc nghiệm")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Tạo câu hỏi bằng AI")')).toBeVisible();
  });

  test('Admin Portal Use Cases', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('admin@edupath.edu');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/admin/);

    // 2. Verify Admin Dashboard content
    await expect(page.locator('span:has-text("Tổng người dùng")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('span:has-text("Hoạt động hôm nay")')).toBeVisible();
    await expect(page.locator('span:has-text("Lượt làm Quiz")')).toBeVisible();
    await expect(page.locator('span:has-text("Rủi ro trung bình")')).toBeVisible();

    // 3. Navigate to User Management
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.locator('h1:has-text("Quản trị tài khoản người dùng")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Quyền Hạn")')).toBeVisible();

    // 4. Navigate to Skill Taxonomy Editor
    await page.goto('/admin/skills');
    await expect(page).toHaveURL(/\/admin\/skills/);
    await expect(page.locator('h1:has-text("Cây kỹ năng và Phân loại học thuật")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Thêm kỹ năng mới")')).toBeVisible();
  });

});
