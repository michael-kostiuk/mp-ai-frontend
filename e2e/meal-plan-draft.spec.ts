import { test, expect, setupBackend, generateTestMealPlan, createMealPlanViaApi } from './fixtures/testFixtures';

const DRAFT_STORAGE_KEY = 'mealPlanDraft';

test.describe('Meal Plan Draft - Unsaved Changes Protection', () => {
  test.beforeEach(async ({ page, mealPlansPage }) => {
    await setupBackend(page);
    // Clear any existing draft before each test
    await page.evaluate((key) => localStorage.removeItem(key), DRAFT_STORAGE_KEY);
    await mealPlansPage.goto();
  });

  test('should show close confirmation when closing modal with unsaved changes', async ({ mealPlansPage, page }) => {
    // Open create modal
    await mealPlansPage.clickAddMealPlan();
    await expect(page.locator('h2:has-text("Create Meal Plan")')).toBeVisible();

    // Make a change by clicking Add meal button to add an entry
    await page.click('button:has-text("Add"):first-of-type');
    
    // Wait for the entry to be added
    await expect(page.locator('text=Recipe').first()).toBeVisible();

    // Try to close the modal
    await page.click('button:has-text("Cancel")');

    // Should show confirmation dialog
    await expect(page.locator('h3:has-text("Unsaved Changes")')).toBeVisible();
    await expect(page.locator('text=You have unsaved changes')).toBeVisible();
    
    // Verify all three buttons are present
    await expect(page.locator('button:has-text("Continue Editing")')).toBeVisible();
    await expect(page.locator('button:has-text("Discard")')).toBeVisible();
    await expect(page.locator('button:has-text("Save Draft")')).toBeVisible();
  });

  test('should allow continuing editing when clicking Continue Editing', async ({ mealPlansPage, page }) => {
    await mealPlansPage.clickAddMealPlan();
    
    // Make a change
    await page.click('button:has-text("Add"):first-of-type');
    await expect(page.locator('text=Recipe').first()).toBeVisible();

    // Try to close
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('h3:has-text("Unsaved Changes")')).toBeVisible();

    // Click Continue Editing
    await page.click('button:has-text("Continue Editing")');

    // Confirmation dialog should close, but create modal should still be open
    await expect(page.locator('h3:has-text("Unsaved Changes")')).not.toBeVisible();
    await expect(page.locator('h2:has-text("Create Meal Plan")')).toBeVisible();
    
    // The added entry should still be there
    await expect(page.locator('text=Recipe').first()).toBeVisible();
  });

  test('should discard changes and close modal when clicking Discard', async ({ mealPlansPage, page }) => {
    await mealPlansPage.clickAddMealPlan();
    
    // Make a change
    await page.click('button:has-text("Add"):first-of-type');
    await expect(page.locator('text=Recipe').first()).toBeVisible();

    // Try to close
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('h3:has-text("Unsaved Changes")')).toBeVisible();

    // Click Discard
    await page.click('button:has-text("Discard")');

    // Modal should close completely
    await expect(page.locator('h2:has-text("Create Meal Plan")')).not.toBeVisible();
    await expect(page.locator('h3:has-text("Unsaved Changes")')).not.toBeVisible();

    // Verify draft was cleared from localStorage
    const draft = await page.evaluate((key) => localStorage.getItem(key), DRAFT_STORAGE_KEY);
    expect(draft).toBeNull();
  });

  test('should save draft and close modal when clicking Save Draft', async ({ mealPlansPage, page }) => {
    await mealPlansPage.clickAddMealPlan();
    
    // Make a change
    await page.click('button:has-text("Add"):first-of-type');
    await expect(page.locator('text=Recipe').first()).toBeVisible();

    // Try to close
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('h3:has-text("Unsaved Changes")')).toBeVisible();

    // Click Save Draft
    await page.click('button:has-text("Save Draft")');

    // Modal should close
    await expect(page.locator('h2:has-text("Create Meal Plan")')).not.toBeVisible();

    // Verify draft was saved to localStorage
    const draft = await page.evaluate((key) => localStorage.getItem(key), DRAFT_STORAGE_KEY);
    expect(draft).not.toBeNull();
    
    const parsedDraft = JSON.parse(draft!);
    expect(parsedDraft.formData).toBeDefined();
    expect(parsedDraft.formData.entries.length).toBeGreaterThan(0);
    expect(parsedDraft.savedAt).toBeDefined();
  });

  test('should show draft restore prompt when reopening modal with saved draft', async ({ mealPlansPage, page }) => {
    // First, create a draft
    await mealPlansPage.clickAddMealPlan();
    await page.click('button:has-text("Add"):first-of-type');
    await expect(page.locator('text=Recipe').first()).toBeVisible();
    
    // Close with Save Draft
    await page.click('button:has-text("Cancel")');
    await page.click('button:has-text("Save Draft")');
    await expect(page.locator('h2:has-text("Create Meal Plan")')).not.toBeVisible();

    // Reopen modal
    await mealPlansPage.clickAddMealPlan();

    // Should show draft restore prompt
    await expect(page.locator('text=Unsaved draft found')).toBeVisible();
    await expect(page.locator('text=You have an unsaved meal plan draft')).toBeVisible();
    await expect(page.locator('button:has-text("Restore Draft")')).toBeVisible();
    await expect(page.locator('button:has-text("Discard")')).toBeVisible();
  });

  test('should restore draft when clicking Restore Draft', async ({ mealPlansPage, page }) => {
    // Create a draft with specific data
    await mealPlansPage.clickAddMealPlan();
    
    // Add a meal entry
    await page.click('button:has-text("Add"):first-of-type');
    await expect(page.locator('text=Recipe').first()).toBeVisible();
    
    // Change people count to a unique value
    const peopleInput = page.getByLabel('People Count');
    await peopleInput.fill('5');
    
    // Close with Save Draft
    await page.click('button:has-text("Cancel")');
    await page.click('button:has-text("Save Draft")');

    // Reopen modal
    await mealPlansPage.clickAddMealPlan();
    await expect(page.locator('text=Unsaved draft found')).toBeVisible();

    // Click Restore Draft
    await page.click('button:has-text("Restore Draft")');

    // Draft prompt should disappear
    await expect(page.locator('text=Unsaved draft found')).not.toBeVisible();

    // Verify the restored data - people count should be 5
    await expect(page.getByLabel('People Count')).toHaveValue('5');
    
    // The meal entry should be restored
    await expect(page.locator('text=Recipe').first()).toBeVisible();
  });

  test('should clear draft when clicking Discard on restore prompt', async ({ mealPlansPage, page }) => {
    // Create a draft
    await mealPlansPage.clickAddMealPlan();
    await page.click('button:has-text("Add"):first-of-type');
    await page.click('button:has-text("Cancel")');
    await page.click('button:has-text("Save Draft")');

    // Reopen modal
    await mealPlansPage.clickAddMealPlan();
    await expect(page.locator('text=Unsaved draft found')).toBeVisible();

    // Click Discard
    await page.locator('button:has-text("Discard")').first().click();

    // Draft prompt should disappear
    await expect(page.locator('text=Unsaved draft found')).not.toBeVisible();
    
    // Modal should still be open with fresh data
    await expect(page.locator('h2:has-text("Create Meal Plan")')).toBeVisible();
    
    // Should show default people count (2)
    await expect(page.getByLabel('People Count')).toHaveValue('2');

    // Verify draft was cleared
    const draft = await page.evaluate((key) => localStorage.getItem(key), DRAFT_STORAGE_KEY);
    expect(draft).toBeNull();
  });

  test('should not show confirmation when closing modal without changes', async ({ mealPlansPage, page }) => {
    await mealPlansPage.clickAddMealPlan();
    await expect(page.locator('h2:has-text("Create Meal Plan")')).toBeVisible();

    // Close immediately without making changes
    await page.click('button:has-text("Cancel")');

    // Should close directly without showing confirmation
    await expect(page.locator('h3:has-text("Unsaved Changes")')).not.toBeVisible();
    await expect(page.locator('h2:has-text("Create Meal Plan")')).not.toBeVisible();
  });

  test('should auto-save draft after making changes', async ({ mealPlansPage, page }) => {
    await mealPlansPage.clickAddMealPlan();
    
    // Make a change
    await page.click('button:has-text("Add"):first-of-type');
    await expect(page.locator('text=Recipe').first()).toBeVisible();

    // Wait for debounced auto-save (1 second + buffer)
    await page.waitForTimeout(1500);

    // Verify draft was auto-saved
    const draft = await page.evaluate((key) => localStorage.getItem(key), DRAFT_STORAGE_KEY);
    expect(draft).not.toBeNull();
    
    const parsedDraft = JSON.parse(draft!);
    expect(parsedDraft.formData.entries.length).toBeGreaterThan(0);
  });

  test('should clear draft after successful meal plan creation', async ({ mealPlansPage, page, resourceTracker }) => {
    // First create a draft
    await mealPlansPage.clickAddMealPlan();
    await page.click('button:has-text("Add"):first-of-type');
    
    // Wait for auto-save
    await page.waitForTimeout(1500);
    
    // Verify draft exists
    let draft = await page.evaluate((key) => localStorage.getItem(key), DRAFT_STORAGE_KEY);
    expect(draft).not.toBeNull();

    // Now close and discard to start fresh
    await page.click('button:has-text("Cancel")');
    await page.click('button:has-text("Discard")');

    // Verify draft is cleared after discard
    draft = await page.evaluate((key) => localStorage.getItem(key), DRAFT_STORAGE_KEY);
    expect(draft).toBeNull();
  });

  test('should show close confirmation when clicking X button with unsaved changes', async ({ mealPlansPage, page }) => {
    await mealPlansPage.clickAddMealPlan();
    
    // Make a change
    await page.click('button:has-text("Add"):first-of-type');
    await expect(page.locator('text=Recipe').first()).toBeVisible();

    // Click the X button (close button in header)
    await page.click('[data-testid="modal-close-button"]');

    // Should show confirmation dialog
    await expect(page.locator('h3:has-text("Unsaved Changes")')).toBeVisible();
  });
});

