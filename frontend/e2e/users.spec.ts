import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from './helpers/auth';

test.describe('Users Management (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await login(page, TEST_USERS.admin);
    await page.goto('/users');
  });

  test('displays users management page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Users Management', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create User' })).toBeVisible();
  });

  test('displays users table with correct columns', async ({ page }) => {
    // Check table headers
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Full Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Active' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Superuser' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible();

    // Check that at least admin user exists
    await expect(page.getByRole('cell', { name: TEST_USERS.admin.email })).toBeVisible();
  });

  test('can create a new user', async ({ page }) => {
    const newUserEmail = `testuser-${Date.now()}@example.com`;
    const newUserName = 'Test User Created';

    // Click Create User button
    await page.getByRole('button', { name: 'Create User' }).click();

    // Wait for modal to appear
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Create User')).toBeVisible();

    // Fill in the form
    await page.getByLabel('Email', { exact: true }).fill(newUserEmail);
    await page.getByLabel('Full Name').fill(newUserName);
    await page.getByLabel('Password', { exact: true }).fill('testpassword123');

    // Submit the form
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // Wait for modal to close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Check for success message
    await expect(page.getByText('User created successfully')).toBeVisible();

    // Verify the user appears in the table
    await expect(page.getByRole('cell', { name: newUserEmail })).toBeVisible();
    await expect(page.getByRole('cell', { name: newUserName })).toBeVisible();
  });

  test('can create a superuser', async ({ page }) => {
    const newUserEmail = `superuser-${Date.now()}@example.com`;

    // Click Create User button
    await page.getByRole('button', { name: 'Create User' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill in the form
    await page.getByLabel('Email', { exact: true }).fill(newUserEmail);
    await page.getByLabel('Password', { exact: true }).fill('testpassword123');

    // Check the Superuser checkbox
    await page.getByLabel('Superuser').check();

    // Submit the form
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // Wait for modal to close and success message
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('User created successfully')).toBeVisible();

    // Find the user row and verify Superuser column shows "Yes"
    const userRow = page.locator('tbody tr').filter({ hasText: newUserEmail });
    await expect(userRow.locator('td').nth(3)).toHaveText('Yes'); // Superuser column
  });

  test('can edit an existing user', async ({ page }) => {
    // Find a regular user to edit (not admin)
    const userRow = page.locator('tbody tr').filter({ hasText: TEST_USERS.regularUser1.email });
    await expect(userRow).toBeVisible();

    // Click Edit button
    await userRow.getByRole('button', { name: 'Edit' }).click();

    // Wait for modal to appear
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Edit User')).toBeVisible();

    // Update the full name
    const updatedName = `Updated User ${Date.now()}`;
    await page.getByLabel('Full Name').fill(updatedName);

    // Submit the form
    await page.getByRole('button', { name: 'Update' }).click();

    // Wait for modal to close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Check for success message
    await expect(page.getByText('User updated successfully')).toBeVisible();

    // Verify the name was updated
    await expect(page.getByRole('cell', { name: updatedName })).toBeVisible();
  });

  test('can delete a user', async ({ page }) => {
    // First create a test user to delete
    const testUserEmail = `delete-test-${Date.now()}@example.com`;

    await page.getByRole('button', { name: 'Create User' }).click();
    await page.getByLabel('Email', { exact: true }).fill(testUserEmail);
    await page.getByLabel('Password', { exact: true }).fill('testpassword123');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Find the user we just created
    const userRow = page.locator('tbody tr').filter({ hasText: testUserEmail });
    await expect(userRow).toBeVisible();

    // Set up dialog handler for confirmation
    page.on('dialog', dialog => dialog.accept());

    // Click Delete button
    await userRow.getByRole('button', { name: 'Delete' }).click();

    // Check for success message
    await expect(page.getByText('User deleted successfully')).toBeVisible();

    // Verify user is no longer in the table
    await expect(page.getByRole('cell', { name: testUserEmail })).not.toBeVisible();
  });

  test('cannot delete own account', async ({ page }) => {
    // Find admin user row
    const adminRow = page.locator('tbody tr').filter({ hasText: TEST_USERS.admin.email });

    // Delete button should be disabled
    await expect(adminRow.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  test('can toggle user active status', async ({ page }) => {
    // Create a test user
    const testUserEmail = `toggle-test-${Date.now()}@example.com`;

    await page.getByRole('button', { name: 'Create User' }).click();
    await page.getByLabel('Email', { exact: true }).fill(testUserEmail);
    await page.getByLabel('Password', { exact: true }).fill('testpassword123');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Find the user and click Edit
    const userRow = page.locator('tbody tr').filter({ hasText: testUserEmail });
    await userRow.getByRole('button', { name: 'Edit' }).click();

    // Uncheck Active
    await page.getByLabel('Active').uncheck();

    // Submit
    await page.getByRole('button', { name: 'Update' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify Active column shows "No"
    await expect(userRow.locator('td').nth(2)).toHaveText('No'); // Active column
  });

  test('password field shows placeholder in edit mode', async ({ page }) => {
    // Click Edit on any user
    const userRow = page.locator('tbody tr').filter({ hasText: TEST_USERS.regularUser1.email });
    await userRow.getByRole('button', { name: 'Edit' }).click();

    // Check that password field has placeholder text
    const passwordInput = page.getByLabel('Password', { exact: true });
    await expect(passwordInput).toHaveAttribute('placeholder', 'Leave blank to keep current password');

    // Password field should be empty
    await expect(passwordInput).toHaveValue('');
  });
});

test.describe('Users Management (Access Control)', () => {
  test('regular users cannot access users management page', async ({ page }) => {
    // Login as regular user
    await login(page, TEST_USERS.regularUser1);
    await page.goto('/users');

    // Should see access denied message
    await expect(page.getByText('Access Denied')).toBeVisible();
    await expect(page.getByText('You must be an administrator to access this page')).toBeVisible();

    // Should NOT see users table or create button
    await expect(page.getByRole('button', { name: 'Create User' })).not.toBeVisible();
  });

  test('users menu is only visible to admins', async ({ page }) => {
    // Login as regular user
    await login(page, TEST_USERS.regularUser1);
    await page.goto('/');

    // Users link should not be in navigation
    await expect(page.getByRole('link', { name: 'Users' })).not.toBeVisible();

    // Logout and login as admin
    await page.getByRole('button', { name: /John Smith|john.smith@example.com/ }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    await login(page, TEST_USERS.admin);

    // Users link should be visible
    await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
  });
});
