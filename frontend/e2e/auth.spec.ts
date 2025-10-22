import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Log in to your account' })).toBeVisible();
  });

  test('displays login page correctly', async ({ page }) => {
    await page.goto('/login');

    // Check login page elements
    await expect(page.getByRole('heading', { name: 'Log in to your account' })).toBeVisible();
    await expect(page.getByText('Enter your email and password')).toBeVisible();
    await expect(page.getByText('Full-stack application with authentication')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Try to login with invalid credentials
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Log in' }).click();

    // Check for error message
    await expect(page.getByText('Invalid email or password')).toBeVisible();

    // Should still be on login page
    await expect(page).toHaveURL('/login');
  });

  test('shows validation error for empty email', async ({ page }) => {
    await page.goto('/login');

    // Try to login without email
    await page.getByLabel('Password').fill('testpassword123');
    await page.getByRole('button', { name: 'Log in' }).click();

    // Should stay on login page (validation prevents submission)
    await expect(page).toHaveURL('/login');
  });

  test('shows validation error for empty password', async ({ page }) => {
    await page.goto('/login');

    // Try to login without password
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByRole('button', { name: 'Log in' }).click();

    // Should stay on login page (validation prevents submission)
    await expect(page).toHaveURL('/login');
  });

  test('successfully logs in with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Login with test user
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('testpassword123');
    await page.getByRole('button', { name: 'Log in' }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/');

    // Should see user menu with user name
    await expect(page.getByRole('button', { name: /Admin User|admin@example.com/ })).toBeVisible();
  });

  test('redirects to original destination after login', async ({ page }) => {
    // Try to access items page while logged out
    await page.goto('/items');

    // Should redirect to login
    await expect(page).toHaveURL('/login');

    // Login
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('testpassword123');
    await page.getByRole('button', { name: 'Log in' }).click();

    // Should redirect back to items page
    await expect(page).toHaveURL('/items');
    await expect(page.getByRole('heading', { name: 'Items', level: 1 })).toBeVisible();
  });

  test('can logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('testpassword123');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL('/');

    // Open user menu
    await page.getByRole('button', { name: /Admin User|admin@example.com/ }).click();

    // Click logout
    await page.getByRole('menuitem', { name: 'Logout' }).click();

    // Should redirect to login page
    await expect(page).toHaveURL('/login');

    // User menu should not be visible
    await expect(page.getByRole('button', { name: /Admin User|admin@example.com/ })).not.toBeVisible();
  });

  test('persists login across page refreshes', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('testpassword123');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL('/');

    // Refresh the page
    await page.reload();

    // Should still be logged in
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('button', { name: /Admin User|admin@example.com/ })).toBeVisible();
  });

  test('shows all navigation items for authenticated user', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('testpassword123');
    await page.getByRole('button', { name: 'Log in' }).click();

    // Check navigation items
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Items' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Users' })).toBeVisible(); // Admin only
    await expect(page.getByRole('link', { name: 'Support' })).toBeVisible();

    // Settings group should be expandable
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  });
});