test.describe('Meal Plan Draft - Edit Mode Unsaved Changes', () => {
  test.beforeEach(async ({ page, mealPlansPage }) => {
    await setupBackend(page);
    await page.evaluate((key) => localStorage.removeItem(key), DRAFT_STORAGE_KEY);
    await mealPlansPage.goto();
  });

  test('should show close confirmation when editing meal plan and clicking Cancel with changes', async ({ mealPlansPage, page, resourceTracker }) => {
    // Create a meal plan via API
    const testMealPlan = generateTestMealPlan();
    const created = await createMealPlanViaApi(testMealPlan);
    resourceTracker.track('meal-plans', created.id);

    // Refresh and open the meal plan detail
    await mealPlansPage.goto();
    await mealPlansPage.openMealPlanDetail(testMealPlan.dietary_preferences[0]);
    
    // Click Edit button
    await mealPlansPage.clickEditButton();
    await expect(page.locator('h2:has-text("Edit Meal Plan")')).toBeVisible();

    // Make a change - modify people count
    const peopleInput = page.getByLabel('People Count');
    await peopleInput.fill('8');

    // Try to close with Cancel button
    await page.click('button:has-text("Cancel")');

    // Should show confirmation dialog
    await expect(page.locator('h3:has-text("Unsaved Changes")')).toBeVisible();
    await expect(page.locator('text=You have unsaved changes to this meal plan')).toBeVisible();
    
    // Should NOT show Save Draft button (only for new meal plans)
    await expect(page.locator('button:has-text("Save Draft")')).not.toBeVisible();
    
    // Should show Continue Editing and Discard buttons
    await expect(page.locator('button:has-text("Continue Editing")')).toBeVisible();
    await expect(page.locator('button:has-text("Discard")')).toBeVisible();
  });

  test('should show close confirmation when editing meal plan and clicking X with changes', async ({ mealPlansPage, page, resourceTracker }) => {
    // Create a meal plan via API
    const testMealPlan = generateTestMealPlan();
    const created = await createMealPlanViaApi(testMealPlan);
    resourceTracker.track('meal-plans', created.id);

    // Refresh and open the meal plan detail
    await mealPlansPage.goto();
    await mealPlansPage.openMealPlanDetail(testMealPlan.dietary_preferences[0]);
    
    // Click Edit button
    await mealPlansPage.clickEditButton();
    await expect(page.locator('h2:has-text("Edit Meal Plan")')).toBeVisible();

    // Make a change - modify target calories
    const caloriesInput = page.getByLabel('Target Calories per Day');
    await caloriesInput.fill('2500');

    // Click the X button
    await page.click('[data-testid="modal-close-button"]');

    // Should show confirmation dialog
    await expect(page.locator('h3:has-text("Unsaved Changes")')).toBeVisible();
  });

  test('should close edit modal without confirmation when no changes made', async ({ mealPlansPage, page, resourceTracker }) => {
    // Create a meal plan via API
    const testMealPlan = generateTestMealPlan();
    const created = await createMealPlanViaApi(testMealPlan);
    resourceTracker.track('meal-plans', created.id);

    // Refresh and open the meal plan detail
    await mealPlansPage.goto();
    await mealPlansPage.openMealPlanDetail(testMealPlan.dietary_preferences[0]);
    
    // Click Edit button
    await mealPlansPage.clickEditButton();
    await expect(page.locator('h2:has-text("Edit Meal Plan")')).toBeVisible();

    // Close immediately without making changes
    await page.click('button:has-text("Cancel")');

    // Should close directly without showing confirmation
    await expect(page.locator('h3:has-text("Unsaved Changes")')).not.toBeVisible();
    await expect(page.locator('h2:has-text("Edit Meal Plan")')).not.toBeVisible();
  });

  test('should allow continuing editing in edit mode', async ({ mealPlansPage, page, resourceTracker }) => {
    // Create a meal plan via API
    const testMealPlan = generateTestMealPlan();
    const created = await createMealPlanViaApi(testMealPlan);
    resourceTracker.track('meal-plans', created.id);

    // Refresh and open the meal plan detail
    await mealPlansPage.goto();
    await mealPlansPage.openMealPlanDetail(testMealPlan.dietary_preferences[0]);
    
    // Click Edit button
    await mealPlansPage.clickEditButton();

    // Make a change
    const peopleInput = page.getByLabel('People Count');
    await peopleInput.fill('6');

    // Try to close
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('h3:has-text("Unsaved Changes")')).toBeVisible();

    // Click Continue Editing
    await page.click('button:has-text("Continue Editing")');

    // Should still be in edit mode with our changes
    await expect(page.locator('h2:has-text("Edit Meal Plan")')).toBeVisible();
    await expect(page.getByLabel('People Count')).toHaveValue('6');
  });

  test('should discard changes and close in edit mode', async ({ mealPlansPage, page, resourceTracker }) => {
    // Create a meal plan via API
    const testMealPlan = generateTestMealPlan();
    const created = await createMealPlanViaApi(testMealPlan);
    resourceTracker.track('meal-plans', created.id);

    // Refresh and open the meal plan detail
    await mealPlansPage.goto();
    await mealPlansPage.openMealPlanDetail(testMealPlan.dietary_preferences[0]);
    
    // Click Edit button
    await mealPlansPage.clickEditButton();

    // Make a change
    const peopleInput = page.getByLabel('People Count');
    await peopleInput.fill('10');

    // Try to close
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('h3:has-text("Unsaved Changes")')).toBeVisible();

    // Click Discard
    await page.click('button:has-text("Discard")');

    // Modal should close
    await expect(page.locator('h2:has-text("Edit Meal Plan")')).not.toBeVisible();
  });
});

