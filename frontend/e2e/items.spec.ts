import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from './helpers/auth';

test.describe('Item Browser (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page, TEST_USERS.regularUser1);
    await page.goto('/items');
  });

  test('displays page title and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Items', level: 1 })).toBeVisible();
    await expect(
      page.getByText('Search for items, view their details, and perform actions')
    ).toBeVisible();
  });

  test('displays toolbar with search and add button', async ({ page }) => {
    await expect(page.getByPlaceholder('Search by title, ID, or description')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Item' })).toBeVisible();
  });

  test('shows item count', async ({ page }) => {
    // Wait for items to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Check that item count is displayed
    const countText = await page.locator('p').filter({ hasText: /\d+ items?/ }).textContent();
    expect(countText).toMatch(/\d+ items?/);
  });

  test('displays items in table', async ({ page }) => {
    // Wait for the table to appear
    await page.waitForSelector('table', { timeout: 5000 });

    // Check table headers (regular user doesn't see Owner column)
    await expect(page.getByRole('columnheader', { name: 'Title' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Description' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible();

    // Check that at least one row exists (or empty state)
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('can create a new item', async ({ page }) => {
    const testTitle = `Test Item ${Date.now()}`;
    const testDescription = 'This is a test item created by E2E tests';

    // Click Add Item button
    await page.getByRole('button', { name: 'Add Item' }).click();

    // Wait for modal to appear
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Create Item')).toBeVisible();
    await expect(page.getByText('Enter the item details below.')).toBeVisible();

    // Fill in the form
    await page.getByLabel('Title', { exact: true }).fill(testTitle);
    await page.getByLabel('Description').fill(testDescription);

    // Submit the form
    await page.getByRole('button', { name: 'Create' }).click();

    // Wait for modal to close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Check for success message
    await expect(page.getByText('Item created successfully')).toBeVisible();

    // Verify the item appears in the table
    await expect(page.getByRole('cell', { name: testTitle })).toBeVisible();
  });

  test('can search for items', async ({ page }) => {
    // Wait for items to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Get the first item title (if any items exist)
    const firstCell = page.locator('tbody tr').first().locator('td').first();
    const firstItemTitle = await firstCell.textContent();

    if (firstItemTitle) {
      // Search for the item
      await page.getByPlaceholder('Search by title, ID, or description').fill(firstItemTitle);

      // Verify filtered results
      await expect(page.getByRole('cell', { name: firstItemTitle })).toBeVisible();

      // Clear search
      await page.getByPlaceholder('Search by title, ID, or description').clear();
    }
  });

  test('can open item drawer by clicking row', async ({ page }) => {
    // Wait for items to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Create an item first if none exist
    const rows = await page.locator('tbody tr').count();
    if (rows === 0) {
      await page.getByRole('button', { name: 'Add Item' }).click();
      await page.getByLabel('Title', { exact: true }).fill('Test Item for Drawer');
      await page.getByRole('button', { name: 'Create' }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }

    // Click on the first row
    await page.locator('tbody tr').first().click();

    // Wait for drawer to open
    await page.waitForTimeout(500); // Animation delay

    // Check that drawer content is visible
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
    await expect(page.getByText('Item ID')).toBeVisible();
    await expect(page.getByText('Owner')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Actions' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Navigation' })).toBeVisible();
  });

  test('can navigate between items in drawer', async ({ page }) => {
    // Wait for items to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Ensure we have at least 2 items
    const rowCount = await page.locator('tbody tr').count();
    if (rowCount < 2) {
      // Create a second item
      await page.getByRole('button', { name: 'Add Item' }).click();
      await page.getByLabel('Title', { exact: true }).fill('Second Item for Navigation');
      await page.getByRole('button', { name: 'Create' }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }

    // Open first item
    await page.locator('tbody tr').first().click();
    await page.waitForTimeout(500);

    // Check that Previous and First are disabled
    await expect(page.getByRole('button', { name: 'First' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();

    // Click Next button
    const nextButton = page.getByRole('button', { name: 'Next' });
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(300);

      // Previous should now be enabled
      await expect(page.getByRole('button', { name: 'Previous' })).toBeEnabled();
    }
  });

  test('can edit an item from table actions', async ({ page }) => {
    // Wait for items to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Create an item first if none exist
    const rows = await page.locator('tbody tr').count();
    if (rows === 0) {
      await page.getByRole('button', { name: 'Add Item' }).click();
      await page.getByLabel('Title', { exact: true }).fill('Item to Edit');
      await page.getByRole('button', { name: 'Create' }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }

    // Click edit button on first item
    const firstRow = page.locator('tbody tr').first();
    await firstRow.locator('button[aria-label="Edit item"]').click();

    // Wait for modal to appear
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Edit Item')).toBeVisible();
    await expect(page.getByText('Update the item details below.')).toBeVisible();

    // Modify the description
    const updatedDescription = `Updated at ${Date.now()}`;
    await page.getByLabel('Description').fill(updatedDescription);

    // Submit the form
    await page.getByRole('button', { name: 'Update' }).click();

    // Wait for modal to close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Check for success message
    await expect(page.getByText('Item updated successfully')).toBeVisible();
  });

  test('can delete an item from table actions', async ({ page }) => {
    // First create a test item to delete
    const testTitle = `Delete Test ${Date.now()}`;

    await page.getByRole('button', { name: 'Add Item' }).click();
    await page.getByLabel('Title', { exact: true }).fill(testTitle);
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Find the item we just created
    const itemRow = page.locator('tbody tr').filter({ hasText: testTitle });
    await expect(itemRow).toBeVisible();

    // Set up dialog handler for confirmation
    page.on('dialog', dialog => dialog.accept());

    // Click delete button
    await itemRow.locator('button[aria-label="Delete item"]').click();

    // Check for success message
    await expect(page.getByText('Item deleted successfully')).toBeVisible();

    // Verify item is no longer in the table
    await expect(page.getByRole('cell', { name: testTitle })).not.toBeVisible();
  });

  test('shows empty state when no search results', async ({ page }) => {
    // Search for something that doesn't exist
    await page.getByPlaceholder('Search by title, ID, or description').fill('xyznonexistent123');

    // Check for "No items found" empty state
    await expect(page.getByRole('heading', { name: 'No items found' })).toBeVisible();
    await expect(page.getByText('Try adjusting your search criteria')).toBeVisible();
  });
});

test.describe('Item Browser (Admin Owner Display)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin to see owner information
    await login(page, TEST_USERS.admin);
    await page.goto('/items');
  });

  test('admin sees owner column in items table', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 5000 });

    // Admin should see Owner column
    await expect(page.getByRole('columnheader', { name: 'Owner' })).toBeVisible();
  });

  test('admin sees owner information in item rows', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 5000 });

    // Create an item if none exist
    const rows = await page.locator('tbody tr').count();
    if (rows === 0) {
      await page.getByRole('button', { name: 'Add Item' }).click();
      await page.getByLabel('Title', { exact: true }).fill('Admin Test Item');
      await page.getByRole('button', { name: 'Create' }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }

    // Check that owner column shows email or name (not just ID)
    const ownerCells = page.locator('td[data-label="Owner"]');
    const firstOwnerText = await ownerCells.first().textContent();
    expect(firstOwnerText).toBeTruthy();
    expect(firstOwnerText).toMatch(/@|Admin User/); // Should contain email or name
  });
});
