import { test, expect } from '@playwright/test';

const requireRecruitment = process.env.REQUIRE_RECRUITMENT_E2E === '1';
const requireAdmin = process.env.REQUIRE_ADMIN_E2E === '1';
const hasAdminCredentials = Boolean(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD);

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.E2E_ADMIN_EMAIL!);
  await page.getByLabel('Password').fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: /Enter Studio/i }).click();
  await expect(page).toHaveURL(/\/admin(?:\/|$)/);
}

test.describe('visitor flows', () => {
  test('Visitor opens home', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/No Flaws|MLBB Squad Archive/i);
    await expect(page.getByText('No Flaws', { exact: false }).first()).toBeVisible();
  });

  test('Visitor searches roster', async ({ page }) => {
    await page.goto('/roster');
    const search = page.getByPlaceholder(/Search player, hero, role/i);
    await expect(search).toBeVisible();
    await search.fill('RYUU');
    await expect(page.getByRole('button', { name: /Open RYUU profile/i })).toHaveCount(1);
  });

  test('Visitor opens member', async ({ page }) => {
    await page.goto('/member/ryuu');
    await expect(page).toHaveURL(/\/member\/ryuu$/);
    await expect(page.getByText('RYUU', { exact: false }).first()).toBeVisible();
  });

  test('Visitor submits recruitment', async ({ page }) => {
    await page.goto('/recruitment');
    const form = page.locator('form').filter({ has: page.locator('input[name="fullName"]') });
    const hasForm = await form.count();
    if (!hasForm) {
      if (requireRecruitment) throw new Error('Recruitment E2E requires an active recruitment job in the E2E environment.');
      test.skip(true, 'No active recruitment job in this E2E environment.');
    }

    await page.route('**/api/recruitment', async (route) => {
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await form.getByLabel(/Full name/i).fill('Phase 12 QA Player');
    await form.getByLabel(/Nickname/i).fill('PHASE12');
    await form.getByLabel(/Email/i).fill('phase12@example.com');
    await form.getByLabel(/Phone/i).fill('+628123456789');
    await form.getByLabel(/Preferred role/i).selectOption('MID');
    await form.locator('input[name="resume"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n', 'utf8'),
    });
    await form.getByLabel(/Cover letter/i).fill('This is a Phase 12 automated browser test application.');
    await form.getByRole('button', { name: /Submit application/i }).click();
    await expect(page).toHaveURL(/\/recruitment\/success$/);
  });
});

test.describe('admin flows', () => {
  test.beforeEach(async () => {
    if (!hasAdminCredentials && requireAdmin) {
      throw new Error('Admin E2E is required but E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD are not configured.');
    }
  });

  test('Admin logs in', async ({ page }) => {
    test.skip(!hasAdminCredentials, 'Admin credentials are not configured for this environment.');
    await loginAsAdmin(page);
  });

  test('Admin sees application inbox', async ({ page }) => {
    test.skip(!hasAdminCredentials, 'Admin credentials are not configured for this environment.');
    await loginAsAdmin(page);
    await page.goto('/admin/recruitment');
    await expect(page.getByText('RECRUITMENT INBOX', { exact: true })).toBeVisible();
  });

  test('Admin updates content', async ({ page }) => {
    test.skip(!hasAdminCredentials, 'Admin credentials are not configured for this environment.');
    await loginAsAdmin(page);
    await page.goto('/admin/roster');
    await page.getByRole('button', { name: 'Members', exact: true }).click();
    await expect(page.getByText(/Member editor/i)).toBeVisible();

    const nickname = page.getByLabel('Nickname').first();
    const original = await nickname.inputValue();
    await nickname.fill(`${original}-QA`);
    await expect(page.getByText('Unsaved draft', { exact: true })).toBeVisible();

    await page.route('**/api/admin/content', async (route) => {
      if (route.request().method() !== 'PUT') return route.continue();
      const body = route.request().postDataJSON() as Record<string, unknown>;
      expect(body.members).toBeTruthy();
      const responseBody = {
        profile: body.profile ?? { name: 'No Flaws', tagline: '', season: '2026', instagram: '#', tiktok: '#', youtube: '#' },
        members: body.members,
        achievements: [],
        gallery: [],
      };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseBody) });
    });

    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    await page.getByRole('button', { name: /^Publish$/ }).click();
    await expect(page.getByText('Published successfully.', { exact: true })).toBeVisible();
  });
});
