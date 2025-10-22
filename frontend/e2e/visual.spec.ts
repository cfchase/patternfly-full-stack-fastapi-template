import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from './helpers/auth';

/**
 * Visual testing suite for PatternFly component implementation.
 *
 * This test suite captures screenshots of all major PatternFly components
 * used in the application for visual comparison with official PatternFly demos
 * at https://www.patternfly.org/components/
 *
 * Screenshots are saved to: playwright-report/ or test-results/
 */

test.describe('PatternFly Component Screenshots', () => {

  test.describe('LoginPage Component', () => {
    test('capture login page', async ({ page }) => {
      await page.goto('/login');

      // Wait for page to fully load
      await expect(page.getByRole('heading', { name: 'Log in to your account' })).toBeVisible();

      // Capture full page
      await page.screenshot({
        path: 'screenshots/01-loginpage-default.png',
        fullPage: true
      });

      // Fill in some values to show the form states
      await page.getByLabel('Email').fill('user@example.com');
      await page.getByLabel('Password').fill('password123');
      await page.screenshot({
        path: 'screenshots/02-loginpage-filled.png',
        fullPage: true
      });

      // Show error state
      await page.getByRole('button', { name: 'Log in' }).click();
      await expect(page.getByText('Invalid email or password')).toBeVisible();
      await page.screenshot({
        path: 'screenshots/03-loginpage-error.png',
        fullPage: true
      });
    });
  });

  test.describe('Page Layout Components', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS.admin);
    });

    test('capture masthead with user dropdown', async ({ page }) => {
      await page.goto('/');

      // Capture masthead area
      const masthead = page.locator('header');
      await masthead.screenshot({
        path: 'screenshots/04-masthead-default.png'
      });

      // Open user dropdown
      await page.getByRole('button', { name: /Admin User|admin@example.com/ }).click();
      await page.screenshot({
        path: 'screenshots/05-masthead-dropdown-open.png',
        fullPage: true
      });
    });

    test('capture page with sidebar navigation', async ({ page }) => {
      await page.goto('/');

      // Full page with sidebar
      await page.screenshot({
        path: 'screenshots/06-page-with-sidebar.png',
        fullPage: true
      });

      // Expand Settings menu
      await page.getByRole('button', { name: 'Settings' }).click();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: 'screenshots/07-page-sidebar-expanded.png',
        fullPage: true
      });
    });
  });

  test.describe('Table Component (Composable)', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS.admin);
    });

    test('capture users management table', async ({ page }) => {
      await page.goto('/users');
      await page.waitForSelector('table', { timeout: 5000 });

      // Table with data
      await page.screenshot({
        path: 'screenshots/08-table-users-default.png',
        fullPage: true
      });

      // Hover over a row
      const firstRow = page.locator('tbody tr').first();
      await firstRow.hover();
      await page.screenshot({
        path: 'screenshots/09-table-users-row-hover.png',
        fullPage: true
      });
    });

    test('capture items table with owner column (admin view)', async ({ page }) => {
      await page.goto('/items');
      await page.waitForSelector('table', { timeout: 5000 });

      // Admin sees owner column
      await page.screenshot({
        path: 'screenshots/10-table-items-admin.png',
        fullPage: true
      });
    });

    test('capture items table without owner column (regular user view)', async ({ page }) => {
      // Logout and login as regular user
      await page.getByRole('button', { name: /Admin User|admin@example.com/ }).click();
      await page.getByRole('menuitem', { name: 'Logout' }).click();
      await login(page, TEST_USERS.regularUser1);

      await page.goto('/items');
      await page.waitForSelector('table', { timeout: 5000 });

      // Regular user doesn't see owner column
      await page.screenshot({
        path: 'screenshots/11-table-items-regular-user.png',
        fullPage: true
      });
    });
  });

  test.describe('Modal Component', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS.admin);
    });

    test('capture create user modal', async ({ page }) => {
      await page.goto('/users');
      await page.getByRole('button', { name: 'Create User' }).click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await page.screenshot({
        path: 'screenshots/12-modal-create-user-empty.png',
        fullPage: true
      });

      // Fill in the form
      await page.getByLabel('Email', { exact: true }).fill('newuser@example.com');
      await page.getByLabel('Full Name').fill('New User');
      await page.getByLabel('Password', { exact: true }).fill('password123');
      await page.getByLabel('Active').check();
      await page.screenshot({
        path: 'screenshots/13-modal-create-user-filled.png',
        fullPage: true
      });
    });

    test('capture edit user modal', async ({ page }) => {
      await page.goto('/users');

      // Click edit on first user
      const firstRow = page.locator('tbody tr').first();
      await firstRow.getByRole('button', { name: 'Edit' }).click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await page.screenshot({
        path: 'screenshots/14-modal-edit-user.png',
        fullPage: true
      });
    });

    test('capture create item modal', async ({ page }) => {
      await page.goto('/items');
      await page.getByRole('button', { name: 'Add Item' }).click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await page.screenshot({
        path: 'screenshots/15-modal-create-item.png',
        fullPage: true
      });
    });
  });

  test.describe('Form Component', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS.regularUser1);
    });

    test('capture profile information form', async ({ page }) => {
      await page.goto('/settings/profile');

      // Profile Information card
      const profileCard = page.locator('form').filter({ has: page.getByLabel('Full Name') }).locator('..');
      await page.screenshot({
        path: 'screenshots/16-form-profile-info.png',
        fullPage: true
      });
    });

    test('capture password change form', async ({ page }) => {
      await page.goto('/settings/profile');

      // Scroll to password section
      await page.getByLabel('Current Password').scrollIntoViewIfNeeded();
      await page.screenshot({
        path: 'screenshots/17-form-password-change.png',
        fullPage: true
      });
    });

    test('capture form with validation errors', async ({ page }) => {
      await page.goto('/settings/profile');

      // Try to change password with mismatched values
      await page.getByLabel('Current Password').fill('test');
      await page.getByLabel('New Password', { exact: true }).fill('short');
      await page.getByLabel('Confirm New Password').fill('different');

      const passwordSection = page.locator('form').filter({ has: page.getByLabel('Current Password') });
      await passwordSection.getByRole('button', { name: 'Change Password' }).click();

      // Wait for error message
      await expect(page.getByText('New passwords do not match')).toBeVisible();
      await page.screenshot({
        path: 'screenshots/18-form-validation-error.png',
        fullPage: true
      });
    });

    test('capture form with success alert', async ({ page }) => {
      await page.goto('/settings/profile');

      // Update profile name
      const newName = 'Screenshot Test User';
      await page.getByLabel('Full Name').fill(newName);

      const profileSection = page.locator('form').filter({ has: page.getByLabel('Full Name') });
      await profileSection.getByRole('button', { name: 'Update Profile' }).click();

      // Wait for success message
      await expect(page.getByText('Profile updated successfully')).toBeVisible();
      await page.screenshot({
        path: 'screenshots/19-form-success-alert.png',
        fullPage: true
      });
    });
  });

  test.describe('Toolbar Component', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS.regularUser1);
    });

    test('capture toolbar with search and button', async ({ page }) => {
      await page.goto('/items');
      await page.waitForSelector('table', { timeout: 5000 });

      // Toolbar area
      const toolbar = page.locator('[role="toolbar"], .pf-v6-c-toolbar').first();
      await toolbar.screenshot({
        path: 'screenshots/20-toolbar-default.png'
      });

      // Fill in search
      await page.getByPlaceholder('Search by title, ID, or description').fill('test search');
      await toolbar.screenshot({
        path: 'screenshots/21-toolbar-with-search.png'
      });
    });
  });

  test.describe('Drawer Component', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS.regularUser1);
    });

    test('capture drawer panel', async ({ page }) => {
      await page.goto('/items');
      await page.waitForSelector('table', { timeout: 5000 });

      // Create an item if none exist
      const rows = await page.locator('tbody tr').count();
      if (rows === 0) {
        await page.getByRole('button', { name: 'Add Item' }).click();
        await page.getByLabel('Title', { exact: true }).fill('Drawer Test Item');
        await page.getByRole('button', { name: 'Create' }).click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
      }

      // Click row to open drawer
      await page.locator('tbody tr').first().click();
      await page.waitForTimeout(500);

      // Drawer open
      await page.screenshot({
        path: 'screenshots/22-drawer-open.png',
        fullPage: true
      });
    });
  });

  test.describe('Alert Component', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS.admin);
    });

    test('capture success alert', async ({ page }) => {
      await page.goto('/users');

      // Create a user to trigger success alert
      const testEmail = `screenshot-${Date.now()}@example.com`;
      await page.getByRole('button', { name: 'Create User' }).click();
      await page.getByLabel('Email', { exact: true }).fill(testEmail);
      await page.getByLabel('Password', { exact: true }).fill('test123456');
      await page.getByRole('button', { name: 'Create', exact: true }).click();

      await expect(page.getByText('User created successfully')).toBeVisible();
      await page.screenshot({
        path: 'screenshots/23-alert-success.png',
        fullPage: true
      });
    });

    test('capture danger alert', async ({ page }) => {
      await page.goto('/settings/profile');

      // Trigger error by wrong password
      await page.getByLabel('Current Password').fill('wrongpassword');
      await page.getByLabel('New Password', { exact: true }).fill('newpassword123');
      await page.getByLabel('Confirm New Password').fill('newpassword123');

      const passwordSection = page.locator('form').filter({ has: page.getByLabel('Current Password') });
      await passwordSection.getByRole('button', { name: 'Change Password' }).click();

      await expect(page.getByText('Current password is incorrect')).toBeVisible();
      await page.screenshot({
        path: 'screenshots/24-alert-danger.png',
        fullPage: true
      });
    });

    test('capture warning alert (access denied)', async ({ page }) => {
      // Logout and login as regular user
      await page.getByRole('button', { name: /Admin User|admin@example.com/ }).click();
      await page.getByRole('menuitem', { name: 'Logout' }).click();
      await login(page, TEST_USERS.regularUser1);

      await page.goto('/users');

      await expect(page.getByText('Access Denied')).toBeVisible();
      await page.screenshot({
        path: 'screenshots/25-alert-warning-access-denied.png',
        fullPage: true
      });
    });
  });

  test.describe('Empty State Component', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS.regularUser1);
    });

    test('capture no search results empty state', async ({ page }) => {
      await page.goto('/items');

      // Search for nonexistent item
      await page.getByPlaceholder('Search by title, ID, or description').fill('xyznonexistent12345');

      await expect(page.getByRole('heading', { name: 'No items found' })).toBeVisible();
      await page.screenshot({
        path: 'screenshots/26-emptystate-no-results.png',
        fullPage: true
      });
    });
  });

  test.describe('Card Component', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS.regularUser1);
    });

    test('capture cards in profile settings', async ({ page }) => {
      await page.goto('/settings/profile');

      // Full page with both cards
      await page.screenshot({
        path: 'screenshots/27-cards-profile-settings.png',
        fullPage: true
      });
    });
  });

  test.describe('Dropdown Component', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS.admin);
    });

    test('capture user menu dropdown', async ({ page }) => {
      await page.goto('/');

      // Click to open dropdown
      await page.getByRole('button', { name: /Admin User|admin@example.com/ }).click();
      await page.waitForTimeout(200);

      // Capture dropdown menu
      await page.screenshot({
        path: 'screenshots/28-dropdown-user-menu.png',
        fullPage: true
      });
    });
  });
});
