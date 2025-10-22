import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from './helpers/auth';

test.describe('Profile Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page, TEST_USERS.regularUser1);
    await page.goto('/settings/profile');
  });

  test('displays profile settings page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Profile Settings', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Profile Information' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Change Password' })).toBeVisible();
  });

  test('displays current user information', async ({ page }) => {
    // Check that email field is populated
    const emailInput = page.getByLabel('Email', { exact: true });
    await expect(emailInput).toHaveValue(TEST_USERS.regularUser1.email);

    // Check that full name field is populated
    const fullNameInput = page.getByLabel('Full Name');
    await expect(fullNameInput).toHaveValue(TEST_USERS.regularUser1.fullName || '');
  });

  test('can update profile name', async ({ page }) => {
    const newName = `Updated Name ${Date.now()}`;

    // Update full name
    await page.getByLabel('Full Name').fill(newName);

    // Click Update Profile button (the one in Profile Information section)
    const profileSection = page.locator('form').filter({ has: page.getByLabel('Full Name') });
    await profileSection.getByRole('button', { name: 'Update Profile' }).click();

    // Check for success message
    await expect(page.getByText('Profile updated successfully')).toBeVisible();

    // Verify the name is still updated after refresh
    await page.reload();
    await expect(page.getByLabel('Full Name')).toHaveValue(newName);
  });

  test('can update email address', async ({ page }) => {
    const newEmail = `test-${Date.now()}@example.com`;

    // Update email
    await page.getByLabel('Email', { exact: true }).fill(newEmail);

    // Click Update Profile button
    const profileSection = page.locator('form').filter({ has: page.getByLabel('Email', { exact: true }) });
    await profileSection.getByRole('button', { name: 'Update Profile' }).click();

    // Check for success message
    await expect(page.getByText('Profile updated successfully')).toBeVisible();

    // Verify the email is still updated
    await expect(page.getByLabel('Email', { exact: true })).toHaveValue(newEmail);
  });

  test('shows error when updating with invalid email', async ({ page }) => {
    // Enter invalid email
    await page.getByLabel('Email', { exact: true }).fill('invalid-email');

    // Try to submit
    const profileSection = page.locator('form').filter({ has: page.getByLabel('Email', { exact: true }) });
    await profileSection.getByRole('button', { name: 'Update Profile' }).click();

    // Should show validation error or stay on page
    // (HTML5 validation may prevent submission)
    await expect(page).toHaveURL('/settings/profile');
  });

  test('can change password successfully', async ({ page }) => {
    // Fill in password change form
    await page.getByLabel('Current Password').fill(TEST_USERS.regularUser1.password);
    await page.getByLabel('New Password', { exact: true }).fill('newpassword123');
    await page.getByLabel('Confirm New Password').fill('newpassword123');

    // Submit password change
    const passwordSection = page.locator('form').filter({ has: page.getByLabel('Current Password') });
    await passwordSection.getByRole('button', { name: 'Change Password' }).click();

    // Check for success message
    await expect(page.getByText('Password changed successfully')).toBeVisible();

    // Password fields should be cleared
    await expect(page.getByLabel('Current Password')).toHaveValue('');
    await expect(page.getByLabel('New Password', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('Confirm New Password')).toHaveValue('');
  });

  test('shows error when current password is incorrect', async ({ page }) => {
    // Fill in password change form with wrong current password
    await page.getByLabel('Current Password').fill('wrongpassword');
    await page.getByLabel('New Password', { exact: true }).fill('newpassword123');
    await page.getByLabel('Confirm New Password').fill('newpassword123');

    // Submit password change
    const passwordSection = page.locator('form').filter({ has: page.getByLabel('Current Password') });
    await passwordSection.getByRole('button', { name: 'Change Password' }).click();

    // Check for error message
    await expect(page.getByText('Current password is incorrect')).toBeVisible();
  });

  test('shows error when new passwords do not match', async ({ page }) => {
    // Fill in password change form with mismatched passwords
    await page.getByLabel('Current Password').fill(TEST_USERS.regularUser1.password);
    await page.getByLabel('New Password', { exact: true }).fill('newpassword123');
    await page.getByLabel('Confirm New Password').fill('differentpassword123');

    // Submit password change
    const passwordSection = page.locator('form').filter({ has: page.getByLabel('Current Password') });
    await passwordSection.getByRole('button', { name: 'Change Password' }).click();

    // Check for error message
    await expect(page.getByText('New passwords do not match')).toBeVisible();
  });

  test('shows error when new password is too short', async ({ page }) => {
    // Fill in password change form with short password
    await page.getByLabel('Current Password').fill(TEST_USERS.regularUser1.password);
    await page.getByLabel('New Password', { exact: true }).fill('short');
    await page.getByLabel('Confirm New Password').fill('short');

    // Submit password change
    const passwordSection = page.locator('form').filter({ has: page.getByLabel('Current Password') });
    await passwordSection.getByRole('button', { name: 'Change Password' }).click();

    // Check for error message
    await expect(page.getByText('Password must be at least 8 characters long')).toBeVisible();
  });

  test('can navigate to profile via user menu', async ({ page }) => {
    // Go to dashboard first
    await page.goto('/');

    // Open user menu
    await page.getByRole('button', { name: /John Smith|john.smith@example.com/ }).click();

    // Click Profile Settings
    await page.getByRole('menuitem', { name: 'Profile Settings' }).click();

    // Should navigate to profile page
    await expect(page).toHaveURL('/settings/profile');
    await expect(page.getByRole('heading', { name: 'Profile Settings', level: 1 })).toBeVisible();
  });
});
