/**
 * Authentication helpers for E2E tests.
 */
import { Page } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  fullName?: string;
}

export const TEST_USERS = {
  admin: {
    email: 'admin@example.com',
    password: 'testpassword123',
    fullName: 'Admin User',
  },
  regularUser1: {
    email: 'john.smith@example.com',
    password: 'testpassword123',
    fullName: 'John Smith',
  },
  regularUser2: {
    email: 'sarah.johnson@example.com',
    password: 'testpassword123',
    fullName: 'Sarah Johnson',
  },
} as const;

/**
 * Login to the application.
 */
export async function login(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Log in' }).click();

  // Wait for redirect away from login page
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 5000 });
}

/**
 * Logout from the application.
 */
export async function logout(page: Page): Promise<void> {
  // Open user menu
  const userMenuButton = page.getByRole('button', { name: /Admin User|admin@example.com|John Smith|Sarah Johnson|User/ });
  await userMenuButton.click();

  // Click logout
  await page.getByRole('menuitem', { name: 'Logout' }).click();

  // Wait for redirect to login page
  await page.waitForURL('/login', { timeout: 5000 });
}

/**
 * Check if user is logged in.
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    const userMenuButton = page.getByRole('button', { name: /Admin User|admin@example.com|John Smith|Sarah Johnson|User/ });
    return await userMenuButton.isVisible({ timeout: 1000 });
  } catch {
    return false;
  }
}