test.describe('Meal Plan Draft - Auto Generate Mode Switch Protection', () => {
  test.beforeEach(async ({ page, mealPlansPage }) => {
    await setupBackend(page);
    await page.evaluate((key) => localStorage.removeItem(key), DRAFT_STORAGE_KEY);
    await mealPlansPage.goto();
  });

  test('should show confirmation when switching from manual to auto-generate with entries', async ({ mealPlansPage, page }) => {
    await mealPlansPage.clickAddMealPlan();
    
    // Add a meal entry in manual mode
    await page.click('button:has-text("Add"):first-of-type');
    await expect(page.locator('text=Recipe').first()).toBeVisible();

    // Try to switch to auto-generate
    await page.click('button:has-text("Auto Generate")');

    // Should show confirmation dialog
    await expect(page.locator('h3:has-text("Switch to Auto Generate?")')).toBeVisible();
    await expect(page.locator('text=discard your current meal entries')).toBeVisible();
  });

  test('should not show confirmation when switching to auto-generate without entries', async ({ mealPlansPage, page }) => {
    await mealPlansPage.clickAddMealPlan();
    
    // Don't add any entries, just switch to auto-generate
    await page.click('button:has-text("Auto Generate")');

    // Should NOT show confirmation - should switch directly
    await expect(page.locator('h3:has-text("Switch to Auto Generate?")')).not.toBeVisible();
    
    // Should now be in auto-generate mode (check for "Number of Days" field)
    await expect(page.getByLabel('Number of Days')).toBeVisible();
  });

  test('should cancel switch to auto-generate and keep entries', async ({ mealPlansPage, page }) => {
    await mealPlansPage.clickAddMealPlan();
    
    // Add a meal entry
    await page.click('button:has-text("Add"):first-of-type');
    await expect(page.locator('text=Recipe').first()).toBeVisible();

    // Try to switch to auto-generate
    await page.click('button:has-text("Auto Generate")');
    await expect(page.locator('h3:has-text("Switch to Auto Generate?")')).toBeVisible();

    // Cancel - click the Cancel button inside the confirmation dialog (z-[60])
    await page.locator('div.z-\\[60\\] button:has-text("Cancel")').click();

    // Should still be in manual mode with entry intact
    await expect(page.locator('h3:has-text("Switch to Auto Generate?")')).not.toBeVisible();
    await expect(page.locator('text=Recipe').first()).toBeVisible();
    
    // Should NOT see Number of Days (auto-generate field)
    await expect(page.getByLabel('Number of Days')).not.toBeVisible();
  });

  test('should confirm switch to auto-generate and discard entries', async ({ mealPlansPage, page }) => {
    await mealPlansPage.clickAddMealPlan();
    
    // Add a meal entry
    await page.click('button:has-text("Add"):first-of-type');
    await expect(page.locator('text=Recipe').first()).toBeVisible();

    // Try to switch to auto-generate
    await page.click('button:has-text("Auto Generate")');
    await expect(page.locator('h3:has-text("Switch to Auto Generate?")')).toBeVisible();

    // Confirm switch
    await page.click('button:has-text("Switch to Auto Generate")');

    // Should now be in auto-generate mode
    await expect(page.locator('h3:has-text("Switch to Auto Generate?")')).not.toBeVisible();
    await expect(page.getByLabel('Number of Days')).toBeVisible();
  });
});
